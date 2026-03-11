# references.js — Reference Data Module

**Path:** `js/references.js`

## Overview

Loads and indexes BibTeX reference metadata from `data/references.json` (built offline by `scripts/build-references.mjs`). Provides lookup by CSV key, human-readable labels, and full-text search across all BibTeX fields (title, authors, journal, year, abstract, DOI, etc.).

## Internal State

| Variable | Type | Description |
|----------|------|-------------|
| `_refMap` | `object` | Map of CSV key to reference object (`{ title, authors, year, journal, doi, ... }`) |
| `_searchIndex` | `object` | Map of CSV key to a single lowercase string of all concatenated fields (for search) |
| `_allKeys` | `string[]` | All known CSV reference keys |

## Exports

### `fetchReferences(url?)`

Fetches `data/references.json` and builds the internal search index. Logs a warning if the file cannot be loaded.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | `'data/references.json'` | URL to the references JSON file |

**Returns:** `Promise<void>`

### `getRef(csvKey)`

Returns the full reference object for a CSV key, or `null` if not found.

| Parameter | Type | Description |
|-----------|------|-------------|
| `csvKey` | `string` | Reference key as it appears in the CSV data |

**Returns:** `object | null` — Reference object with fields: `title`, `authors`, `year`, `journal`, `doi`, `volume`, `number`, `pages`, `publisher`, `abstract`, `url`, `type`, `shortLabel`, `displayLabel`, `note`

### `getShortLabel(csvKey)`

Returns a short human-readable label (e.g. "Adam & Green (1994)"), or `null` if not found.

| Parameter | Type | Description |
|-----------|------|-------------|
| `csvKey` | `string` | CSV reference key |

**Returns:** `string | null`

### `getDisplayLabel(csvKey)`

Returns a display label with truncated title (e.g. "Adam & Green (1994) — The effects of pressure..."). Falls back to the CSV key with underscores replaced by spaces if not found.

| Parameter | Type | Description |
|-----------|------|-------------|
| `csvKey` | `string` | CSV reference key |

**Returns:** `string`

### `searchRefs(query)`

Searches across all BibTeX fields (title, authors, journal, year, volume, pages, DOI, publisher, abstract, shortLabel, note). Returns all matching CSV keys.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | `string` | Search query (case-insensitive) |

**Returns:** `string[]` — Matching CSV keys. Returns all keys if query is empty.

### `getAllKeys()`

Returns all known CSV reference keys.

**Returns:** `string[]`

## Internal Functions

### `_buildSearchIndex()`

Concatenates all searchable fields for each reference into a single lowercase string and stores them in `_searchIndex`. Called automatically by `fetchReferences()`.
