# config.js — Centralized Configuration

**Path:** `js/config.js`

## Overview

Single source of truth for all tunable values in the application. Exports a frozen `CONFIG` object used by every other module. Changing a value here propagates everywhere without touching other files.

## Exports

### `CONFIG` (object)

Frozen configuration object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `backend` | `string` | Backend mode: `'static'` (CSV + localStorage) or `'remote'` (future API) |
| `apiUrl` | `string \| null` | Base URL for remote API (unused in static mode) |
| `defaultAxes` | `object` | Default axis selections `{ x, y, z }` on first load |
| `autoInvertY` | `string[]` | Column names that automatically invert the Y axis (e.g. Pressure) |
| `contactEmail` | `string` | Contact email displayed in contribution/export modals |
| `maxCacheSizeKB` | `number` | Maximum size for localStorage user data cache (in KB) |
| `theme` | `object` | Color palette for the dark theme (background, text, accent colors) |
| `clusterColors` | `string[]` | Ordered color cycle used to distinguish volcano groups in charts |

## Usage

```js
import { CONFIG } from '../config.js';

if (CONFIG.backend === 'static') { /* ... */ }
const colors = CONFIG.clusterColors;
```

## Notes

- The object is frozen (`Object.freeze`) — properties cannot be modified at runtime.
- To add a new tunable value, add it to this object and use it via import wherever needed.
