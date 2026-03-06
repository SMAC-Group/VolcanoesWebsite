# Project Files

[Back to README](../README.md)

---

## `index.html`

Application entry point. Defines the 3-column layout:

- **Header**: logo, 2D/3D toggle, action buttons (Import, Add, Manage, Export, Contribute, Reset layout)
- **Left panel** (`panel-left`): X/Y/Z axis selectors, color selector, "Invert Y" checkbox, volcano filter with search
- **Resize handles** (`resize-handle`): draggable dividers between panels (col-resize cursor)
- **Main area** (`main-area`): toolbar (lasso, rectangle, pan, reset, ellipses, labels) + `#plotDiv` (Plotly container)
- **Right panel** (`panel-right`): selected point detail, selection statistics, selected points list, clear selection button

Panels are resizable by dragging the handles. Min/max constraints: left 180–400px, right 200–450px.

Also contains 5 modals (overlays): CSV upload, manual entry, manage user data, export, contribution.

Loads Plotly.js 2.27.0 via CDN and Google Fonts (Syne + Space Mono).

---

## `css/style.css`

Single stylesheet. Dark theme based on CSS variables (`:root`).

**Main sections**:
- Theme variables (`--bg`, `--accent`, `--text`, etc.)
- Sticky header with logo and pill buttons
- 3-column grid layout (`255px 1fr 275px`)
- Axis selectors and volcano filter
- Chart toolbar
- Right panel (volcano cards, stats, selection list)
- Modals (overlay + content)
- Drag & drop upload zone
- Preview table
- Responsive: below 900px, switches to single column

---

## `js/config.js`

Centralized configuration. All tunable values for the project.

**Properties**:
- `backend`: `'static'` or `'remote'` (backend toggle)
- `apiUrl`: remote backend URL (null in static mode)
- `defaultAxes`: default axes (`{ x: 'T_C', y: 'P_kbar', z: 'SiO2_Cpx' }`)
- `contactEmail`: contact email for contributions
- `maxCacheSizeKB`: localStorage limit (5 MB)
- `theme`: colors, fonts, backgrounds
- `clusterColors`: palette of 12 colors for groups/clusters

---

## `js/events.js`

Lightweight event bus (pub/sub). 3 methods:
- `Events.on(event, fn)` — subscribe to an event
- `Events.off(event, fn)` — unsubscribe
- `Events.emit(event, data)` — emit an event

Also exports `EVT`: event name constants. See [architecture.md](architecture.md) for the full list.

---

## `js/app.js`

Main orchestrator. Imports all modules and wires up events.

**Responsibilities**:
- `init()`: loads data, initializes UI, wires all listeners
- `renderChart()`: determines active view (2D/3D), filters rows, delegates to the appropriate chart module
- `setView(v)`: toggles 2D/3D, updates toolbar and Z selector state
- `_initResize()`: sets up draggable resize handles between the 3 panels (min/max constraints, Plotly resize on end)
- `setTool(mode)`: changes Plotly interaction mode (`lasso`, `select`, `pan`)
- `resetView()`: resets camera/axes to initial position
- `toggleEllipses()` / `toggleLabels()`: toggles visual overlays
- Keyboard shortcut: `Escape` to clear selection

---

## `js/columns.js`

CSV column configuration. Each entry defines:
- `label`: display name in the UI (with Unicode special characters)
- `role`: determines where and how the column is used

**Available roles**:
| Role | Axes | Tooltips | Detail | Description |
|------|------|----------|--------|-------------|
| `axis` | yes | yes | yes | Primary numeric column |
| `meta` | no | no | yes | Text metadata (e.g., Reference) |
| `detail` | yes | no | yes | Secondary numeric (standard deviations) |
| `hidden` | no | no | no | Ignored by the UI |

**Exported functions**: `allKeys()`, `axisKeys()`, `tooltipKeys()`, `detailKeys()`, `metaKeys()`, `label(key)`, `isActive(key)`.

---

## `js/csv.js`

Pure CSV parser and exporter (no dependencies, no side effects).

**Functions**:
- `parse(text)` → `{ headers: string[], rows: object[] }` — handles quoted fields, multi-line values, empty cells (→ `null`), European decimal separator (comma → period)
- `stringify(headers, rows)` → CSV string — escapes commas, quotes, newlines
- `validate(headers, rows)` → `{ type, message }[]` — detects missing headers, entirely empty rows

---

## `js/selection.js`

Point selection state (by index). Uses an internal `Set`.

**API**:
- `get()` → copy of the selection Set
- `count()` → number of selected points
- `isSelected(index)` → boolean
- `select(index)`, `deselect(index)`, `toggle(index)`
- `selectMultiple(indices)` — adds multiple points
- `clearAll()` — clears the selection

Every change emits `EVT.SELECTION_CHANGED`.

---

---

## `js/ui/correction.js`

Correction mode engine: allows dragging user points on the 2D chart to adjust their position.

**Exports**: `enter(axes)`, `exit()`, `isActive()`, `reattach()`, `setAxes(axes)`, `undo()`, `redo()`, `getCorrections()`, `getCorrectionForIndex(idx)`, `clearAll()`, `applyToUserData()`, `patchRows(rows)`

See [ui.md](ui.md) for full documentation.

---

## Service files → see [services.md](services.md)

## UI files → see [ui.md](ui.md)
