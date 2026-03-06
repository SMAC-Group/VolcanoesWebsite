# VolcanInfos — Interactive Volcanic Data Visualization

Static web application for visualizing volcanic geochemical data (Temperature, Pressure, oxide compositions, etc.) with interactive 2D and 3D scatter plots.

## Overview

- **2D Charts**: scatter plots with confidence ellipses, lasso/rectangle selection
- **3D Charts**: scatter plots with group centroids, free rotation
- **CSV Import**: drag & drop or browse, with preview and validation
- **Manual Entry**: dynamic form based on CSV columns
- **Export / Contribute**: CSV download + submission instructions

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vanilla HTML/CSS/JS (ES Modules, no build step) |
| Visualization | [Plotly.js 2.27.0](https://plotly.com/javascript/) via CDN |
| Fonts | Syne (headings) + Space Mono (monospace) via Google Fonts |
| Local Storage | localStorage (user data) |
| Data Format | CSV |

## Quick Start

```bash
# ES Modules require an HTTP server (file:// won't work)
python -m http.server 8000
# Then open http://localhost:8000
```

## Detailed Documentation

| Document | Description |
|----------|------------|
| [Architecture](docs/architecture.md) | Architecture overview, patterns, and design decisions |
| [Project Files](docs/files.md) | Detailed description of every file in the project |
| [Service Layer](docs/services.md) | Data API, static backend, migration to a dynamic backend |
| [UI Components](docs/ui.md) | Sidebar, 2D/3D charts, detail panel, modals |
| [Data Format](docs/data.md) | CSV structure, columns, types, missing value handling |
| [Contributing](docs/contributing.md) | Data contribution workflow and adding dimensions |

## Project Structure

```
VolcanoWebsite/
├── index.html                  # SPA entry point — 3-column layout
├── css/style.css               # Dark theme
├── js/
│   ├── config.js               # Centralized configuration
│   ├── events.js               # Pub/sub event bus
│   ├── app.js                  # Main orchestrator
│   ├── columns.js              # CSV column configuration
│   ├── csv.js                  # Pure CSV parser/exporter
│   ├── selection.js            # Point selection state
│   ├── services/
│   │   ├── api.js              # Data access facade
│   │   └── static-backend.js   # Static implementation (CSV + localStorage)
│   └── ui/
│       ├── sidebar.js          # Axis selectors, volcano filter
│       ├── chart2d.js          # 2D Plotly chart (scattergl + ellipses)
│       ├── chart3d.js          # 3D Plotly chart (scatter3d + centroids)
│       ├── detail-panel.js     # Right panel: point detail, stats
│       └── modals.js           # Modals: upload, entry, export, contribute
├── data/volcanoData.csv        # Main database
└── docs/                       # Detailed documentation (see links above)
```

## Conventions

- **English** UI and code
- **camelCase** for JS, **kebab-case** for CSS
- **HTML IDs** in camelCase (`axisX`, `plotDiv`, `modalUpload`)
- All tunable values in `js/config.js`
