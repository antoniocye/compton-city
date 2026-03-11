import { useMemo, useState } from 'react';
import './App.css';
import { ComptonMap } from './components/ComptonMap';
import {
  aggregateHotspots,
  formatCoordinate,
  formatPercent,
  parseCoordinateText,
  sampleCoordinateText,
  type ViewMode,
} from './lib/coordinates';

const numberFormatter = new Intl.NumberFormat('en-US');

function App() {
  const [input, setInput] = useState(sampleCoordinateText);
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid');
  const [radius, setRadius] = useState(34);

  const parsed = useMemo(() => parseCoordinateText(input), [input]);
  const hotspots = useMemo(() => aggregateHotspots(parsed.points), [parsed.points]);

  const totalWeight = hotspots.reduce((sum, hotspot) => sum + hotspot.weight, 0);
  const totalEntries = hotspots.reduce((sum, hotspot) => sum + hotspot.entries, 0);
  const topHotspot = hotspots[0];

  return (
    <div className="app-shell">
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <header className="hero">
        <div>
          <span className="eyebrow">Compton Pulse</span>
          <h1>Beautiful hotspot mapping for Compton coordinates.</h1>
          <p>
            Paste coordinates, switch between heat and circle views, and instantly
            surface the areas that appear most often.
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => setInput(sampleCoordinateText)}
          >
            Load sample data
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setInput('')}
          >
            Clear canvas
          </button>
        </div>
      </header>

      <main className="workspace-grid">
        <aside className="panel glass-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Input</span>
              <h2>Coordinate feed</h2>
            </div>
            <span className="status-pill">
              {parsed.invalidLines.length === 0
                ? 'All lines valid'
                : `${parsed.invalidLines.length} invalid`}
            </span>
          </div>

          <label className="field-label" htmlFor="coordinate-input">
            Accepted formats: <code>lat,lng</code> or <code>lat,lng,weight</code>
          </label>
          <textarea
            id="coordinate-input"
            className="coordinate-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="33.8958,-118.2201"
            spellCheck={false}
          />

          <div className="panel-note">
            Repeated coordinates automatically stack into stronger hotspots, and an
            optional third column lets you apply extra weight per line.
          </div>

          {parsed.invalidLines.length > 0 && (
            <div className="validation-card">
              <h3>Skipped lines</h3>
              <ul>
                {parsed.invalidLines.slice(0, 4).map((line) => (
                  <li key={`${line.lineNumber}-${line.content}`}>
                    <strong>Line {line.lineNumber}:</strong> {line.content || '(empty)'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="map-stage glass-panel">
          <div className="map-toolbar">
            <div>
              <span className="panel-kicker">Map</span>
              <h2>Center stage: Compton</h2>
            </div>

            <div className="mode-toggle" role="tablist" aria-label="Map display mode">
              {(['hybrid', 'heat', 'circles'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`toggle-chip ${viewMode === mode ? 'is-active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="map-overlay top-left">
            <span className="overlay-label">Focused city</span>
            <strong>Compton, California</strong>
            <span>Dark basemap, live hotspot layers, zero backend required.</span>
          </div>

          <div className="map-overlay bottom-right slider-card">
            <div className="slider-copy">
              <span className="overlay-label">Heat radius</span>
              <strong>{radius}px spread</strong>
            </div>
            <input
              type="range"
              min="18"
              max="60"
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
            />
          </div>

          <ComptonMap hotspots={hotspots} radius={radius} viewMode={viewMode} />

          {hotspots.length === 0 && (
            <div className="empty-state">
              <h3>No valid coordinates yet</h3>
              <p>Add Compton coordinates on the left to light up the map.</p>
            </div>
          )}
        </section>

        <aside className="panel glass-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Insights</span>
              <h2>Hotspot summary</h2>
            </div>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span>Total weighted points</span>
              <strong>{numberFormatter.format(totalWeight)}</strong>
            </article>
            <article className="stat-card">
              <span>Unique hotspots</span>
              <strong>{numberFormatter.format(hotspots.length)}</strong>
            </article>
            <article className="stat-card">
              <span>Entries parsed</span>
              <strong>{numberFormatter.format(totalEntries)}</strong>
            </article>
            <article className="stat-card">
              <span>Strongest share</span>
              <strong>{topHotspot ? formatPercent(topHotspot.share) : '--'}</strong>
            </article>
          </div>

          <div className="insight-hero">
            <span className="overlay-label">Top signal</span>
            <strong>
              {topHotspot
                ? `${formatCoordinate(topHotspot.lat)}, ${formatCoordinate(topHotspot.lng)}`
                : 'Waiting for coordinates'}
            </strong>
            <p>
              {topHotspot
                ? `${topHotspot.weight} weighted hits across ${topHotspot.entries} entries`
                : 'Paste data to identify the strongest represented location.'}
            </p>
          </div>

          <div className="hotspot-list-card">
            <div className="list-header">
              <h3>Top hotspots</h3>
              <span>{hotspots.length} tracked</span>
            </div>

            <ol className="hotspot-list">
              {hotspots.slice(0, 6).map((hotspot, index) => (
                <li key={hotspot.id} className="hotspot-row">
                  <div className="rank-badge">{index + 1}</div>
                  <div className="hotspot-meta">
                    <strong>
                      {formatCoordinate(hotspot.lat)}, {formatCoordinate(hotspot.lng)}
                    </strong>
                    <span>
                      {hotspot.entries} entries • {formatPercent(hotspot.share)} of all
                      points
                    </span>
                  </div>
                  <div className="hotspot-weight">{hotspot.weight}</div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
