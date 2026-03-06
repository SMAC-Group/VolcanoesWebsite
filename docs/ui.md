# UI Components

[Back to README](../README.md) | [Files](files.md)

---

## Resizable Panels

The 3-column layout includes draggable resize handles between panels. Drag the border between left/center or center/right to resize. Constraints:
- Left panel: 180px min, 400px max
- Right panel: 200px min, 450px max
- Center (chart): takes remaining space (`1fr`)

The Plotly chart is resized automatically when dragging ends. On mobile (<900px), handles are hidden and layout switches to single column.

Panel sizes are persisted in `localStorage` (key `volcaninfos_layout`) and restored on page load. The "Reset layout" button in the header clears the saved sizes and restores defaults (255px / 275px).

---

## `js/ui/sidebar.js`

Left panel: axis selectors and volcano filter.

**Exported functions**:

- `initAxisSelectors()` — populates the X, Y, Z, and Color `<select>` elements with available numeric/categorical columns. Uses default values from `CONFIG.defaultAxes`.
- `initVolcanoFilter()` — generates the checkbox list from unique values of the first categorical column. Each change emits `EVT.FILTER_CHANGED`.
- `getActiveFilters()` — returns the names of checked volcanoes, or `null` if all are checked (= no filter).
- `getAxes()` — returns `{ x, y, z, color, invertY }` from the current selector values.

---

## `js/ui/chart2d.js`

2D chart using Plotly (`scattergl` for performance).

**`render(rows, xCol, yCol, colorCol, options)`**

1. Filters rows with valid values for X and Y
2. Builds a color map by group (color column)
3. Creates 2 traces: base data (triangles) and user data (green circles)
4. If `showEllipses`: computes confidence ellipses (~1.9 sigma) per group (min 5 points) with semi-transparent fill
5. If `showLabels`: adds the group name below each ellipse
6. Wires `plotly_click` → emits `EVT.POINT_CLICKED` (shows detail) and `plotly_selected` → `Selection.selectMultiple()`

**Layout**: dark theme, lasso dragmode by default, scrollZoom enabled, no visible modebar.

**Middle-click pan**: a custom handler (`_attachMiddlePan`) enables panning with the middle mouse button regardless of the current dragmode. This keeps left-click for the active tool (lasso/rect/pan) while middle-click always pans. During middle-click drag, the Pan toolbar button is visually highlighted; on release, the highlight returns to the previously active tool (read from Plotly's `dragmode`). A hint label in the 2D toolbar reminds the user of this shortcut.

**Internal functions**:
- `_attachMiddlePan(el)` — wires mousedown/mousemove/mouseup for middle-button panning
- `_setToolbarHighlight(mode, active)` — toggles toolbar button highlights during middle-click pan
- `_groupBy(rows, col)` — groups rows by column value
- `_tooltip(row)` — generates tooltip HTML (meta + main axes)
- `_hexToRgba(hex, a)` — converts hex color to rgba

---

## `js/ui/chart3d.js`

3D chart using Plotly (`scatter3d`).

**`render(rows, xCol, yCol, zCol, colorCol, options)`**

1. Filters valid rows for X, Y, and Z
2. Creates base + user traces (same logic as 2D)
3. Computes **centroids** per group: average X/Y/Z position, displayed as open circles with labels
4. Wires `plotly_click` → emits `EVT.POINT_CLICKED` (shows detail)

No lasso/rectangle in 3D (Plotly limitation). Interaction is via orbit (drag), pan (Shift+drag), and zoom (scroll).

---

## `js/ui/detail-panel.js`

Right panel: selection details and statistics.

**`updateSelectionInfo(selectedSet, allRows, axes)`**
- Updates counters (number of selected points)
- Computes averages for the current X and Y axes (dynamic, passed via `axes: { x, y }`)
- Updates stat labels to show the current axis names via `Columns.label()`
- Displays up to 50 selected points as clickable items in the selection list
- Clicking an item calls `showPointDetailByIndex()` to display its detail
- If no points selected: shows an empty state message

**`showPointDetailByIndex(index)`**
- Looks up the row by index in `API.getAllRows()`
- Displays a detail card for the point (Reference as title, "YOU" tag if user data, all configured columns)
- If a multi-selection is active, shows a "Back to selection" button that restores the empty detail view (the selection list remains visible below)

**Interaction flow**:
1. **Single click** on a chart point → shows detail directly in the "Selected point" section
2. **Ctrl+click** (or Cmd+click on macOS) → toggles the point in the selection set
3. **Lasso/rectangle selection** → populates the selection list with clickable items + stats
4. **Click an item** in the selection list → shows its detail with a "Back to selection" button
5. **Click "Back"** → returns to the empty detail state (selection list stays)
6. **Change axes** while selection is active → stats and labels update dynamically

---

## `js/ui/modals.js`

Manages the 5 application modals.

### CSV Upload (`modalUpload`)
- Drag & drop zone + click to browse
- Parses the file with `csv.js`, shows a preview (first 10 rows)
- Displays validation errors/warnings
- "Confirm" button → `API.appendUserData()` + emits `EVT.DATA_UPDATED`

### Manual Entry (`modalAdd`)
- Dynamically generates form fields from CSV headers
- On submit: converts values (string → number if applicable, empty → null)
- Adds the row via `API.appendUserData()`

### Export (`modalExport`)
- Shows a CSV preview in a `<pre>` block
- "Download" button: generates a Blob and triggers the download
- 3-step instructions for email submission

### Contribution (`modalContribute`)
- Name and email fields
- Summary of user data in cache
- "Download & Send" button: generates CSV, downloads it, shows contact email

### Manage User Data (`modalManage`)
- Lists all user-added points in a table (first 6 columns displayed)
- Each row has a "Delete" button to remove that individual point via `API.deleteUserDataRow(index)`
- "Delete all" button clears all user data (with confirmation)
- Table and info text rebuild after each deletion
- Emits `EVT.DATA_UPDATED` after changes so the chart and UI refresh
