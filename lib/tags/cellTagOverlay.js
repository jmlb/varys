/**
 * Cell Tag & Position Overlay
 *
 * Injects a thin bar at the top of every notebook cell that shows:
 *   • LEFT  — coloured tag pills (only when the cell carries tags)
 *   • RIGHT — a small "#N" position badge (always, on every cell)
 *
 * Clicking a tag pill enters "delete mode" — the pill expands to show an ×
 * button. Clicking × removes the tag from cell metadata and re-renders.
 * Clicking anywhere else dismisses delete mode.
 *
 * The position number reflects the cell's 1-based index in the notebook and
 * updates automatically whenever:
 *   • The active cell or notebook changes
 *   • Cells are inserted, deleted, or moved (model.cells.changed signal)
 *   • A periodic 1.5 s fallback fires (catches metadata edits in the panel)
 */
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
/**
 * Remove a tag from a cell's metadata and trigger a re-render.
 * Operates directly on the JupyterLab cell model.
 */
function deleteTag(tracker, cellIndex, tagToRemove, refresh) {
    var _a, _b, _c, _d, _e;
    const nb = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
    if (!(nb === null || nb === void 0 ? void 0 : nb.model))
        return;
    const cellModel = nb.model.cells.get(cellIndex);
    if (!cellModel)
        return;
    const current = (_b = cellModel.metadata['tags']) !== null && _b !== void 0 ? _b : [];
    const updated = current.filter(t => t !== tagToRemove);
    if (updated.length > 0) {
        cellModel.setMetadata('tags', updated);
    }
    else {
        // Remove the key entirely when no tags remain
        try {
            (_e = (_d = (_c = cellModel).deleteMetadata) === null || _d === void 0 ? void 0 : _d.call(_c, 'tags')) !== null && _e !== void 0 ? _e : cellModel.setMetadata('tags', undefined);
        }
        catch (_f) {
            cellModel.setMetadata('tags', []);
        }
    }
    refresh();
}
/** Render tag + position overlays for every cell in the current notebook. */
function renderOverlays(tracker, refresh) {
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
                const cellIdx = i; // capture for closure
                const pill = document.createElement('span');
                pill.className = 'ds-cell-tag-pill';
                pill.style.setProperty('--pill-color', tagColor(tag));
                pill.style.pointerEvents = 'auto';
                pill.style.cursor = 'pointer';
                pill.title = `Click to remove "${tag}"`;
                const label = document.createElement('span');
                label.className = 'ds-cell-tag-pill-label';
                label.textContent = tag;
                const removeBtn = document.createElement('span');
                removeBtn.className = 'ds-cell-tag-pill-remove';
                removeBtn.textContent = '×';
                removeBtn.title = `Remove tag "${tag}"`;
                pill.appendChild(label);
                pill.appendChild(removeBtn);
                // Click the pill label → toggle "pending delete" state
                let pending = false;
                const dismissPending = (e) => {
                    if (e)
                        e.stopPropagation();
                    pending = false;
                    pill.classList.remove('ds-cell-tag-pill--pending');
                };
                pill.addEventListener('click', e => {
                    e.stopPropagation(); // don't propagate to cell or document
                    if (pending) {
                        // Second click on pill itself → cancel
                        dismissPending();
                    }
                    else {
                        pending = true;
                        pill.classList.add('ds-cell-tag-pill--pending');
                        // Dismiss if user clicks anywhere outside this pill
                        const onOutside = (ev) => {
                            if (!pill.contains(ev.target)) {
                                dismissPending();
                                document.removeEventListener('click', onOutside, true);
                            }
                        };
                        document.addEventListener('click', onOutside, true);
                    }
                });
                removeBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    deleteTag(tracker, cellIdx, tag, refresh);
                });
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
export function initCellTagOverlay(tracker) {
    const refresh = () => renderOverlays(tracker, refresh);
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
