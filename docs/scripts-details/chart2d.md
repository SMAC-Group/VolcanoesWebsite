# chart2d.js — 2D Scatter Chart

**Path:** `js/ui/chart2d.js`

## Overview

Renders an interactive 2D scatter plot using Plotly.js (`scattergl` trace type). Supports confidence ellipses per group, point labels, lasso/rectangle selection, and click-to-select. Separates base and user data into distinct traces for styling. Emits `POINT_CLICKED` and `SELECTION_CHANGED` events.

## Exports

### `render(rows, xCol, yCol, colorCol, options?)`

Renders (or re-renders) the 2D scatter plot.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rows` | `object[]` | Data rows to plot |
| `xCol` | `string` | Column for X axis |
| `yCol` | `string` | Column for Y axis |
| `colorCol` | `string` | Column for color grouping |
| `options` | `object` | Optional rendering options (see below) |

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `invertY` | `boolean` | `false` | Invert the Y axis |
| `showEllipses` | `boolean` | `false` | Show 95% confidence ellipses per group |
| `showLabels` | `boolean` | `false` | Show text labels on points |
| `colorMap` | `object` | `null` | Pre-built `{ group: color }` mapping |

**Behavior:**
- Creates one trace per volcano group (base data) + one trace for user data
- Points with `null` values for x or y are excluded
- Ellipses are computed as 95% confidence ellipses from covariance matrix
- Selection via lasso/rectangle emits `SELECTION_CHANGED`
- Click on a point emits `POINT_CLICKED`

### `getPlotElement()` → `HTMLElement`

Returns the Plotly container DOM element (`#plotDiv`).

### `getUserTraceIndex()` → `number`

Returns the trace index of the user data trace. Returns `-1` if no user data trace exists. Used by the correction module to identify which trace to enable dragging on.

### `pixelToData(clientX, clientY)` → `{ x, y } | null`

Converts screen pixel coordinates to data coordinates on the chart.

| Parameter | Type | Description |
|-----------|------|-------------|
| `clientX` | `number` | Mouse X position (viewport pixels) |
| `clientY` | `number` | Mouse Y position (viewport pixels) |

Returns `null` if the coordinates are outside the plot area.

### `dataToPixel(dataX, dataY)` → `{ px, py } | null`

Converts data coordinates to screen pixel coordinates.

| Parameter | Type | Description |
|-----------|------|-------------|
| `dataX` | `number` | X value in data space |
| `dataY` | `number` | Y value in data space |

Returns `null` if the conversion fails.
