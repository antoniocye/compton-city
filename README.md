# Compton Heat Map Project

A polished web app starter is now available in:

- `compton-heatmap-app/`

## Chosen approach

This implementation uses a **React + MapLibre + deck.gl HeatmapLayer** stack.
It gives a modern UI and smooth performance while keeping costs low (no paid map
token required).

## Current features

- Full-screen Compton-focused map experience
- Paste coordinates as CSV lines (`lat,lng,weight`) or JSON arrays/objects
- Optional strict Compton boundary filtering
- Interactive heat controls (radius, intensity)
- Theme switch (night/day basemap)
- Upload `.csv`, `.txt`, or `.json` files
- Top hotspot summary + parse diagnostics

## Run locally

```bash
cd compton-heatmap-app
npm install
npm run dev
```
