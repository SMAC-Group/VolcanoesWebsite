# Scripts Reference

Detailed reference for all JavaScript modules in the project. Each section summarizes the file's purpose and key functions. For the complete API (all functions, parameters, return types), click the **detailed reference** link.

---

## Core Modules

### [`config.js`](scripts-details/config.md) — Centralized Configuration

Single frozen `CONFIG` object containing all tunable values: backend mode, default axes, theme colors, cluster color cycle, contact email, cache size limit, and auto-invert Y axis rules. Every other module imports from here.

---

### [`events.js`](scripts-details/events.md) — Event Bus

Lightweight pub/sub system that decouples all modules.

| Function | Description |
|----------|-------------|
| `Events.on(event, fn)` | Subscribe to a named event |
| `Events.off(event, fn)` | Unsubscribe from an event |
| `Events.emit(event, data)` | Broadcast an event to all subscribers |

Events used across the app: `DATA_LOADED`, `DATA_UPDATED`, `AXES_CHANGED`, `FILTER_CHANGED`, `SELECTION_CHANGED`, `POINT_CLICKED`, `VIEW_CHANGED`, `CORRECTION_MODE_CHANGED`, `POINT_CORRECTED`, `FETCH_ERROR`.

---

### [`columns.js`](scripts-details/columns.md) — Column Configuration

Maps CSV headers to display labels and roles (`axis`, `meta`, `detail`, `hidden`). The role determines where a column appears in the UI.

| Function | Description |
|----------|-------------|
| `axisKeys()` | Columns usable as chart axes |
| `metaKeys()` | Metadata columns (Volcano, Reference, etc.) |
| `label(key)` | Human-readable label for a column |
| `isActive(key)` | Whether a column is visible in the UI |

---

### [`csv.js`](scripts-details/csv.md) — CSV Parser / Exporter

Pure utility — no DOM, no side effects.

| Function | Description |
|----------|-------------|
| `parse(text)` | CSV string → `{ headers, rows }`, handles quotes, converts numeric values |
| `stringify(headers, rows)` | Row objects → CSV string with proper escaping |
| `validate(headers, rows)` | Checks for missing headers, duplicates, type mismatches — returns issue list |

---

### [`selection.js`](scripts-details/selection.md) — Selection State

Manages the set of selected point indices. Emits `SELECTION_CHANGED` on every modification.

| Function | Description |
|----------|-------------|
| `select(index)` / `deselect(index)` | Add/remove a single point |
| `toggle(index)` | Toggle selection on a point |
| `selectMultiple(indices)` | Bulk-add points (lasso/rectangle selection) |
| `clearAll()` | Deselect everything |
| `get()` | Returns a copy of the current selection `Set` |

---

### [`app.js`](scripts-details/app.md) — Main Orchestrator

Entry point loaded by `index.html`. Imports all modules, calls `init()` to load data and build the UI, then wires all event subscriptions. Manages view state (`2d`/`3d`), ellipse/label toggles, and the color map. Does not export any public API.

---

## Service Layer

### [`services/api.js`](scripts-details/api.md) — Data Access Facade

**The only module other files should import for data access.** Delegates to the active backend.

| Function | Description |
|----------|-------------|
| `fetchVolcanoes()` | Load base CSV dataset |
| `getAllRows()` | Merged base + user rows (tagged with `_source`) |
| `getAllHeaders()` / `getNumericHeaders()` | Available columns, filtered by config |
| `appendUserData(rows)` | Add rows to user data (localStorage) |
| `deleteUserDataRow(index)` | Remove a single user row |
| `clearUserData()` | Wipe all user data |
| `exportUserCSV(headers)` | Generate CSV string for download |
| `submitContribution(headers, meta)` | Package user data for contribution |
| `uniqueValues(header)` | Unique sorted values for a column |

---

### [`services/static-backend.js`](scripts-details/static-backend.md) — Static Backend

Implements the backend interface using `fetch()` for CSV loading and `localStorage` for user data persistence. Used when `CONFIG.backend === 'static'`. Same function signatures as `api.js` — the facade delegates here directly.

---

## UI Components

### [`ui/sidebar.js`](scripts-details/sidebar.md) — Sidebar Controls

Populates axis dropdowns and volcano filter checkboxes. Emits `AXES_CHANGED` and `FILTER_CHANGED`.

| Function | Description |
|----------|-------------|
| `initAxisSelectors()` | Build X/Y/Z/Color dropdowns from available columns |
| `initVolcanoFilter()` | Build checkbox list of volcano names |
| `getAxes()` | Current selections: `{ x, y, z, color, invertY }` |
| `getActiveFilters()` | Checked volcanoes (`null` = all visible) |

---

### [`ui/chart2d.js`](scripts-details/chart2d.md) — 2D Scatter Chart

Plotly.js `scattergl` chart with confidence ellipses, lasso/rectangle selection, and click interaction.

| Function | Description |
|----------|-------------|
| `render(rows, xCol, yCol, colorCol, options)` | Draw/redraw the 2D plot (supports `invertY`, `showEllipses`, `showLabels`, `colorMap`) |
| `getPlotElement()` | Returns the plot container DOM element |
| `getUserTraceIndex()` | Trace index of user data (for correction drag) |
| `pixelToData(clientX, clientY)` | Screen pixels → data coordinates |
| `dataToPixel(dataX, dataY)` | Data coordinates → screen pixels |

---

### [`ui/chart3d.js`](scripts-details/chart3d.md) — 3D Scatter Chart

Plotly.js `scatter3d` chart with group centroids and WebGL detection.

| Function | Description |
|----------|-------------|
| `hasWebGL()` | Check browser WebGL support |
| `showNoWebGLWarning()` | Display fallback message if no WebGL |
| `render(rows, xCol, yCol, zCol, colorCol, options)` | Draw/redraw the 3D plot with centroids |

---

### [`ui/detail-panel.js`](scripts-details/detail-panel.md) — Detail Panel

Right sidebar showing point details and selection statistics.

| Function | Description |
|----------|-------------|
| `updateSelectionInfo(selectedSet, allRows, axes)` | Show count, mean, std dev for selected points |
| `showPointDetailByIndex(index)` | Show all column values for a single point |

---

### [`ui/correction.js`](scripts-details/correction.md) — Data Correction

Drag-to-correct user data points on the 2D chart, with undo/redo.

| Function | Description |
|----------|-------------|
| `enter(axes)` / `exit()` | Toggle correction mode |
| `reattach()` | Re-bind drag handlers after chart re-render |
| `undo()` / `redo()` | Navigate correction history |
| `getCorrections()` | All pending corrections (`Map`) |
| `applyToUserData()` | Save corrections to localStorage, returns count |
| `patchRows(rows)` | Apply pending corrections to rows for rendering |

---

### [`ui/toast.js`](scripts-details/toast.md) — Toast Notifications

| Function | Description |
|----------|-------------|
| `toast(message, type)` | Show auto-dismissing notification (`info`, `success`, `warning`, `error`) |

---

### [`ui/modals.js`](scripts-details/modals.md) — Modal Dialogs

Manages CSV upload, manual entry, data management, export, and contribution modals.

| Function | Description |
|----------|-------------|
| `init()` | Wire all modal open/close/submit handlers (call once at startup) |
| `openUpload()` | CSV file upload with preview and validation |
| `openManualEntry()` | Dynamic form for adding a data point |
| `openManage()` | Table of user data with per-row delete |
| `openExport()` | CSV download of user data |
| `openContribute()` | Contribution form with metadata |

---

### [`ui/tutorial.js`](scripts-details/tutorial.md) — Guided Tutorial

Step-by-step onboarding overlay. Auto-starts on first visit.

| Function | Description |
|----------|-------------|
| `init()` | Create overlay DOM, auto-start on first visit |
| `start()` | Start tutorial from step 0 |

---

## Utility Scripts

### [`scripts/fetch_bibtex.mjs`](scripts-details/fetch_bibtex.md) — BibTeX Reference Fetcher

Node.js CLI script (not part of the frontend). Extracts references from `volcanoData.csv`, queries CrossRef API, scores results by author match and geology relevance, then outputs `data/references.bib` and `data/references_review.md`.

Run with: `node scripts/fetch_bibtex.mjs`

| Function | Description |
|----------|-------------|
| `extractUniqueRefs(csvPath)` | Parse CSV and return sorted unique reference strings |
| `parseRefString(refStr)` | Parse `"Author_Year"` into `{ firstAuthor, year, ... }` |
| `queryCrossRef(firstAuthor, allAuthors, year)` | Search CrossRef API for matching works |
| `scoreItem(firstAuthor, allAuthors, item)` | Rank a CrossRef result by author + geo-relevance |
| `fetchBibtex(doi)` | Get BibTeX entry via DOI content negotiation |
| `main()` | Orchestrate the full fetch-score-classify-export pipeline |
