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
import React from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
export interface TagsPanelProps {
    notebookTracker: INotebookTracker;
}
export declare const TagsPanel: React.FC<TagsPanelProps>;
