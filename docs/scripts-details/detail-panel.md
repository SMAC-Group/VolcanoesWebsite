# detail-panel.js — Right Detail Panel

**Path:** `js/ui/detail-panel.js`

## Overview

Manages the right sidebar panel that displays information about selected points: individual point details (all column values) and selection statistics (count, mean, std dev for numeric columns). Imports `Events`, `EVT`, and `Refs` (from `references.js`) to make reference names clickable — clicking a reference name emits `REF_VIEW_REQUESTED` to open the reference viewer modal.

## Exports

### `updateSelectionInfo(selectedSet, allRows, axes)`

Updates the panel with aggregate statistics for the current selection.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selectedSet` | `Set<number>` | Set of selected point indices |
| `allRows` | `object[]` | Complete merged dataset |
| `axes` | `object` | Current axes `{ x?: string, y?: string }` |

**Displays:**
- Number of selected points
- Mean and standard deviation for X and Y columns
- List of selected points with click-to-detail

### `showPointDetailByIndex(index)`

Shows a detail card for a single data point, listing all column values.

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Point index in the merged dataset |

**Displays:**
- All non-hidden column values for the point
- Reference name as a clickable link (`.ref-link`) that emits `REF_VIEW_REQUESTED` to open the reference viewer modal
- Source indicator (base or user data)
- Delete button for user data points
