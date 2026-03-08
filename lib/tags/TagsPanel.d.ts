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
import React from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
export declare const TAG_PALETTE: string[];
export declare function tagColorAuto(tag: string): string;
export declare const BUILT_IN_TAG_DEFS: {
    category: string;
    tags: {
        value: string;
        description: string;
    }[];
}[];
/** Tag JSON shape: { "value": string, "description": string, "color"?: string } */
export interface CustomTagDef {
    value: string;
    description: string;
    color?: string;
}
export declare function loadCustomTags(): CustomTagDef[];
export interface TagsPanelProps {
    notebookTracker: INotebookTracker;
}
export declare const TagsPanel: React.FC<TagsPanelProps>;
//# sourceMappingURL=TagsPanel.d.ts.map