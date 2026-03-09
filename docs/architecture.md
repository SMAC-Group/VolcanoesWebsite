# Architecture

[Back to README](../README.md)

## Overview

VolcanInfos is a **static SPA (Single Page Application)** built with vanilla JS and ES Modules. There is no build step — the browser resolves imports natively.

The single entry point is:
```html
<script type="module" src="js/app.js">
```

## Core Patterns

### 1. Event Bus (Pub/Sub)

Modules communicate via an event bus (`js/events.js`) instead of calling each other directly. This allows:
- Decoupling modules from one another
- Easy replacement of a module (e.g., switching to React/Vue)
- Adding new listeners without modifying existing code

**Available events** (`EVT`):

| Constant | Trigger | Payload |
|----------|---------|---------|
| `DATA_LOADED` | CSV data loaded at boot | none |
| `DATA_UPDATED` | After CSV upload or manual entry | none |
| `SELECTION_CHANGED` | Click/lasso/rectangle on chart | `Set<index>` |
| `VIEW_CHANGED` | 2D/3D toggle | `'2d'` or `'3d'` |
| `FILTER_CHANGED` | Volcano checkbox toggled | none |
| `AXES_CHANGED` | X/Y/Z/color axis changed | none |
| `POINT_CLICKED` | Click on a chart point | `{ index, ctrlKey }` |
| `CORRECTION_MODE_CHANGED` | Correction mode toggled | `{ active }` |
| `POINT_CORRECTED` | User point dragged/edited | correction data |
| `FETCH_ERROR` | Base CSV fetch failed | error message string |

### 2. Service Layer (backend abstraction)

All data access goes through `js/services/api.js`, which delegates to the active backend. In static mode, this is `static-backend.js` (CSV fetch + localStorage). See [services.md](services.md) for migration details.

### 3. Dynamic Dimensions

Columns are **not hardcoded**. They are detected from CSV headers and configured in `js/columns.js`. Adding a dimension = adding a column to the CSV + an entry in `columns.js`.

### 4. Missing Data Handling

Null/empty cells are valid throughout. Points with null values for the current axes are filtered from the chart (not removed from the dataset).

## Data Flow

```
volcanoData.csv
      |
      v
static-backend.js  (fetch + parse)
      |
      v
   api.js  (unified facade)
      |
      +---> sidebar.js     (axis selectors, filter)
      +---> chart2d.js     (2D rendering)
      +---> chart3d.js     (3D rendering)
      +---> detail-panel.js (right panel)
      +---> modals.js      (import/export)
      +---> toast.js       (notifications)
      +---> tutorial.js    (guided onboarding)

localStorage
      |
      v
static-backend.js  (read/write user data)
      |
      v
   api.js  (merge base + user via getAllRows())
```

## Render Cycle

1. `app.js` calls `renderChart()`
2. Rows are filtered according to active volcano filters (`_getFilteredRows()`)
3. The active chart module (2D or 3D) receives rows and column names
4. Plotly generates the chart in `#plotDiv`
5. Plotly events (`plotly_click`, `plotly_selected`) feed into `selection.js`
6. `selection.js` emits `SELECTION_CHANGED` → `detail-panel.js` updates the right panel
