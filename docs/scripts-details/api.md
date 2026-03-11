# api.js — Data Access Facade

**Path:** `js/services/api.js`

## Overview

The **only data access point** for the entire application. All other modules import from `api.js` instead of touching the backend directly. It delegates to the active backend implementation (`static-backend.js` by default). This indirection enables switching to a remote API without changing any consumer code.

## Exports

### Data Loading

#### `fetchVolcanoes(url?)` → `Promise`

Loads the base CSV dataset. Delegates to the backend's `fetchVolcanoes()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | (backend default) | Optional CSV URL override |

---

### Base Data Accessors

#### `getBaseHeaders()` → `string[]`

Returns the column headers from the base CSV dataset.

#### `getBaseRows()` → `object[]`

Returns base data rows, each tagged with `_source: 'base'`.

---

### User Data Management

#### `getUserData()` → `object[]`

Returns user-added data rows from localStorage.

#### `saveUserData(rows)`

Overwrites all user data in localStorage.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rows` | `object[]` | Complete user dataset to save |

#### `appendUserData(newRows)`

Appends rows to existing user data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `newRows` | `object[]` | Rows to append |

#### `deleteUserDataRow(index)`

Deletes a single user row by its index within the user dataset.

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Index in the user data array |

#### `clearUserData()`

Removes all user data from localStorage.

#### `hasUserData()` → `boolean`

Returns `true` if any user data exists in localStorage.

#### `userDataSizeKB()` → `number`

Returns the size of stored user data in kilobytes.

---

### Export & Contribution

#### `exportUserCSV(headers)` → `string`

Exports user data as a CSV string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `string[]` | Columns to include in export |

#### `submitContribution(headers, meta)` → `{ csv, rowCount, meta }`

Prepares a contribution payload (CSV + metadata). In static mode, returns the data for the user to send manually.

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `string[]` | Columns to include |
| `meta` | `object` | Contributor metadata (name, email, notes) |

---

### Merged Data Accessors

#### `getAllRows()` → `object[]`

Returns merged base + user rows. Each row has `_source: 'base'` or `_source: 'user'`.

#### `getAllHeaders()` → `string[]`

Returns the union of all headers (base + user), filtered by column configuration.

#### `getNumericHeaders()` → `string[]`

Returns headers for numeric columns — usable as chart axes.

#### `getMetaHeaders()` → `string[]`

Returns headers for metadata columns (e.g. Volcano, Reference).

#### `getTooltipHeaders()` → `string[]`

Returns headers shown in hover tooltips.

#### `getCategoricalHeaders()` → `string[]`

Returns headers for categorical columns — usable for color grouping and filtering.

#### `uniqueValues(header)` → `any[]`

Returns sorted unique values for a given column across all data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `header` | `string` | Column name |

---

### Index Mapping

#### `userDataIndexFromMerged(mergedIndex)` → `number`

Converts an index in the merged dataset to the corresponding index in user data. Returns `-1` if the point is from the base dataset.

| Parameter | Type | Description |
|-----------|------|-------------|
| `mergedIndex` | `number` | Index in the merged (base + user) array |
