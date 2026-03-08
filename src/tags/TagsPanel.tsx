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
import { INotebookTracker } from '@jupyterlab/notebook';

// ── Palette & colour helpers ──────────────────────────────────────────────────

export const TAG_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
];

export function tagColorAuto(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

// ── Built-in tag library ──────────────────────────────────────────────────────

export const BUILT_IN_TAG_DEFS: { category: string; tags: { value: string; description: string }[] }[] = [
  { category: 'ML Pipeline', tags: [
    { value: 'data-loading',        description: 'Cells that load data from files, databases, or APIs.' },
    { value: 'preprocessing',       description: 'Data cleaning, normalization, and transformation steps.' },
    { value: 'feature-engineering', description: 'Feature creation, selection, and encoding.' },
    { value: 'training',            description: 'Model training and fitting.' },
    { value: 'evaluation',          description: 'Metrics, validation, and model assessment.' },
    { value: 'inference',           description: 'Prediction or scoring on new data.' },
  ]},
  { category: 'Quality', tags: [
    { value: 'todo',           description: 'Cell needs attention or further work.' },
    { value: 'reviewed',       description: 'Cell has been reviewed and approved.' },
    { value: 'needs-refactor', description: 'Works but the implementation should be improved.' },
    { value: 'slow',           description: 'Computationally slow — candidate for optimization.' },
    { value: 'broken',         description: 'Cell is broken or produces errors.' },
    { value: 'tested',         description: 'Cell has been verified to produce correct output.' },
  ]},
  { category: 'Report', tags: [
    { value: 'report',         description: 'Output to include in an exported report.' },
    { value: 'figure',         description: 'Cell that generates a figure or chart.' },
    { value: 'table',          description: 'Cell that generates a table.' },
    { value: 'key-finding',    description: 'Contains an important result or insight.' },
    { value: 'report-exclude', description: 'Explicitly exclude from report output.' },
  ]},
  { category: 'Status', tags: [
    { value: 'draft',       description: 'Work in progress — not finalized.' },
    { value: 'stable',      description: 'Unlikely to change; safe dependency for other cells.' },
    { value: 'deprecated',  description: 'No longer needed; kept for reference.' },
    { value: 'sensitive',   description: 'Contains sensitive data, credentials, or PII.' },
  ]},
];

// ── Custom tag store (localStorage) ──────────────────────────────────────────

const CUSTOM_TAGS_KEY = 'varys_custom_tag_definitions';

/** Tag JSON shape: { "value": string, "topic": string, "description": string, "color"?: string } */
export interface CustomTagDef { value: string; topic?: string; description: string; color?: string }

export function loadCustomTags(): CustomTagDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Record<string, string>>;
    // Migrate legacy records that used `name` instead of `value`
    return parsed.map(r => ({
      value:       r['value'] ?? r['name'] ?? '',
      description: r['description'] ?? '',
      color:       r['color'],
    })).filter(t => t.value);
  } catch { return []; }
}

function saveCustomTagsToStorage(tags: CustomTagDef[]): void {
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}

export const BUILT_IN_TOPICS = BUILT_IN_TAG_DEFS.map(g => g.category);

function resolveColor(tagValue: string, customTags: CustomTagDef[]): string {
  const custom = customTags.find(t => t.value === tagValue);
  return custom?.color ?? tagColorAuto(tagValue);
}

function findMeta(tagValue: string, customTags: CustomTagDef[]): { description: string; topic: string } {
  const custom = customTags.find(t => t.value === tagValue);
  if (custom) return { description: custom.description, topic: custom.topic ?? 'Custom' };
  for (const group of BUILT_IN_TAG_DEFS) {
    const found = group.tags.find(t => t.value === tagValue);
    if (found) return { description: found.description, topic: group.category };
  }
  return { description: '', topic: '' };
}

// ── ColorPicker ───────────────────────────────────────────────────────────────

const ColorPicker: React.FC<{ value: string; onChange: (c: string) => void }> = ({ value, onChange }) => (
  <div className="ds-tp-color-picker">
    {TAG_PALETTE.map(c => (
      <button
        key={c}
        className={`ds-tp-color-swatch${value === c ? ' ds-tp-color-swatch--active' : ''}`}
        style={{ background: c }}
        onClick={() => onChange(c)}
        title={c}
        type="button"
      />
    ))}
  </div>
);

// ── TagPill ───────────────────────────────────────────────────────────────────

const TagPill: React.FC<{
  tagValue: string; color: string;
  selected: boolean; onClick: () => void;
}> = ({ tagValue, color, selected, onClick }) => (
  <button
    className={`ds-tp-pill${selected ? ' ds-tp-pill--selected' : ''}`}
    style={{ '--pill-color': color } as React.CSSProperties}
    onClick={onClick}
    title={tagValue}
  >
    {tagValue}
  </button>
);

// ── Main component ────────────────────────────────────────────────────────────

export interface TagsPanelProps {
  notebookTracker: INotebookTracker;
}

export const TagsPanel: React.FC<TagsPanelProps> = ({ notebookTracker }) => {

  const [customTags,  setCustomTags]  = useState<CustomTagDef[]>(loadCustomTags);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Create form state
  const [newValue, setNewValue]  = useState('');
  const [newDesc,  setNewDesc]   = useState('');
  const [newTopic, setNewTopic]  = useState('');
  const [newColor, setNewColor]  = useState(TAG_PALETTE[0]);
  const [nameErr,  setNameErr]   = useState('');

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
    const noop = () => { /* keep alive */ };
    notebookTracker.currentChanged.connect(noop);
    return () => { notebookTracker.currentChanged.disconnect(noop); };
  }, [notebookTracker]);

  // ── All built-in tag values (for duplicate check) ─────────────────────────
  const allBuiltInValues: string[] = ([] as string[]).concat(
    ...BUILT_IN_TAG_DEFS.map(g => g.tags.map(t => t.value))
  );

  // ── Create custom tag ──────────────────────────────────────────────────────
  const createTag = () => {
    const raw = newValue.trim().toLowerCase().replace(/\s+/g, '-');
    if (!raw) { setNameErr('Value is required.'); return; }
    if (!/^[a-z0-9][\w\-.]*$/.test(raw)) { setNameErr('Only a-z, 0-9, - or _ allowed.'); return; }
    if (allBuiltInValues.includes(raw)) { setNameErr('Already a built-in tag.'); return; }
    if (customTags.some(t => t.value === raw)) { setNameErr('Custom tag already exists.'); return; }
    const tag: CustomTagDef = { value: raw, topic: newTopic || undefined, description: newDesc.trim(), color: newColor };
    const updated = [...customTags, tag];
    setCustomTags(updated);
    saveCustomTagsToStorage(updated);
    setNewValue(''); setNewDesc(''); setNewTopic(''); setNewColor(TAG_PALETTE[0]); setNameErr('');
    setSelectedTag(raw);
  };

  // ── Delete custom tag ──────────────────────────────────────────────────────
  const deleteCustomTag = (tagValue: string) => {
    const updated = customTags.filter(t => t.value !== tagValue);
    setCustomTags(updated);
    saveCustomTagsToStorage(updated);
    if (selectedTag === tagValue) setSelectedTag(null);
  };

  // ── Derived for details panel ──────────────────────────────────────────────
  const isCustom                  = selectedTag ? customTags.some(t => t.value === selectedTag) : false;
  const selColor                  = selectedTag ? resolveColor(selectedTag, customTags) : TAG_PALETTE[0];
  const { description: selDesc, topic: selTopic } = selectedTag
    ? findMeta(selectedTag, customTags)
    : { description: '', topic: '' };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ds-tags-panel ds-tags-panel-v2">

      {/* ── Create Tag form ──────────────────────────────────────────────── */}
      <div className="ds-tp-create-section">
        <div className="ds-tp-create-header">New Tag</div>
        <input
          className="ds-tp-name-input"
          placeholder="tag-value"
          value={newValue}
          onChange={e => { setNewValue(e.target.value); setNameErr(''); }}
          onKeyDown={e => { if (e.key === 'Enter') createTag(); }}
        />
        <input
          className="ds-tp-desc-input"
          placeholder="Description (optional)"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') createTag(); }}
        />
        <select
          className="ds-tp-topic-select"
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
        >
          <option value="">Topic (optional)</option>
          {BUILT_IN_TOPICS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <ColorPicker value={newColor} onChange={setNewColor} />
        {nameErr && <p className="ds-tp-error">{nameErr}</p>}
        <button
          className="ds-tp-create-btn"
          onClick={createTag}
          disabled={!newValue.trim()}
        >+ Create</button>
      </div>

      {/* ── Body: tag list (left) + details (right) ──────────────────────── */}
      <div className="ds-tp-body">

        {/* LEFT — grouped tag library */}
        <div className="ds-tp-list">
          {customTags.length > 0 && (
            <div className="ds-tp-group">
              <div className="ds-tp-group-label">Custom</div>
              <div className="ds-tp-group-pills">
                {customTags.map(t => (
                  <TagPill
                    key={t.value}
                    tagValue={t.value}
                    color={t.color ?? tagColorAuto(t.value)}
                    selected={selectedTag === t.value}
                    onClick={() => setSelectedTag(t.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {BUILT_IN_TAG_DEFS.map(group => (
            <div key={group.category} className="ds-tp-group">
              <div className="ds-tp-group-label">{group.category}</div>
              <div className="ds-tp-group-pills">
                {group.tags.map(t => (
                  <TagPill
                    key={t.value}
                    tagValue={t.value}
                    color={tagColorAuto(t.value)}
                    selected={selectedTag === t.value}
                    onClick={() => setSelectedTag(t.value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — details panel */}
        <div className="ds-tp-details">
          {selectedTag ? (
            <>
              <span
                className="ds-tp-details-pill"
                style={{ '--pill-color': selColor } as React.CSSProperties}
              >{selectedTag}</span>

              <div className="ds-tp-details-color-row">
                <span className="ds-tp-details-swatch" style={{ background: selColor }} />
                <span className="ds-tp-details-hex">{selColor}</span>
              </div>

              <div className="ds-tp-details-json">
                <pre className="ds-tp-details-json-pre">{JSON.stringify(
                  { value: selectedTag, topic: selTopic || undefined, description: selDesc, color: selColor },
                  null, 2
                )}</pre>
              </div>

              {selDesc ? (
                <p className="ds-tp-details-desc">{selDesc}</p>
              ) : (
                <p className="ds-tp-details-desc ds-tp-details-desc--empty">No description.</p>
              )}

              {isCustom && (
                <button
                  className="ds-tp-details-del-btn"
                  onClick={() => deleteCustomTag(selectedTag)}
                  title="Delete this custom tag"
                >🗑 Delete</button>
              )}
            </>
          ) : (
            <p className="ds-tp-details-hint">← Select a tag</p>
          )}
        </div>
      </div>
    </div>
  );
};
