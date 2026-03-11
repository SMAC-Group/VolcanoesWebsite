# static-backend.js — Static Backend Implementation

**Path:** `js/services/static-backend.js`

## Overview

Implements the data backend using CSV file fetching and localStorage. This is the default backend used when `CONFIG.backend === 'static'`. All functions here are called indirectly through `api.js` — no other module should import this file directly.

## Exports

### `fetchVolcanoes(url?)` → `Promise<{ headers, rows }>`

Fetches and parses the base CSV dataset via HTTP.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | `'data/volcanoData.csv'` | Path to the CSV file |

**Returns:** `{ headers: string[], rows: object[] }` where each row has `_source: 'base'`.

### `getBaseHeaders()` → `string[]`

Returns cached base CSV headers (available after `fetchVolcanoes` resolves).

### `getBaseRows()` → `object[]`

Returns cached base CSV rows, each tagged with `_source: 'base'`.

### `getUserData()` → `object[]`

Reads and parses user data from `localStorage` key `'volcanoUserData'`.

### `saveUserData(rows)`

Serializes and saves user data to localStorage.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rows` | `object[]` | Complete user dataset |

### `appendUserData(newRows)`

Appends rows to existing localStorage user data.

| Parameter | Type | Description |
|-----------|------|-------------|
| `newRows` | `object[]` | New rows to append |

### `deleteUserDataRow(index)`

Deletes a single row from user data by index.

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `number` | Index in the user data array |

### `clearUserData()`

Removes the `'volcanoUserData'` key from localStorage entirely.

### `hasUserData()` → `boolean`

Returns `true` if the localStorage key exists and is non-empty.

### `userDataSizeKB()` → `number`

Returns the size of the serialized user data in kilobytes.

### `exportUserCSV(headers)` → `string`

Exports user data as a CSV string with the given headers.

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `string[]` | Columns to include |

### `submitContribution(headers, meta)` → `{ csv, rowCount, meta }`

Packages user data + metadata for contribution. In static mode, returns the payload without sending it anywhere.

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `string[]` | Columns to include |
| `meta` | `object` | Contributor info `{ name, email, notes }` |

## Storage Details

- **Key:** `'volcanoUserData'`
- **Format:** JSON-serialized array of row objects
- **Size limit:** Checked against `CONFIG.maxCacheSizeKB`
