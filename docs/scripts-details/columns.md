# columns.js — Column Configuration

**Path:** `js/columns.js`

## Overview

Defines the configuration for CSV columns: their display labels, roles (axis, meta, detail, hidden), and visibility. Provides helper functions to query columns by role. The UI uses these helpers to populate dropdowns, tooltips, and detail panels dynamically.

## Exports

### `COLUMNS` (object)

Configuration map keyed by CSV header name. Each entry has:

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Human-readable display label |
| `role` | `string` | One of `'axis'`, `'meta'`, `'detail'`, `'hidden'` |

Roles determine where a column appears:
- **axis** — Available as X/Y/Z axis, shown in tooltips and detail panel
- **meta** — Metadata column (e.g. Volcano name), used for grouping/filtering
- **detail** — Shown in detail panel and exports but not as axis option
- **hidden** — Excluded from UI entirely

---

### `allKeys()` → `string[]`

Returns all configured column keys excluding hidden ones.

### `axisKeys()` → `string[]`

Returns columns with role `'axis'` or `'detail'` — usable as chart axes.

### `tooltipKeys()` → `string[]`

Returns columns with role `'axis'` only — shown in hover tooltips.

### `detailKeys()` → `string[]`

Returns all non-hidden columns — shown in the detail panel.

### `metaKeys()` → `string[]`

Returns columns with role `'meta'` — used for grouping and filtering.

### `label(key)` → `string`

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | CSV header name |

Returns the display label for a column. Falls back to the key itself if not configured.

### `isActive(key)` → `boolean`

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | CSV header name |

Returns `true` if the column is configured and not hidden.

## Usage

```js
import { axisKeys, label } from '../columns.js';

const options = axisKeys().map(k => ({ value: k, text: label(k) }));
```
