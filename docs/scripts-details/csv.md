# csv.js — CSV Parser / Exporter

**Path:** `js/csv.js`

## Overview

Pure utility module for parsing, generating, and validating CSV data. Has no side effects, no DOM access, and no dependencies on other modules. Used by the service layer to convert between raw CSV text and structured row objects.

## Exports

### `parse(text)` → `{ headers: string[], rows: object[] }`

Parses a CSV string into structured data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Raw CSV text (comma-separated, with optional quoted fields) |

**Returns:** Object with:
- `headers` — Array of column names from the first row
- `rows` — Array of objects keyed by header name. Empty cells become `null`.

**Behavior:**
- Handles quoted fields with escaped double-quotes (`""`)
- Trims whitespace from values
- Converts numeric strings to `Number`, keeps non-numeric as strings
- Empty/whitespace-only cells become `null`

---

### `stringify(headers, rows)` → `string`

Converts structured data back to a CSV string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `string[]` | Column names for the header row |
| `rows` | `object[]` | Array of row objects keyed by header name |

**Returns:** CSV string with header row + data rows. Values containing commas, quotes, or newlines are quoted.

---

### `validate(headers, rows)` → `Array<{ type: string, message: string }>`

Validates CSV structure and returns a list of issues.

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `string[]` | Column names |
| `rows` | `object[]` | Row data |

**Returns:** Array of issue objects. Empty array = valid. Each issue has:
- `type` — `'error'` or `'warning'`
- `message` — Human-readable description of the issue

**Checks performed:**
- Missing required headers
- Duplicate headers
- Empty dataset
- Non-numeric values in numeric columns
