// Modal dialogs: CSV upload, manual data entry, export/contribution.

import { parse, validate, stringify } from '../csv.js';
import * as API from '../services/api.js';
import { CONFIG } from '../config.js';
import { Events, EVT } from '../events.js';

let _pendingUpload = null;

export function init() {
    // Close on X or backdrop click
    document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => _closeParentModal(btn));
    });
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    });

    _initUpload();
    _initManualEntry();
    _initExport();
}

export function openUpload() {
    document.getElementById('modalUpload')?.classList.add('open');
}

export function openManualEntry() {
    _buildFormFields();
    document.getElementById('modalAdd')?.classList.add('open');
}

export function openExport() {
    const userRows = API.getUserData();
    if (userRows.length === 0) {
        alert('Aucune donnée utilisateur à exporter.');
        return;
    }
    const headers = API.getAllHeaders().filter(h => !h.startsWith('_'));
    const csvString = stringify(headers, userRows);
    _showExportPreview(csvString);
    document.getElementById('modalExport')?.classList.add('open');
}

export function openContribute() {
    const count = API.getUserData().length;
    const summary = document.getElementById('userDataSummary');
    if (summary) {
        summary.textContent = count > 0
            ? `${count} points utilisateur en cache`
            : 'Aucune donnée utilisateur chargée';
    }
    document.getElementById('modalContribute')?.classList.add('open');
}

// --- Upload ---

function _initUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) _handleFile(e.dataTransfer.files[0]);
        });
        dropZone.addEventListener('click', () => fileInput?.click());
    }

    fileInput?.addEventListener('change', () => {
        if (fileInput.files.length) _handleFile(fileInput.files[0]);
    });

    document.getElementById('btnConfirmUpload')?.addEventListener('click', () => {
        if (_pendingUpload) {
            API.appendUserData(_pendingUpload.rows);
            _pendingUpload = null;
            document.getElementById('modalUpload')?.classList.remove('open');
            Events.emit(EVT.DATA_UPDATED);
        }
    });
}

function _handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Veuillez sélectionner un fichier .csv');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const { headers, rows } = parse(e.target.result);
        const issues = validate(headers, rows);

        const errEl = document.getElementById('uploadErrors');
        if (errEl) {
            errEl.innerHTML = issues.map(i =>
                `<p style="color:${i.type === 'error' ? '#e94560' : '#ffd700'}">${i.message}</p>`
            ).join('');
        }

        _showUploadPreview(headers, rows);
        _pendingUpload = { headers, rows };
    };
    reader.readAsText(file);
}

function _showUploadPreview(headers, rows) {
    const container = document.getElementById('previewTableContainer');
    if (!container) return;

    const maxRows = Math.min(rows.length, 10);
    let html = '<table class="preview-table"><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    for (let i = 0; i < maxRows; i++) {
        html += '<tr>';
        headers.forEach(h => {
            const val = rows[i][h];
            html += `<td>${val ?? '<em>vide</em>'}</td>`;
        });
        html += '</tr>';
    }
    if (rows.length > 10) {
        html += `<tr><td colspan="${headers.length}">... et ${rows.length - 10} autres lignes</td></tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    document.getElementById('uploadPreview')?.classList.remove('hidden');
}

// --- Manual entry ---

function _initManualEntry() {
    document.getElementById('formAddData')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const row = {};
        for (const [key, val] of formData.entries()) {
            const trimmed = val.trim();
            row[key] = trimmed === '' ? null : (isNaN(Number(trimmed)) ? trimmed : Number(trimmed));
        }
        API.appendUserData([row]);
        document.getElementById('modalAdd')?.classList.remove('open');
        e.target.reset();
        Events.emit(EVT.DATA_UPDATED);
    });
}

function _buildFormFields() {
    const container = document.getElementById('formFields');
    if (!container) return;
    const headers = API.getAllHeaders().filter(h => !h.startsWith('_'));
    container.innerHTML = '';
    headers.forEach(h => {
        const div = document.createElement('div');
        div.className = 'form-row';
        div.innerHTML = `<label>${h}</label><input type="text" name="${h}" placeholder="Vide si inconnu">`;
        container.appendChild(div);
    });
}

// --- Export ---

function _initExport() {
    document.getElementById('btnDownloadCSV')?.addEventListener('click', () => {
        const headers = API.getAllHeaders().filter(h => !h.startsWith('_'));
        const csv = API.exportUserCSV(headers);
        _downloadFile('mes_donnees_volcaniques.csv', csv);
    });

    document.getElementById('btnSubmit')?.addEventListener('click', () => {
        const name = document.getElementById('contribName')?.value || '';
        const email = document.getElementById('contribEmail')?.value || '';
        if (!email) { alert('Email requis.'); return; }

        const headers = API.getAllHeaders().filter(h => !h.startsWith('_'));
        const result = API.submitContribution(headers, { name, email });
        _downloadFile('contribution_volcaninfos.csv', result.csv);
        alert(`CSV téléchargé (${result.rowCount} lignes). Envoyez-le à ${CONFIG.contactEmail}`);
        document.getElementById('modalContribute')?.classList.remove('open');
    });
}

function _showExportPreview(csvString) {
    const el = document.getElementById('exportPreview');
    if (!el) return;
    el.innerHTML = `<pre style="max-height:200px;overflow:auto;font-size:0.75rem;background:#0a0c10;padding:8px;border-radius:4px">${_escapeHtml(csvString)}</pre>`;
}

// --- Helpers ---

function _closeParentModal(el) {
    el.closest('.modal-overlay')?.classList.remove('open');
}

function _downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
