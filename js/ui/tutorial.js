// Guided tutorial overlay — highlights UI elements step by step.
// Saves completion in localStorage so it only auto-shows once.

const STORAGE_KEY = 'volcaninfos_tutorial_done';

const STEPS = [
    {
        title: 'Welcome to VolcanInfos!',
        text: 'This quick tour will show you the main features of the application. You can quit at any time.',
        selector: null, // no highlight — centered welcome
    },
    {
        title: 'Chart axes',
        text: 'Choose which dimensions to plot on X, Y (and Z in 3D mode). The data adapts automatically.',
        selector: '.axis-selector',
        position: 'right',
    },
    {
        title: 'Color grouping',
        text: 'Select a categorical column to color-code the points. Use the refresh button to randomize colors.',
        selector: '.color-row',
        position: 'right',
    },
    {
        title: 'Volcano filter',
        text: 'Search and toggle individual volcanoes to focus on specific datasets.',
        selector: '#volcanoList',
        position: 'right',
    },
    {
        title: '2D / 3D views',
        text: 'Switch between a 2D scatter plot and an interactive 3D view.',
        selector: '.view-toggle',
        position: 'bottom',
    },
    {
        title: 'Chart tools',
        text: 'Use Lasso or Rectangle to select points, Pan to move around, and toggle Ellipses or Labels.',
        selector: '.plot-toolbar',
        position: 'bottom',
    },
    {
        title: 'Correction mode',
        text: 'Drag your own data points to correct their position. Undo/redo supported.',
        selector: '#tb-correct',
        position: 'bottom',
    },
    {
        title: 'Selection & details',
        text: 'Click a point to see its data. Use lasso/rectangle to select multiple points and see statistics.',
        selector: '#selectionPanels',
        position: 'left',
    },
    {
        title: 'Import & Export',
        text: 'Import your own CSV data, add points manually, manage or export your dataset.',
        selector: '.header-right',
        position: 'bottom',
    },
    {
        title: 'You\'re all set!',
        text: 'Click the ? button in the header anytime to replay this tour. Enjoy exploring!',
        selector: '#btnTutorial',
        position: 'bottom',
    },
];

let _currentStep = -1;
let _overlay = null;
let _spotlight = null;
let _tooltip = null;

export function init() {
    _createDOM();
    if (!localStorage.getItem(STORAGE_KEY)) {
        start();
    }
}

export function start() {
    _currentStep = -1;
    _overlay.classList.add('tutorial-active');
    _next();
}

function _finish() {
    _overlay.classList.remove('tutorial-active');
    _spotlight.style.display = 'none';
    _tooltip.style.display = 'none';
    localStorage.setItem(STORAGE_KEY, '1');
}

function _next() {
    _currentStep++;
    if (_currentStep >= STEPS.length) { _finish(); return; }
    _renderStep();
}

function _prev() {
    if (_currentStep > 0) _currentStep--;
    _renderStep();
}

function _renderStep() {
    const step = STEPS[_currentStep];
    const el = step.selector ? document.querySelector(step.selector) : null;

    // Tooltip content
    _tooltip.querySelector('.tut-title').textContent = step.title;
    _tooltip.querySelector('.tut-text').textContent = step.text;
    _tooltip.querySelector('.tut-counter').textContent = `${_currentStep + 1} / ${STEPS.length}`;
    _tooltip.querySelector('.tut-prev').style.display = _currentStep > 0 ? '' : 'none';
    _tooltip.querySelector('.tut-next').textContent = _currentStep === STEPS.length - 1 ? 'Finish' : 'Next';

    if (el) {
        // Highlight the element
        el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });

        // Small delay to let scroll settle
        requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            const pad = 6;
            _spotlight.style.display = 'block';
            _spotlight.style.left = (rect.left - pad) + 'px';
            _spotlight.style.top = (rect.top - pad) + 'px';
            _spotlight.style.width = (rect.width + pad * 2) + 'px';
            _spotlight.style.height = (rect.height + pad * 2) + 'px';

            _positionTooltip(rect, step.position || 'bottom');
        });
    } else {
        // No target — center the tooltip (welcome / generic step)
        _spotlight.style.display = 'none';
        _tooltip.style.display = 'flex';
        _tooltip.style.left = '50%';
        _tooltip.style.top = '50%';
        _tooltip.style.transform = 'translate(-50%, -50%)';
    }
}

function _positionTooltip(rect, pos) {
    const tt = _tooltip;
    tt.style.display = 'flex';
    tt.style.transform = '';
    const gap = 14;

    // Reset
    tt.style.left = '';
    tt.style.top = '';

    // Temporarily show to measure
    const ttRect = tt.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left, top;

    switch (pos) {
        case 'right':
            left = rect.right + gap;
            top = rect.top + rect.height / 2 - ttRect.height / 2;
            break;
        case 'left':
            left = rect.left - gap - ttRect.width;
            top = rect.top + rect.height / 2 - ttRect.height / 2;
            break;
        case 'top':
            left = rect.left + rect.width / 2 - ttRect.width / 2;
            top = rect.top - gap - ttRect.height;
            break;
        case 'bottom':
        default:
            left = rect.left + rect.width / 2 - ttRect.width / 2;
            top = rect.bottom + gap;
            break;
    }

    // Clamp to viewport
    left = Math.max(10, Math.min(vw - ttRect.width - 10, left));
    top = Math.max(10, Math.min(vh - ttRect.height - 10, top));

    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
}

function _createDOM() {
    // Overlay (blocks clicks everywhere except spotlight)
    _overlay = document.createElement('div');
    _overlay.className = 'tutorial-overlay';

    // Spotlight cutout
    _spotlight = document.createElement('div');
    _spotlight.className = 'tutorial-spotlight';
    _spotlight.style.display = 'none';

    // Tooltip
    _tooltip = document.createElement('div');
    _tooltip.className = 'tutorial-tooltip';
    _tooltip.style.display = 'none';
    _tooltip.innerHTML = `
        <div class="tut-title"></div>
        <div class="tut-text"></div>
        <div class="tut-footer">
            <span class="tut-counter"></span>
            <div class="tut-buttons">
                <button class="tut-skip">Skip</button>
                <button class="tut-prev">Back</button>
                <button class="tut-next">Next</button>
            </div>
        </div>
    `;

    _tooltip.querySelector('.tut-next').addEventListener('click', _next);
    _tooltip.querySelector('.tut-prev').addEventListener('click', _prev);
    _tooltip.querySelector('.tut-skip').addEventListener('click', _finish);

    // Click on overlay background also skips
    _overlay.addEventListener('click', (e) => {
        if (e.target === _overlay) _finish();
    });

    _overlay.appendChild(_spotlight);
    _overlay.appendChild(_tooltip);
    document.body.appendChild(_overlay);
}
