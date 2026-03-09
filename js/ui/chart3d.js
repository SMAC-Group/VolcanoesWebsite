// 3D scatter plot using Plotly.
// Single trace with per-point colors for performance.

import { CONFIG } from '../config.js';
import * as Columns from '../columns.js';
import * as Selection from '../selection.js';
import { Events, EVT } from '../events.js';

const CHART_ID = 'plotDiv';

// Detect WebGL support (Brave shields may block it)
const _hasWebGL = (() => {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch { return false; }
})();

export function hasWebGL() { return _hasWebGL; }

export function showNoWebGLWarning() {
    const el = document.getElementById(CHART_ID);
    if (!el) return;
    el.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'webgl-warning';
    box.innerHTML = `
        <div class="webgl-warning-icon">&#9888;</div>
        <h3>WebGL is not available</h3>
        <p>The 3D view requires WebGL, which appears to be blocked or unavailable in your browser.</p>
        <div class="webgl-warning-steps">
            <h4>How to enable WebGL</h4>
            <ul>
                <li><strong>Brave:</strong> Click the Shields icon (lion) in the address bar &rarr; set <em>Block fingerprinting</em> to <strong>Off</strong> or <strong>Standard</strong>, then reload the page.</li>
                <li><strong>Firefox:</strong> Go to <code>about:config</code> &rarr; search for <code>webgl.disabled</code> &rarr; set it to <strong>false</strong>.</li>
                <li><strong>Chrome / Edge:</strong> Go to <code>chrome://flags</code> &rarr; search for <em>WebGL</em> &rarr; set to <strong>Enabled</strong>.</li>
                <li><strong>General:</strong> Make sure your graphics drivers are up to date.</li>
            </ul>
        </div>
        <p class="webgl-warning-note">The 2D view works without WebGL and is fully functional.</p>
    `;
    el.appendChild(box);
}

export function render(rows, xCol, yCol, zCol, colorCol, { showLabels = false, colorMap = null } = {}) {
    const t = CONFIG.theme;

    const valid = rows
        .map((r, i) => ({ ...r, _idx: r._idx ?? i }))
        .filter(r => r[xCol] !== null && r[yCol] !== null && r[zCol] !== null);

    // Use provided color map or build a local one
    if (!colorMap) {
        const groupSet = [...new Set(valid.map(r => r[colorCol] ?? 'N/A'))];
        colorMap = {};
        groupSet.forEach((name, i) => {
            colorMap[name] = CONFIG.clusterColors[i % CONFIG.clusterColors.length];
        });
    }

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
            name: 'Base data',
            legendrank: 1,
            mode: showLabels ? 'markers+text' : 'markers',
            type: 'scatter3d',
            textfont: { size: 7, color: basePts.map(p => colorMap[p[colorCol] ?? 'N/A']) },
            marker: {
                size: 4,
                color: basePts.map(p => colorMap[p[colorCol] ?? 'N/A']),
            },
            hovertemplate: `%{customdata}<br>${Columns.label(xCol)}=%{x:.2f}<br>${Columns.label(yCol)}=%{y:.2f}<br>${Columns.label(zCol)}=%{z:.2f}<extra></extra>`,
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
            legendrank: 2,
            mode: 'markers',
            type: 'scatter3d',
            marker: { size: 6, color: t.userColor },
            hovertemplate: `Your data<br>${Columns.label(xCol)}=%{x:.2f}<br>${Columns.label(yCol)}=%{y:.2f}<br>${Columns.label(zCol)}=%{z:.2f}<extra></extra>`,
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
        const ctrlKey = evt.event?.ctrlKey || evt.event?.metaKey || false;
        Events.emit(EVT.POINT_CLICKED, { index: evt.points[0].customdata, ctrlKey });
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
