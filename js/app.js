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
import * as Correction from './ui/correction.js';
import * as Tutorial from './ui/tutorial.js';
import { toast } from './ui/toast.js';

let currentView = '2d';
let showEllipses = true;
let showLabels = false;
let _colorMap = null;

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

    // Hide loading overlay
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => overlay.remove(), 300);
    }

    // --- Wire events ---

    // Axis / color / filter changes
    ['axisX', 'axisY', 'axisZ', 'colorSelect', 'invertY'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            if (id === 'colorSelect') _colorMap = null; // rebuild on color column change
            Events.emit(EVT.AXES_CHANGED);
            renderChart();
            // Refresh stats if a selection is active
            if (Selection.count() > 0) {
                const a = Sidebar.getAxes();
                DetailPanel.updateSelectionInfo(Selection.get(), API.getAllRows(), { x: a.x, y: a.y });
            }
        });
    });

    // View toggle
    document.getElementById('btn2d')?.addEventListener('click', () => setView('2d'));
    document.getElementById('btn3d')?.addEventListener('click', () => setView('3d'));

    // Toolbar buttons
    document.getElementById('btnRefreshColors')?.addEventListener('click', refreshColors);
    document.getElementById('tb-lasso')?.addEventListener('click', () => setTool('lasso'));
    document.getElementById('tb-select')?.addEventListener('click', () => setTool('select'));
    document.getElementById('tb-pan')?.addEventListener('click', () => setTool('pan'));
    document.getElementById('tb-reset')?.addEventListener('click', resetView);
    document.getElementById('tb-reset3d')?.addEventListener('click', resetView);
    document.getElementById('tb-ellipses')?.addEventListener('click', toggleEllipses);
    document.getElementById('tb-labels')?.addEventListener('click', toggleLabels);
    document.getElementById('tb-labels3d')?.addEventListener('click', toggleLabels);
    document.getElementById('tb-correct')?.addEventListener('click', toggleCorrectionMode);
    document.getElementById('btnUndo')?.addEventListener('click', () => Correction.undo());
    document.getElementById('btnRedo')?.addEventListener('click', () => Correction.redo());
    document.getElementById('btnApplyCorrections')?.addEventListener('click', applyCorrections);
    document.getElementById('btnDiscardCorrections')?.addEventListener('click', discardCorrections);

    // Correction mode events
    Events.on(EVT.CORRECTION_MODE_CHANGED, ({ active }) => {
        document.getElementById('tb-correct')?.classList.toggle('correction-active', active);
        const corrPanel = document.getElementById('correctionPanel');
        const selPanels = document.getElementById('selectionPanels');
        if (corrPanel) corrPanel.style.display = active ? '' : 'none';
        if (selPanels) selPanels.style.display = active ? 'none' : '';
        ['tb-lasso', 'tb-select', 'tb-pan'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) { btn.disabled = active; btn.style.opacity = active ? '0.3' : ''; }
        });
        if (!active) renderChart();
    });

    // Header actions
    document.getElementById('btnContribute')?.addEventListener('click', () => Modals.openContribute());
    document.getElementById('btnUpload')?.addEventListener('click', () => Modals.openUpload());
    document.getElementById('btnManage')?.addEventListener('click', () => Modals.openManage());
    document.getElementById('btnExport')?.addEventListener('click', () => Modals.openExport());
    document.getElementById('btnAddManual')?.addEventListener('click', () => Modals.openManualEntry());

    // Sidebar filter — filters checkbox list + chart points
    document.getElementById('filterSearch')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('#volcanoList label').forEach(label => {
            label.style.display = label.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
        renderChart();
    });

    document.getElementById('btnSelectAll')?.addEventListener('click', () => {
        document.querySelectorAll('#volcanoList input[type="checkbox"]').forEach(cb => { cb.checked = true; });
        Events.emit(EVT.FILTER_CHANGED);
    });
    document.getElementById('btnDeselectAll')?.addEventListener('click', () => {
        document.querySelectorAll('#volcanoList input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        Events.emit(EVT.FILTER_CHANGED);
    });

    // Selection (lasso / rectangle)
    Events.on(EVT.SELECTION_CHANGED, (selected) => {
        const a = Sidebar.getAxes();
        DetailPanel.updateSelectionInfo(selected, API.getAllRows(), { x: a.x, y: a.y });
    });

    // Single point click → show detail; Ctrl+click → toggle selection
    Events.on(EVT.POINT_CLICKED, ({ index, ctrlKey }) => {
        if (ctrlKey) {
            Selection.toggle(index);
        } else {
            DetailPanel.showPointDetailByIndex(index);
        }
    });

    document.getElementById('btnClearSelection')?.addEventListener('click', () => {
        Selection.clearAll();
        // Reset Plotly's visual selection highlight by re-rendering
        renderChart();
    });

    // Data update (after CSV upload or manual entry)
    Events.on(EVT.DATA_UPDATED, () => {
        Sidebar.initAxisSelectors();
        Sidebar.initVolcanoFilter();
        _colorMap = null; // rebuild color map with new data
        _updateCacheWarning();
        _updateTotalCount();
        renderChart();
    });

    Events.on(EVT.FILTER_CHANGED, () => renderChart());
    Events.on(EVT.FETCH_ERROR, (msg) => toast('Could not load base data: ' + msg, 'error'));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (Correction.isActive()) {
                Correction.exit();
            } else {
                Selection.clearAll();
                renderChart();
            }
        }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && Correction.isActive()) {
            e.preventDefault();
            e.shiftKey ? Correction.redo() : Correction.undo();
        }
        if (e.key === 'y' && (e.ctrlKey || e.metaKey) && Correction.isActive()) {
            e.preventDefault();
            Correction.redo();
        }
    });

    // Prevent default middle-click auto-scroll on the plot
    document.getElementById('plotDiv')?.addEventListener('mousedown', (e) => {
        if (e.button === 1) e.preventDefault();
    });

    _initResize();

    // Tutorial
    Tutorial.init();
    document.getElementById('btnTutorial')?.addEventListener('click', () => Tutorial.start());

    Events.emit(EVT.DATA_LOADED);
}

function _buildColorMap(colorCol, rows) {
    const groupSet = [...new Set(rows.map(r => r[colorCol] ?? 'N/A'))];
    const map = {};
    groupSet.forEach((name, i) => {
        map[name] = CONFIG.clusterColors[i % CONFIG.clusterColors.length];
    });
    return map;
}

function refreshColors() {
    const axes = Sidebar.getAxes();
    _colorMap = _buildColorMap(axes.color, _getFilteredRows());
    renderChart();
}

function renderChart() {
    const axes = Sidebar.getAxes();
    let rows = _getFilteredRows();
    _updateTotalCount(rows.length);

    // Build stable color map if not yet initialized or color column changed
    if (!_colorMap) _colorMap = _buildColorMap(axes.color, API.getAllRows());

    // Apply pending corrections to rendered data
    if (Correction.isActive()) {
        Correction.setAxes({ x: axes.x, y: axes.y });
        rows = Correction.patchRows(rows);
    }

    if (currentView === '3d') {
        _showChartSpinner();
        // Defer render so the browser paints the spinner first
        setTimeout(() => {
            Chart3D.render(rows, axes.x, axes.y, axes.z, axes.color, { showLabels, colorMap: _colorMap });
            _hideChartSpinner();
        }, 20);
    } else {
        Chart2D.render(rows, axes.x, axes.y, axes.color, {
            invertY: axes.invertY,
            showEllipses,
            showLabels,
            colorMap: _colorMap,
        });
        if (Correction.isActive()) Correction.reattach();
    }
}

function _showChartSpinner() {
    const plotDiv = document.getElementById('plotDiv');
    if (!plotDiv) return;
    Plotly.purge(plotDiv);
    let spinner = document.getElementById('chartSpinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'chartSpinner';
        spinner.className = 'chart-spinner';
        spinner.innerHTML = '<div class="spinner"></div><div class="loading-text">Loading 3D view...</div>';
        plotDiv.parentElement.appendChild(spinner);
    }
    spinner.style.display = '';
}

function _hideChartSpinner() {
    const spinner = document.getElementById('chartSpinner');
    if (spinner) spinner.style.display = 'none';
}

function _getFilteredRows() {
    const all = API.getAllRows();
    const catCols = API.getCategoricalHeaders();
    const volcanoCol = catCols[0];
    if (!volcanoCol) return all;

    // Checkbox filter
    const active = Sidebar.getActiveFilters();
    // Search bar filter
    const query = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();

    if (!active && !query) return all;

    return all.filter(r => {
        const name = (r[volcanoCol] ?? '').toString().toLowerCase();
        if (active && !active.includes(r[volcanoCol])) return false;
        if (query && !name.includes(query)) return false;
        return true;
    });
}

function setView(v) {
    if (Correction.isActive()) Correction.exit();
    currentView = v;
    document.getElementById('btn2d')?.classList.toggle('active', v === '2d');
    document.getElementById('btn3d')?.classList.toggle('active', v === '3d');
    document.getElementById('tools2d').style.display = v === '2d' ? 'flex' : 'none';
    document.getElementById('tools3d').style.display = v === '3d' ? 'flex' : 'none';
    document.getElementById('zRow')?.classList.toggle('dimmed', v === '2d');
    Events.emit(EVT.VIEW_CHANGED, v);
    renderChart();
}

function toggleCorrectionMode() {
    if (currentView === '3d') return;
    if (Correction.isActive()) {
        Correction.exit();
    } else {
        Selection.clearAll();
        const axes = Sidebar.getAxes();
        Correction.enter({ x: axes.x, y: axes.y });
        renderChart();
    }
}

function applyCorrections() {
    const count = Correction.applyToUserData();
    if (count > 0) {
        Events.emit(EVT.DATA_UPDATED);
    }
}

function discardCorrections() {
    Correction.clearAll();
    Correction.exit();
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

// --- Resizable panels ---

const LAYOUT_STORAGE_KEY = 'volcaninfos_layout';
const DEFAULT_LEFT = 255;
const DEFAULT_RIGHT = 275;

function _initResize() {
    const layout = document.querySelector('.layout');
    const handleLeft = document.getElementById('resizeLeft');
    const handleRight = document.getElementById('resizeRight');
    if (!layout || !handleLeft || !handleRight) return;

    const MIN_LEFT = 180;
    const MAX_LEFT = 400;
    const MIN_RIGHT = 200;
    const MAX_RIGHT = 450;
    const HANDLE_W = 4;

    // Load saved sizes or use defaults
    const saved = _loadLayout();
    let leftW = saved.leftW;
    let rightW = saved.rightW;

    function applyColumns() {
        layout.style.gridTemplateColumns = `${leftW}px ${HANDLE_W}px 1fr ${HANDLE_W}px ${rightW}px`;
    }

    function saveLayout() {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ leftW, rightW }));
    }

    // Apply saved layout on load
    applyColumns();

    _makeDraggable(handleLeft, (dx) => {
        leftW = Math.max(MIN_LEFT, Math.min(MAX_LEFT, leftW + dx));
        applyColumns();
    }, () => {
        saveLayout();
        Plotly.Plots.resize(document.getElementById('plotDiv'));
    });

    _makeDraggable(handleRight, (dx) => {
        rightW = Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, rightW - dx));
        applyColumns();
    }, () => {
        saveLayout();
        Plotly.Plots.resize(document.getElementById('plotDiv'));
    });

    // Reset layout button
    document.getElementById('btnResetLayout')?.addEventListener('click', () => {
        leftW = DEFAULT_LEFT;
        rightW = DEFAULT_RIGHT;
        applyColumns();
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
        Plotly.Plots.resize(document.getElementById('plotDiv'));
    });
}

function _loadLayout() {
    try {
        const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (data.leftW && data.rightW) return data;
        }
    } catch { /* ignore */ }
    return { leftW: DEFAULT_LEFT, rightW: DEFAULT_RIGHT };
}

function _makeDraggable(handle, onDrag, onEnd) {
    let startX = 0;
    let accumulated = 0;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        accumulated = 0;
        handle.classList.add('active');
        document.body.classList.add('resizing');

        const onMove = (e) => {
            const dx = e.clientX - startX;
            onDrag(dx - accumulated);
            accumulated = dx;
        };

        const onUp = () => {
            handle.classList.remove('active');
            document.body.classList.remove('resizing');
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (onEnd) onEnd();
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });
}

// Boot
init();
