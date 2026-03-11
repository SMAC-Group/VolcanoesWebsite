# fetch_bibtex.mjs — BibTeX Reference Fetcher

**Path:** `scripts/fetch_bibtex.mjs`

## Overview

Node.js utility script that extracts unique references from `volcanoData.csv`, queries the CrossRef API to find matching publications, and outputs BibTeX entries and a review report. Not part of the frontend — run manually via `node scripts/fetch_bibtex.mjs`.

## Output Files

| File | Description |
|------|-------------|
| `data/references.bib` | All found BibTeX entries, keyed by the reference string from the CSV |
| `data/references_review.md` | Review report with status for every reference and candidate details |

## Constants

### `GEO_KEYWORDS` (array)

List of geology-related keywords used to filter CrossRef results for relevance (e.g. `'petrol'`, `'geochem'`, `'volcano'`, `'magma'`).

## Internal Functions

### `parseCSVLine(line)` → `string[]`

Parses a single CSV line handling quoted fields and escaped double-quotes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `line` | `string` | A single CSV row |

### `extractUniqueRefs(csvPath)` → `string[]`

Reads the CSV file, extracts unique values from the `Reference` column, and returns them sorted.

| Parameter | Type | Description |
|-----------|------|-------------|
| `csvPath` | `string` | Absolute path to the CSV file |

### `parseRefString(refStr)` → `object | null`

Parses a reference string like `"PatinoDouce_1997"` into structured parts.

| Parameter | Type | Description |
|-----------|------|-------------|
| `refStr` | `string` | Reference string from the CSV |

**Returns:** `{ firstAuthor, allAuthors, fullQuery, year, suffix }` or `null` if no year is found.

**Parsing logic:**
- Extracts year (and optional letter suffix) from the end of the string
- Splits author names by underscores
- Handles camelCase compound names (e.g. `PatinoDouce` → `Patino-Douce`)
- Strips `et al`, `PhD`, `and`

### `fetchURL(url, accept)` → `Promise<{ status, data }>`

Generic HTTP GET request with redirect handling.

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | URL to fetch |
| `accept` | `string` | Accept header value |

### `sleep(ms)` → `Promise`

Delays execution for rate limiting between API calls.

### `queryCrossRef(firstAuthor, allAuthors, year)` → `Promise<object[]>`

Queries the CrossRef API for works matching the author and year.

| Parameter | Type | Description |
|-----------|------|-------------|
| `firstAuthor` | `string` | Primary author surname |
| `allAuthors` | `string[]` | All author surnames |
| `year` | `string` | Publication year |

**Returns:** Array of CrossRef work items (up to 10).

### `fetchBibtex(doi)` → `Promise<string | null>`

Fetches a BibTeX entry for a DOI from doi.org using content negotiation.

| Parameter | Type | Description |
|-----------|------|-------------|
| `doi` | `string` | DOI identifier |

### `authorMatchScore(firstAuthor, allAuthors, item)` → `number`

Scores how well a CrossRef result's authors match the expected authors.

| Parameter | Type | Description |
|-----------|------|-------------|
| `firstAuthor` | `string` | Expected first author surname |
| `allAuthors` | `string[]` | All expected author surnames |
| `item` | `object` | CrossRef work item |

**Scoring:**
- Exact first author match: +10
- Partial first author match: +7
- Prefix match (4 chars): +5
- Second author match: +5

### `isGeoRelevant(item)` → `boolean`

Checks if a CrossRef result is geology-related by matching its journal, title, and subjects against `GEO_KEYWORDS`.

### `scoreItem(firstAuthor, allAuthors, item)` → `number`

Combines author match score, geo-relevance (+8), and CrossRef relevance score into a single ranking score.

### `formatItemShort(item)` → `string`

Formats a CrossRef result as a short markdown string for the review report.

### `main()`

Main entry point:
1. Extracts unique references from CSV
2. For each reference, queries CrossRef and scores results
3. Classifies matches: `ok`, `ambiguous`, `wrong_field`, `weak_author`, `no_match`, `not_found`, `no_year`
4. Fetches BibTeX for confident matches (score >= 10)
5. Writes `.bib` file and review `.md` file

**Classification criteria:**

| Status | Condition |
|--------|-----------|
| `ok` | Author match >= 7, geo-relevant, not ambiguous |
| `ambiguous` | Author match >= 7, geo-relevant, but second candidate is close |
| `wrong_field` | Author matches but journal is not geology-related |
| `weak_author` | Geology journal but poor author match |
| `no_match` | Neither good author match nor geo-relevance |
| `not_found` | No CrossRef results returned |
| `no_year` | Could not parse year from reference string |
