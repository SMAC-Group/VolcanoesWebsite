# UI Components

[Back to README](../README.md) | [Files](files.md)

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
6. Wires `plotly_click` → `Selection.toggle()` and `plotly_selected` → `Selection.selectMultiple()`

**Layout**: dark theme, lasso dragmode by default, scrollZoom enabled, no visible modebar.

**Internal functions**:
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
4. Wires `plotly_click` → `Selection.toggle()`

No lasso/rectangle in 3D (Plotly limitation). Interaction is via orbit (drag), pan (Shift+drag), and zoom (scroll).

---

## `js/ui/detail-panel.js`

Right panel: selection details and statistics.

**`updateSelectionInfo(selectedSet, allRows)`**
- Updates counters (number of selected points)
- Computes Temperature and Pressure averages for the selection
- Displays the first 20 selected points (name + value)
- If no points selected: shows an empty state message

**`showPointDetail(row)`**
- Displays a detail card for a single point
- Shows the Reference as title, "YOU" tag if it's user data
- Lists all configured columns with their values

---

## `js/ui/modals.js`

Manages the 4 application modals.

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
