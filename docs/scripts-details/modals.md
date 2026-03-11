# modals.js — Modal Dialogs

**Path:** `js/ui/modals.js`

## Overview

Manages all modal dialogs: CSV upload, manual data entry, user data management, export, and contribution. Handles form validation, CSV preview, and interaction with the data API. Emits `DATA_UPDATED` when user data changes.

## Exports

### `init()`

Initializes all modal event listeners (open/close buttons, form submissions, file drag & drop). Must be called once during app startup.

### `openUpload()`

Opens the CSV upload modal. Provides:
- File browse button and drag & drop zone
- CSV preview table with validation feedback
- Import confirmation

### `openManualEntry()`

Opens the manual data entry modal. Provides:
- Dynamic form generated from current CSV columns
- Numeric validation for axis columns
- Add button that appends a row to user data

### `openManage()`

Opens the user data management modal. Provides:
- Table of all user-added data points
- Per-row delete button
- "Clear all" button
- Row count and storage size info

### `openExport()`

Opens the export modal. Provides:
- CSV download of user data
- Preview of export content

### `openContribute()`

Opens the contribution modal. Provides:
- Contributor metadata form (name, email, notes)
- CSV generation for submission
- Instructions for sending data to the contact email
