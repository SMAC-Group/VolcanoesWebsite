// 3D scatter plot using Plotly.
// Single trace with per-point colors for performance.

import { CONFIG } from '../config.js';
import * as Columns from '../columns.js';
import * as Selection from '../selection.js';
import { Events, EVT } from '../events.js';

const CHART_ID = 'plotDiv';

export function render(rows, xCol, yCol, zCol, colorCol, { showLabels = false } = {}) {
    const t = CONFIG.theme;

    const valid = rows
        .map((r, i) => ({ ...r, _idx: i }))
        .filter(r => r[xCol] !== null && r[yCol] !== null && r[zCol] !== null);

    // Build color map
    const groupSet = [...new Set(valid.map(r => r[colorCol] ?? 'N/A'))];
    const colorMap = {};
    groupSet.forEach((name, i) => {
        colorMap[name] = CONFIG.clusterColors[i % CONFIG.clusterColors.length];
    });

    const basePts = valid.filter(r => r._source !== 'user');
    const userPts = valid.filter(r => r._source === 'user');
    const traces = [];

    // Single base trace
    if (basePts.length) {
        traces.push({
            x: basePts.map(p => p[xCol]),
            y: basePts.map(p => p[yCol]),
            z: basePts.map(p => p[zCol]),
            customdata: basePts.map(p => p._idx),
            text: showLabels ? basePts.map(p => p[colorCol] ?? '') : undefined,
            name: 'Data',
            mode: showLabels ? 'markers+text' : 'markers',
            type: 'scatter3d',
            textfont: { size: 7, color: basePts.map(p => colorMap[p[colorCol] ?? 'N/A']) },
            marker: {
                size: 4,
                color: basePts.map(p => colorMap[p[colorCol] ?? 'N/A']),
            },
            hovertemplate: `%{customdata}<br>${Columns.label(xCol)}=%{x}<br>${Columns.label(yCol)}=%{y}<br>${Columns.label(zCol)}=%{z}<extra></extra>`,
        });
    }

    // User trace
    if (userPts.length) {
        traces.push({
            x: userPts.map(p => p[xCol]),
            y: userPts.map(p => p[yCol]),
            z: userPts.map(p => p[zCol]),
            customdata: userPts.map(p => p._idx),
            name: 'Your data',
            mode: 'markers',
            type: 'scatter3d',
            marker: { size: 6, color: t.userColor },
            hovertemplate: `Your data<br>${Columns.label(xCol)}=%{x}<br>${Columns.label(yCol)}=%{y}<br>${Columns.label(zCol)}=%{z}<extra></extra>`,
        });
    }

    // Centroids
    const groups = _groupBy(basePts, colorCol);
    const centroids = { x: [], y: [], z: [], text: [], colors: [] };
    Object.entries(groups).forEach(([name, pts]) => {
        if (pts.length === 0) return;
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        centroids.x.push(avg(pts.map(p => p[xCol])));
        centroids.y.push(avg(pts.map(p => p[yCol])));
        centroids.z.push(avg(pts.map(p => p[zCol])));
        centroids.text.push(name);
        centroids.colors.push(colorMap[name]);
    });

    if (centroids.x.length) {
        traces.push({
            x: centroids.x, y: centroids.y, z: centroids.z,
            mode: 'markers+text', type: 'scatter3d', name: 'Centroids', showlegend: false,
            text: centroids.text,
            textfont: { size: 9, color: centroids.colors },
            textposition: 'top center',
            marker: { size: 8, color: centroids.colors, symbol: 'circle-open', line: { width: 2, color: centroids.colors } },
            hoverinfo: 'text',
        });
    }

    const layout = {
        paper_bgcolor: t.bgPanel,
        font: { family: t.fontMono, color: t.text, size: 9 },
        scene: {
            bgcolor: t.bgPlot,
            xaxis: { title: Columns.label(xCol), gridcolor: t.gridColor, zerolinecolor: t.border, color: t.muted, tickfont: { size: 8 } },
            yaxis: { title: Columns.label(yCol), gridcolor: t.gridColor, zerolinecolor: t.border, color: t.muted, tickfont: { size: 8 } },
            zaxis: { title: Columns.label(zCol), gridcolor: t.gridColor, zerolinecolor: t.border, color: t.muted, tickfont: { size: 8 } },
            camera: { eye: { x: 1.6, y: 1.6, z: 0.9 } },
        },
        legend: { bgcolor: t.bgPlot + '88', bordercolor: t.border, borderwidth: 1, font: { size: 8 } },
        margin: { l: 0, r: 0, t: 20, b: 0 },
        hovermode: 'closest',
        modebar: { bgcolor: 'transparent', color: t.muted, activecolor: t.accent },
    };

    Plotly.newPlot(CHART_ID, traces, layout, { responsive: true, displayModeBar: false, scrollZoom: true });

    document.getElementById(CHART_ID).on('plotly_click', (evt) => {
        if (!evt.points.length) return;
        Events.emit(EVT.POINT_CLICKED, evt.points[0].customdata);
    });
}

function _groupBy(rows, col) {
    const groups = {};
    rows.forEach(r => {
        const key = r[col] ?? 'N/A';
        (groups[key] = groups[key] || []).push(r);
    });
    return groups;
}
