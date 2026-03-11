# sidebar.js — Sidebar Controls

**Path:** `js/ui/sidebar.js`

## Overview

Manages the left sidebar UI: axis selector dropdowns (X, Y, Z, Color), the Y-axis invert toggle, and the volcano filter checkbox list. Emits `AXES_CHANGED` and `FILTER_CHANGED` events when the user interacts with controls.

## Exports

### `initAxisSelectors()`

Populates the X, Y, Z, and Color `<select>` elements with available columns from `getNumericHeaders()` and `getCategoricalHeaders()`. Sets default selections from `CONFIG.defaultAxes`. Attaches `change` event listeners that emit `AXES_CHANGED`.

### `initVolcanoFilter()`

Builds a checkbox list of unique volcano names from the data. Each checkbox toggles that volcano's visibility. Changes emit `FILTER_CHANGED`.

### `getActiveFilters()` → `string[] | null`

Returns the list of checked volcano names, or `null` if all are checked (meaning no filter is active).

### `getAxes()` → `object`

Returns the current axis selections:

| Property | Type | Description |
|----------|------|-------------|
| `x` | `string` | Selected X-axis column |
| `y` | `string` | Selected Y-axis column |
| `z` | `string` | Selected Z-axis column |
| `color` | `string` | Selected color grouping column |
| `invertY` | `boolean` | Whether Y-axis is inverted (auto-set for Pressure columns) |
