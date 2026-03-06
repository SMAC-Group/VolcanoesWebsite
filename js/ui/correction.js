// Correction mode: drag user points on the 2D chart to adjust their position.
// Session-only undo/redo. Corrections are applied to localStorage on explicit save.

import { Events, EVT } from '../events.js';
import * as Chart2D from './chart2d.js';
import * as API from '../services/api.js';
import * as Columns from '../columns.js';

// --- State ---
let _active = false;
let _undoStack = [];
let _redoStack = [];
// Map<mergedIndex, { fields: { [col]: { originalValue, newValue } } }>
let _corrections = new Map();
let _dragState = null;
let _didDrag = false;
let _currentAxes = { x: null, y: null };

// Bound handlers (for cleanup)
let _onMouseDown = null;
let _onMouseMove = null;
let _onMouseUp = null;

// --- Public API ---

export function isActive() { return _active; }

export function enter(axes) {
    if (_active) return;
    _active = true;
    if (axes) _currentAxes = axes;
    _attachHandlers();
    const plotEl = Chart2D.getPlotElement();
    if (plotEl) {
        plotEl.classList.add('correction-cursor');
        Plotly.relayout(plotEl, { dragmode: false });
    }
    Events.emit(EVT.CORRECTION_MODE_CHANGED, { active: true });
}

export function exit() {
    if (!_active) return;
    _active = false;
    _detachHandlers();
    _dragState = null;
    const plotEl = Chart2D.getPlotElement();
    if (plotEl) {
        plotEl.classList.remove('correction-cursor', 'correction-dragging');
    }
    Events.emit(EVT.CORRECTION_MODE_CHANGED, { active: false });
}

export function setAxes(axes) {
    _currentAxes = axes;
}

export function reattach() {
    if (!_active) return;
    _detachHandlers();
    _attachHandlers();
    const plotEl = Chart2D.getPlotElement();
    if (plotEl) {
        plotEl.classList.add('correction-cursor');
        Plotly.relayout(plotEl, { dragmode: false });
    }
}

export function undo() {
    if (_undoStack.length === 0) return;
    const action = _undoStack.pop();
    _redoStack.push(action);
    _applyAction(action, true);
    _updateButtons();
    _updateCorrectionPanel();
}

export function redo() {
    if (_redoStack.length === 0) return;
    const action = _redoStack.pop();
    _undoStack.push(action);
    _applyAction(action, false);
    _updateButtons();
    _updateCorrectionPanel();
}

export function getCorrections() { return _corrections; }

export function getCorrectionForIndex(mergedIndex) {
    return _corrections.get(mergedIndex) || null;
}

export function clearAll() {
    _undoStack = [];
    _redoStack = [];
    _corrections.clear();
    _dragState = null;
    _updateButtons();
    _updateCorrectionPanel();
}

export function applyToUserData() {
    if (_corrections.size === 0) return 0;
    const userData = API.getUserData();
    let count = 0;
    for (const [mergedIdx, corr] of _corrections) {
        const userIdx = API.userDataIndexFromMerged(mergedIdx);
        if (userIdx >= 0 && userIdx < userData.length) {
            for (const [field, { newValue }] of Object.entries(corr.fields)) {
                userData[userIdx][field] = newValue;
            }
            count++;
        }
    }
    API.saveUserData(userData);
    clearAll();
    return count;
}

// Apply pending corrections to a rows array (for rendering)
export function patchRows(rows) {
    if (_corrections.size === 0) return rows;
    return rows.map((r, i) => {
        const corr = _corrections.get(i);
        if (!corr) return r;
        const patched = { ...r };
        for (const [field, { newValue }] of Object.entries(corr.fields)) {
            patched[field] = newValue;
        }
        return patched;
    });
}

// --- Internal: drag handling ---

function _attachHandlers() {
    const plotEl = Chart2D.getPlotElement();
    if (!plotEl) return;

    const dragLayer = plotEl.querySelector('.nsewdrag') || plotEl;

    _onMouseDown = (e) => {
        if (e.button !== 0) return;
        const hit = _hitTestUserPoint(e.clientX, e.clientY);
        if (!hit) return;
        e.preventDefault();
        e.stopPropagation();
        _dragState = hit;
        _didDrag = false;
        plotEl.classList.add('correction-dragging');
    };

    _onMouseMove = (e) => {
        if (!_dragState) return;
        e.preventDefault();
        _didDrag = true;
        const data = Chart2D.pixelToData(e.clientX, e.clientY);
        if (!data) return;

        const el = Chart2D.getPlotElement();
        const traceIdx = _dragState.traceIndex;
        const ptIdx = _dragState.ptIdx;
        el.data[traceIdx].x[ptIdx] = data.x;
        el.data[traceIdx].y[ptIdx] = data.y;
        Plotly.redraw(el);
    };

    _onMouseUp = (e) => {
        if (!_dragState || e.button !== 0) return;
        if (_didDrag) {
            const data = Chart2D.pixelToData(e.clientX, e.clientY);
            if (data) {
                _commitDrag(data.x, data.y);
            }
        }
        plotEl.classList.remove('correction-dragging');
        _dragState = null;
    };

    dragLayer.addEventListener('mousedown', _onMouseDown, true);
    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mouseup', _onMouseUp);
}

function _detachHandlers() {
    const plotEl = Chart2D.getPlotElement();
    if (plotEl) {
        const dragLayer = plotEl.querySelector('.nsewdrag') || plotEl;
        if (_onMouseDown) dragLayer.removeEventListener('mousedown', _onMouseDown, true);
    }
    if (_onMouseMove) window.removeEventListener('mousemove', _onMouseMove);
    if (_onMouseUp) window.removeEventListener('mouseup', _onMouseUp);
    _onMouseDown = _onMouseMove = _onMouseUp = null;
}

function _hitTestUserPoint(clientX, clientY) {
    const traceIdx = Chart2D.getUserTraceIndex();
    if (traceIdx < 0) return null;

    const el = Chart2D.getPlotElement();
    const trace = el.data[traceIdx];
    if (!trace || !trace.x) return null;

    const HIT_RADIUS = 15;
    let bestDist = HIT_RADIUS;
    let bestIdx = -1;

    for (let i = 0; i < trace.x.length; i++) {
        const px = Chart2D.dataToPixel(trace.x[i], trace.y[i]);
        if (!px) continue;
        const dx = clientX - px.px;
        const dy = clientY - px.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
        }
    }

    if (bestIdx < 0) return null;

    return {
        traceIndex: traceIdx,
        ptIdx: bestIdx,
        mergedIndex: trace.customdata[bestIdx],
        startX: trace.x[bestIdx],
        startY: trace.y[bestIdx],
    };
}

function _commitDrag(newX, newY) {
    const { mergedIndex, startX, startY } = _dragState;
    const xCol = _currentAxes.x;
    const yCol = _currentAxes.y;
    if (!xCol || !yCol) return;

    // Get or create correction record
    let corr = _corrections.get(mergedIndex);
    if (!corr) {
        corr = { fields: {} };
        _corrections.set(mergedIndex, corr);
    }

    // Store original values only on first correction
    if (!(xCol in corr.fields)) {
        corr.fields[xCol] = { originalValue: startX, newValue: newX };
    } else {
        corr.fields[xCol].newValue = newX;
    }
    if (!(yCol in corr.fields)) {
        corr.fields[yCol] = { originalValue: startY, newValue: newY };
    } else {
        corr.fields[yCol].newValue = newY;
    }

    // Push undo action
    const action = {
        type: 'drag',
        mergedIndex,
        xCol, yCol,
        prevX: startX, prevY: startY,
        newX, newY,
    };
    _undoStack.push(action);
    _redoStack = [];

    _updateButtons();
    _updateCorrectionPanel();
    Events.emit(EVT.POINT_CORRECTED, { mergedIndex, xCol, yCol, newX, newY });
}

function _applyAction(action, isUndo) {
    if (action.type === 'field') {
        _applyFieldAction(action, isUndo);
        return;
    }

    // type === 'drag'
    const { mergedIndex, xCol, yCol, prevX, prevY, newX, newY } = action;
    const applyX = isUndo ? prevX : newX;
    const applyY = isUndo ? prevY : newY;

    _applyCorrectionValue(mergedIndex, xCol, isUndo ? prevX : newX, prevX, isUndo);
    _applyCorrectionValue(mergedIndex, yCol, isUndo ? prevY : newY, prevY, isUndo);

    // Update the chart trace directly
    _updateChartPoint(mergedIndex);

    _updateCorrectionPanel();
}

function _applyFieldAction(action, isUndo) {
    const { mergedIndex, col, prevValue, newValue, originalValue } = action;
    const applyVal = isUndo ? prevValue : newValue;

    _applyCorrectionValue(mergedIndex, col, applyVal, originalValue, isUndo);
    _updateChartPoint(mergedIndex);

    _updateCorrectionPanel();
}

function _applyCorrectionValue(mergedIndex, col, value, originalValue, isUndo) {
    let corr = _corrections.get(mergedIndex);
    if (isUndo) {
        if (corr && corr.fields[col]) {
            if (value === corr.fields[col].originalValue) {
                delete corr.fields[col];
            } else {
                corr.fields[col].newValue = value;
            }
            if (Object.keys(corr.fields).length === 0) {
                _corrections.delete(mergedIndex);
            }
        }
    } else {
        if (!corr) {
            corr = { fields: {} };
            _corrections.set(mergedIndex, corr);
        }
        if (!(col in corr.fields)) {
            corr.fields[col] = { originalValue, newValue: value };
        } else {
            corr.fields[col].newValue = value;
        }
    }
}

function _commitFieldEdit(mergedIndex, col, originalValue, newValue) {
    let corr = _corrections.get(mergedIndex);
    if (!corr) {
        corr = { fields: {} };
        _corrections.set(mergedIndex, corr);
    }

    const prevValue = corr.fields[col]?.newValue ?? originalValue;

    if (newValue === originalValue) {
        // Back to original — remove correction for this field
        delete corr.fields[col];
        if (Object.keys(corr.fields).length === 0) {
            _corrections.delete(mergedIndex);
        }
    } else {
        if (!(col in corr.fields)) {
            corr.fields[col] = { originalValue, newValue };
        } else {
            corr.fields[col].newValue = newValue;
        }
    }

    // Push undo entry
    _undoStack.push({
        type: 'field',
        mergedIndex,
        col,
        prevValue,
        newValue,
        originalValue,
    });
    _redoStack = [];
    _updateButtons();

    // Update chart if this is an axis column currently displayed
    _updateChartPoint(mergedIndex);
    Events.emit(EVT.POINT_CORRECTED, { mergedIndex, col, newValue });
}

function _updateChartPoint(mergedIndex) {
    const el = Chart2D.getPlotElement();
    const traceIdx = Chart2D.getUserTraceIndex();
    if (!el || traceIdx < 0) return;

    const trace = el.data[traceIdx];
    const ptIdx = trace.customdata.indexOf(mergedIndex);
    if (ptIdx < 0) return;

    const corr = _corrections.get(mergedIndex);
    const allRows = API.getAllRows();
    const row = allRows[mergedIndex];
    if (!row) return;

    const xCol = _currentAxes.x;
    const yCol = _currentAxes.y;
    if (xCol) trace.x[ptIdx] = corr?.fields[xCol]?.newValue ?? row[xCol];
    if (yCol) trace.y[ptIdx] = corr?.fields[yCol]?.newValue ?? row[yCol];
    Plotly.redraw(el);
}

// --- Internal: UI updates ---

function _updateButtons() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if (btnUndo) btnUndo.disabled = _undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = _redoStack.length === 0;
}

function _updateCorrectionPanel() {
    const container = document.getElementById('correctionInfo');
    if (!container) return;

    if (_corrections.size === 0) {
        container.innerHTML = '<div class="empty-state">Drag a user point<br>to correct its position</div>';
        return;
    }

    let html = '';
    for (const [mergedIdx, corr] of _corrections) {
        const allRows = API.getAllRows();
        const row = allRows[mergedIdx];
        const catCols = API.getCategoricalHeaders();
        const name = catCols[0] && row ? (row[catCols[0]] ?? `#${mergedIdx}`) : `#${mergedIdx}`;

        html += `<div style="font-size:0.6rem;color:var(--accent2);margin:6px 0 2px">${name}</div>`;
        for (const [field, { originalValue, newValue }] of Object.entries(corr.fields)) {
            const origFmt = typeof originalValue === 'number' ? originalValue.toFixed(2) : originalValue;
            const newFmt = typeof newValue === 'number' ? newValue.toFixed(2) : newValue;
            html += `<div class="correction-row">
                <span class="col-name">${Columns.label(field)}</span>
                <span><span class="original">${origFmt}</span>
                <span class="arrow">&rarr;</span>
                <span class="corrected inline-editable" data-merged="${mergedIdx}" data-col="${field}" data-original="${originalValue ?? ''}">${newFmt}</span></span>
            </div>`;
        }
    }
    container.innerHTML = html;

    // Wire inline editing on green values
    container.querySelectorAll('.inline-editable').forEach(span => {
        span.addEventListener('click', (e) => {
            e.stopPropagation();
            _startInlineEdit(span);
        });
    });
}

function _startInlineEdit(span) {
    if (span.querySelector('input')) return; // already editing

    const mergedIndex = Number(span.dataset.merged);
    const col = span.dataset.col;
    const originalValue = span.dataset.original === '' ? null : Number(span.dataset.original);
    const corr = _corrections.get(mergedIndex);
    const currentValue = corr?.fields[col]?.newValue ?? originalValue;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentValue !== null && currentValue !== undefined ? currentValue : '';
    span.textContent = '';
    span.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
        const raw = input.value.trim();
        const newVal = raw === '' ? null : Number(raw);
        if (newVal !== null && isNaN(newVal)) {
            // Invalid — revert display
            _updateCorrectionPanel();
            return;
        }
        _commitFieldEdit(mergedIndex, col, originalValue, newVal);
        _updateCorrectionPanel();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { e.preventDefault(); input.removeEventListener('blur', commit); _updateCorrectionPanel(); }
    });
}

// --- Cleanup on data change ---
Events.on(EVT.DATA_UPDATED, () => {
    if (_active) exit();
    clearAll();
});
