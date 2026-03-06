// Right panel: point detail card, selection stats, selection list.

import * as API from '../services/api.js';
import * as Columns from '../columns.js';
import { CONFIG } from '../config.js';

// Keep track of the last selection so we can navigate back from detail view
let _lastSelection = [];
let _currentAxes = {};

// Update selection stats and list in the right panel
export function updateSelectionInfo(selectedSet, allRows, axes) {
    const statN = document.getElementById('statN');
    const statT = document.getElementById('statT');
    const statP = document.getElementById('statP');
    const labelT = document.getElementById('labelStatT');
    const labelP = document.getElementById('labelStatP');
    const selCount = document.getElementById('selectionCount');
    const selListCount = document.getElementById('selListCount');
    const selList = document.getElementById('selectionList');
    const detail = document.getElementById('pointDetail');

    if (!statN) return;

    _currentAxes = axes || {};
    const col1 = _currentAxes.x;
    const col2 = _currentAxes.y;

    // Update stat labels
    if (labelT) labelT.textContent = col1 ? Columns.label(col1) : 'Avg X';
    if (labelP) labelP.textContent = col2 ? Columns.label(col2) : 'Avg Y';

    const sel = [...selectedSet].map(i => ({ ...allRows[i], _idx: i })).filter(Boolean);
    _lastSelection = sel;

    selCount.textContent = sel.length;
    selListCount.textContent = sel.length;

    // Reset detail view when selection changes
    if (detail) detail.innerHTML = '<div class="empty-state">Click on a point<br>to see its data</div>';

    if (sel.length === 0) {
        statN.textContent = '—';
        statT.textContent = '—';
        statP.textContent = '—';
        selList.innerHTML = '<div class="empty-state">Use lasso or<br>rectangle (2D view)</div>';
        return;
    }

    statN.textContent = sel.length;

    if (col1) {
        const vals = sel.map(r => r[col1]).filter(v => v !== null && typeof v === 'number');
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        statT.textContent = avg !== null ? (Number.isInteger(avg) ? avg : avg.toFixed(2)) : '—';
    }
    if (col2) {
        const vals = sel.map(r => r[col2]).filter(v => v !== null && typeof v === 'number');
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        statP.textContent = avg !== null ? (Number.isInteger(avg) ? avg : avg.toFixed(2)) : '—';
    }

    _renderSelectionList(sel);
}

// Show detail card for a single clicked point (by index)
export function showPointDetailByIndex(index) {
    const allRows = API.getAllRows();
    const row = allRows[index];
    if (!row) return;
    _showDetail(row, _lastSelection.length > 0);
}

// --- Internal ---

function _renderSelectionList(sel) {
    const selList = document.getElementById('selectionList');
    if (!selList) return;

    const catCols = API.getCategoricalHeaders();
    const nameCol = catCols[0];
    const refCol = Columns.metaKeys()[0]; // 'Reference'
    const col1 = _currentAxes.x;

    selList.innerHTML = sel.slice(0, 50).map(d => {
        const name = nameCol ? (d[nameCol] ?? '?') : `#${d._idx ?? ''}`;
        const ref = refCol && d[refCol] ? d[refCol] : '';
        const val = col1 && d[col1] !== null ? `${d[col1]}` : '';
        return `<div class="sel-item" data-idx="${d._idx}">
            <div class="sel-item-info"><span class="sel-item-name">${name}</span>${ref ? `<span class="sel-item-ref">${ref}</span>` : ''}</div>
            <span style="color:${CONFIG.theme.accent2}">${val}</span>
        </div>`;
    }).join('') + (sel.length > 50 ? `<div class="sel-item" style="justify-content:center;cursor:default">... and ${sel.length - 50} more</div>` : '');

    // Wire click on each item
    selList.querySelectorAll('.sel-item[data-idx]').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.idx, 10);
            showPointDetailByIndex(idx);
        });
    });
}

function _showDetail(row, showBack) {
    const container = document.getElementById('pointDetail');
    if (!container || !row) return;

    const isUser = row._source === 'user';
    const metaKeys = Columns.metaKeys();
    const detailKeys = Columns.detailKeys().filter(k => !metaKeys.includes(k));

    const titleKey = metaKeys[0];
    const title = titleKey ? (row[titleKey] ?? '—') : '—';

    let html = '';
    if (showBack) {
        html += `<button class="btn-back" id="btnBackToList">&larr; Back to selection</button>`;
    }
    html += `<div class="volcano-card">`;
    html += `<div class="name">${title}`;
    if (isUser) html += ` <span class="user-tag">YOU</span>`;
    html += `</div>`;

    metaKeys.slice(1).forEach(h => {
        const val = row[h];
        html += `<div class="prop"><span class="key">${Columns.label(h)}</span><span class="val">${val ?? '—'}</span></div>`;
    });

    detailKeys.forEach(h => {
        const val = row[h];
        html += `<div class="prop"><span class="key">${Columns.label(h)}</span><span class="val">${val ?? '—'}</span></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Wire back button
    if (showBack) {
        document.getElementById('btnBackToList')?.addEventListener('click', () => {
            container.innerHTML = '<div class="empty-state">Click on a point<br>to see its data</div>';
        });
    }
}
