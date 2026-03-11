# chart3d.js — 3D Scatter Chart

**Path:** `js/ui/chart3d.js`

## Overview

Renders an interactive 3D scatter plot using Plotly.js (`scatter3d` trace type). Displays group centroids as larger markers and supports free rotation. Checks for WebGL availability before rendering.

## Exports

### `hasWebGL()` → `boolean`

Tests whether the browser supports WebGL by attempting to create a WebGL context on a temporary canvas. Returns `true` if WebGL is available.

### `showNoWebGLWarning()`

Displays a warning message in the plot container indicating that WebGL is not available and 3D view cannot be used.

### `render(rows, xCol, yCol, zCol, colorCol, options?)`

Renders the 3D scatter plot.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rows` | `object[]` | Data rows to plot |
| `xCol` | `string` | Column for X axis |
| `yCol` | `string` | Column for Y axis |
| `zCol` | `string` | Column for Z axis |
| `colorCol` | `string` | Column for color grouping |
| `options` | `object` | Optional rendering options (see below) |

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showLabels` | `boolean` | `false` | Show text labels on points |
| `colorMap` | `object` | `null` | Pre-built `{ group: color }` mapping |

**Behavior:**
- Creates one trace per volcano group + one for user data
- Adds centroid markers (larger, diamond-shaped) for each group
- Points with `null` for any of x/y/z are excluded
- Click on a point emits `POINT_CLICKED`
