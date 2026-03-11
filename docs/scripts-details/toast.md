# toast.js — Toast Notification System

**Path:** `js/ui/toast.js`

## Overview

Provides non-blocking, auto-dismissing toast notifications. Replaces browser `alert()` calls with styled messages that appear in the corner of the screen and fade out automatically.

## Exports

### `toast(message, type?)`

Displays a toast notification.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | `string` | (required) | Text content of the notification |
| `type` | `string` | `'info'` | Visual style: `'info'`, `'success'`, `'warning'`, or `'error'` |

**Behavior:**
- Creates a `<div>` element styled according to `type`
- Appends it to the toast container (created on first use)
- Auto-removes after a timeout (a few seconds)
- Multiple toasts stack vertically
