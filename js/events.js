// Lightweight event bus for decoupled communication between modules.
// Any future framework can subscribe to these same events.

const _listeners = {};

export const Events = {
    on(event, fn) {
        (_listeners[event] = _listeners[event] || []).push(fn);
    },

    off(event, fn) {
        if (!_listeners[event]) return;
        _listeners[event] = _listeners[event].filter(f => f !== fn);
    },

    emit(event, data) {
        (_listeners[event] || []).forEach(fn => fn(data));
    },
};

// Event name constants to avoid typos
export const EVT = {
    DATA_LOADED: 'data:loaded',
    DATA_UPDATED: 'data:updated',
    SELECTION_CHANGED: 'selection:changed',
    VIEW_CHANGED: 'view:changed',
    FILTER_CHANGED: 'filter:changed',
    AXES_CHANGED: 'axes:changed',
};
