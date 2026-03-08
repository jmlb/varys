/**
 * Cell Tag & Position Overlay
 *
 * Injects a thin bar at the top of every notebook cell that shows:
 *   • LEFT  — coloured tag pills + a [+] button to add tags inline
 *   • RIGHT — a small "#N" position badge (always, on every cell)
 *
 * Clicking a tag pill enters "delete mode" — the pill expands to show an ×
 * button. Clicking × removes the tag from cell metadata and re-renders.
 *
 * Clicking [+] opens a floating dropdown with:
 *   • A text input to type/create a new custom tag
 *   • Tags already used elsewhere in the notebook (quick-add)
 *   • Built-in preset groups (ML Pipeline, Quality, Report, Status)
 *   Only tags NOT already applied to the cell are shown.
 *
 * Re-renders are suppressed while the dropdown or a pending-delete pill is
 * open so the user can interact without the DOM being destroyed under them.
 */
import { INotebookTracker } from '@jupyterlab/notebook';
/**
 * Initialise the cell tag + position overlay system.
 * Call once from the main plugin activate() function.
 * Returns a cleanup function.
 */
export declare function initCellTagOverlay(tracker: INotebookTracker): () => void;
//# sourceMappingURL=cellTagOverlay.d.ts.map