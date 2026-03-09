# Contributing Data

[Back to README](../README.md) | [Data format](data.md)

---

## Overview

VolcanInfos accepts volcanic geochemical data contributions. You can add your data through the website, verify it visually on the chart, then export and send it to the project maintainers.

---

## Step 1: Prepare your data

Your CSV file should follow this format:

```csv
Reference,T_C,P_kbar,n_cpx,SiO2_Cpx,TiO2_Cpx,...
"My Study 2024",1150,3.2,15,48.5,1.2,...
```

**Requirements:**
- First row = column headers (must match existing column names)
- Separator: comma (`,`)
- Decimal separator: period (`.`) or comma — both are accepted
- Empty cells are allowed (they become null values)
- Text values with commas must be quoted (`"value, with comma"`)

**Columns:** See [data.md](data.md) for the full list. You don't need all columns — missing ones will be treated as null.

Minimal example:
```csv
Reference,T_C,P_kbar,SiO2_Cpx
"My study 2024",1100,2.8,49.1
"My study 2024",1050,3.1,48.7
```

---

## Step 2: Import your data

Two options:

### Option A: CSV upload
1. Click **Import CSV** in the header
2. Drag & drop your file or click to browse
3. Review the preview table and check for warnings/errors
4. Click **Confirm import**

### Option B: Manual entry
1. Click **Add** in the header
2. Fill in the fields (leave unknown values empty)
3. Click **Add**

Your data appears as **green circles** on the chart, distinct from the base data (triangles).

---

## Step 3: Verify on the chart

Check that your points make sense relative to existing data:
- Are they in the expected temperature/pressure range?
- Do the compositions look reasonable compared to similar volcanoes?

### Correcting positions
If a point looks off:
1. Click the **Correct** button in the toolbar (2D view only)
2. Drag your point to the correct position
3. You can also click on the green value in the right panel to type an exact number
4. Use **Undo/Redo** if needed (Ctrl+Z / Ctrl+Shift+Z)
5. Click **Apply** to save corrections, or **Discard** to cancel

---

## Step 4: Export and send

1. Click **Contribute** in the header
2. Enter your name/institution and contact email
3. Click **Download & Send** — this downloads a CSV file
4. Send the CSV file by email to the project maintainers
5. Include the source/reference for your data

Alternatively, click **Export** to download just your data without the contribution form.

---

## Managing your data

Click **Manage** in the header to:
- See all your user-added points
- Delete individual points
- Delete all user data at once

**Important:** Your data is stored in your browser's local storage. It will be lost if you clear your browser data. Export your data before clearing the cache.

---

## Adding new dimensions

If your data includes columns not yet in the database:
1. Add the column to your CSV with a descriptive header
2. The website will accept it — new columns are detected automatically from headers
3. Mention the new columns in your contribution email so they can be added to the base database

See [data.md](data.md) for column naming conventions.

---

## Adding volcanoes

Simply add rows to the CSV. The first categorical (text) column is used for the volcano filter and group coloring.
