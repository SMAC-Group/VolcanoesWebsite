# correction.js — Data Correction Mode

**Path:** `js/ui/correction.js`

## Overview

Implements a drag-to-correct workflow for user data points on the 2D chart. When correction mode is active, user data points become draggable. Changes are tracked in memory with full undo/redo support and can be applied to localStorage.

## Internal State

| Variable | Type | Description |
|----------|------|-------------|
| `_active` | `boolean` | Whether correction mode is currently on |
| `_corrections` | `Map<number, { fields }>` | Pending corrections keyed by merged index |
| `_undoStack` | `array` | Stack of previous states for undo |
| `_redoStack` | `array` | Stack of undone states for redo |
| `_axes` | `object` | Current `{ x, y }` axis columns |

## Exports

### `isActive()` → `boolean`

Returns `true` if correction mode is currently enabled.

### `enter(axes)`

Activates correction mode. Emits `CORRECTION_MODE_CHANGED`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `axes` | `object` | Current axes `{ x?: string, y?: string }` |

### `exit()`

Deactivates correction mode. Emits `CORRECTION_MODE_CHANGED`.

### `setAxes(axes)`

Updates the axis mapping used for corrections (called when axes change while in correction mode).

| Parameter | Type | Description |
|-----------|------|-------------|
| `axes` | `object` | New axes `{ x?: string, y?: string }` |

### `reattach()`

Re-attaches drag event handlers to the Plotly chart. Must be called after every chart re-render while correction mode is active.

### `undo()`

Reverts the last correction. Pushes current state to redo stack. Emits `POINT_CORRECTED`.

### `redo()`

Re-applies the last undone correction. Pushes current state to undo stack. Emits `POINT_CORRECTED`.

### `getCorrections()` → `Map<number, { fields: object }>`

Returns all pending corrections. Each entry maps a merged index to an object with `fields` containing the corrected column values.

### `getCorrectionForIndex(mergedIndex)` → `{ fields: object } | null`

Returns pending corrections for a specific point, or `null` if none.

| Parameter | Type | Description |
|-----------|------|-------------|
| `mergedIndex` | `number` | Index in the merged dataset |

### `clearAll()`

Clears all pending corrections and empties both undo and redo stacks.

### `applyToUserData()` → `number`

Applies all pending corrections to localStorage user data. Returns the number of points actually updated. Clears corrections after applying.

### `patchRows(rows)` → `object[]`

Returns a copy of the rows array with pending corrections applied. Used to render corrected positions on the chart without saving them.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rows` | `object[]` | Original data rows |
