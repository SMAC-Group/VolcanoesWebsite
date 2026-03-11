# app.js — Main Orchestrator

**Path:** `js/app.js`

## Overview

Entry point of the application, loaded via `<script type="module" src="js/app.js">` in `index.html`. Imports all other modules (including `references.js` as `Refs`), initializes the UI, loads data and references in parallel, and wires event listeners. Does not export any public API.

## Internal State

| Variable | Type | Description |
|----------|------|-------------|
| `currentView` | `string` | Current view mode: `'2d'` or `'3d'` |
| `showEllipses` | `boolean` | Whether confidence ellipses are shown in 2D view |
| `showLabels` | `boolean` | Whether point labels are shown on charts |
| `_colorMap` | `object` | Cached mapping of volcano names to colors |

## Internal Functions

### `init()`

Main initialization function, called automatically at module load:
1. Loads base CSV data and references in parallel (`Promise.all([API.fetchVolcanoes(), Refs.fetchReferences()])`)
2. Initializes sidebar (axis selectors, volcano filter)
3. Initializes modals and tutorial
4. Performs the first chart render
5. Wires all event subscriptions (see below)

### `refresh()`

Re-renders the current chart (2D or 3D) with the latest data, axes, and filters. Called whenever data, axes, filters, or view mode change.

### `buildColorMap(rows, colorCol)`

Builds a `{ volcanoName: color }` mapping using `CONFIG.clusterColors`.

| Parameter | Type | Description |
|----------|------|-------------|
| `rows` | `object[]` | Data rows |
| `colorCol` | `string` | Column name used for coloring |

## Event Wiring

`app.js` subscribes to the following events and reacts accordingly:

| Event | Reaction |
|-------|----------|
| `AXES_CHANGED` | Re-renders chart with new axes |
| `FILTER_CHANGED` | Re-renders chart with new volcano filter |
| `DATA_UPDATED` | Re-renders chart with updated data |
| `SELECTION_CHANGED` | Updates detail panel with selection info |
| `POINT_CLICKED` | Shows point detail in right panel |
| `VIEW_CHANGED` | Switches between 2D and 3D rendering |
| `CORRECTION_MODE_CHANGED` | Enables/disables correction UI |
| `POINT_CORRECTED` | Re-renders chart to reflect correction |
| `REF_VIEW_REQUESTED` | Opens the reference viewer modal via `Modals.openReference(csvKey)` |

## DOM Bindings

Attaches click/change handlers to:
- View toggle buttons (2D/3D)
- Ellipse toggle checkbox
- Label toggle checkbox
- Correction mode button
- Undo/redo buttons
- Reset 3D view button
- Sidebar search box (`#filterSearch`): filters volcano checkboxes by name and by BibTeX field matches (via `Refs.searchRefs()`), with `<mark>` highlighting on matching label text
