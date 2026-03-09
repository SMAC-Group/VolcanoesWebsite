// Static backend: reads CSV files via fetch, stores user data in localStorage.
// This file is swapped out entirely when switching to a remote backend.

import { parse, stringify } from '../csv.js';
import { Events, EVT } from '../events.js';

const STORAGE_KEY = 'volcaninfos_user_data';

let _baseRows = [];
let _baseHeaders = [];

export async function fetchVolcanoes(url = 'data/volcanoData.csv') {
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const text = await resp.text();
        const result = parse(text);
        _baseRows = result.rows;
        _baseHeaders = result.headers;
        return result;
    } catch (err) {
        console.warn('Could not load base data:', err.message);
        Events.emit(EVT.FETCH_ERROR, err.message);
        _baseRows = [];
        _baseHeaders = [];
        return { headers: [], rows: [] };
    }
}

export function getBaseHeaders() {
    return [..._baseHeaders];
}

export function getBaseRows() {
    return _baseRows.map(r => ({ ...r, _source: 'base' }));
}

// --- User data (localStorage) ---

export function getUserData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function saveUserData(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function appendUserData(newRows) {
    const existing = getUserData();
    saveUserData([...existing, ...newRows]);
}

export function deleteUserDataRow(index) {
    const rows = getUserData();
    if (index >= 0 && index < rows.length) {
        rows.splice(index, 1);
        saveUserData(rows);
    }
}

export function clearUserData() {
    localStorage.removeItem(STORAGE_KEY);
}

export function hasUserData() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

export function userDataSizeKB() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Math.round((raw.length * 2) / 1024) : 0;
}

// Export user data as downloadable CSV
export function exportUserCSV(headers) {
    const rows = getUserData();
    return stringify(headers, rows);
}

// "Submit" = download CSV file (static site has no server to POST to)
export function submitContribution(headers, meta) {
    const rows = getUserData();
    return {
        csv: stringify(headers, rows),
        rowCount: rows.length,
        meta,
    };
}
