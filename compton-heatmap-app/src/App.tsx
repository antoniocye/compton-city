import { useMemo, useState, type ChangeEvent } from 'react'
import DeckGL from '@deck.gl/react'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import type { MapViewState } from '@deck.gl/core'
import MapLibreMap, {
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import './App.css'

type CoordinatePoint = {
  lat: number
  lng: number
  weight: number
}

type ParseResult = {
  points: CoordinatePoint[]
  errors: string[]
}

const COMPTON_CENTER = {
  latitude: 33.8958,
  longitude: -118.2201,
  zoom: 12.3,
  pitch: 32,
  bearing: -10,
}

const COMPTON_BOUNDS = {
  minLat: 33.83,
  maxLat: 33.96,
  minLng: -118.31,
  maxLng: -118.16,
}

const SAMPLE_INPUT = `33.8955,-118.2202,3
33.8959,-118.2201,2
33.8994,-118.2151,4
33.8902,-118.2333,2
33.8922,-118.2418,1
33.9102,-118.226,2
33.8844,-118.2205,3
33.8957,-118.2204,5
33.9001,-118.2277,4
33.8965,-118.2114,2`

const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
} as const

function normalizeCoordinates(a: number, b: number) {
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
    return { lat: a, lng: b }
  }

  if (Math.abs(a) <= 180 && Math.abs(b) <= 90) {
    return { lat: b, lng: a }
  }

  return null
}

function toNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function parseCoordinateInput(raw: string): ParseResult {
  const input = raw.trim()
  if (!input) {
    return { points: [], errors: [] }
  }

  if (input.startsWith('[') || input.startsWith('{')) {
    return parseJsonPoints(input)
  }

  const points: CoordinatePoint[] = []
  const errors: string[] = []
  const lines = raw.split(/\r?\n/)

  lines.forEach((line, index) => {
    const value = line.trim()
    if (!value) {
      return
    }

    if (
      index === 0 &&
      /lat|latitude/i.test(value) &&
      /lng|lon|longitude/i.test(value)
    ) {
      return
    }

    const parts = value.split(/[,\s]+/).filter(Boolean)
    if (parts.length < 2) {
      errors.push(`Line ${index + 1}: expected at least 2 values.`)
      return
    }

    const a = toNumber(parts[0])
    const b = toNumber(parts[1])
    const weight = parts[2] !== undefined ? toNumber(parts[2]) : 1

    if (a === null || b === null) {
      errors.push(`Line ${index + 1}: invalid numeric coordinates.`)
      return
    }

    const normalized = normalizeCoordinates(a, b)
    if (!normalized) {
      errors.push(`Line ${index + 1}: coordinates are out of range.`)
      return
    }

    points.push({
      ...normalized,
      weight: weight && weight > 0 ? weight : 1,
    })
  })

  return { points, errors }
}

function parseJsonPoints(raw: string): ParseResult {
  const points: CoordinatePoint[] = []
  const errors: string[] = []

  try {
    const data = JSON.parse(raw) as unknown
    const collection = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && 'points' in data
        ? (data as { points: unknown[] }).points
        : null

    if (!collection || !Array.isArray(collection)) {
      return {
        points: [],
        errors: ['JSON must be an array or an object with a points array.'],
      }
    }

    collection.forEach((item, index) => {
      if (Array.isArray(item) && item.length >= 2) {
        const a = toNumber(item[0])
        const b = toNumber(item[1])
        const weight = item.length >= 3 ? toNumber(item[2]) : 1

        if (a === null || b === null) {
          errors.push(`Item ${index + 1}: invalid numeric coordinates.`)
          return
        }

        const normalized = normalizeCoordinates(a, b)
        if (!normalized) {
          errors.push(`Item ${index + 1}: coordinates are out of range.`)
          return
        }

        points.push({
          ...normalized,
          weight: weight && weight > 0 ? weight : 1,
        })
        return
      }

      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const latCandidate =
          record.lat ?? record.latitude ?? record.y ?? record.Latitude
        const lngCandidate =
          record.lng ??
          record.lon ??
          record.long ??
          record.longitude ??
          record.x ??
          record.Longitude
        const weightCandidate = record.weight ?? record.count ?? 1

        const lat = toNumber(latCandidate)
        const lng = toNumber(lngCandidate)
        const weight = toNumber(weightCandidate)

        if (lat === null || lng === null) {
          errors.push(`Item ${index + 1}: missing lat/lng fields.`)
          return
        }

        const normalized = normalizeCoordinates(lat, lng)
        if (!normalized) {
          errors.push(`Item ${index + 1}: coordinates are out of range.`)
          return
        }

        points.push({
          ...normalized,
          weight: weight && weight > 0 ? weight : 1,
        })
        return
      }

      errors.push(`Item ${index + 1}: unsupported JSON shape.`)
    })

    return { points, errors }
  } catch {
    return { points: [], errors: ['JSON parse failed. Check formatting.'] }
  }
}

function inComptonBounds(point: CoordinatePoint) {
  return (
    point.lat >= COMPTON_BOUNDS.minLat &&
    point.lat <= COMPTON_BOUNDS.maxLat &&
    point.lng >= COMPTON_BOUNDS.minLng &&
    point.lng <= COMPTON_BOUNDS.maxLng
  )
}

function App() {
  const [rawInput, setRawInput] = useState(SAMPLE_INPUT)
  const [radiusPixels, setRadiusPixels] = useState(52)
  const [intensity, setIntensity] = useState(1.1)
  const [strictComptonBounds, setStrictComptonBounds] = useState(true)
  const [theme, setTheme] = useState<keyof typeof MAP_STYLES>('dark')
  const [viewState, setViewState] = useState<MapViewState>(COMPTON_CENTER)

  const parsed = useMemo(() => parseCoordinateInput(rawInput), [rawInput])

  const visiblePoints = useMemo(() => {
    if (!strictComptonBounds) {
      return parsed.points
    }
    return parsed.points.filter(inComptonBounds)
  }, [parsed.points, strictComptonBounds])

  const outOfBoundsCount = parsed.points.length - visiblePoints.length

  const weightedTotal = useMemo(
    () => visiblePoints.reduce((sum, point) => sum + point.weight, 0),
    [visiblePoints],
  )

  const hotspots = useMemo(() => {
    const buckets = new globalThis.Map<string, { count: number; label: string }>()

    visiblePoints.forEach((point) => {
      const latBucket = point.lat.toFixed(3)
      const lngBucket = point.lng.toFixed(3)
      const key = `${latBucket},${lngBucket}`
      const existing = buckets.get(key)
      const nextCount = (existing?.count ?? 0) + point.weight
      buckets.set(key, { count: nextCount, label: `${latBucket}, ${lngBucket}` })
    })

    return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }, [visiblePoints])

  const heatmapLayer = useMemo(() => {
    return new HeatmapLayer<CoordinatePoint>({
      id: 'compton-heatmap',
      data: visiblePoints,
      getPosition: (point) => [point.lng, point.lat],
      getWeight: (point) => point.weight,
      radiusPixels,
      intensity,
      threshold: 0.03,
      colorRange: [
        [30, 58, 138, 0],
        [57, 91, 183, 60],
        [56, 154, 216, 120],
        [97, 224, 175, 170],
        [255, 224, 102, 220],
        [255, 109, 87, 255],
      ],
    })
  }, [visiblePoints, radiusPixels, intensity])

  const handleFileLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const text = await file.text()
    setRawInput(text)
    event.target.value = ''
  }

  return (
    <div className="app-shell">
      <DeckGL
        controller
        layers={[heatmapLayer]}
        viewState={viewState}
        onViewStateChange={({ viewState: nextViewState }) =>
          setViewState(nextViewState as MapViewState)
        }
      >
        <MapLibreMap
          mapLib={maplibregl}
          mapStyle={MAP_STYLES[theme]}
          reuseMaps
          attributionControl={false}
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-right" />
        </MapLibreMap>
      </DeckGL>

      <aside className="control-panel">
        <div className="panel-header">
          <p className="eyebrow">Compton Location Intelligence</p>
          <h1>Compton Heat Map Studio</h1>
          <p className="subtitle">
            Paste coordinate streams and instantly see the most represented
            zones in Compton.
          </p>
        </div>

        <div className="metrics-grid">
          <article>
            <span>Valid points</span>
            <strong>{visiblePoints.length}</strong>
          </article>
          <article>
            <span>Weighted total</span>
            <strong>{weightedTotal.toFixed(1)}</strong>
          </article>
          <article>
            <span>Parse issues</span>
            <strong>{parsed.errors.length}</strong>
          </article>
          <article>
            <span>Filtered out</span>
            <strong>{outOfBoundsCount}</strong>
          </article>
        </div>

        <label className="input-label" htmlFor="coordinate-input">
          Coordinates (CSV lines: lat,lng,weight or JSON array)
        </label>
        <textarea
          id="coordinate-input"
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          className="coordinate-input"
          spellCheck={false}
        />

        <div className="action-row">
          <button type="button" onClick={() => setRawInput(SAMPLE_INPUT)}>
            Load sample
          </button>
          <button type="button" onClick={() => setRawInput('')}>
            Clear
          </button>
          <label className="file-button" htmlFor="file-upload">
            Upload file
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.txt,.json"
            onChange={handleFileLoad}
          />
        </div>

        <div className="control-row">
          <label htmlFor="radius-range">
            Radius <strong>{radiusPixels}px</strong>
          </label>
          <input
            id="radius-range"
            type="range"
            min={20}
            max={100}
            value={radiusPixels}
            onChange={(event) => setRadiusPixels(Number(event.target.value))}
          />
        </div>

        <div className="control-row">
          <label htmlFor="intensity-range">
            Intensity <strong>{intensity.toFixed(1)}</strong>
          </label>
          <input
            id="intensity-range"
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
          />
        </div>

        <div className="switch-row">
          <button
            type="button"
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => setTheme('dark')}
          >
            Night mode
          </button>
          <button
            type="button"
            className={theme === 'light' ? 'active' : ''}
            onClick={() => setTheme('light')}
          >
            Day mode
          </button>
          <button
            type="button"
            className={strictComptonBounds ? 'active' : ''}
            onClick={() => setStrictComptonBounds((enabled) => !enabled)}
          >
            {strictComptonBounds ? 'Compton bounds: on' : 'Compton bounds: off'}
          </button>
        </div>

        <div className="legend">
          <span>Low</span>
          <div className="legend-gradient" />
          <span>High</span>
        </div>

        {parsed.errors.length > 0 && (
          <ul className="error-list">
            {parsed.errors.slice(0, 3).map((error) => (
              <li key={error}>{error}</li>
            ))}
            {parsed.errors.length > 3 && (
              <li>...and {parsed.errors.length - 3} more issues.</li>
            )}
          </ul>
        )}

        <div className="hotspots">
          <h2>Top represented hotspots</h2>
          <ol>
            {hotspots.length === 0 && <li>No hotspots yet.</li>}
            {hotspots.map((spot) => (
              <li key={spot.label}>
                <span>{spot.label}</span>
                <strong>{spot.count.toFixed(1)}</strong>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  )
}

export default App
