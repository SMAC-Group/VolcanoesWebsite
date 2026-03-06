# Contributing Data

[Back to README](../README.md)

## Contribution Workflow

1. **Import your data** via the "Import CSV" or "Add" button (manual entry)
2. **Verify** your points visually on the chart
3. **Export** via the "Export" button → downloads a file `my_volcanic_data.csv`
4. **Send** the CSV by email to the address shown in the "Contribute" section

## Expected CSV Format

The imported CSV must have headers matching the columns defined in `js/columns.js`. Missing columns will be treated as `null`.

Minimal example:
```csv
Reference,T_C,P_kbar,SiO2_Cpx
"My study 2024",1100,2.8,49.1
"My study 2024",1050,3.1,48.7
```

## Adding Dimensions to the Project

To add new data columns:

1. Add the column in `data/volcanoData.csv`
2. Add the entry in `js/columns.js`:
   ```js
   NewColumn: { label: 'Display Name', role: 'axis' },
   ```
3. Axis selectors, tooltips, and detail panel adapt automatically

## Adding Volcanoes

Simply add rows to the CSV. The first categorical (text) column is used for the volcano filter and group coloring.
