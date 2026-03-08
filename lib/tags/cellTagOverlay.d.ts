/**
 * Cell Tag & Position Overlay
 *
 * Injects a thin bar at the top of every notebook cell that shows:
 *   • LEFT  — coloured tag pills (only when the cell carries tags)
 *   • RIGHT — a small "#N" position badge (always, on every cell)
 *
 * Clicking a tag pill enters "delete mode" — the pill expands to show an ×
 * button. Clicking × removes the tag from cell metadata and re-renders.
 * Clicking anywhere else dismisses delete mode.
 *
 * The position number reflects the cell's 1-based index in the notebook and
 * updates automatically whenever:
 *   • The active cell or notebook changes
 *   • Cells are inserted, deleted, or moved (model.cells.changed signal)
 *   • A periodic 1.5 s fallback fires (catches metadata edits in the panel)
 */
import { INotebookTracker } from '@jupyterlab/notebook';
/**
 * Initialise the cell tag + position overlay system.
 * Call once from the main plugin activate() function.
 * Returns a cleanup function.
 */
export declare function initCellTagOverlay(tracker: INotebookTracker): () => void;
//# sourceMappingURL=cellTagOverlay.d.ts.map