# Compton Heat — Architecture Reference

> **Audience:** agents or engineers making deep changes to this codebase.
> This document covers the full architecture, non-obvious design decisions,
> hard-won bug fixes, and traps to avoid.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, `"use client"` components throughout) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3, `darkMode: "class"` strategy |
| Heatmap map | [MapLibre GL JS](https://maplibre.org/) v5 — no API key required |
| Map tiles | CARTO Dark Matter + CARTO Positron (free, no key) |
| Street View | Google Maps JavaScript API v3 — **requires** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| API loader | `@googlemaps/js-api-loader` v1.16.6 (v2 removed the `Loader` class entirely) |

---

## Directory structure

```
src/
├── app/
│   ├── globals.css       # Global resets, MapLibre overrides, tooltip styles
│   ├── layout.tsx        # Root layout — <html class="dark"> by default
│   └── page.tsx          # Root component — all state lives here
├── components/
│   ├── HeatmapMap.tsx    # MapLibre map (always mounted, never unmounts)
│   ├── Header.tsx        # Top floating bar — stats + theme toggle
│   ├── Sidebar.tsx       # Left panel — Add / List / Style tabs
│   ├── Legend.tsx        # Bottom-right density gradient legend
│   ├── StreetViewScene.tsx  # Google Maps StreetViewPanorama + pin overlays
│   ├── StreetViewHeader.tsx # Header overlay rendered on top of Street View
│   └── MiniMap.tsx       # Small MapLibre map shown in corner during Street View
└── lib/
    ├── types.ts           # Shared types + COLOR_SCHEMES data
    ├── sampleData.ts      # Cultural artifact dataset loader
    └── comptonBoundary.ts # Boundary exports derived from LA County snapshot
scripts/
├── updateComptonBoundarySnapshot.mjs # Fetch + normalize Compton boundary snapshot
└── verifyComptonBoundarySnapshot.mjs # Guardrails for boundary validity/richness
```

---

## Two-mode layout

The app has exactly two visual modes, toggled by `streetView` state in `page.tsx`:

```
streetView === null  →  MAP MODE
streetView !== null  →  STREET VIEW MODE
```

**Map mode:** `HeatmapMap` fills the screen. Header, Sidebar, Legend float on top.

**Street View mode:** `StreetViewScene` fills the screen (z-index 10).
`HeatmapMap` is **never unmounted** — it fades to `opacity-0 pointer-events-none`
and back. This preserves the user's zoom/pan state across mode switches.
`MiniMap` and `StreetViewHeader` are rendered on top of the panorama.

```tsx
// page.tsx — simplified
<div>
  {/* Always mounted, fades in/out */}
  <div className={inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"}>
    <HeatmapMap ... />
  </div>

  {/* Regular UI — fades with the map */}
  <div className={inStreetView ? "opacity-0 pointer-events-none" : ""}>
    <Header /><Sidebar /><Legend />
  </div>

  {/* Street View — conditionally rendered */}
  {inStreetView && (
    <div className="absolute inset-0 z-10">
      <StreetViewScene ... />
      <StreetViewHeader ... />
      <MiniMap ... />
    </div>
  )}
</div>
```

---

## State management (`page.tsx`)

All state is co-located in `page.tsx`. There is no external store.

| State | Type | Purpose |
|---|---|---|
| `locations` | `Location[]` | The heatmap data points |
| `settings` | `HeatmapSettings` | Heatmap visual controls |
| `theme` | `"dark" \| "light"` | Controls tiles, UI colours, mask colour |
| `sidebarOpen` | `boolean` | Sidebar visibility |
| `pendingCoords` | `{lat,lng} \| null` | Coords from a map click → auto-fills sidebar form |
| `streetView` | `StreetViewLocation \| null` | Current Street View position. `null` = map mode |
| `showPins` | `boolean` | Whether location pins are rendered in Street View |

**Theme sync:** `useEffect` toggles both `dark` and `light` classes on
`document.documentElement`. Tailwind's `dark:` variants respond to the `dark`
class. The `light` class is used in `globals.css` to restyle MapLibre controls
(which can't use Tailwind's class strategy).

---

## HeatmapMap component

`src/components/HeatmapMap.tsx`

### Map instance lifecycle

- Initialised once in a `useEffect([], [])` (empty deps).
- The MapLibre `Map` is stored in `mapRef` and never recreated.
- `loadedRef` is a boolean ref that becomes `true` inside `map.on("load")`.
  All sync effects guard on `!map || !loadedRef.current` before touching the map.
- **Cleanup order matters:** set `mapRef.current = null` **before** calling
  `map.remove()`, then call `map.stop()` before `map.remove()`. This prevents
  any in-flight animation callbacks from accessing a destroyed style object
  (see *Known bugs fixed* below).

### Dual tile layers (no style reload on theme change)

Both tile sources are loaded at startup:

```
tiles-dark  → CARTO Dark Matter
tiles-light → CARTO Positron
```

Two raster layers sit above them, each with a `visibility` layout property.
Theme toggle calls `map.setLayoutProperty("layer-dark", "visibility", ...)` and
`map.setLayoutProperty("layer-light", "visibility", ...)` — instant, no style
reload, no flicker.

### Compton boundary + mask

Boundary geometry is sourced from **Los Angeles County DPW CityBoundaries**
(`MapServer/1`, `CITY_NAME='Compton'`, `FEAT_TYPE='Land'`) and committed as
`src/data/comptonBoundary.snapshot.json`.

`src/lib/comptonBoundary.ts` builds:
- `COMPTON_CITY_GEOJSON` (`Polygon`/`MultiPolygon`) from the snapshot
- `COMPTON_BORDER_GEOJSON` (`FeatureCollection<LineString>`) for every ring
- `COMPTON_MASK_GEOJSON` (`MultiPolygon`) with:
  - polygon 1: world exterior + Compton outer shells as holes
  - polygons 2..N: Compton interior holes converted to filled polygons
- `COMPTON_BOUNDS` computed from outer shells (not hard-coded)

This keeps enclave/inner-hole behavior accurate while preserving high-fidelity
border detail.

### Heatmap colour expressions

`COLOR_SCHEMES` in `types.ts` is an array of `[density, cssColor]` stop pairs.
`buildHeatmapColorExpr()` converts these into a MapLibre
`["interpolate", ["linear"], ["heatmap-density"], ...]` expression.
The return type is cast via `any[]` because MapLibre's TypeScript generics
don't accept a plain array literal for this expression type.

---

## StreetViewScene component

`src/components/StreetViewScene.tsx`

This is the most complex component. Read carefully.

### Lifecycle

Uses `@googlemaps/js-api-loader` v1.16.6 (pinned — v2 broke the `Loader` class).
A **singleton loader instance** (`loaderInstance`) is created once at module level
so the Maps script is injected into the page only once even if the component
mounts/unmounts multiple times.

The main `useEffect` has deps `[lat, lng]`. It:
1. Sets a `cancelled = true` cleanup flag to abort in-flight async callbacks
2. Loads `"maps"` and `"streetView"` libraries via `importLibrary`
3. Calls `getPanorama` with radius 80m, falls back to 500m
4. Creates `StreetViewPanorama` at the found node
5. Computes the initial heading (see below)
6. Rebuilds pins in `status_changed`

**`cancelled` flag is critical.** `getPanorama` is async. If the user clicks
another pin before the first `getPanorama` resolves, the old callback must not
create a panorama with stale coordinates. Without this guard, the second
panorama gets created, then the first one overwrites it. The cleanup sets
`cancelled = true` immediately, so all callbacks check it before proceeding.

### Heading computation

**Do not compute heading in `page.tsx` and pass it as a prop.** This was tried
and failed because `getPanorama` snaps to a node that can be 10–80m from the
exact pin coordinates. A heading from the old position toward the pin coordinates
is computed against a different point than where you actually land.

**Correct approach:** `bearingToTarget(panoPos, lat, lng)` runs *after*
`getPanorama` returns, using `data.location.latLng` (the actual panorama node)
as the origin and the original target `lat/lng` as the destination.
This guarantees the target is always directly in front of the user on arrival.

The heading is applied in **two places**:
1. In the `StreetViewPanorama` constructor `pov` option
2. In the `status_changed` listener via `pano.setPov()`

Both are needed because Google Maps resets the POV during panorama position
loading (an internal Maps API behaviour). The `status_changed` event fires
after this reset, so the second `setPov` call always wins.

### Pin overlay system (`StreetViewPin` class)

Each `Location` gets a `StreetViewPin` which wraps a custom
`google.maps.OverlayView` subclass. The overlay is attached to
`panorama.overlayMouseTarget` pane (topmost, supports pointer events).

The `draw()` method is called by Google Maps every frame:
1. `fromLatLngToContainerPixel(pos)` → raw 2D screen position for the 3D world coord
2. Distance from panorama position (`haversineM`) → `distanceToScale()` → CSS scale
3. Pins beyond ~850m are hidden (scale returns 0)
4. Pins whose raw projected Y falls below `h * 0.80` and are more than 20m away
   are hidden (they'd appear in the road surface)
5. Distant pins (>20m) are lifted `PIN_Y_LIFT` pixels upward to float above the road.
   **`PIN_Y_LIFT` is a named constant at the top of `StreetViewScene.tsx` — change
   this single number to tune the vertical position of pins.**

**Do not add pitch-based clamping.** It was tried (computing `dynHorizonY` from
pitch and vFOV) and causes pins to visibly track up/down as you tilt the camera.
Using the raw projected Y with a static hide threshold is cleaner and stable.

**Do not animate the pin container with CSS `transform` keyframes.** The container
element owns `transform: scale(...)` for distance scaling. If you also put a
float animation on the container it fights with the scale. The inner `<div>`
can have animations that don't use `transform` (e.g. `box-shadow` pulse).

### `gm_authFailure` global

Before loading, `window.gm_authFailure` is set to a callback that calls
`setState("auth-error")`. This is the only way to catch `InvalidKeyMapError`
and similar auth failures — Google Maps fires this global, not a JS exception.

---

## MiniMap component

`src/components/MiniMap.tsx`

A second independent MapLibre instance rendered at `230×158px` in the
bottom-right corner during Street View mode. It shows the heatmap + Compton
border + a glowing marker at the current street view position.

**Interactive:** `scrollZoom`, `doubleClickZoom`, `dragRotate`, and `keyboard`
are all disabled. Regular drag panning is enabled. A `map.on("click")` handler
fires `onTeleport(lat, lng)` which snaps street view to the nearest DB location.

**Cleanup order:** same as `HeatmapMap` — `mapRef.current = null` first,
then `map.stop()` then `map.remove()`. This prevents a pending `easeTo`
animation's `requestAnimationFrame` callback from firing after the style is
destroyed (manifested as `Cannot read properties of null (reading 'getLayer')`).

The marker and camera centre are synced in a separate `useEffect([focusLat, focusLng])`.

---

## Click interaction model

| Event | Handler | Result |
|---|---|---|
| Click on main heatmap | `handleMapClick` | Snaps to nearest DB location, opens Street View, auto-fills sidebar form |
| Click on a location dot (zoom ≥ 14) | `handleLocationClick` | Opens Street View at that location (exact label known) |
| Click a pin in Street View | `onPinClick` → `handlePinClick` | Teleports to pin's location, `bearingToTarget` ensures pin is in front |
| Click mini-map | `onTeleport` → `handleTeleport` | Snaps to nearest DB location, updates Street View |
| Click mini-map expand button | `onExpand` → `closeStreetView` | Sets `streetView = null`, returns to map mode |
| Click "← Map" in Street View header | `onClose` → `closeStreetView` | Same |

**Nearest-location snapping:** `findNearest(lat, lng, locations)` runs a linear
scan computing Haversine distance to every location. No max-distance cutoff —
always returns the closest. Used by `handleMapClick` and `handleTeleport`.

---

## Theme system

1. `page.tsx` toggles `document.documentElement.classList` — adds/removes `dark`
   and `light` simultaneously.
2. Tailwind's `dark:` variants respond to the `dark` class.
3. `globals.css` has `.light .maplibregl-ctrl-group { ... }` rules for controls
   that can't be reached by Tailwind.
4. `HeatmapMap` responds to theme via a `useEffect([theme])` that calls
   `setLayoutProperty` / `setPaintProperty` — no style reload.
5. All UI components accept a `theme: Theme` prop and switch class strings
   programmatically (no `dark:` Tailwind variants inside JSX — explicit
   conditional classes are used instead for clarity).

---

## Known bugs fixed (do not re-introduce)

### `Cannot read properties of null (reading 'getLayer')`

**Cause:** `MiniMap` or `HeatmapMap` calls `map.remove()` while a MapLibre
`easeTo` or `fitBounds` animation is in flight. The animation uses
`requestAnimationFrame`. The rAF callback fires on the next frame *after* the
style has been destroyed, and MapLibre's internal animation step calls
`this.style.getLayer(...)` which throws.

**Fix:** always call `map.stop()` before `map.remove()` in every cleanup
function. Also null the ref before removal so any React effect that runs
concurrently sees `null` and bails.

### Pin vertical wobble during camera tilt

**Cause:** an earlier version computed `dynHorizonY = h * (0.5 + pitch/vFOV)`
each `draw()` call and clamped pin Y to that value. Since `draw()` is called
every frame, pins visibly tracked the horizon as the user tilted the camera.

**Fix:** use raw `fromLatLngToContainerPixel` Y, apply a static `h * 0.80`
hide threshold, and lift by `PIN_Y_LIFT` pixels. No per-frame Y manipulation.

### Heading not applied on panorama load

**Cause:** Google Maps resets the POV internally when it finishes resolving
a panorama's position. The heading set in the constructor `pov` option is
overwritten before the panorama becomes visible.

**Fix:** re-apply `pano.setPov({ heading, pitch: 0 })` inside `status_changed`,
which fires after the internal reset completes.

### Stale async callback overwriting newer panorama

**Cause:** clicking two pins quickly causes two overlapping `getPanorama` calls.
The first (for pin A) might resolve after the second (for pin B), creating
a panorama for A on top of B's panorama.

**Fix:** `let cancelled = false` scoped inside the `useEffect`. The cleanup
function sets `cancelled = true`. Every callback checks `if (cancelled) return`.

### `InvalidKeyMapError` silent failure

**Cause:** Google Maps fires `window.gm_authFailure()` for auth errors (invalid
key, API not enabled, billing not set up). This is a global callback, not a
thrown exception, so standard `try/catch` and promise `.catch()` don't catch it.

**Fix:** set `window.gm_authFailure = () => setState("auth-error")` before
initiating the library load.

---

## Environment variables

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

Required APIs on the key: **Maps JavaScript API**.
Billing must be enabled on the Google Cloud project (free $200/month credit).
For local dev: set Application Restrictions to "None" or allow `localhost`.

Without the key the app works fully in map/heatmap mode. Street View degrades
gracefully to a "key needed" screen with setup instructions.

---

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # boundary verification + production build + type check
```

---

## Updating boundary snapshot

```bash
npm run boundary:refresh   # fetch + normalize + verify
# or separately:
npm run boundary:update
npm run boundary:verify
```

---

## Adding new location data

Edit `src/data/culturalArtifacts.json`.

Locations support points and street geometries; artifacts reference `locationId`.

- `id` must be unique (prefix `s` for sample, `u` for user-added at runtime)
- `heatWeight` on artifacts controls contribution to heat intensity
- Coordinates should be real-world lon/lat values (WGS84)
- The app also accepts coordinates at runtime via the sidebar (single or bulk paste)

---

## Extending the Street View overlay system

The `StreetViewPin` class in `StreetViewScene.tsx` is the foundation for
adding arbitrary overlays to the Street View. To add a new overlay type:

1. Create a class that follows the same pattern: inner `google.maps.OverlayView`,
   `onAdd()` appends to `getPanes().overlayMouseTarget`, `draw()` uses
   `fromLatLngToContainerPixel` for screen position.
2. Instantiate it in `buildPins()` alongside `StreetViewPin`.
3. Store refs in `pinsRef` (or a separate ref array) so cleanup calls `setMap(null)`.
4. The footer bar in `StreetViewHeader.tsx` (currently showing a placeholder hint)
   is the intended location for the UI controls that create/manage these overlays.
