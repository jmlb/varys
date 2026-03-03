"use strict";
/**
 * Cell Tag & Position Overlay
 *
 * Injects a thin bar at the top of every notebook cell that shows:
 *   • LEFT  — coloured tag pills (only when the cell carries tags)
 *   • RIGHT — a small "#N" position badge (always, on every cell)
 *
 * The position number reflects the cell's 1-based index in the notebook and
 * updates automatically whenever:
 *   • The active cell or notebook changes
 *   • Cells are inserted, deleted, or moved (model.cells.changed signal)
 *   • A periodic 1.5 s fallback fires (catches metadata edits in the panel)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCellTagOverlay = void 0;
const OVERLAY_CLASS = 'ds-cell-tag-overlay';
const INTERVAL_MS = 1500;
const TAG_PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
];
function tagColor(tag) {
    let h = 0;
    for (let i = 0; i < tag.length; i++)
        h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    return TAG_PALETTE[h % TAG_PALETTE.length];
}
/** Remove all existing overlays from the page. */
function clearOverlays() {
    document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach(el => el.remove());
}
/** Render tag + position overlays for every cell in the current notebook. */
function renderOverlays(tracker) {
    var _a, _b;
    clearOverlays();
    const nb = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
    if (!(nb === null || nb === void 0 ? void 0 : nb.model))
        return;
    const total = nb.model.cells.length;
    for (let i = 0; i < total; i++) {
        const cellModel = nb.model.cells.get(i);
        const cellWidget = nb.widgets[i];
        if (!cellWidget)
            continue;
        const tags = (_b = cellModel.metadata['tags']) !== null && _b !== void 0 ? _b : [];
        // Insert the overlay bar as a sibling BEFORE .jp-Cell-inputWrapper so it
        // spans the full width of the cell above the code/text area.
        const inputWrapper = cellWidget.node.querySelector('.jp-Cell-inputWrapper');
        if (!inputWrapper)
            continue;
        const bar = document.createElement('div');
        bar.className = OVERLAY_CLASS;
        // ── Left: tag pills (only when the cell has tags) ──────────────────────
        if (tags.length > 0) {
            const pillsGroup = document.createElement('span');
            pillsGroup.className = 'ds-overlay-tags';
            for (const tag of tags) {
                const pill = document.createElement('span');
                pill.className = 'ds-cell-tag-pill';
                pill.textContent = tag;
                pill.style.setProperty('--pill-color', tagColor(tag));
                pillsGroup.appendChild(pill);
            }
            bar.appendChild(pillsGroup);
        }
        // ── Right: position badge "#N" ─────────────────────────────────────────
        const badge = document.createElement('span');
        badge.className = 'ds-cell-position-badge';
        badge.textContent = `#${i + 1}`;
        bar.appendChild(badge);
        cellWidget.node.insertBefore(bar, inputWrapper);
    }
}
// Track the model-level signal disconnect so we can rewire when the notebook
// switches.
let _disconnectModelSignal = null;
function connectModelSignal(tracker, refresh) {
    var _a, _b;
    _disconnectModelSignal === null || _disconnectModelSignal === void 0 ? void 0 : _disconnectModelSignal();
    _disconnectModelSignal = null;
    const model = (_b = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.model;
    if (!model)
        return;
    const handler = (_, __) => refresh();
    model.cells.changed.connect(handler);
    _disconnectModelSignal = () => model.cells.changed.disconnect(handler);
}
/**
 * Initialise the cell tag + position overlay system.
 * Call once from the main plugin activate() function.
 * Returns a cleanup function.
 */
function initCellTagOverlay(tracker) {
    const refresh = () => renderOverlays(tracker);
    // Re-render and rewire the model signal whenever the active notebook changes.
    const onNotebookChanged = () => {
        connectModelSignal(tracker, refresh);
        refresh();
    };
    tracker.activeCellChanged.connect(refresh);
    tracker.currentChanged.connect(onNotebookChanged);
    // Wire the initial notebook (if one is already open).
    connectModelSignal(tracker, refresh);
    const timer = setInterval(refresh, INTERVAL_MS);
    refresh();
    return () => {
        tracker.activeCellChanged.disconnect(refresh);
        tracker.currentChanged.disconnect(onNotebookChanged);
        _disconnectModelSignal === null || _disconnectModelSignal === void 0 ? void 0 : _disconnectModelSignal();
        _disconnectModelSignal = null;
        clearInterval(timer);
        clearOverlays();
    };
}
exports.initCellTagOverlay = initCellTagOverlay;
//# sourceMappingURL=cellTagOverlay.js.map