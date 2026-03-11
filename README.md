# Compton Pulse

A polished web app for visualizing Compton coordinate data as a live heatmap and hotspot explorer.

## Stack

- React + TypeScript
- Vite
- MapLibre GL JS

## Current MVP

- Centered map focused on Compton
- Dark premium UI with glass panels
- Paste coordinates directly into the app
- Optional weighted coordinates via a third column
- Toggle between hybrid, heat-only, and circle-only views
- Top hotspot summary with ranked locations

## Coordinate format

Accepted inputs:

```txt
33.8958,-118.2201
33.8958,-118.2201,3
```

- First value: latitude
- Second value: longitude
- Optional third value: weight

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Next ideas

- CSV upload
- Saved datasets
- Nearby-point clustering instead of exact-match aggregation
- Filters by category or date
- Styled neighborhood overlays
