// CSV parsing and export utilities.
// Pure functions, no side effects — handles quoted fields, multi-line values, empty cells.

// Parse CSV string into { headers: string[], rows: object[] }. Empty cells become null.
export function parse(text) {
    const lines = _splitLines(text);
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = _parseLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        const values = _parseLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = idx < values.length ? _coerce(values[idx]) : null;
        });
        rows.push(row);
    }

    return { headers, rows };
}

// Convert array of objects to CSV string
export function stringify(headers, rows) {
    const headerLine = headers.map(_escape).join(',');
    const dataLines = rows.map(row =>
        headers.map(h => _escape(row[h] ?? '')).join(',')
    );
    return [headerLine, ...dataLines].join('\n');
}

// Validate CSV structure, return list of { type, message } issues
export function validate(headers, rows) {
    const issues = [];
    if (headers.length === 0) {
        issues.push({ type: 'error', message: 'Aucun en-tête détecté' });
    }
    rows.forEach((row, i) => {
        const nullCount = headers.filter(h => row[h] === null || row[h] === '').length;
        if (nullCount === headers.length) {
            issues.push({ type: 'warning', message: `Ligne ${i + 1} est entièrement vide` });
        }
    });
    return issues;
}

// --- Internal helpers ---

function _splitLines(text) {
    const lines = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
            current += ch;
        } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            lines.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function _parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                fields.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
    }
    fields.push(current.trim());
    return fields;
}

function _coerce(val) {
    if (val === null || val === undefined || val.trim() === '') return null;
    const trimmed = val.trim();
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
    // Handle European decimal separator (comma): "47,55" -> 47.55
    if (/^-?\d+,\d+$/.test(trimmed)) {
        const converted = Number(trimmed.replace(',', '.'));
        if (!isNaN(converted)) return converted;
    }
    return trimmed;
}

function _escape(val) {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}
