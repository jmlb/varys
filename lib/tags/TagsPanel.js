"use strict";
/**
 * Cell Tagging & Metadata Panel
 *
 * Shows for the currently-active cell:
 *   • Editable tag chips  (stored in cell.metadata.tags)
 *   • Custom metadata JSON editor
 *
 * Shows for the whole notebook:
 *   • All unique tags with per-tag cell counts
 *   • Click a tag to navigate to the next cell that carries it
 *   • Tagged-cells overview list
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsPanel = void 0;
const react_1 = __importStar(require("react"));
// ── Tag colour helpers ────────────────────────────────────────────────────────
const TAG_PALETTE = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#ec4899',
    '#14b8a6',
    '#6366f1', // indigo
];
function tagColor(tag) {
    let h = 0;
    for (let i = 0; i < tag.length; i++)
        h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    return TAG_PALETTE[h % TAG_PALETTE.length];
}
const TagChip = ({ tag, onRemove, onClick, count }) => (react_1.default.createElement("span", { className: "ds-tag-chip", style: { '--tag-color': tagColor(tag) }, onClick: onClick, title: onClick ? `Jump to next cell tagged "${tag}"` : tag },
    tag,
    count !== undefined && react_1.default.createElement("span", { className: "ds-tag-chip-count" }, count),
    onRemove && (react_1.default.createElement("button", { className: "ds-tag-chip-remove", onClick: e => { e.stopPropagation(); onRemove(); }, title: "Remove tag" }, "\u00D7"))));
const TagsPanel = ({ notebookTracker }) => {
    const [activeTags, setActiveTags] = (0, react_1.useState)([]);
    const [customMeta, setCustomMeta] = (0, react_1.useState)('{}');
    const [metaError, setMetaError] = (0, react_1.useState)('');
    const [metaSaved, setMetaSaved] = (0, react_1.useState)(false);
    const [newTag, setNewTag] = (0, react_1.useState)('');
    const [tagError, setTagError] = (0, react_1.useState)('');
    const [allTags, setAllTags] = (0, react_1.useState)(new Map());
    const [taggedCells, setTaggedCells] = (0, react_1.useState)([]);
    const [activeCellIdx, setActiveCellIdx] = (0, react_1.useState)(-1);
    const [filterText, setFilterText] = (0, react_1.useState)('');
    const [section, setSection] = (0, react_1.useState)('cell');
    const activeCellRef = (0, react_1.useRef)(null);
    // ── Read notebook ───────────────────────────────────────────────────────────
    const refreshNotebook = (0, react_1.useCallback)(() => {
        var _a, _b, _c, _d;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!(nb === null || nb === void 0 ? void 0 : nb.model)) {
            setAllTags(new Map());
            setTaggedCells([]);
            return;
        }
        const counts = new Map();
        const cells = [];
        for (let i = 0; i < nb.model.cells.length; i++) {
            const cm = nb.model.cells.get(i);
            const tags = (_b = cm.metadata['tags']) !== null && _b !== void 0 ? _b : [];
            if (tags.length > 0) {
                for (const t of tags)
                    counts.set(t, ((_c = counts.get(t)) !== null && _c !== void 0 ? _c : 0) + 1);
                const src = cm.sharedModel.source;
                cells.push({
                    index: i,
                    execCount: (_d = cm.executionCount) !== null && _d !== void 0 ? _d : null,
                    tags,
                    preview: src.slice(0, 70).replace(/\n/g, ' ') + (src.length > 70 ? '…' : ''),
                    type: cm.type,
                });
            }
        }
        setAllTags(counts);
        setTaggedCells(cells);
    }, [notebookTracker]);
    // ── Read active cell ────────────────────────────────────────────────────────
    const refreshActiveCell = (0, react_1.useCallback)(() => {
        var _a, _b, _c, _d;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        const cell = (_b = nb === null || nb === void 0 ? void 0 : nb.activeCell) !== null && _b !== void 0 ? _b : null;
        activeCellRef.current = cell;
        setActiveCellIdx((_c = nb === null || nb === void 0 ? void 0 : nb.activeCellIndex) !== null && _c !== void 0 ? _c : -1);
        if (!cell) {
            setActiveTags([]);
            setCustomMeta('{}');
            return;
        }
        const meta = cell.model.metadata;
        const tags = (_d = meta['tags']) !== null && _d !== void 0 ? _d : [];
        setActiveTags([...tags]);
        // Build custom metadata dict (everything except 'tags')
        const custom = {};
        for (const [k, v] of Object.entries(meta)) {
            if (k !== 'tags')
                custom[k] = v;
        }
        setCustomMeta(JSON.stringify(custom, null, 2));
        setMetaError('');
        setMetaSaved(false);
    }, [notebookTracker]);
    const refresh = (0, react_1.useCallback)(() => {
        refreshActiveCell();
        refreshNotebook();
    }, [refreshActiveCell, refreshNotebook]);
    // ── Subscriptions ───────────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        notebookTracker.activeCellChanged.connect(refresh);
        notebookTracker.currentChanged.connect(refresh);
        refresh();
        return () => {
            notebookTracker.activeCellChanged.disconnect(refresh);
            notebookTracker.currentChanged.disconnect(refresh);
        };
    }, [notebookTracker, refresh]);
    // ── Tag mutations ───────────────────────────────────────────────────────────
    const applyTags = (tags) => {
        var _a, _b, _c;
        const cell = activeCellRef.current;
        if (!cell)
            return;
        if (tags.length > 0) {
            cell.model.setMetadata('tags', tags);
        }
        else {
            // Remove key entirely when empty
            const meta = Object.assign({}, cell.model.metadata);
            delete meta['tags'];
            // JupyterLab 4.x: iterate keys and remove
            for (const k of Object.keys(cell.model.metadata)) {
                if (k !== 'tags')
                    continue;
                (_c = (_b = (_a = cell.model).deleteMetadata) === null || _b === void 0 ? void 0 : _b.call(_a, 'tags')) !== null && _c !== void 0 ? _c : cell.model.setMetadata('tags', undefined);
            }
        }
        setActiveTags([...tags]);
        refreshNotebook();
    };
    const addTag = () => {
        const raw = newTag.trim().toLowerCase().replace(/\s+/g, '-');
        if (!raw)
            return;
        if (!/^[a-z0-9][\w\-.]*$/.test(raw)) {
            setTagError('Tags must start with a letter or digit, and contain only a-z, 0-9, - or _');
            return;
        }
        if (activeTags.includes(raw)) {
            setTagError('Tag already applied');
            return;
        }
        setTagError('');
        applyTags([...activeTags, raw]);
        setNewTag('');
    };
    const removeTag = (tag) => {
        applyTags(activeTags.filter(t => t !== tag));
    };
    const saveCustomMeta = () => {
        const cell = activeCellRef.current;
        if (!cell)
            return;
        try {
            const obj = JSON.parse(customMeta);
            for (const [k, v] of Object.entries(obj)) {
                cell.model.setMetadata(k, v);
            }
            setMetaError('');
            setMetaSaved(true);
            setTimeout(() => setMetaSaved(false), 2000);
        }
        catch (_a) {
            setMetaError('Invalid JSON — check syntax');
        }
    };
    // ── Navigation ──────────────────────────────────────────────────────────────
    const jumpToTag = (tag) => {
        var _a, _b;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!(nb === null || nb === void 0 ? void 0 : nb.model))
            return;
        const total = nb.model.cells.length;
        const start = nb.activeCellIndex;
        for (let offset = 1; offset <= total; offset++) {
            const idx = (start + offset) % total;
            const tags = (_b = nb.model.cells.get(idx).metadata['tags']) !== null && _b !== void 0 ? _b : [];
            if (tags.includes(tag)) {
                nb.activeCellIndex = idx;
                // scroll into view
                const cellWidget = nb.widgets[idx];
                cellWidget === null || cellWidget === void 0 ? void 0 : cellWidget.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }
        }
    };
    const jumpToCell = (index) => {
        var _a, _b;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!nb)
            return;
        nb.activeCellIndex = index;
        (_b = nb.widgets[index]) === null || _b === void 0 ? void 0 : _b.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    // ── Render ──────────────────────────────────────────────────────────────────
    const hasNotebook = !!notebookTracker.currentWidget;
    const filteredTags = [...allTags.entries()].filter(([t]) => !filterText || t.includes(filterText.toLowerCase())).sort((a, b) => b[1] - a[1]); // sort by count desc
    const cellRef = activeCellIdx >= 0
        ? `cell[${activeCellIdx}]`
        : '—';
    return (react_1.default.createElement("div", { className: "ds-tags-panel" },
        react_1.default.createElement("div", { className: "ds-tags-section-bar" },
            react_1.default.createElement("button", { className: `ds-tags-section-btn${section === 'cell' ? ' active' : ''}`, onClick: () => setSection('cell') }, "Active Cell"),
            react_1.default.createElement("button", { className: `ds-tags-section-btn${section === 'notebook' ? ' active' : ''}`, onClick: () => setSection('notebook') },
                "Notebook (",
                allTags.size,
                " tag",
                allTags.size !== 1 ? 's' : '',
                ")"),
            react_1.default.createElement("button", { className: "ds-tags-refresh-btn", onClick: refresh, title: "Refresh" }, "\u21BB")),
        !hasNotebook && (react_1.default.createElement("p", { className: "ds-tags-empty" }, "No notebook open.")),
        hasNotebook && section === 'cell' && (react_1.default.createElement("div", { className: "ds-tags-cell-section" },
            react_1.default.createElement("div", { className: "ds-tags-cell-ref" },
                cellRef,
                activeTags.length === 0 && (react_1.default.createElement("span", { className: "ds-tags-cell-ref-hint" }, "no tags"))),
            activeTags.length > 0 && (react_1.default.createElement("div", { className: "ds-tags-chips-row" }, activeTags.map(t => (react_1.default.createElement(TagChip, { key: t, tag: t, onRemove: () => removeTag(t) }))))),
            react_1.default.createElement("div", { className: "ds-tags-add-row" },
                react_1.default.createElement("input", { className: "ds-tags-input", placeholder: "new-tag", value: newTag, onChange: e => { setNewTag(e.target.value); setTagError(''); }, onKeyDown: e => { if (e.key === 'Enter')
                        addTag(); }, disabled: !activeCellRef.current }),
                react_1.default.createElement("button", { className: "ds-tags-add-btn", onClick: addTag, disabled: !activeCellRef.current || !newTag.trim() }, "+ Add")),
            tagError && react_1.default.createElement("p", { className: "ds-tags-error" }, tagError),
            allTags.size > 0 && (react_1.default.createElement("div", { className: "ds-tags-quickpick" },
                react_1.default.createElement("span", { className: "ds-tags-quickpick-label" }, "Quick-add:"),
                [...allTags.keys()].filter(t => !activeTags.includes(t)).map(t => (react_1.default.createElement("button", { key: t, className: "ds-tags-quickpick-btn", style: { '--tag-color': tagColor(t) }, onClick: () => { applyTags([...activeTags, t]); } }, t))))),
            react_1.default.createElement("div", { className: "ds-tags-meta-section" },
                react_1.default.createElement("div", { className: "ds-tags-meta-header" },
                    react_1.default.createElement("span", null, "Custom metadata"),
                    react_1.default.createElement("button", { className: "ds-tags-meta-save-btn", onClick: saveCustomMeta, disabled: !activeCellRef.current }, metaSaved ? '✓ Saved' : 'Save')),
                react_1.default.createElement("textarea", { className: `ds-tags-meta-editor${metaError ? ' ds-tags-meta-error' : ''}`, value: customMeta, onChange: e => { setCustomMeta(e.target.value); setMetaError(''); setMetaSaved(false); }, rows: 6, spellCheck: false, disabled: !activeCellRef.current, placeholder: '{}' }),
                metaError && react_1.default.createElement("p", { className: "ds-tags-error" }, metaError),
                react_1.default.createElement("p", { className: "ds-tags-meta-hint" },
                    "JSON key/value pairs saved to cell metadata. Reserved key ",
                    react_1.default.createElement("code", null, "tags"),
                    " is managed above.")))),
        hasNotebook && section === 'notebook' && (react_1.default.createElement("div", { className: "ds-tags-notebook-section" },
            allTags.size === 0 && (react_1.default.createElement("p", { className: "ds-tags-empty" }, "No tagged cells in this notebook yet.")),
            allTags.size > 0 && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "ds-tags-filter-row" },
                    react_1.default.createElement("input", { className: "ds-tags-filter-input", placeholder: "Filter tags\u2026", value: filterText, onChange: e => setFilterText(e.target.value) })),
                react_1.default.createElement("div", { className: "ds-tags-cloud" }, filteredTags.map(([tag, count]) => (react_1.default.createElement(TagChip, { key: tag, tag: tag, count: count, onClick: () => jumpToTag(tag) })))),
                react_1.default.createElement("div", { className: "ds-tags-divider" }),
                react_1.default.createElement("div", { className: "ds-tags-cells-list" }, taggedCells
                    .filter(c => !filterText ||
                    c.tags.some(t => t.includes(filterText.toLowerCase())))
                    .map(c => {
                    const ref = c.execCount != null
                        ? `exec:[${c.execCount}]`
                        : `cell[${c.index}]`;
                    return (react_1.default.createElement("div", { key: c.index, className: "ds-tags-cell-row", onClick: () => jumpToCell(c.index), title: `Go to ${ref}` },
                        react_1.default.createElement("div", { className: "ds-tags-cell-row-header" },
                            react_1.default.createElement("span", { className: "ds-tags-cell-row-ref" }, ref),
                            react_1.default.createElement("span", { className: "ds-tags-cell-row-type" }, c.type)),
                        react_1.default.createElement("div", { className: "ds-tags-cell-row-preview" }, c.preview),
                        react_1.default.createElement("div", { className: "ds-tags-cell-row-tags" }, c.tags.map(t => (react_1.default.createElement(TagChip, { key: t, tag: t, onClick: () => jumpToTag(t) }))))));
                }))))))));
};
exports.TagsPanel = TagsPanel;
//# sourceMappingURL=TagsPanel.js.map