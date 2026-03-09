// Toast notification system — replaces browser alert() calls.
// Usage: toast('message', 'success') | toast('message', 'error') etc.

let _container = null;

function _ensureContainer() {
    if (!_container) {
        _container = document.createElement('div');
        _container.id = 'toastContainer';
        document.body.appendChild(_container);
    }
}

export function toast(message, type = 'info') {
    _ensureContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${message}</span><button class="toast-close">&times;</button>`;
    _container.appendChild(el);

    const dismiss = () => {
        el.classList.add('fade-out');
        el.addEventListener('animationend', () => el.remove());
    };

    el.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
}
