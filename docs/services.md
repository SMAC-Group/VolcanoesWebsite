# Service Layer

[Back to README](../README.md) | [Files](files.md)

## Principle

All data access goes through `js/services/api.js`. It is the **only data dependency** for all other modules. The rest of the app has no knowledge of where the data comes from.

---

## `js/services/api.js`

Facade that delegates to the active backend based on `CONFIG.backend`.

**Functions delegated to the backend**:
| Function | Description |
|----------|-------------|
| `fetchVolcanoes(url?)` | Loads base data (CSV or API) |
| `getBaseHeaders()` | Base CSV headers |
| `getBaseRows()` | Base CSV rows (tagged `_source: 'base'`) |
| `getUserData()` | User data (localStorage or API) |
| `saveUserData(rows)` | Saves user data |
| `appendUserData(newRows)` | Appends rows to user data |
| `deleteUserDataRow(index)` | Deletes a single user data row by index |
| `clearUserData()` | Deletes all user data |
| `hasUserData()` | Checks if user data exists |
| `userDataSizeKB()` | User data size in KB |
| `exportUserCSV(headers)` | Exports user data as CSV string |
| `submitContribution(headers, meta)` | Prepares contribution CSV |

**Derived functions (backend-agnostic)**:
| Function | Description |
|----------|-------------|
| `getAllRows()` | Merges base + user, each row tagged with `_source` |
| `getAllHeaders()` | Union of headers, filtered by `columns.js` |
| `getNumericHeaders()` | Numeric columns (role `axis` or `detail`) |
| `getMetaHeaders()` | Metadata columns (role `meta`) |
| `getTooltipHeaders()` | Columns shown in tooltips (role `axis`) |
| `getCategoricalHeaders()` | Text columns (for color/filter) |
| `uniqueValues(header)` | Sorted unique values for a column |

---

## `js/services/static-backend.js`

Static implementation: loads CSV via `fetch()`, stores user data in `localStorage`.

**How it works**:
1. `fetchVolcanoes()` calls `fetch('data/volcanoData.csv')`, parses the CSV, stores rows in memory
2. User data is serialized as JSON in `localStorage` under the key `volcaninfos_user_data`
3. `submitContribution()` generates a CSV and returns it (no server call — the file is downloaded client-side)

---

## Migrating to a Dynamic Backend

To switch to a server-backed backend:

1. Create `js/services/remote-backend.js` that exports the same functions as `static-backend.js`
2. Set `CONFIG.backend = 'remote'` and `CONFIG.apiUrl = 'https://...'` in `config.js`
3. Update the import in `api.js` to load `remote-backend.js` when `backend === 'remote'`

No other files need to change. UI modules continue to call `api.js` as before.
