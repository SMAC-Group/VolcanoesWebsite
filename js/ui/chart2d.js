// 2D scatter plot using Plotly (WebGL for performance).
// Uses scattergl with per-point colors instead of one trace per group.

import { CONFIG } from '../config.js';
import * as Columns from '../columns.js';
import * as Selection from '../selection.js';
import { Events, EVT } from '../events.js';
import * as Refs from '../references.js';

const CHART_ID = 'plotDiv';
let _bindingsAttached = false;
let _midPan = null;

// Detect WebGL support (Brave shields may block it)
const _hasWebGL = (() => {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch { return false; }
})();
const SCATTER_TYPE = _hasWebGL ? 'scattergl' : 'scatter';

export function render(rows, xCol, yCol, colorCol, { invertY = false, showEllipses = true, showLabels = false, colorMap = null, numericColor = false, gradientColor = '#e85d2f' } = {}) {
    // Remove any WebGL warning overlay left by 3D view
    document.getElementById(CHART_ID)?.querySelector('.webgl-warning')?.remove();

    const t = CONFIG.theme;

    // Filter rows with valid values for both axes
    const valid = rows
        .map((r, i) => ({ ...r, _idx: r._idx ?? i }))
        .filter(r => r[xCol] !== null && r[yCol] !== null);

    // Use provided color map or build a local one (categorical mode)
    if (!numericColor && !colorMap) {
        const groupSet = [...new Set(valid.map(r => r[colorCol] ?? 'N/A'))];
        colorMap = {};
        groupSet.forEach((name, i) => {
            colorMap[name] = CONFIG.clusterColors[i % CONFIG.clusterColors.length];
        });
    }

    // Separate base and user points
    const basePts = valid.filter(r => r._source !== 'user');
    const userPts = valid.filter(r => r._source === 'user');

    const traces = [];

    // Continuous colorscale: white → chosen color
    const COLORSCALE = [[0, '#ffffff'], [1, gradientColor]];

    // Single base trace (scattergl for performance)
    if (basePts.length) {
        const markerOpts = {
            symbol: 'triangle-up',
            size: 7,
            opacity: 0.8,
        };
        if (numericColor) {
            const colorVals = basePts.map(p => p[colorCol]).filter(v => v !== null && typeof v === 'number');
            const cmin = colorVals.length ? Math.min(...colorVals) : 0;
            const cmax = colorVals.length ? Math.max(...colorVals) : 1;
            markerOpts.color = basePts.map(p => p[colorCol] ?? null);
            markerOpts.colorscale = COLORSCALE;
            markerOpts.cmin = cmin;
            markerOpts.cmax = cmax;
            markerOpts.showscale = true;
            markerOpts.colorbar = {
                title: { text: Columns.label(colorCol), font: { size: 10 } },
                thickness: 12,
                len: 0.6,
                tickfont: { size: 9, color: t.muted },
                bordercolor: t.border,
                borderwidth: 1,
            };
        } else {
            markerOpts.color = basePts.map(p => colorMap[p[colorCol] ?? 'N/A']);
        }

        traces.push({
            x: basePts.map(p => p[xCol]),
            y: basePts.map(p => p[yCol]),
            customdata: basePts.map(p => p._idx),
            text: basePts.map(p => _tooltip(p)),
            name: 'Base data',
            legendrank: 1,
            mode: 'markers',
            type: SCATTER_TYPE,
            marker: markerOpts,
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
            name: 'Your data',
            legendrank: 2,
            mode: 'markers',
            type: SCATTER_TYPE,
            marker: {
                symbol: 'circle',
                size: 9,
                color: t.userColor,
                opacity: 0.9,
            },
            hovertemplate: '%{text}<extra></extra>',
        });
    }

    // Ellipses (SVG overlay, only for categorical groups with enough points)
    if (showEllipses && !numericColor) {
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
                legendgroup: 'ellipses',
                line: { color, width: 1.2, dash: 'dot' },
                fill: 'toself',
                fillcolor: _hexToRgba(color, 0.05),
            });

            if (showLabels) {
                traces.push({
                    x: [mx], y: [my - sy * 1.1],
                    mode: 'text', type: 'scatter', showlegend: false, hoverinfo: 'skip', legendgroup: 'ellipses',
                    text: [Refs.getShortLabel(name) || name],
                    textfont: { color, size: 9, family: t.fontMono },
                });
            }
        });

        // Single legend entry for ellipses
        traces.push({
            x: [null], y: [null],
            mode: 'lines', type: 'scatter',
            name: '~95% confidence',
            legendgroup: 'ellipses',
            legendrank: 10,
            line: { color: t.muted, width: 1.2, dash: 'dot' },
            hoverinfo: 'skip',
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
        const ctrlKey = evt.event?.ctrlKey || evt.event?.metaKey || false;
        Events.emit(EVT.POINT_CLICKED, { index: evt.points[0].customdata, ctrlKey });
    });
    el.on('plotly_selected', (evt) => {
        if (!evt?.points) return;
        Selection.selectMultiple(evt.points.map(p => p.customdata));
    });

    // Middle-click pan
    _attachMiddlePan(el);
}

function _attachMiddlePan(el) {
    const plotArea = el.querySelector('.draglayer') || el;

    // Capture phase: intercept middle-click before Plotly starts a lasso/select
    plotArea.addEventListener('mousedown', (e) => {
        if (e.button !== 1) return; // middle button only
        e.preventDefault();
        e.stopImmediatePropagation();
        const xaxis = el._fullLayout.xaxis;
        const yaxis = el._fullLayout.yaxis;
        _midPan = {
            startX: e.clientX,
            startY: e.clientY,
            xRange: [xaxis.range[0], xaxis.range[1]],
            yRange: [yaxis.range[0], yaxis.range[1]],
            pxPerX: (xaxis._length) / (xaxis.range[1] - xaxis.range[0]),
            pxPerY: (yaxis._length) / (yaxis.range[1] - yaxis.range[0]),
        };
        // Highlight Pan button in toolbar
        _setToolbarHighlight('pan', true);
    }, true);

    window.addEventListener('mousemove', (e) => {
        if (!_midPan) return;
        const dx = (e.clientX - _midPan.startX) / _midPan.pxPerX;
        const dy = (e.clientY - _midPan.startY) / _midPan.pxPerY;
        Plotly.relayout(el, {
            'xaxis.range[0]': _midPan.xRange[0] - dx,
            'xaxis.range[1]': _midPan.xRange[1] - dx,
            'yaxis.range[0]': _midPan.yRange[0] + dy,
            'yaxis.range[1]': _midPan.yRange[1] + dy,
        });
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 1 && _midPan) {
            _midPan = null;
            // Restore previous tool highlight
            _setToolbarHighlight('pan', false);
        }
    });
}

function _setToolbarHighlight(mode, active) {
    const btnMap = { lasso: 'tb-lasso', select: 'tb-select', pan: 'tb-pan' };
    if (active) {
        // Remember which buttons are currently active, then highlight pan
        ['lasso', 'select', 'pan'].forEach(t => {
            const btn = document.getElementById(btnMap[t]);
            if (btn) btn.classList.toggle('active', t === mode);
        });
    } else {
        // Restore: read Plotly's current dragmode to know the real active tool
        const el = document.getElementById(CHART_ID);
        const currentMode = el?._fullLayout?.dragmode || 'lasso';
        ['lasso', 'select', 'pan'].forEach(t => {
            const btn = document.getElementById(btnMap[t]);
            if (btn) btn.classList.toggle('active', t === currentMode);
        });
    }
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
        .map(k => {
            let val = row[k];
            // Show readable reference label instead of raw CSV key
            if (k === 'Reference' && val) {
                val = Refs.getShortLabel(val) || val;
            } else {
                val = _fmt(val);
            }
            return `${Columns.label(k)}: ${val}`;
        })
        .join('<br>');
}

function _fmt(val) {
    return typeof val === 'number' ? parseFloat(val.toFixed(2)) : val;
}

function _hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

// --- Exported helpers for correction mode ---

export function getPlotElement() {
    return document.getElementById(CHART_ID);
}

export function getUserTraceIndex() {
    const el = document.getElementById(CHART_ID);
    if (!el?.data) return -1;
    return el.data.findIndex(t => t.name === 'Your data');
}

export function pixelToData(clientX, clientY) {
    const el = document.getElementById(CHART_ID);
    if (!el?._fullLayout) return null;
    const xaxis = el._fullLayout.xaxis;
    const yaxis = el._fullLayout.yaxis;
    const rect = el.querySelector('.nsewdrag')?.getBoundingClientRect();
    if (!rect) return null;
    return {
        x: xaxis.p2d(clientX - rect.left),
        y: yaxis.p2d(clientY - rect.top),
    };
}

export function dataToPixel(dataX, dataY) {
    const el = document.getElementById(CHART_ID);
    if (!el?._fullLayout) return null;
    const xaxis = el._fullLayout.xaxis;
    const yaxis = el._fullLayout.yaxis;
    const rect = el.querySelector('.nsewdrag')?.getBoundingClientRect();
    if (!rect) return null;
    return {
        px: xaxis.d2p(dataX) + rect.left,
        py: yaxis.d2p(dataY) + rect.top,
    };
}
