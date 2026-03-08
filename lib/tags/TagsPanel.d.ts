/**
 * Tags Panel — redesigned
 *
 * Layout:
 *   1. Create Tag form  (name · color picker · description · [+ Create])
 *   2. Two-column body:
 *        LEFT  — Specs panel: details of the currently selected tag
 *        RIGHT — Tag library: all tags grouped by topic, click to select
 */
import React from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
export declare const TAG_PALETTE: string[];
export declare function tagColorAuto(tag: string): string;
export declare const BUILT_IN_TAG_DEFS: {
    category: string;
    tags: {
        name: string;
        description: string;
    }[];
}[];
export interface CustomTagDef {
    name: string;
    description: string;
    color?: string;
}
export declare function loadCustomTags(): CustomTagDef[];
export interface TagsPanelProps {
    notebookTracker: INotebookTracker;
}
export declare const TagsPanel: React.FC<TagsPanelProps>;
//# sourceMappingURL=TagsPanel.d.ts.map