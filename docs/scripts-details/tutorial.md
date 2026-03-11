# tutorial.js — Guided Tutorial Overlay

**Path:** `js/ui/tutorial.js`

## Overview

Implements a step-by-step onboarding tutorial that highlights UI elements and explains their purpose. Auto-starts on first visit (tracked via localStorage). Can be re-triggered via the "?" help button.

## Exports

### `init()`

Initializes the tutorial system:
- Creates the overlay DOM elements (backdrop, tooltip, navigation buttons)
- Checks localStorage for first-visit flag
- Auto-starts the tutorial if it's the user's first visit
- Attaches click handler to the help button for re-triggering

### `start()`

Starts the tutorial from step 0. Each step:
- Highlights a specific UI element (by selector)
- Shows a tooltip with title and description
- Provides Next/Previous/Skip navigation
- Scrolls the highlighted element into view if needed

## Internal State

| Variable | Type | Description |
|----------|------|-------------|
| `_steps` | `array` | Array of step definitions `{ selector, title, text }` |
| `_currentStep` | `number` | Index of the currently displayed step |

## localStorage

- **Key:** `'volcanoTutorialDone'`
- **Value:** `'1'` after the tutorial is completed or skipped
