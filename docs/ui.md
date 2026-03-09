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
3. Creates 2 traces: "Base data" (triangles, per-group colors) and "Your data" (green circles). Both appear in the Plotly legend at bottom-left for in-sample / out-of-sample distinction
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

---

## `js/ui/correction.js`

Data correction engine: drag user points on the 2D chart to adjust their position.

**Activation**: toggle via the "Correct" toolbar button (2D only). Entering correction mode disables lasso/select/pan tools and sets Plotly's dragmode to `false`. Exiting restores normal interaction.

**Drag workflow**:
1. In correction mode, mousedown on a user point (within 15px hit radius) starts a drag
2. mousemove updates the point position in real-time via `Plotly.redraw()`
3. mouseup commits the change and pushes an undo entry
4. The correction panel in the right sidebar shows original vs corrected values

**Inline editing**:
1. After dragging a point, its corrected values appear in green in the correction panel
2. Clicking on a green value converts it into an inline input (Unity-style click-to-edit)
3. Modifying the value and pressing Enter (or clicking away) commits the change and updates the chart in real-time
4. Pressing Escape cancels the edit
5. Invalid (non-numeric) input is silently reverted

**Undo/redo**: session-only in-memory stacks. Supports both drag actions (`type: 'drag'`, X + Y changes) and field edits (`type: 'field'`, single column change). Ctrl+Z / Ctrl+Y keyboard shortcuts supported. Undo restores previous value and updates both chart and edit form if open. If fully undone to original, the correction entry is removed.

**Corrections map**: `Map<mergedIndex, { fields: { [colName]: { originalValue, newValue } } }>`. Used by `patchRows()` to apply corrections to rendered data when the chart re-renders during correction mode.

**Apply/Discard**:
- "Apply" writes corrected values into localStorage user data, then clears correction state and emits `EVT.DATA_UPDATED`
- "Discard" clears all corrections and re-renders the chart with original values

**Edge cases**:
- Switching to 3D exits correction mode (corrections remain in memory)
- Data update (upload/delete) exits correction mode and clears all corrections
- Chart re-render during correction mode: `reattach()` re-binds mouse handlers, `patchRows()` ensures corrected positions are preserved

**Events emitted**: `EVT.CORRECTION_MODE_CHANGED`, `EVT.POINT_CORRECTED`

---

## `js/ui/tutorial.js`

Guided step-by-step tutorial overlay for onboarding new users.

**Auto-show**: on first visit (no `volcaninfos_tutorial_done` key in `localStorage`). After completion or skip, the key is set and the tutorial won't auto-show again.

**Re-trigger**: the "?" button (`#btnTutorial`) in the header calls `Tutorial.start()` at any time.

**UI structure**:
- **Overlay** (`.tutorial-overlay`): semi-transparent black background, z-index 500
- **Spotlight** (`.tutorial-spotlight`): positioned over the target element with a `box-shadow` cutout and orange border. Transitions smoothly between steps
- **Tooltip** (`.tutorial-tooltip`): positioned relative to the spotlight (right/left/top/bottom), clamped to viewport. Contains title, text, step counter, and 3 buttons (Skip, Back, Next)

**Steps** (10 total):
1. Welcome (centered, no highlight)
2. Chart axes (`.axis-selector`)
3. Color grouping (`.color-row`)
4. Volcano filter (`#volcanoList`)
5. 2D/3D views (`.view-toggle`)
6. Chart tools (`.plot-toolbar`)
7. Correction mode (`#tb-correct`)
8. Selection & details (`#selectionPanels`)
9. Import & Export (`.header-right`)
10. Conclusion (`#btnTutorial`)

**Navigation**: Skip quits immediately. Back goes to previous step. Next advances. Clicking the overlay background also quits. On the last step, Next becomes "Finish"

---

## Toast Notifications (`js/ui/toast.js`)

Styled notification system replacing browser `alert()`. Toasts appear at the bottom-right corner and auto-dismiss after 4 seconds. Four types: `info` (blue), `success` (green), `warning` (gold), `error` (red).

Used in `modals.js` (validation warnings, export success) and `app.js` (fetch errors via `EVT.FETCH_ERROR`).

---

## Loading Spinner

A full-screen overlay (`#loadingOverlay`) shown while the base CSV data loads. Pure CSS animation (rotating circle). Hidden after `fetchVolcanoes()` + first `renderChart()` complete, then removed from the DOM after the fade-out transition.
