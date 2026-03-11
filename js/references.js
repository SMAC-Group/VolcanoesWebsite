// Reference data module: load, index, search, and label formatting.
// Loads data/references.json (built offline by scripts/build-references.mjs).

let _refMap = {};       // csvKey → { title, authors, year, journal, doi, ... }
let _searchIndex = {};  // csvKey → single lowercase string of all fields
let _allKeys = [];

export async function fetchReferences(url = 'data/references.json') {
    const resp = await fetch(url);
    if (!resp.ok) { console.warn('Could not load references.json'); return; }
    _refMap = await resp.json();
    _allKeys = Object.keys(_refMap);
    _buildSearchIndex();
}

function _buildSearchIndex() {
    for (const key of _allKeys) {
        const r = _refMap[key];
        // Concatenate all searchable fields into one lowercase string
        _searchIndex[key] = [
            key, r.title, r.authors, r.journal, r.year,
            r.volume, r.pages, r.doi, r.publisher, r.abstract,
            r.shortLabel, r.note,
        ].filter(Boolean).join(' ').toLowerCase();
    }
}

/** Get full reference object for a CSV key */
export function getRef(csvKey) {
    return _refMap[csvKey] || null;
}

/** Get human-readable short label: "Adam & Green (1994)" */
export function getShortLabel(csvKey) {
    return _refMap[csvKey]?.shortLabel || null;
}

/** Get display label: "Adam & Green (1994) — The effects of pressure..." */
export function getDisplayLabel(csvKey) {
    return _refMap[csvKey]?.displayLabel || csvKey.replace(/_/g, ' ');
}

/** Search across all BibTeX fields. Returns array of matching CSV keys. */
export function searchRefs(query) {
    const q = query.toLowerCase().trim();
    if (!q) return _allKeys;
    return _allKeys.filter(key => _searchIndex[key]?.includes(q));
}

/** All known CSV reference keys */
export function getAllKeys() {
    return _allKeys;
}
