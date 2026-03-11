# events.js — Pub/Sub Event Bus

**Path:** `js/events.js`

## Overview

Lightweight publish/subscribe event system that decouples modules. Any module can emit or listen to named events without importing other modules directly. This makes it easy to swap UI frameworks or add new subscribers without modifying emitters.

## Exports

### `Events` (object)

Event bus singleton with three methods:

#### `Events.on(event, fn)`

Subscribe to an event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `string` | Event name (use `EVT` constants) |
| `fn` | `function` | Callback invoked with event data |

#### `Events.off(event, fn)`

Unsubscribe from an event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `string` | Event name |
| `fn` | `function` | The exact function reference passed to `on()` |

#### `Events.emit(event, data)`

Emit an event, calling all subscribers synchronously.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `string` | Event name |
| `data` | `any` | Data passed to each subscriber callback |

---

### `EVT` (object)

Constants for all event names used across the application:

| Constant | Value | Emitted by | Description |
|----------|-------|------------|-------------|
| `DATA_LOADED` | `'data:loaded'` | `app.js` | Base CSV data finished loading |
| `DATA_UPDATED` | `'data:updated'` | `modals.js`, `correction.js` | User data added/deleted/corrected |
| `SELECTION_CHANGED` | `'selection:changed'` | `selection.js` | Point selection set changed |
| `VIEW_CHANGED` | `'view:changed'` | `app.js` | Switched between 2D and 3D view |
| `FILTER_CHANGED` | `'filter:changed'` | `sidebar.js` | Volcano filter checkboxes changed |
| `AXES_CHANGED` | `'axes:changed'` | `sidebar.js` | Axis dropdown selection changed |
| `POINT_CLICKED` | `'point:clicked'` | `chart2d.js`, `chart3d.js` | User clicked a data point |
| `CORRECTION_MODE_CHANGED` | `'correction:modeChanged'` | `correction.js` | Entered/exited correction mode |
| `POINT_CORRECTED` | `'correction:pointCorrected'` | `correction.js` | A point was dragged to new position |
| `FETCH_ERROR` | `'data:fetchError'` | `api.js` | Error fetching base data |
| `REF_VIEW_REQUESTED` | `'ref:viewRequested'` | `detail-panel.js`, `sidebar.js` | User wants to view a reference's details |

## Usage

```js
import { Events, EVT } from '../events.js';

Events.on(EVT.DATA_LOADED, (data) => { /* react to data load */ });
Events.emit(EVT.AXES_CHANGED, { x: 'SiO2', y: 'MgO' });
```
