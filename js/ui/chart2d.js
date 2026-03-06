// 2D scatter plot using Plotly (WebGL for performance).
// Uses scattergl with per-point colors instead of one trace per group.

import { CONFIG } from '../config.js';
import * as Columns from '../columns.js';
import * as Selection from '../selection.js';

const CHART_ID = 'plotDiv';
let _bindingsAttached = false;

export function render(rows, xCol, yCol, colorCol, { invertY = false, showEllipses = true, showLabels = false } = {}) {
    const t = CONFIG.theme;

    // Filter rows with valid values for both axes
    const valid = rows
        .map((r, i) => ({ ...r, _idx: i }))
        .filter(r => r[xCol] !== null && r[yCol] !== null);

    // Build color map for groups
    const groupSet = [...new Set(valid.map(r => r[colorCol] ?? 'N/A'))];
    const colorMap = {};
    groupSet.forEach((name, i) => {
        colorMap[name] = CONFIG.clusterColors[i % CONFIG.clusterColors.length];
    });

    // Separate base and user points
    const basePts = valid.filter(r => r._source !== 'user');
    const userPts = valid.filter(r => r._source === 'user');

    const traces = [];

    // Single base trace (scattergl for performance)
    if (basePts.length) {
        traces.push({
            x: basePts.map(p => p[xCol]),
            y: basePts.map(p => p[yCol]),
            customdata: basePts.map(p => p._idx),
            text: basePts.map(p => _tooltip(p)),
            name: 'Données',
            mode: 'markers',
            type: 'scattergl',
            marker: {
                symbol: 'triangle-up',
                size: 7,
                color: basePts.map(p => colorMap[p[colorCol] ?? 'N/A']),
                opacity: 0.8,
            },
            hovertemplate: '%{text}<extra></extra>',
        });
    }

    // User points trace
    if (userPts.length) {
        traces.push({
            x: userPts.map(p => p[xCol]),
            y: userPts.map(p => p[yCol]),
            customdata: userPts.map(p => p._idx),
            text: userPts.map(p => _tooltip(p)),
            name: 'Vos données',
            mode: 'markers',
            type: 'scattergl',
            marker: {
                symbol: 'circle',
                size: 9,
                color: t.userColor,
                opacity: 0.9,
            },
            hovertemplate: '%{text}<extra></extra>',
        });
    }

    // Ellipses (SVG overlay, only for groups with enough points)
    if (showEllipses) {
        const groups = _groupBy(basePts, colorCol);
        Object.entries(groups).forEach(([name, pts]) => {
            if (pts.length < 5) return;
            const color = colorMap[name];
            const xs = pts.map(p => p[xCol]);
            const ys = pts.map(p => p[yCol]);
            const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
            const my = ys.reduce((a, b) => a + b, 0) / ys.length;
            const sx = Math.sqrt(xs.map(x => (x - mx) ** 2).reduce((a, b) => a + b, 0) / xs.length) * 1.9;
            const sy = Math.sqrt(ys.map(y => (y - my) ** 2).reduce((a, b) => a + b, 0) / ys.length) * 1.9;
            const th = Array.from({ length: 40 }, (_, i) => (i / 39) * 2 * Math.PI);

            traces.push({
                x: th.map(a => mx + sx * Math.cos(a)),
                y: th.map(a => my + sy * Math.sin(a)),
                mode: 'lines', type: 'scatter', showlegend: false, hoverinfo: 'skip',
                line: { color, width: 1.2, dash: 'dot' },
                fill: 'toself',
                fillcolor: _hexToRgba(color, 0.05),
            });

            if (showLabels) {
                traces.push({
                    x: [mx], y: [my - sy * 1.1],
                    mode: 'text', type: 'scatter', showlegend: false, hoverinfo: 'skip',
                    text: [name],
                    textfont: { color, size: 9, family: t.fontMono },
                });
            }
        });
    }

    const layout = {
        paper_bgcolor: t.bgPanel,
        plot_bgcolor: t.bgPlot,
        font: { family: t.fontMono, color: t.text, size: 10 },
        xaxis: { title: { text: Columns.label(xCol), font: { size: 11 } }, gridcolor: t.gridColor, zerolinecolor: t.border, color: t.muted },
        yaxis: { title: { text: Columns.label(yCol), font: { size: 11 } }, autorange: invertY ? 'reversed' : true, gridcolor: t.gridColor, zerolinecolor: '#404860', color: t.muted },
        legend: { bgcolor: t.bgPlot, bordercolor: t.border, borderwidth: 1, font: { size: 9 }, x: 0.01, y: 0.01, xanchor: 'left', yanchor: 'bottom' },
        dragmode: 'lasso',
        hovermode: 'closest',
        margin: { l: 52, r: 20, t: 16, b: 50 },
        modebar: { bgcolor: 'transparent', color: t.muted, activecolor: t.accent },
    };

    Plotly.newPlot(CHART_ID, traces, layout, { responsive: true, displayModeBar: false, scrollZoom: true });

    // Wire selection events (only once — Plotly.newPlot replaces the element internals)
    const el = document.getElementById(CHART_ID);
    el.removeAllListeners?.('plotly_click');
    el.removeAllListeners?.('plotly_selected');
    el.on('plotly_click', (evt) => {
        if (!evt.points.length) return;
        Selection.toggle(evt.points[0].customdata);
    });
    el.on('plotly_selected', (evt) => {
        if (!evt?.points) return;
        Selection.selectMultiple(evt.points.map(p => p.customdata));
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

function _tooltip(row) {
    const keys = [...Columns.metaKeys(), ...Columns.tooltipKeys()];
    return keys
        .filter(k => row[k] !== null && row[k] !== undefined)
        .map(k => `${Columns.label(k)}: ${row[k]}`)
        .join('<br>');
}

function _hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}
