// Main entry point — orchestrates init, events, and rendering.
// All dependencies are explicit ES module imports.

import { CONFIG } from './config.js';
import { Events, EVT } from './events.js';
import * as API from './services/api.js';
import * as Selection from './selection.js';
import * as Sidebar from './ui/sidebar.js';
import * as Chart2D from './ui/chart2d.js';
import * as Chart3D from './ui/chart3d.js';
import * as DetailPanel from './ui/detail-panel.js';
import * as Modals from './ui/modals.js';

let currentView = '2d';
let showEllipses = true;
let showLabels = false;

async function init() {
    // Load base data
    await API.fetchVolcanoes();

    // Init UI
    Sidebar.initAxisSelectors();
    Sidebar.initVolcanoFilter();
    Modals.init();
    _updateCacheWarning();
    _updateTotalCount();

    // Initial render
    renderChart();

    // --- Wire events ---

    // Axis / color / filter changes
    ['axisX', 'axisY', 'axisZ', 'colorSelect', 'invertY'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            Events.emit(EVT.AXES_CHANGED);
            renderChart();
        });
    });

    // View toggle
    document.getElementById('btn2d')?.addEventListener('click', () => setView('2d'));
    document.getElementById('btn3d')?.addEventListener('click', () => setView('3d'));

    // Toolbar buttons
    document.getElementById('tb-lasso')?.addEventListener('click', () => setTool('lasso'));
    document.getElementById('tb-select')?.addEventListener('click', () => setTool('select'));
    document.getElementById('tb-pan')?.addEventListener('click', () => setTool('pan'));
    document.getElementById('tb-reset')?.addEventListener('click', resetView);
    document.getElementById('tb-ellipses')?.addEventListener('click', toggleEllipses);
    document.getElementById('tb-labels')?.addEventListener('click', toggleLabels);
    document.getElementById('tb-labels3d')?.addEventListener('click', toggleLabels);

    // Header actions
    document.getElementById('btnContribute')?.addEventListener('click', () => Modals.openContribute());
    document.getElementById('btnUpload')?.addEventListener('click', () => Modals.openUpload());
    document.getElementById('btnManage')?.addEventListener('click', () => Modals.openManage());
    document.getElementById('btnExport')?.addEventListener('click', () => Modals.openExport());
    document.getElementById('btnAddManual')?.addEventListener('click', () => Modals.openManualEntry());

    // Sidebar filter
    document.getElementById('filterSearch')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('#volcanoList label').forEach(label => {
            label.style.display = label.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    });

    // Selection
    Events.on(EVT.SELECTION_CHANGED, (selected) => {
        DetailPanel.updateSelectionInfo(selected, API.getAllRows());
    });
    document.getElementById('btnClearSelection')?.addEventListener('click', () => Selection.clearAll());

    // Data update (after CSV upload or manual entry)
    Events.on(EVT.DATA_UPDATED, () => {
        Sidebar.initAxisSelectors();
        Sidebar.initVolcanoFilter();
        _updateCacheWarning();
        _updateTotalCount();
        renderChart();
    });

    Events.on(EVT.FILTER_CHANGED, () => renderChart());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') Selection.clearAll();
    });

    Events.emit(EVT.DATA_LOADED);
}

function renderChart() {
    const axes = Sidebar.getAxes();
    const rows = _getFilteredRows();
    _updateTotalCount(rows.length);

    if (currentView === '3d') {
        Chart3D.render(rows, axes.x, axes.y, axes.z, axes.color, { showLabels });
    } else {
        Chart2D.render(rows, axes.x, axes.y, axes.color, {
            invertY: axes.invertY,
            showEllipses,
            showLabels,
        });
    }
}

function _getFilteredRows() {
    const all = API.getAllRows();
    const active = Sidebar.getActiveFilters();
    if (!active) return all;

    const catCols = API.getCategoricalHeaders();
    const volcanoCol = catCols[0];
    if (!volcanoCol) return all;

    return all.filter(r => active.includes(r[volcanoCol]));
}

function setView(v) {
    currentView = v;
    document.getElementById('btn2d')?.classList.toggle('active', v === '2d');
    document.getElementById('btn3d')?.classList.toggle('active', v === '3d');
    document.getElementById('tools2d').style.display = v === '2d' ? 'flex' : 'none';
    document.getElementById('tools3d').style.display = v === '3d' ? 'flex' : 'none';
    document.getElementById('zRow')?.classList.toggle('dimmed', v === '2d');
    Events.emit(EVT.VIEW_CHANGED, v);
    renderChart();
}

function setTool(mode) {
    if (currentView === '3d') return;
    Plotly.relayout('plotDiv', { dragmode: mode });
    ['lasso', 'select', 'pan'].forEach(t => {
        document.getElementById(`tb-${t}`)?.classList.remove('active');
    });
    document.getElementById(`tb-${mode}`)?.classList.add('active');
}

function resetView() {
    if (currentView === '3d') {
        Plotly.relayout('plotDiv', { 'scene.camera': { eye: { x: 1.6, y: 1.6, z: 0.9 } } });
    } else {
        Plotly.relayout('plotDiv', { 'xaxis.autorange': true, 'yaxis.autorange': true });
    }
}

function toggleEllipses() {
    showEllipses = !showEllipses;
    document.getElementById('tb-ellipses')?.classList.toggle('active', showEllipses);
    renderChart();
}

function toggleLabels() {
    showLabels = !showLabels;
    document.getElementById('tb-labels')?.classList.toggle('active', showLabels);
    document.getElementById('tb-labels3d')?.classList.toggle('active', showLabels);
    renderChart();
}

function _updateCacheWarning() {
    const el = document.getElementById('cacheWarning');
    if (el) el.style.display = API.hasUserData() ? 'flex' : 'none';
}

function _updateTotalCount(count) {
    const el = document.getElementById('totalCount');
    if (el) el.textContent = count ?? API.getAllRows().length;
}

// Boot
init();
