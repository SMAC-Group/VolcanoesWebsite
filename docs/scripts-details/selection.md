# selection.js — Point Selection State

**Path:** `js/selection.js`

## Overview

Manages the set of currently selected data point indices. Acts as a centralized selection state that emits `SELECTION_CHANGED` events whenever the selection changes. Used by charts (for highlighting) and the detail panel (for showing stats).

## Internal State

- `_selected` — `Set<number>` storing indices of selected points in the merged dataset.

## Exports

### `get()` → `Set<number>`

Returns a **copy** of the current selection set (safe to iterate without side effects).

### `count()` → `number`

Returns the number of currently selected points.

### `isSelected(index)` → `boolean`

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Point index in the merged dataset |

Returns `true` if the point is in the current selection.

### `select(index)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Point index to add |

Adds a point to the selection. Emits `SELECTION_CHANGED`.

### `deselect(index)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Point index to remove |

Removes a point from the selection. Emits `SELECTION_CHANGED`.

### `toggle(index)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Point index to toggle |

Adds the point if not selected, removes it if already selected. Emits `SELECTION_CHANGED`.

### `selectMultiple(indices)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `indices` | `number[]` | Array of point indices |

Adds all given indices to the selection. Emits `SELECTION_CHANGED` once.

### `clearAll()`

Clears the entire selection. Emits `SELECTION_CHANGED`.
