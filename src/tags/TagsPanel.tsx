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

export const BUILT_IN_TAG_DEFS: { category: string; tags: { name: string; description: string }[] }[] = [
  { category: 'ML Pipeline', tags: [
    { name: 'data-loading',        description: 'Cells that load data from files, databases, or APIs' },
    { name: 'preprocessing',       description: 'Data cleaning, normalization, and transformation steps' },
    { name: 'feature-engineering', description: 'Feature creation, selection, and encoding' },
    { name: 'training',            description: 'Model training and fitting' },
    { name: 'evaluation',          description: 'Metrics, validation, and model assessment' },
    { name: 'inference',           description: 'Prediction or scoring on new data' },
  ]},
  { category: 'Quality', tags: [
    { name: 'todo',           description: 'Cell needs attention or further work' },
    { name: 'reviewed',       description: 'Cell has been reviewed and approved' },
    { name: 'needs-refactor', description: 'Works but the implementation should be improved' },
    { name: 'slow',           description: 'Computationally slow — candidate for optimization' },
    { name: 'broken',         description: 'Cell is broken or produces errors' },
    { name: 'tested',         description: 'Cell has been verified to produce correct output' },
  ]},
  { category: 'Report', tags: [
    { name: 'report',         description: 'Output to include in an exported report' },
    { name: 'figure',         description: 'Cell that generates a figure or chart' },
    { name: 'table',          description: 'Cell that generates a table' },
    { name: 'key-finding',    description: 'Contains an important result or insight' },
    { name: 'report-exclude', description: 'Explicitly exclude from report output' },
  ]},
  { category: 'Status', tags: [
    { name: 'draft',       description: 'Work in progress — not finalized' },
    { name: 'stable',      description: 'Unlikely to change; safe dependency for other cells' },
    { name: 'deprecated',  description: 'No longer needed; kept for reference' },
    { name: 'sensitive',   description: 'Contains sensitive data, credentials, or PII' },
  ]},
];

// ── Custom tag store (localStorage) ──────────────────────────────────────────

const CUSTOM_TAGS_KEY = 'varys_custom_tag_definitions';

export interface CustomTagDef { name: string; description: string; color?: string }

export function loadCustomTags(): CustomTagDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_KEY);
    return raw ? (JSON.parse(raw) as CustomTagDef[]) : [];
  } catch { return []; }
}

function saveCustomTagsToStorage(tags: CustomTagDef[]): void {
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}

// resolve color: custom tags may have explicit color, else auto-hash
function resolveColor(tag: string, customTags: CustomTagDef[]): string {
  const custom = customTags.find(t => t.name === tag);
  return custom?.color ?? tagColorAuto(tag);
}

function findDescription(tag: string, customTags: CustomTagDef[]): string {
  const custom = customTags.find(t => t.name === tag);
  if (custom) return custom.description;
  for (const group of BUILT_IN_TAG_DEFS) {
    const found = group.tags.find(t => t.name === tag);
    if (found) return found.description;
  }
  return '';
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export interface TagsPanelProps {
  notebookTracker: INotebookTracker;
}

export const TagsPanel: React.FC<TagsPanelProps> = ({ notebookTracker }) => {

  // ── State ──────────────────────────────────────────────────────────────────
  const [nbTagCounts, setNbTagCounts] = useState<Map<string, number>>(new Map());
  const [customTags,  setCustomTags]  = useState<CustomTagDef[]>(loadCustomTags);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Create form
  const [newName,  setNewName]  = useState('');
  const [newDesc,  setNewDesc]  = useState('');
  const [newColor, setNewColor] = useState(TAG_PALETTE[0]);
  const [nameErr,  setNameErr]  = useState('');

  // ── Notebook scan ──────────────────────────────────────────────────────────
  const refreshNb = useCallback(() => {
    const nb = notebookTracker.currentWidget?.content;
    if (!nb?.model) { setNbTagCounts(new Map()); return; }
    const counts = new Map<string, number>();
    for (let i = 0; i < nb.model.cells.length; i++) {
      const tags = (nb.model.cells.get(i).metadata['tags'] as string[] | undefined) ?? [];
      tags.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1));
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
  const allBuiltInNames: string[] = ([] as string[]).concat(
    ...BUILT_IN_TAG_DEFS.map(g => g.tags.map(t => t.name))
  );

  const createTag = () => {
    const raw = newName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!raw) { setNameErr('Name is required.'); return; }
    if (!/^[a-z0-9][\w\-.]*$/.test(raw)) { setNameErr('Only a-z, 0-9, - or _ allowed.'); return; }
    if (allBuiltInNames.includes(raw)) { setNameErr('Already a built-in tag.'); return; }
    if (customTags.some(t => t.name === raw)) { setNameErr('Custom tag already exists.'); return; }
    const updated = [...customTags, { name: raw, description: newDesc.trim(), color: newColor }];
    setCustomTags(updated);
    saveCustomTagsToStorage(updated);
    setNewName(''); setNewDesc(''); setNewColor(TAG_PALETTE[0]); setNameErr('');
    setSelectedTag(raw);
  };

  // ── Delete custom tag ──────────────────────────────────────────────────────
  const deleteCustomTag = (name: string) => {
    const updated = customTags.filter(t => t.name !== name);
    setCustomTags(updated);
    saveCustomTagsToStorage(updated);
    if (selectedTag === name) setSelectedTag(null);
  };

  // ── Jump to next cell with this tag ───────────────────────────────────────
  const jumpToTag = (tag: string) => {
    const nb = notebookTracker.currentWidget?.content;
    if (!nb?.model) return;
    const total = nb.model.cells.length;
    const start = nb.activeCellIndex ?? 0;
    for (let off = 1; off <= total; off++) {
      const idx  = (start + off) % total;
      const tags = (nb.model.cells.get(idx).metadata['tags'] as string[] | undefined) ?? [];
      if (tags.includes(tag)) {
        nb.activeCellIndex = idx;
        nb.widgets[idx]?.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasNotebook   = !!notebookTracker.currentWidget;
  const isCustom      = selectedTag ? customTags.some(t => t.name === selectedTag) : false;
  const selColor      = selectedTag ? resolveColor(selectedTag, customTags) : TAG_PALETTE[0];
  const selDesc       = selectedTag ? findDescription(selectedTag, customTags) : '';
  const selCount      = selectedTag ? (nbTagCounts.get(selectedTag) ?? 0) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ds-tags-panel ds-tags-panel-v2">

      {/* ── Create Tag form ──────────────────────────────────────────────── */}
      <div className="ds-tp-create-section">
        <div className="ds-tp-create-header">New Tag</div>
        <div className="ds-tp-create-row1">
          <input
            className="ds-tp-name-input"
            placeholder="tag-name"
            value={newName}
            onChange={e => { setNewName(e.target.value); setNameErr(''); }}
            onKeyDown={e => { if (e.key === 'Enter') createTag(); }}
          />
          <button
            className="ds-tp-create-btn"
            onClick={createTag}
            disabled={!newName.trim()}
          >+ Create</button>
        </div>
        <ColorPicker value={newColor} onChange={setNewColor} />
        <input
          className="ds-tp-desc-input"
          placeholder="Description (optional)"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') createTag(); }}
        />
        {nameErr && <p className="ds-tp-error">{nameErr}</p>}
      </div>

      {!hasNotebook && <p className="ds-tags-empty">No notebook open.</p>}

      {/* ── Body: specs (left) + tag list (right) ───────────────────────── */}
      {hasNotebook && (
        <div className="ds-tp-body">

          {/* LEFT — specs panel */}
          <div className="ds-tp-specs">
            {selectedTag ? (
              <>
                <span
                  className="ds-tp-specs-pill"
                  style={{ '--pill-color': selColor } as React.CSSProperties}
                >{selectedTag}</span>

                <div className="ds-tp-specs-color-row">
                  <span className="ds-tp-specs-swatch" style={{ background: selColor }} />
                  <span className="ds-tp-specs-hex">{selColor}</span>
                </div>

                <p className="ds-tp-specs-desc">
                  {selDesc || <em className="ds-tp-specs-desc-empty">No description</em>}
                </p>

                <div className="ds-tp-specs-usage">
                  {selCount > 0 ? (
                    <>
                      <span className="ds-tp-specs-count">{selCount} cell{selCount !== 1 ? 's' : ''}</span>
                      <button
                        className="ds-tp-specs-jump-btn"
                        onClick={() => jumpToTag(selectedTag)}
                        title="Jump to next cell with this tag"
                      >→ Jump</button>
                    </>
                  ) : (
                    <span className="ds-tp-specs-unused">Not used in notebook</span>
                  )}
                </div>

                {isCustom && (
                  <button
                    className="ds-tp-specs-del-btn"
                    onClick={() => deleteCustomTag(selectedTag)}
                    title="Delete this custom tag"
                  >🗑 Delete</button>
                )}
              </>
            ) : (
              <p className="ds-tp-specs-hint">Select a tag<br />to see its specs</p>
            )}
          </div>

          {/* RIGHT — tag library grouped by topic */}
          <div className="ds-tp-list">

            {/* Custom tags */}
            {customTags.length > 0 && (
              <div className="ds-tp-group">
                <div className="ds-tp-group-label">Custom</div>
                <div className="ds-tp-group-pills">
                  {customTags.map(t => (
                    <TagPill
                      key={t.name}
                      name={t.name}
                      color={t.color ?? tagColorAuto(t.name)}
                      count={nbTagCounts.get(t.name)}
                      selected={selectedTag === t.name}
                      onClick={() => setSelectedTag(t.name)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Built-in groups */}
            {BUILT_IN_TAG_DEFS.map(group => (
              <div key={group.category} className="ds-tp-group">
                <div className="ds-tp-group-label">{group.category}</div>
                <div className="ds-tp-group-pills">
                  {group.tags.map(t => (
                    <TagPill
                      key={t.name}
                      name={t.name}
                      color={tagColorAuto(t.name)}
                      count={nbTagCounts.get(t.name)}
                      selected={selectedTag === t.name}
                      onClick={() => setSelectedTag(t.name)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── TagPill ───────────────────────────────────────────────────────────────────

const TagPill: React.FC<{
  name: string; color: string; count?: number;
  selected: boolean; onClick: () => void;
}> = ({ name, color, count, selected, onClick }) => (
  <button
    className={`ds-tp-pill${selected ? ' ds-tp-pill--selected' : ''}`}
    style={{ '--pill-color': color } as React.CSSProperties}
    onClick={onClick}
    title={name}
  >
    {name}
    {count !== undefined && count > 0 && (
      <span className="ds-tp-pill-count">{count}</span>
    )}
  </button>
);
