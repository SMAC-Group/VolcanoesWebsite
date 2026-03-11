// Left sidebar: axis selectors, volcano filter list, selection tools.

import { CONFIG } from '../config.js';
import * as API from '../services/api.js';
import * as Columns from '../columns.js';
import { Events, EVT } from '../events.js';
import * as Refs from '../references.js';

export function initAxisSelectors() {
    const numCols = API.getNumericHeaders();
    const catCols = API.getCategoricalHeaders();
    const defaults = CONFIG.defaultAxes;

    _populateSelect('axisX', numCols, defaults.x || numCols[0]);
    _populateSelect('axisY', numCols, defaults.y || numCols[1] || numCols[0]);
    _populateSelect('axisZ', numCols, defaults.z || numCols[2] || numCols[0]);

    // Color selector: categorical first, then numeric
    const colorEl = document.getElementById('colorSelect');
    if (!colorEl) return;
    colorEl.innerHTML = '';
    [...catCols, ...numCols].forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = Columns.label(c);
        colorEl.appendChild(opt);
    });
}

export function initVolcanoFilter() {
    const list = document.getElementById('volcanoList');
    if (!list) return;

    const catCols = API.getCategoricalHeaders();
    const volcanoCol = catCols[0];
    if (!volcanoCol) return;

    const volcanoes = API.uniqueValues(volcanoCol);
    list.innerHTML = '';
    volcanoes.forEach(name => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.dataset.volcano = name;
        cb.addEventListener('change', () => Events.emit(EVT.FILTER_CHANGED));
        label.appendChild(cb);

        const displayLabel = Refs.getDisplayLabel(name) || name;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'ref-label-text';
        labelSpan.textContent = ` ${displayLabel}`;
        labelSpan.title = displayLabel;
        label.appendChild(labelSpan);

        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'btn-ref-eye';
        eyeBtn.innerHTML = '&#9737;';
        eyeBtn.title = 'View reference details';
        eyeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Events.emit(EVT.REF_VIEW_REQUESTED, name);
        });
        label.appendChild(eyeBtn);

        list.appendChild(label);
    });
}

// Get currently checked volcano names (null = all checked = no filter)
export function getActiveFilters() {
    const checkboxes = document.querySelectorAll('#volcanoList input[type="checkbox"]');
    if (checkboxes.length === 0) return null;
    const checked = [...checkboxes].filter(cb => cb.checked).map(cb => cb.dataset.volcano);
    return checked.length === checkboxes.length ? null : checked;
}

// Get current axis selections
export function getAxes() {
    return {
        x: document.getElementById('axisX')?.value,
        y: document.getElementById('axisY')?.value,
        z: document.getElementById('axisZ')?.value,
        color: document.getElementById('colorSelect')?.value,
        invertY: document.getElementById('invertY')?.checked ?? false,
    };
}

function _populateSelect(id, options, defaultVal) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = Columns.label(opt);
        if (opt === defaultVal) o.selected = true;
        el.appendChild(o);
    });
}
