# Data Format

[Back to README](../README.md)

## Main CSV File

The file `data/volcanoData.csv` is the project's database. Expected structure:

```csv
Reference,T_C,P_kbar,n_cpx,SiO2_Cpx,TiO2_Cpx,...
"Study X 2020",1150,3.2,15,48.5,1.2,...
```

### Column Types

| Category | Examples | Type | Role in `columns.js` |
|----------|----------|------|---------------------|
| Metadata | `Reference` | Text | `meta` |
| Main axes | `T_C`, `P_kbar` | Numeric | `axis` |
| Cpx compositions | `SiO2_Cpx`, `TiO2_Cpx`, ... | Numeric | `axis` |
| Standard deviations | `SiO2_Cpx_sd`, ... | Numeric | `detail` |

### Current Columns

**Main axes**: `T_C` (Temperature in °C), `P_kbar` (Pressure in kbar)

**Cpx compositions** (14 columns): `n_cpx`, `SiO2_Cpx`, `TiO2_Cpx`, `Al2O3_Cpx`, `FeO_Cpx`, `Fe2O3_Cpx`, `MnO_Cpx`, `MgO_Cpx`, `CaO_Cpx`, `Na2O_Cpx`, `K2O_Cpx`, `P2O5_Cpx`, `Cr2O3_Cpx`, `NiO_Cpx`

**Standard deviations** (13 `_sd` columns): same names as compositions, with `_sd` suffix

## Missing Values

- Empty CSV cells become `null` after parsing
- Points with `null` on an active axis are **filtered from the chart** (not removed from the dataset)
- `null` values are displayed as `—` in the detail panel

## Type Coercion

The CSV parser (`js/csv.js`) automatically applies:
1. Empty cell → `null`
2. Numeric value → `Number`
3. European decimal separator (`,` → `.`): `"47,55"` → `47.55`
4. Otherwise → `String` (text)

## User Data

Data added by the user (CSV upload or manual entry) is:
- Stored in `localStorage` under the key `volcaninfos_user_data` (serialized as JSON)
- Merged with base data via `API.getAllRows()`
- Tagged `_source: 'user'` for visual distinction (green color, circle symbol)
- Non-persistent: it disappears if the browser cache is cleared

## Adding a Dimension

1. Add the column to the CSV (`data/volcanoData.csv`)
2. Add an entry in `js/columns.js` with the desired `label` and `role`
3. The UI adapts automatically (axis selectors, tooltips, detail panel)
