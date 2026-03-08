/**
 * NotebookReader - Extracts full context from the active JupyterLab notebook.
 */
import { INotebookTracker } from '@jupyterlab/notebook';
import { CellInfo, NotebookContext, DataFrameSchema } from '../api/client';
export declare class NotebookReader {
    private tracker;
    /**
     * Cache for DataFrame schemas.  Invalidated whenever the max execution
     * count across all cells changes (i.e. after any cell is run).
     */
    private _dfCache;
    constructor(tracker: INotebookTracker);
    /**
     * Returns the full context of the currently active notebook.
     * Returns null if no notebook is open.
     */
    getFullContext(): NotebookContext | null;
    private _extractContext;
    /**
     * Returns the text currently selected by the user in the active code cell,
     * or null when there is no meaningful selection (cursor only / empty).
     */
    private _getSelection;
    /**
     * Extracts a full (untruncated) plain-text representation of a code cell's
     * outputs.  Used for the focal cell's focalCellOutput payload field — the
     * backend assembler injects this verbatim rather than the stored summary.
     */
    private _extractFullOutput;
    /**
     * Extracts a plain-text representation of a code cell's outputs.
     * Handles: execute_result, display_data, stream (stdout/stderr), error.
     * Caps at 2000 chars to keep context size reasonable.
     */
    private _extractOutput;
    private _extractOutputImpl;
    /**
     * Extracts the first image/png output from a code cell, returned as a
     * base64 string (no data-URI prefix).  Returns null if no image present.
     */
    private _extractImage;
    /**
     * Executes a Python snippet in the live kernel to collect the schema
     * (shape, column names, dtypes, 3-row sample) for every pandas DataFrame
     * currently in the kernel namespace.
     *
     * Returns an empty array when:
     *  - No notebook is open
     *  - The kernel is not running
     *  - pandas is not installed
     *  - Any other error occurs (silent failure)
     *
     * Results are cached until the max execution count changes, so repeated
     * calls within the same execution cycle are essentially free.
     */
    getDataFrameSchemas(): Promise<DataFrameSchema[]>;
    /**
     * Computes a cache-key from the current max execution count across all
     * cells.  Changes as soon as any cell is executed.
     */
    private _executionCountKey;
    /**
     * Runs the DataFrame inspection snippet in the kernel and parses the JSON
     * written to stdout.
     */
    private _inspectKernel;
    /**
     * Returns a single cell by index, or null if out of bounds.
     */
    getCell(index: number): CellInfo | null;
    /**
     * Returns an inclusive slice of cells from start to end.
     */
    getCellRange(start: number, end: number): CellInfo[];
    /**
     * Finds cells whose source matches the given regex pattern.
     */
    findCells(pattern: RegExp): CellInfo[];
    /**
     * Returns the index of the currently active cell in the notebook.
     */
    getCurrentCellIndex(): number;
}
//# sourceMappingURL=NotebookReader.d.ts.map