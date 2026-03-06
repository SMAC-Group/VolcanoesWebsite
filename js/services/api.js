// API abstraction layer — the only module that other code imports for data access.
// Delegates to the active backend (static or remote) based on config.
// To switch to a dynamic site: create remote-backend.js and change CONFIG.backend.

import { CONFIG } from '../config.js';
import * as Columns from '../columns.js';
import * as staticBackend from './static-backend.js';

// Dynamically resolve the backend (could be async import for remote)
function _backend() {
    // Future: if (CONFIG.backend === 'remote') return remoteBackend;
    return staticBackend;
}

export async function fetchVolcanoes(url) {
    return _backend().fetchVolcanoes(url);
}

export function getBaseHeaders() {
    return _backend().getBaseHeaders();
}

export function getBaseRows() {
    return _backend().getBaseRows();
}

export function getUserData() {
    return _backend().getUserData();
}

export function saveUserData(rows) {
    return _backend().saveUserData(rows);
}

export function appendUserData(newRows) {
    return _backend().appendUserData(newRows);
}

export function deleteUserDataRow(index) {
    return _backend().deleteUserDataRow(index);
}

export function clearUserData() {
    return _backend().clearUserData();
}

export function hasUserData() {
    return _backend().hasUserData();
}

export function userDataSizeKB() {
    return _backend().userDataSizeKB();
}

export function exportUserCSV(headers) {
    return _backend().exportUserCSV(headers);
}

export function submitContribution(headers, meta) {
    return _backend().submitContribution(headers, meta);
}

// --- Derived helpers (backend-agnostic) ---

// All rows merged (base + user), each tagged with _source
export function getAllRows() {
    const base = getBaseRows();
    const user = getUserData().map(r => ({ ...r, _source: 'user' }));
    return [...base, ...user];
}

// Union of all headers from base + user data, filtered by column config
export function getAllHeaders() {
    const baseH = getBaseHeaders();
    const userData = getUserData();
    const userH = userData.length > 0 ? Object.keys(userData[0]) : [];
    const combined = new Set([...baseH, ...userH]);
    combined.delete('_source');
    // Only keep columns declared in columns.js
    return [...combined].filter(h => Columns.isActive(h));
}

// Numeric columns available as axes (role = 'axis' or 'detail' in columns.js)
export function getNumericHeaders() {
    const all = getAllRows();
    const configured = Columns.axisKeys();
    return configured.filter(h => all.some(r => typeof r[h] === 'number'));
}

// Metadata columns (Reference, etc.)
export function getMetaHeaders() {
    return Columns.metaKeys();
}

// Columns shown in tooltips (concise subset)
export function getTooltipHeaders() {
    return Columns.tooltipKeys();
}

// Only categorical columns (for color/filter)
export function getCategoricalHeaders() {
    const all = getAllRows();
    return getAllHeaders().filter(h => {
        if (h.startsWith('_')) return false;
        return all.some(r => r[h] !== null && typeof r[h] === 'string');
    });
}

// Unique values for a column
export function uniqueValues(header) {
    const all = getAllRows();
    const set = new Set(all.map(r => r[header]).filter(v => v !== null));
    return [...set].sort();
}
