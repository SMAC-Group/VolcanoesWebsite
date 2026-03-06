// Column configuration interface.
// Add/remove entries here to control which CSV columns are used in the app.
//
// Roles:
//   'axis'   — numeric, available as X/Y/Z axis selector + shown in tooltips & detail
//   'meta'   — text/metadata, shown in detail panel only (not plottable)
//   'detail' — numeric but secondary (std deviations etc.), shown in detail panel,
//              available as axis but not in tooltips
//   'hidden' — present in CSV but completely ignored by the UI
//
// To add a column:  add an entry with its CSV header name as key.
// To hide a column: set role to 'hidden' or simply delete/comment out the entry.

export const COLUMNS = {
    // --- Metadata ---
    Reference:      { label: 'Référence',          role: 'meta' },

    // --- Main axes ---
    T_C:            { label: 'Température (°C)',    role: 'axis' },
    P_kbar:         { label: 'Pression (kbar)',     role: 'axis' },

    // --- Cpx compositions ---
    n_cpx:          { label: 'n Cpx',               role: 'axis' },
    SiO2_Cpx:       { label: 'SiO\u2082 Cpx',      role: 'axis' },
    TiO2_Cpx:       { label: 'TiO\u2082 Cpx',      role: 'axis' },
    Al2O3_Cpx:      { label: 'Al\u2082O\u2083 Cpx', role: 'axis' },
    FeO_Cpx:        { label: 'FeO Cpx',             role: 'axis' },
    Fe2O3_Cpx:      { label: 'Fe\u2082O\u2083 Cpx', role: 'axis' },
    MnO_Cpx:        { label: 'MnO Cpx',             role: 'axis' },
    MgO_Cpx:        { label: 'MgO Cpx',             role: 'axis' },
    CaO_Cpx:        { label: 'CaO Cpx',             role: 'axis' },
    Na2O_Cpx:       { label: 'Na\u2082O Cpx',       role: 'axis' },
    K2O_Cpx:        { label: 'K\u2082O Cpx',        role: 'axis' },
    P2O5_Cpx:       { label: 'P\u2082O\u2085 Cpx',  role: 'axis' },
    Cr2O3_Cpx:      { label: 'Cr\u2082O\u2083 Cpx', role: 'axis' },
    NiO_Cpx:        { label: 'NiO Cpx',             role: 'axis' },

    // --- Cpx standard deviations ---
    SiO2_Cpx_sd:    { label: 'SiO\u2082 Cpx \u03C3',      role: 'detail' },
    TiO2_Cpx_sd:    { label: 'TiO\u2082 Cpx \u03C3',      role: 'detail' },
    Al2O3_Cpx_sd:   { label: 'Al\u2082O\u2083 Cpx \u03C3', role: 'detail' },
    FeO_Cpx_sd:     { label: 'FeO Cpx \u03C3',             role: 'detail' },
    Fe2O3_Cpx_sd:   { label: 'Fe\u2082O\u2083 Cpx \u03C3', role: 'detail' },
    MnO_Cpx_sd:     { label: 'MnO Cpx \u03C3',             role: 'detail' },
    MgO_Cpx_sd:     { label: 'MgO Cpx \u03C3',             role: 'detail' },
    CaO_Cpx_sd:     { label: 'CaO Cpx \u03C3',             role: 'detail' },
    Na2O_Cpx_sd:    { label: 'Na\u2082O Cpx \u03C3',       role: 'detail' },
    K2O_Cpx_sd:     { label: 'K\u2082O Cpx \u03C3',        role: 'detail' },
    P2O5_Cpx_sd:    { label: 'P\u2082O\u2085 Cpx \u03C3',  role: 'detail' },
    Cr2O3_Cpx_sd:   { label: 'Cr\u2082O\u2083 Cpx \u03C3', role: 'detail' },
    NiO_Cpx_sd:     { label: 'NiO Cpx \u03C3',             role: 'detail' },
};

// --- Helpers (used by other modules) ---

// All configured column keys
export function allKeys() {
    return Object.keys(COLUMNS).filter(k => COLUMNS[k].role !== 'hidden');
}

// Column keys available as plot axes (role = 'axis' or 'detail')
export function axisKeys() {
    return Object.keys(COLUMNS).filter(k => COLUMNS[k].role === 'axis' || COLUMNS[k].role === 'detail');
}

// Column keys shown in tooltips (role = 'axis' only, keeps tooltips concise)
export function tooltipKeys() {
    return Object.keys(COLUMNS).filter(k => COLUMNS[k].role === 'axis');
}

// Column keys shown in detail panel (everything except hidden)
export function detailKeys() {
    return allKeys();
}

// Metadata columns (Reference, etc.)
export function metaKeys() {
    return Object.keys(COLUMNS).filter(k => COLUMNS[k].role === 'meta');
}

// Get display label for a CSV column name
export function label(key) {
    return COLUMNS[key]?.label ?? key;
}

// Check if a CSV column is configured (not hidden)
export function isActive(key) {
    return key in COLUMNS && COLUMNS[key].role !== 'hidden';
}
