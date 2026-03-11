/**
 * Offline script: parse references.bib + volcanoData.csv
 * and produce data/references.json mapping CSV ref keys to BibTeX data.
 *
 * Run: node scripts/build-references.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

// ── Parse BibTeX ──

function parseBibtex(src) {
  const entries = [];
  // Match @type{key, ...} blocks (handles nested braces)
  const re = /@(\w+)\s*\{([^,]*),/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const type = m[1].toLowerCase();
    const bibKey = m[2].trim();
    const start = m.index + m[0].length;

    // Walk forward counting braces to find the closing }
    let depth = 1, i = start;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    const body = src.slice(start, i - 1);
    const fields = parseFields(body);
    fields._type = type;
    fields._key = bibKey;
    entries.push(fields);
  }
  return entries;
}

function parseFields(body) {
  const fields = {};
  // Match field = {value} or field = value
  const re = /(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}|(\w+)\s*=\s*([^,}\n]+)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const key = (m[1] || m[3]).toLowerCase().trim();
    const val = (m[2] || m[4] || '').trim();
    fields[key] = val;
  }
  return fields;
}

// ── Extract unique refs from CSV ──

function parseCsvRow(line) {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}

function extractCsvRefs(csvPath) {
  const csv = readFileSync(csvPath, 'utf-8');
  const lines = csv.split('\n');
  const headers = parseCsvRow(lines[0]);
  const refIdx = headers.indexOf('Reference');
  const refs = new Set();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvRow(lines[i]);
    const val = cols[refIdx]?.trim();
    if (val) refs.add(val);
  }
  return [...refs].sort();
}

// ── Build short label from author field ──

function shortLabel(authorField, year) {
  if (!authorField) return null;
  // Split on " and "
  const authors = authorField.split(/\s+and\s+/i);
  const surnames = authors.map(a => {
    // "Last, First" or "First Last" or "{Last}, First"
    const parts = a.trim().replace(/[{}~]/g, '').split(',');
    return parts[0].trim().split(/\s+/).pop();
  });
  let label;
  if (surnames.length === 1) label = surnames[0];
  else if (surnames.length === 2) label = `${surnames[0]} & ${surnames[1]}`;
  else label = `${surnames[0]} et al.`;
  return `${label} (${year || '?'})`;
}

// ── Normalize: strip diacritics + lowercase ──

function stripDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeForMatch(str) {
  return stripDiacritics(str).toLowerCase()
    .replace(/[&_\s]+/g, '')
    .replace(/etal/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function extractAuthorYear(csvKey) {
  const yearMatch = csvKey.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : null;
  let author = csvKey
    .replace(/_PhD.*/, '')
    .replace(/_et_al.*/, '').replace(/_et al.*/, '')
    .replace(/_and_.*/, '')
    .replace(/&.*/, '')
    .replace(/_\d{4}.*/, '')
    .replace(/_/g, '')
    .replace(/-/g, '')
    .toLowerCase();
  return { author: stripDiacritics(author), year };
}

function extractBibAuthor(authorField) {
  if (!authorField) return '';
  const first = authorField.split(/\s+and\s+/i)[0];
  const parts = first.trim().replace(/[{}~]/g, '').split(',');
  return stripDiacritics(
    parts[0].trim().split(/\s+/).pop().toLowerCase()
  ).replace(/[^a-z]/g, '');
}

// ── Manual overrides for tricky matches (CSV key → BibTeX key) ──

const MANUAL_MAP = {
  'Grove_et_al_1992':           'Grove_2013',       // BibTeX year=2013 for 1992 monograph reprint
  'Medard_et_al_2004':          'M_dard_2004',      // mojibake in BibTeX key
  'Maaloe_2004':                'Maal_e_2004',      // mangled ø
  'PatinoDouce&Beard_1995':     'PATI_O_DOUCE_1995',
  'PatinoDouce_1995':           'Pati_o_Douce_1995',
  'PatinoDouce_2005':           'PATINO_DOUCE_2004', // year off by 1
  'Skulsi_et_al_1994':          'Skulski_1994',      // typo in CSV
  'Pichavent&Macdonald_2007':   'Pichavant_2007',   // typo in CSV
  'Pertermann&Lundstrom_2006':  'PERTERMANN_2003',  // different year, same first author
};

// ── Main ──

const bibSrc = readFileSync('data/references.bib', 'utf-8');
const bibEntries = parseBibtex(bibSrc);
console.log(`Parsed ${bibEntries.length} BibTeX entries`);

const csvRefs = extractCsvRefs('data/volcanoData.csv');
console.log(`Found ${csvRefs.length} unique CSV references`);

// Build lookup by BibTeX key
const bibByKey = {};
bibEntries.forEach(e => { bibByKey[e._key] = e; });

// Build lookup structures for BibTeX entries
const bibByNorm = {};
const bibByAuthorYear = {};
bibEntries.forEach(e => {
  const norm = normalizeForMatch(e._key);
  bibByNorm[norm] = e;

  const author = extractBibAuthor(e.author);
  const year = e.year;
  if (author && year) {
    const key = author + year;
    if (!bibByAuthorYear[key]) bibByAuthorYear[key] = [];
    bibByAuthorYear[key].push(e);
  }
});

// Match CSV refs to BibTeX entries
const result = {};
let matched = 0, unmatched = 0;

csvRefs.forEach(csvKey => {
  const { author, year } = extractAuthorYear(csvKey);
  let bib = null;

  // Pass 0: manual override
  if (MANUAL_MAP[csvKey] && bibByKey[MANUAL_MAP[csvKey]]) {
    bib = bibByKey[MANUAL_MAP[csvKey]];
  }

  // Pass 1: normalized key match
  if (!bib) {
    const normCsv = normalizeForMatch(csvKey);
    if (bibByNorm[normCsv]) {
      bib = bibByNorm[normCsv];
    }
  }

  // Pass 2: author + year match
  if (!bib && author && year) {
    const candidates = bibByAuthorYear[author + year];
    if (candidates) {
      if (candidates.length === 1) {
        bib = candidates[0];
      } else {
        // Multiple matches for same author+year: try to disambiguate with a/b suffix
        const suffix = csvKey.match(/(\d{4})([a-z])$/);
        if (suffix && candidates.length > 1) {
          const idx = suffix[2].charCodeAt(0) - 97; // a=0, b=1, etc.
          bib = candidates[idx] || candidates[0];
        } else {
          bib = candidates[0];
        }
      }
    }
  }

  // Pass 3: fuzzy — try partial author match with year ±1
  if (!bib && author && year) {
    const yearN = parseInt(year);
    for (const e of bibEntries) {
      const bibAuth = extractBibAuthor(e.author);
      const bibYear = parseInt(e.year);
      if (!bibAuth || !bibYear) continue;
      const yearClose = Math.abs(bibYear - yearN) <= 1;
      const authorMatch = bibAuth.startsWith(author) || author.startsWith(bibAuth);
      if (yearClose && authorMatch) {
        bib = e;
        break;
      }
    }
  }

  // Pass 4: try matching BibTeX key contains CSV author + year ±1
  if (!bib && author && year) {
    const yearN = parseInt(year);
    for (const e of bibEntries) {
      const bibYear = parseInt(e.year);
      if (!bibYear || Math.abs(bibYear - yearN) > 1) continue;
      const normKey = stripDiacritics(e._key).toLowerCase().replace(/[^a-z]/g, '');
      if (normKey.includes(author.replace(/[^a-z]/g, ''))) {
        bib = e;
        break;
      }
    }
  }

  if (bib) {
    matched++;
    const titleRaw = bib.title || '';
    // Clean BibTeX markup from title
    const titleClean = titleRaw.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
    const titleShort = titleClean.length > 80 ? titleClean.slice(0, 77) + '...' : titleClean;

    result[csvKey] = {
      bibKey: bib._key,
      type: bib._type,
      title: titleClean,
      authors: (bib.author || '').replace(/[{}~]/g, ' ').replace(/\s+/g, ' ').trim(),
      journal: (bib.journal || bib.booktitle || bib.school || '').replace(/[{}]/g, ''),
      year: bib.year || '',
      volume: bib.volume || '',
      number: bib.number || '',
      pages: (bib.pages || '').replace(/--/g, '–'),
      doi: (bib.doi || bib.DOI || '').replace(/^https?:\/\/doi\.org\//, ''),
      url: bib.url || '',
      issn: bib.issn || bib.ISSN || '',
      publisher: (bib.publisher || '').replace(/[{}]/g, ''),
      abstract: (bib.abstract || '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim(),
      month: bib.month || '',
      note: bib.note || '',
      shortLabel: shortLabel(bib.author, bib.year),
      displayLabel: `${shortLabel(bib.author, bib.year)} — ${titleShort}`,
    };
  } else {
    unmatched++;
    console.log(`  UNMATCHED: ${csvKey} (author=${author}, year=${year})`);
    // Still create an entry with just the CSV key
    result[csvKey] = {
      bibKey: null,
      type: null,
      title: '',
      authors: '',
      journal: '',
      year: year || '',
      volume: '',
      number: '',
      pages: '',
      doi: '',
      url: '',
      issn: '',
      publisher: '',
      abstract: '',
      month: '',
      note: '',
      shortLabel: csvKey.replace(/_/g, ' '),
      displayLabel: csvKey.replace(/_/g, ' '),
    };
  }
});

console.log(`\nMatched: ${matched}/${csvRefs.length}, Unmatched: ${unmatched}`);

writeFileSync('data/references.json', JSON.stringify(result, null, 2));
console.log('Written data/references.json');
