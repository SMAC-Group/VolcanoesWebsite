// Selection state — tracks selected point indices.
// Emits events so any UI module can react without direct coupling.

import { Events, EVT } from './events.js';

const _selected = new Set();

export function get() { return new Set(_selected); }
export function count() { return _selected.size; }
export function isSelected(index) { return _selected.has(index); }

export function select(index) {
    _selected.add(index);
    _notify();
}

export function deselect(index) {
    _selected.delete(index);
    _notify();
}

export function toggle(index) {
    _selected.has(index) ? _selected.delete(index) : _selected.add(index);
    _notify();
}

export function selectMultiple(indices) {
    indices.forEach(i => _selected.add(i));
    _notify();
}

export function clearAll() {
    _selected.clear();
    _notify();
}

function _notify() {
    Events.emit(EVT.SELECTION_CHANGED, get());
}
