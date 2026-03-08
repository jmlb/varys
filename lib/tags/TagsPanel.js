/**
 * Tags Panel — Tag Zoo
 *
 * Layout:
 *   1. Create Tag form  (value · color picker · description · [+ Create])
 *   2. Two-column body:
 *        LEFT  — Tag library grouped by category (click to select)
 *        RIGHT — Details of the selected tag (description + color)
 *
 * Tag JSON shape: { "value": string, "description": string, "color"?: string }
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
            { value: 'data-loading', description: 'Cells that load data from files, databases, or APIs.' },
            { value: 'preprocessing', description: 'Data cleaning, normalization, and transformation steps.' },
            { value: 'feature-engineering', description: 'Feature creation, selection, and encoding.' },
            { value: 'training', description: 'Model training and fitting.' },
            { value: 'evaluation', description: 'Metrics, validation, and model assessment.' },
            { value: 'inference', description: 'Prediction or scoring on new data.' },
        ] },
    { category: 'Quality', tags: [
            { value: 'todo', description: 'Cell needs attention or further work.' },
            { value: 'reviewed', description: 'Cell has been reviewed and approved.' },
            { value: 'needs-refactor', description: 'Works but the implementation should be improved.' },
            { value: 'slow', description: 'Computationally slow — candidate for optimization.' },
            { value: 'broken', description: 'Cell is broken or produces errors.' },
            { value: 'tested', description: 'Cell has been verified to produce correct output.' },
        ] },
    { category: 'Report', tags: [
            { value: 'report', description: 'Output to include in an exported report.' },
            { value: 'figure', description: 'Cell that generates a figure or chart.' },
            { value: 'table', description: 'Cell that generates a table.' },
            { value: 'key-finding', description: 'Contains an important result or insight.' },
            { value: 'report-exclude', description: 'Explicitly exclude from report output.' },
        ] },
    { category: 'Status', tags: [
            { value: 'draft', description: 'Work in progress — not finalized.' },
            { value: 'stable', description: 'Unlikely to change; safe dependency for other cells.' },
            { value: 'deprecated', description: 'No longer needed; kept for reference.' },
            { value: 'sensitive', description: 'Contains sensitive data, credentials, or PII.' },
        ] },
];
// ── Custom tag store (localStorage) ──────────────────────────────────────────
const CUSTOM_TAGS_KEY = 'varys_custom_tag_definitions';
export function loadCustomTags() {
    try {
        const raw = localStorage.getItem(CUSTOM_TAGS_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        // Migrate legacy records that used `name` instead of `value`
        return parsed.map(r => {
            var _a, _b, _c;
            return ({
                value: (_b = (_a = r['value']) !== null && _a !== void 0 ? _a : r['name']) !== null && _b !== void 0 ? _b : '',
                description: (_c = r['description']) !== null && _c !== void 0 ? _c : '',
                color: r['color'],
            });
        }).filter(t => t.value);
    }
    catch (_a) {
        return [];
    }
}
function saveCustomTagsToStorage(tags) {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}
function resolveColor(tagValue, customTags) {
    var _a;
    const custom = customTags.find(t => t.value === tagValue);
    return (_a = custom === null || custom === void 0 ? void 0 : custom.color) !== null && _a !== void 0 ? _a : tagColorAuto(tagValue);
}
function findDescription(tagValue, customTags) {
    const custom = customTags.find(t => t.value === tagValue);
    if (custom)
        return custom.description;
    for (const group of BUILT_IN_TAG_DEFS) {
        const found = group.tags.find(t => t.value === tagValue);
        if (found)
            return found.description;
    }
    return '';
}
// ── ColorPicker ───────────────────────────────────────────────────────────────
const ColorPicker = ({ value, onChange }) => (React.createElement("div", { className: "ds-tp-color-picker" }, TAG_PALETTE.map(c => (React.createElement("button", { key: c, className: `ds-tp-color-swatch${value === c ? ' ds-tp-color-swatch--active' : ''}`, style: { background: c }, onClick: () => onChange(c), title: c, type: "button" })))));
// ── TagPill ───────────────────────────────────────────────────────────────────
const TagPill = ({ tagValue, color, selected, onClick }) => (React.createElement("button", { className: `ds-tp-pill${selected ? ' ds-tp-pill--selected' : ''}`, style: { '--pill-color': color }, onClick: onClick, title: tagValue }, tagValue));
export const TagsPanel = ({ notebookTracker }) => {
    const [customTags, setCustomTags] = useState(loadCustomTags);
    const [selectedTag, setSelectedTag] = useState(null);
    // Create form state
    const [newValue, setNewValue] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newColor, setNewColor] = useState(TAG_PALETTE[0]);
    const [nameErr, setNameErr] = useState('');
    // Keep custom tags in sync when another panel writes to localStorage
    const syncFromStorage = useCallback(() => {
        setCustomTags(loadCustomTags());
    }, []);
    useEffect(() => {
        window.addEventListener('storage', syncFromStorage);
        return () => window.removeEventListener('storage', syncFromStorage);
    }, [syncFromStorage]);
    // Subscribe to notebook changes so the component stays alive
    useEffect(() => {
        const noop = () => { };
        notebookTracker.currentChanged.connect(noop);
        return () => { notebookTracker.currentChanged.disconnect(noop); };
    }, [notebookTracker]);
    // ── All built-in tag values (for duplicate check) ─────────────────────────
    const allBuiltInValues = [].concat(...BUILT_IN_TAG_DEFS.map(g => g.tags.map(t => t.value)));
    // ── Create custom tag ──────────────────────────────────────────────────────
    const createTag = () => {
        const raw = newValue.trim().toLowerCase().replace(/\s+/g, '-');
        if (!raw) {
            setNameErr('Value is required.');
            return;
        }
        if (!/^[a-z0-9][\w\-.]*$/.test(raw)) {
            setNameErr('Only a-z, 0-9, - or _ allowed.');
            return;
        }
        if (allBuiltInValues.includes(raw)) {
            setNameErr('Already a built-in tag.');
            return;
        }
        if (customTags.some(t => t.value === raw)) {
            setNameErr('Custom tag already exists.');
            return;
        }
        const tag = { value: raw, description: newDesc.trim(), color: newColor };
        const updated = [...customTags, tag];
        setCustomTags(updated);
        saveCustomTagsToStorage(updated);
        setNewValue('');
        setNewDesc('');
        setNewColor(TAG_PALETTE[0]);
        setNameErr('');
        setSelectedTag(raw);
    };
    // ── Delete custom tag ──────────────────────────────────────────────────────
    const deleteCustomTag = (tagValue) => {
        const updated = customTags.filter(t => t.value !== tagValue);
        setCustomTags(updated);
        saveCustomTagsToStorage(updated);
        if (selectedTag === tagValue)
            setSelectedTag(null);
    };
    // ── Derived for details panel ──────────────────────────────────────────────
    const isCustom = selectedTag ? customTags.some(t => t.value === selectedTag) : false;
    const selColor = selectedTag ? resolveColor(selectedTag, customTags) : TAG_PALETTE[0];
    const selDesc = selectedTag ? findDescription(selectedTag, customTags) : '';
    // ── Render ─────────────────────────────────────────────────────────────────
    return (React.createElement("div", { className: "ds-tags-panel ds-tags-panel-v2" },
        React.createElement("div", { className: "ds-tp-create-section" },
            React.createElement("div", { className: "ds-tp-create-header" }, "New Tag"),
            React.createElement("div", { className: "ds-tp-create-row1" },
                React.createElement("input", { className: "ds-tp-name-input", placeholder: "tag-value", value: newValue, onChange: e => { setNewValue(e.target.value); setNameErr(''); }, onKeyDown: e => { if (e.key === 'Enter')
                        createTag(); } }),
                React.createElement("button", { className: "ds-tp-create-btn", onClick: createTag, disabled: !newValue.trim() }, "+ Create")),
            React.createElement(ColorPicker, { value: newColor, onChange: setNewColor }),
            React.createElement("input", { className: "ds-tp-desc-input", placeholder: "Description (optional)", value: newDesc, onChange: e => setNewDesc(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                    createTag(); } }),
            nameErr && React.createElement("p", { className: "ds-tp-error" }, nameErr)),
        React.createElement("div", { className: "ds-tp-body" },
            React.createElement("div", { className: "ds-tp-list" },
                customTags.length > 0 && (React.createElement("div", { className: "ds-tp-group" },
                    React.createElement("div", { className: "ds-tp-group-label" }, "Custom"),
                    React.createElement("div", { className: "ds-tp-group-pills" }, customTags.map(t => {
                        var _a;
                        return (React.createElement(TagPill, { key: t.value, tagValue: t.value, color: (_a = t.color) !== null && _a !== void 0 ? _a : tagColorAuto(t.value), selected: selectedTag === t.value, onClick: () => setSelectedTag(t.value) }));
                    })))),
                BUILT_IN_TAG_DEFS.map(group => (React.createElement("div", { key: group.category, className: "ds-tp-group" },
                    React.createElement("div", { className: "ds-tp-group-label" }, group.category),
                    React.createElement("div", { className: "ds-tp-group-pills" }, group.tags.map(t => (React.createElement(TagPill, { key: t.value, tagValue: t.value, color: tagColorAuto(t.value), selected: selectedTag === t.value, onClick: () => setSelectedTag(t.value) })))))))),
            React.createElement("div", { className: "ds-tp-details" }, selectedTag ? (React.createElement(React.Fragment, null,
                React.createElement("span", { className: "ds-tp-details-pill", style: { '--pill-color': selColor } }, selectedTag),
                React.createElement("div", { className: "ds-tp-details-color-row" },
                    React.createElement("span", { className: "ds-tp-details-swatch", style: { background: selColor } }),
                    React.createElement("span", { className: "ds-tp-details-hex" }, selColor)),
                React.createElement("div", { className: "ds-tp-details-json" },
                    React.createElement("pre", { className: "ds-tp-details-json-pre" }, JSON.stringify({ value: selectedTag, description: selDesc, color: selColor }, null, 2))),
                selDesc ? (React.createElement("p", { className: "ds-tp-details-desc" }, selDesc)) : (React.createElement("p", { className: "ds-tp-details-desc ds-tp-details-desc--empty" }, "No description.")),
                isCustom && (React.createElement("button", { className: "ds-tp-details-del-btn", onClick: () => deleteCustomTag(selectedTag), title: "Delete this custom tag" }, "\uD83D\uDDD1 Delete")))) : (React.createElement("p", { className: "ds-tp-details-hint" }, "\u2190 Select a tag"))))));
};
