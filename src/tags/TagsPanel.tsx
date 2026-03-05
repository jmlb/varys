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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';

// ── Tag colour helpers ────────────────────────────────────────────────────────

const TAG_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
];

function tagColor(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface TagChipProps {
  tag: string;
  onRemove?: () => void;
  onClick?: () => void;
  count?: number;
}

const TagChip: React.FC<TagChipProps> = ({ tag, onRemove, onClick, count }) => (
  <span
    className="ds-tag-chip"
    style={{ '--tag-color': tagColor(tag) } as React.CSSProperties}
    onClick={onClick}
    title={onClick ? `Jump to next cell tagged "${tag}"` : tag}
  >
    {tag}
    {count !== undefined && <span className="ds-tag-chip-count">{count}</span>}
    {onRemove && (
      <button
        className="ds-tag-chip-remove"
        onClick={e => { e.stopPropagation(); onRemove(); }}
        title="Remove tag"
      >×</button>
    )}
  </span>
);

// ── Main component ────────────────────────────────────────────────────────────

interface TaggedCellInfo {
  index:    number;
  execCount: number | null;
  tags:     string[];
  preview:  string;   // first 60 chars of cell source
  type:     string;
}

export interface TagsPanelProps {
  notebookTracker: INotebookTracker;
}

export const TagsPanel: React.FC<TagsPanelProps> = ({ notebookTracker }) => {
  const [activeTags, setActiveTags]           = useState<string[]>([]);
  const [customMeta, setCustomMeta]           = useState('{}');
  const [metaError, setMetaError]             = useState('');
  const [metaSaved, setMetaSaved]             = useState(false);
  const [newTag, setNewTag]                   = useState('');
  const [tagError, setTagError]               = useState('');
  const [allTags, setAllTags]                 = useState<Map<string, number>>(new Map());
  const [taggedCells, setTaggedCells]         = useState<TaggedCellInfo[]>([]);
  const [activeCellIdx, setActiveCellIdx]     = useState<number>(-1);
  const [filterText, setFilterText]           = useState('');
  const [section, setSection]                 = useState<'cell' | 'notebook'>('cell');
  const activeCellRef = useRef<Cell | null>(null);

  // ── Read notebook ───────────────────────────────────────────────────────────

  const refreshNotebook = useCallback(() => {
    const nb = notebookTracker.currentWidget?.content;
    if (!nb?.model) {
      setAllTags(new Map());
      setTaggedCells([]);
      return;
    }
    const counts  = new Map<string, number>();
    const cells: TaggedCellInfo[] = [];

    for (let i = 0; i < nb.model.cells.length; i++) {
      const cm   = nb.model.cells.get(i);
      const tags = (cm.metadata['tags'] as string[] | undefined) ?? [];
      if (tags.length > 0) {
        for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
        const src = cm.sharedModel.source;
        cells.push({
          index:     i,
          execCount: (cm as any).executionCount ?? null,
          tags,
          preview:   src.slice(0, 70).replace(/\n/g, ' ') + (src.length > 70 ? '…' : ''),
          type:      cm.type,
        });
      }
    }
    setAllTags(counts);
    setTaggedCells(cells);
  }, [notebookTracker]);

  // ── Read active cell ────────────────────────────────────────────────────────

  const refreshActiveCell = useCallback(() => {
    const nb   = notebookTracker.currentWidget?.content;
    const cell = nb?.activeCell ?? null;
    activeCellRef.current = cell;
    setActiveCellIdx(nb?.activeCellIndex ?? -1);

    if (!cell) {
      setActiveTags([]);
      setCustomMeta('{}');
      return;
    }
    const meta  = cell.model.metadata;
    const tags  = (meta['tags'] as string[] | undefined) ?? [];
    setActiveTags([...tags]);

    // Build custom metadata dict (everything except 'tags')
    const custom: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meta)) {
      if (k !== 'tags') custom[k] = v;
    }
    setCustomMeta(JSON.stringify(custom, null, 2));
    setMetaError('');
    setMetaSaved(false);
  }, [notebookTracker]);

  const refresh = useCallback(() => {
    refreshActiveCell();
    refreshNotebook();
  }, [refreshActiveCell, refreshNotebook]);

  // ── Subscriptions ───────────────────────────────────────────────────────────

  useEffect(() => {
    notebookTracker.activeCellChanged.connect(refresh);
    notebookTracker.currentChanged.connect(refresh);
    refresh();
    return () => {
      notebookTracker.activeCellChanged.disconnect(refresh);
      notebookTracker.currentChanged.disconnect(refresh);
    };
  }, [notebookTracker, refresh]);

  // ── Tag mutations ───────────────────────────────────────────────────────────

  const applyTags = (tags: string[]) => {
    const cell = activeCellRef.current;
    if (!cell) return;
    if (tags.length > 0) {
      cell.model.setMetadata('tags', tags);
    } else {
      // Remove key entirely when empty
      const meta = { ...cell.model.metadata };
      delete meta['tags'];
      // JupyterLab 4.x: iterate keys and remove
      for (const k of Object.keys(cell.model.metadata)) {
        if (k !== 'tags') continue;
        (cell.model as any).deleteMetadata?.('tags')
          ?? cell.model.setMetadata('tags', undefined as any);
      }
    }
    setActiveTags([...tags]);
    refreshNotebook();
  };

  const addTag = () => {
    const raw = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!raw) return;
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

  const removeTag = (tag: string) => {
    applyTags(activeTags.filter(t => t !== tag));
  };

  const saveCustomMeta = () => {
    const cell = activeCellRef.current;
    if (!cell) return;
    try {
      const obj = JSON.parse(customMeta) as Record<string, unknown>;
      for (const [k, v] of Object.entries(obj)) {
        cell.model.setMetadata(k, v);
      }
      setMetaError('');
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 2000);
    } catch {
      setMetaError('Invalid JSON — check syntax');
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const jumpToTag = (tag: string) => {
    const nb = notebookTracker.currentWidget?.content;
    if (!nb?.model) return;
    const total = nb.model.cells.length;
    const start = nb.activeCellIndex;
    for (let offset = 1; offset <= total; offset++) {
      const idx  = (start + offset) % total;
      const tags = (nb.model.cells.get(idx).metadata['tags'] as string[] | undefined) ?? [];
      if (tags.includes(tag)) {
        nb.activeCellIndex = idx;
        // scroll into view
        const cellWidget = nb.widgets[idx];
        cellWidget?.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }
  };

  const jumpToCell = (index: number) => {
    const nb = notebookTracker.currentWidget?.content;
    if (!nb) return;
    nb.activeCellIndex = index;
    nb.widgets[index]?.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const hasNotebook = !!notebookTracker.currentWidget;
  const filteredTags = [...allTags.entries()].filter(
    ([t]) => !filterText || t.includes(filterText.toLowerCase())
  ).sort((a, b) => b[1] - a[1]);            // sort by count desc

  const cellRef = activeCellIdx >= 0
    ? `#${activeCellIdx + 1}`
    : '—';

  return (
    <div className="ds-tags-panel">

      {/* ── Section switcher ──────────────────────────────────────────────── */}
      <div className="ds-tags-section-bar">
        <button
          className={`ds-tags-section-btn${section === 'cell' ? ' active' : ''}`}
          onClick={() => setSection('cell')}
        >Active Cell</button>
        <button
          className={`ds-tags-section-btn${section === 'notebook' ? ' active' : ''}`}
          onClick={() => setSection('notebook')}
        >Notebook ({allTags.size} tag{allTags.size !== 1 ? 's' : ''})</button>
        <button className="ds-tags-refresh-btn" onClick={refresh} title="Refresh">↻</button>
      </div>

      {!hasNotebook && (
        <p className="ds-tags-empty">No notebook open.</p>
      )}

      {/* ══════════════ ACTIVE CELL SECTION ════════════════════════════════ */}
      {hasNotebook && section === 'cell' && (
        <div className="ds-tags-cell-section">
          <div className="ds-tags-cell-ref">
            {cellRef}
            {activeTags.length === 0 && (
              <span className="ds-tags-cell-ref-hint">no tags</span>
            )}
          </div>

          {/* Current tags */}
          {activeTags.length > 0 && (
            <div className="ds-tags-chips-row">
              {activeTags.map(t => (
                <TagChip key={t} tag={t} onRemove={() => removeTag(t)} />
              ))}
            </div>
          )}

          {/* Add tag */}
          <div className="ds-tags-add-row">
            <input
              className="ds-tags-input"
              placeholder="new-tag"
              value={newTag}
              onChange={e => { setNewTag(e.target.value); setTagError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
              disabled={!activeCellRef.current}
            />
            <button
              className="ds-tags-add-btn"
              onClick={addTag}
              disabled={!activeCellRef.current || !newTag.trim()}
            >+ Add</button>
          </div>
          {tagError && <p className="ds-tags-error">{tagError}</p>}

          {/* Quick-pick from existing notebook tags */}
          {allTags.size > 0 && (
            <div className="ds-tags-quickpick">
              <span className="ds-tags-quickpick-label">Quick-add:</span>
              {[...allTags.keys()].filter(t => !activeTags.includes(t)).map(t => (
                <button
                  key={t}
                  className="ds-tags-quickpick-btn"
                  style={{ '--tag-color': tagColor(t) } as React.CSSProperties}
                  onClick={() => { applyTags([...activeTags, t]); }}
                >{t}</button>
              ))}
            </div>
          )}

          {/* ── Custom metadata JSON editor ─────────────────────────────── */}
          <div className="ds-tags-meta-section">
            <div className="ds-tags-meta-header">
              <span>Custom metadata</span>
              <button
                className="ds-tags-meta-save-btn"
                onClick={saveCustomMeta}
                disabled={!activeCellRef.current}
              >{metaSaved ? '✓ Saved' : 'Save'}</button>
            </div>
            <textarea
              className={`ds-tags-meta-editor${metaError ? ' ds-tags-meta-error' : ''}`}
              value={customMeta}
              onChange={e => { setCustomMeta(e.target.value); setMetaError(''); setMetaSaved(false); }}
              rows={6}
              spellCheck={false}
              disabled={!activeCellRef.current}
              placeholder='{}'
            />
            {metaError && <p className="ds-tags-error">{metaError}</p>}
            <p className="ds-tags-meta-hint">
              JSON key/value pairs saved to cell metadata. Reserved key <code>tags</code> is managed above.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════ NOTEBOOK OVERVIEW SECTION ═══════════════════════════ */}
      {hasNotebook && section === 'notebook' && (
        <div className="ds-tags-notebook-section">

          {allTags.size === 0 && (
            <p className="ds-tags-empty">No tagged cells in this notebook yet.</p>
          )}

          {allTags.size > 0 && (
            <>
              {/* Tag cloud / filter */}
              <div className="ds-tags-filter-row">
                <input
                  className="ds-tags-filter-input"
                  placeholder="Filter tags…"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                />
              </div>

              <div className="ds-tags-cloud">
                {filteredTags.map(([tag, count]) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    count={count}
                    onClick={() => jumpToTag(tag)}
                  />
                ))}
              </div>

              <div className="ds-tags-divider" />

              {/* Tagged cells list */}
              <div className="ds-tags-cells-list">
                {taggedCells
                  .filter(c =>
                    !filterText ||
                    c.tags.some(t => t.includes(filterText.toLowerCase()))
                  )
                  .map(c => {
                    const ref = `#${c.index + 1}`;
                    return (
                      <div
                        key={c.index}
                        className="ds-tags-cell-row"
                        onClick={() => jumpToCell(c.index)}
                        title={`Go to ${ref}`}
                      >
                        <div className="ds-tags-cell-row-header">
                          <span className="ds-tags-cell-row-ref">{ref}</span>
                          <span className="ds-tags-cell-row-type">{c.type}</span>
                        </div>
                        <div className="ds-tags-cell-row-preview">{c.preview}</div>
                        <div className="ds-tags-cell-row-tags">
                          {c.tags.map(t => (
                            <TagChip key={t} tag={t} onClick={() => jumpToTag(t)} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
