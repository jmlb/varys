/**
 * Tags Panel — redesigned
 *
 * Layout:
 *   1. Create Tag form  (name · color picker · description · [+ Create])
 *   2. Two-column body:
 *        LEFT  — Specs panel: details of the currently selected tag
 *        RIGHT — Tag library: all tags grouped by topic, click to select
 */
import React, { useState, useEffect, useCallback } from 'react';
// ── Palette & colour helpers ──────────────────────────────────────────────────
export const TAG_PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
];
export function tagColorAuto(tag) {
    let h = 0;
    for (let i = 0; i < tag.length; i++)
        h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    return TAG_PALETTE[h % TAG_PALETTE.length];
}
// ── Built-in tag library ──────────────────────────────────────────────────────
export const BUILT_IN_TAG_DEFS = [
    { category: 'ML Pipeline', tags: [
            { name: 'data-loading', description: 'Cells that load data from files, databases, or APIs' },
            { name: 'preprocessing', description: 'Data cleaning, normalization, and transformation steps' },
            { name: 'feature-engineering', description: 'Feature creation, selection, and encoding' },
            { name: 'training', description: 'Model training and fitting' },
            { name: 'evaluation', description: 'Metrics, validation, and model assessment' },
            { name: 'inference', description: 'Prediction or scoring on new data' },
        ] },
    { category: 'Quality', tags: [
            { name: 'todo', description: 'Cell needs attention or further work' },
            { name: 'reviewed', description: 'Cell has been reviewed and approved' },
            { name: 'needs-refactor', description: 'Works but the implementation should be improved' },
            { name: 'slow', description: 'Computationally slow — candidate for optimization' },
            { name: 'broken', description: 'Cell is broken or produces errors' },
            { name: 'tested', description: 'Cell has been verified to produce correct output' },
        ] },
    { category: 'Report', tags: [
            { name: 'report', description: 'Output to include in an exported report' },
            { name: 'figure', description: 'Cell that generates a figure or chart' },
            { name: 'table', description: 'Cell that generates a table' },
            { name: 'key-finding', description: 'Contains an important result or insight' },
            { name: 'report-exclude', description: 'Explicitly exclude from report output' },
        ] },
    { category: 'Status', tags: [
            { name: 'draft', description: 'Work in progress — not finalized' },
            { name: 'stable', description: 'Unlikely to change; safe dependency for other cells' },
            { name: 'deprecated', description: 'No longer needed; kept for reference' },
            { name: 'sensitive', description: 'Contains sensitive data, credentials, or PII' },
        ] },
];
// ── Custom tag store (localStorage) ──────────────────────────────────────────
const CUSTOM_TAGS_KEY = 'varys_custom_tag_definitions';
export function loadCustomTags() {
    try {
        const raw = localStorage.getItem(CUSTOM_TAGS_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch (_a) {
        return [];
    }
}
function saveCustomTagsToStorage(tags) {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}
// resolve color: custom tags may have explicit color, else auto-hash
function resolveColor(tag, customTags) {
    var _a;
    const custom = customTags.find(t => t.name === tag);
    return (_a = custom === null || custom === void 0 ? void 0 : custom.color) !== null && _a !== void 0 ? _a : tagColorAuto(tag);
}
function findDescription(tag, customTags) {
    const custom = customTags.find(t => t.name === tag);
    if (custom)
        return custom.description;
    for (const group of BUILT_IN_TAG_DEFS) {
        const found = group.tags.find(t => t.name === tag);
        if (found)
            return found.description;
    }
    return '';
}
// ── Sub-components ────────────────────────────────────────────────────────────
const ColorPicker = ({ value, onChange }) => (React.createElement("div", { className: "ds-tp-color-picker" }, TAG_PALETTE.map(c => (React.createElement("button", { key: c, className: `ds-tp-color-swatch${value === c ? ' ds-tp-color-swatch--active' : ''}`, style: { background: c }, onClick: () => onChange(c), title: c, type: "button" })))));
export const TagsPanel = ({ notebookTracker }) => {
    var _a;
    // ── State ──────────────────────────────────────────────────────────────────
    const [nbTagCounts, setNbTagCounts] = useState(new Map());
    const [customTags, setCustomTags] = useState(loadCustomTags);
    const [selectedTag, setSelectedTag] = useState(null);
    // Create form
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newColor, setNewColor] = useState(TAG_PALETTE[0]);
    const [nameErr, setNameErr] = useState('');
    // ── Notebook scan ──────────────────────────────────────────────────────────
    const refreshNb = useCallback(() => {
        var _a, _b;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!(nb === null || nb === void 0 ? void 0 : nb.model)) {
            setNbTagCounts(new Map());
            return;
        }
        const counts = new Map();
        for (let i = 0; i < nb.model.cells.length; i++) {
            const tags = (_b = nb.model.cells.get(i).metadata['tags']) !== null && _b !== void 0 ? _b : [];
            tags.forEach(t => { var _a; return counts.set(t, ((_a = counts.get(t)) !== null && _a !== void 0 ? _a : 0) + 1); });
        }
        setNbTagCounts(counts);
    }, [notebookTracker]);
    useEffect(() => {
        notebookTracker.activeCellChanged.connect(refreshNb);
        notebookTracker.currentChanged.connect(refreshNb);
        refreshNb();
        return () => {
            notebookTracker.activeCellChanged.disconnect(refreshNb);
            notebookTracker.currentChanged.disconnect(refreshNb);
        };
    }, [notebookTracker, refreshNb]);
    // ── Create custom tag ──────────────────────────────────────────────────────
    const allBuiltInNames = [].concat(...BUILT_IN_TAG_DEFS.map(g => g.tags.map(t => t.name)));
    const createTag = () => {
        const raw = newName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!raw) {
            setNameErr('Name is required.');
            return;
        }
        if (!/^[a-z0-9][\w\-.]*$/.test(raw)) {
            setNameErr('Only a-z, 0-9, - or _ allowed.');
            return;
        }
        if (allBuiltInNames.includes(raw)) {
            setNameErr('Already a built-in tag.');
            return;
        }
        if (customTags.some(t => t.name === raw)) {
            setNameErr('Custom tag already exists.');
            return;
        }
        const updated = [...customTags, { name: raw, description: newDesc.trim(), color: newColor }];
        setCustomTags(updated);
        saveCustomTagsToStorage(updated);
        setNewName('');
        setNewDesc('');
        setNewColor(TAG_PALETTE[0]);
        setNameErr('');
        setSelectedTag(raw);
    };
    // ── Delete custom tag ──────────────────────────────────────────────────────
    const deleteCustomTag = (name) => {
        const updated = customTags.filter(t => t.name !== name);
        setCustomTags(updated);
        saveCustomTagsToStorage(updated);
        if (selectedTag === name)
            setSelectedTag(null);
    };
    // ── Jump to next cell with this tag ───────────────────────────────────────
    const jumpToTag = (tag) => {
        var _a, _b, _c, _d;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!(nb === null || nb === void 0 ? void 0 : nb.model))
            return;
        const total = nb.model.cells.length;
        const start = (_b = nb.activeCellIndex) !== null && _b !== void 0 ? _b : 0;
        for (let off = 1; off <= total; off++) {
            const idx = (start + off) % total;
            const tags = (_c = nb.model.cells.get(idx).metadata['tags']) !== null && _c !== void 0 ? _c : [];
            if (tags.includes(tag)) {
                nb.activeCellIndex = idx;
                (_d = nb.widgets[idx]) === null || _d === void 0 ? void 0 : _d.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }
        }
    };
    // ── Derived ────────────────────────────────────────────────────────────────
    const hasNotebook = !!notebookTracker.currentWidget;
    const isCustom = selectedTag ? customTags.some(t => t.name === selectedTag) : false;
    const selColor = selectedTag ? resolveColor(selectedTag, customTags) : TAG_PALETTE[0];
    const selDesc = selectedTag ? findDescription(selectedTag, customTags) : '';
    const selCount = selectedTag ? ((_a = nbTagCounts.get(selectedTag)) !== null && _a !== void 0 ? _a : 0) : 0;
    // ── Render ─────────────────────────────────────────────────────────────────
    return (React.createElement("div", { className: "ds-tags-panel ds-tags-panel-v2" },
        React.createElement("div", { className: "ds-tp-create-section" },
            React.createElement("div", { className: "ds-tp-create-header" }, "New Tag"),
            React.createElement("div", { className: "ds-tp-create-row1" },
                React.createElement("input", { className: "ds-tp-name-input", placeholder: "tag-name", value: newName, onChange: e => { setNewName(e.target.value); setNameErr(''); }, onKeyDown: e => { if (e.key === 'Enter')
                        createTag(); } }),
                React.createElement("button", { className: "ds-tp-create-btn", onClick: createTag, disabled: !newName.trim() }, "+ Create")),
            React.createElement(ColorPicker, { value: newColor, onChange: setNewColor }),
            React.createElement("input", { className: "ds-tp-desc-input", placeholder: "Description (optional)", value: newDesc, onChange: e => setNewDesc(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                    createTag(); } }),
            nameErr && React.createElement("p", { className: "ds-tp-error" }, nameErr)),
        !hasNotebook && React.createElement("p", { className: "ds-tags-empty" }, "No notebook open."),
        hasNotebook && (React.createElement("div", { className: "ds-tp-body" },
            React.createElement("div", { className: "ds-tp-specs" }, selectedTag ? (React.createElement(React.Fragment, null,
                React.createElement("span", { className: "ds-tp-specs-pill", style: { '--pill-color': selColor } }, selectedTag),
                React.createElement("div", { className: "ds-tp-specs-color-row" },
                    React.createElement("span", { className: "ds-tp-specs-swatch", style: { background: selColor } }),
                    React.createElement("span", { className: "ds-tp-specs-hex" }, selColor)),
                React.createElement("p", { className: "ds-tp-specs-desc" }, selDesc || React.createElement("em", { className: "ds-tp-specs-desc-empty" }, "No description")),
                React.createElement("div", { className: "ds-tp-specs-usage" }, selCount > 0 ? (React.createElement(React.Fragment, null,
                    React.createElement("span", { className: "ds-tp-specs-count" },
                        selCount,
                        " cell",
                        selCount !== 1 ? 's' : ''),
                    React.createElement("button", { className: "ds-tp-specs-jump-btn", onClick: () => jumpToTag(selectedTag), title: "Jump to next cell with this tag" }, "\u2192 Jump"))) : (React.createElement("span", { className: "ds-tp-specs-unused" }, "Not used in notebook"))),
                isCustom && (React.createElement("button", { className: "ds-tp-specs-del-btn", onClick: () => deleteCustomTag(selectedTag), title: "Delete this custom tag" }, "\uD83D\uDDD1 Delete")))) : (React.createElement("p", { className: "ds-tp-specs-hint" },
                "Select a tag",
                React.createElement("br", null),
                "to see its specs"))),
            React.createElement("div", { className: "ds-tp-list" },
                customTags.length > 0 && (React.createElement("div", { className: "ds-tp-group" },
                    React.createElement("div", { className: "ds-tp-group-label" }, "Custom"),
                    React.createElement("div", { className: "ds-tp-group-pills" }, customTags.map(t => {
                        var _a;
                        return (React.createElement(TagPill, { key: t.name, name: t.name, color: (_a = t.color) !== null && _a !== void 0 ? _a : tagColorAuto(t.name), count: nbTagCounts.get(t.name), selected: selectedTag === t.name, onClick: () => setSelectedTag(t.name) }));
                    })))),
                BUILT_IN_TAG_DEFS.map(group => (React.createElement("div", { key: group.category, className: "ds-tp-group" },
                    React.createElement("div", { className: "ds-tp-group-label" }, group.category),
                    React.createElement("div", { className: "ds-tp-group-pills" }, group.tags.map(t => (React.createElement(TagPill, { key: t.name, name: t.name, color: tagColorAuto(t.name), count: nbTagCounts.get(t.name), selected: selectedTag === t.name, onClick: () => setSelectedTag(t.name) }))))))))))));
};
// ── TagPill ───────────────────────────────────────────────────────────────────
const TagPill = ({ name, color, count, selected, onClick }) => (React.createElement("button", { className: `ds-tp-pill${selected ? ' ds-tp-pill--selected' : ''}`, style: { '--pill-color': color }, onClick: onClick, title: name },
    name,
    count !== undefined && count > 0 && (React.createElement("span", { className: "ds-tp-pill-count" }, count))));
