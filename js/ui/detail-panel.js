// Right panel: point detail card, selection stats, selection list.

import * as API from '../services/api.js';
import * as Columns from '../columns.js';
import { CONFIG } from '../config.js';

// Update selection stats and list in the right panel
export function updateSelectionInfo(selectedSet, allRows) {
    const statN = document.getElementById('statN');
    const statT = document.getElementById('statT');
    const statP = document.getElementById('statP');
    const selCount = document.getElementById('selectionCount');
    const selListCount = document.getElementById('selListCount');
    const selList = document.getElementById('selectionList');

    if (!statN) return;

    const sel = [...selectedSet].map(i => allRows[i]).filter(Boolean);

    selCount.textContent = sel.length;
    selListCount.textContent = sel.length;

    if (sel.length === 0) {
        statN.textContent = '—';
        statT.textContent = '—';
        statP.textContent = '—';
        selList.innerHTML = '<div class="empty-state">Utilisez le lasso ou<br>le rectangle (vue 2D)</div>';
        return;
    }

    statN.textContent = sel.length;

    // Compute averages for T and P
    const col1 = 'T_C';
    const col2 = 'P_kbar';

    if (col1) {
        const vals = sel.map(r => r[col1]).filter(v => v !== null);
        statT.textContent = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '—';
    }
    if (col2) {
        const vals = sel.map(r => r[col2]).filter(v => v !== null);
        statP.textContent = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
    }

    // Selection list
    const catCols = API.getCategoricalHeaders();
    const nameCol = catCols[0];
    selList.innerHTML = sel.slice(0, 20).map(d => {
        const name = nameCol ? (d[nameCol] ?? '?') : `#${d._idx ?? ''}`;
        const val = col1 && d[col1] !== null ? `${d[col1]}` : '';
        return `<div class="sel-item"><span>${name}</span><span style="color:${CONFIG.theme.accent2}">${val}</span></div>`;
    }).join('') + (sel.length > 20 ? `<div class="sel-item" style="justify-content:center">... et ${sel.length - 20} autres</div>` : '');
}

// Show detail card for a single clicked point
export function showPointDetail(row) {
    const container = document.getElementById('pointDetail');
    if (!container || !row) return;

    const isUser = row._source === 'user';
    const metaKeys = Columns.metaKeys();
    const detailKeys = Columns.detailKeys().filter(k => !metaKeys.includes(k));

    // Header: show Reference (or first meta column) as title
    const titleKey = metaKeys[0];
    const title = titleKey ? (row[titleKey] ?? '—') : '—';

    let html = `<div class="volcano-card">`;
    html += `<div class="name">${title}`;
    if (isUser) html += ` <span class="user-tag">VOUS</span>`;
    html += `</div>`;

    // Show remaining meta fields
    metaKeys.slice(1).forEach(h => {
        const val = row[h];
        html += `<div class="prop"><span class="key">${Columns.label(h)}</span><span class="val">${val ?? '—'}</span></div>`;
    });

    // Show all other configured columns
    detailKeys.forEach(h => {
        const val = row[h];
        html += `<div class="prop"><span class="key">${Columns.label(h)}</span><span class="val">${val ?? '—'}</span></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}
