/**
 * NotebookReader - Extracts full context from the active JupyterLab notebook.
 */
/**
 * Maximum characters captured from each cell's output before truncation.
 * Must match CELL_CONTENT_LIMIT in varys/llm/context_utils.py
 * so the backend and frontend agree on the same cap.
 */
const CELL_OUTPUT_MAX_CHARS = 2000;
/**
 * Python snippet executed in the live kernel to collect DataFrame schemas.
 * Uses only stdlib + pandas (already present in any DS environment).
 * All output is a single JSON object printed to stdout.
 *
 * Design notes:
 *  - Prefixes all private names with _dsctx_ to avoid polluting user namespace
 *  - Caps at 15 DataFrames to prevent token bloat
 *  - Serialises non-JSON-native values (np types, Timestamps) to str
 *  - Completely silent on errors — returns {} if anything goes wrong
 */
const DATAFRAME_INSPECTION_CODE = `
import json as _dsctx_json
_dsctx_result = {}
try:
    import pandas as _dsctx_pd
    _dsctx_ns = get_ipython().user_ns
    _dsctx_count = 0
    for _dsctx_name, _dsctx_val in list(_dsctx_ns.items()):
        if _dsctx_name.startswith('_') or not isinstance(_dsctx_val, _dsctx_pd.DataFrame):
            continue
        if _dsctx_count >= 15:
            break
        _dsctx_count += 1
        try:
            _dsctx_sample = []
            for _dsctx_row in _dsctx_val.head(3).to_dict('records'):
                _dsctx_clean = {}
                for _dsctx_k, _dsctx_v in _dsctx_row.items():
                    _dsctx_k_s = str(_dsctx_k)
                    if isinstance(_dsctx_v, (int, float, str, bool, type(None))):
                        _dsctx_clean[_dsctx_k_s] = _dsctx_v
                    elif hasattr(_dsctx_v, 'item'):
                        try:
                            _dsctx_clean[_dsctx_k_s] = _dsctx_v.item()
                        except Exception:
                            _dsctx_clean[_dsctx_k_s] = str(_dsctx_v)
                    else:
                        _dsctx_clean[_dsctx_k_s] = str(_dsctx_v)
                _dsctx_sample.append(_dsctx_clean)
            _dsctx_result[_dsctx_name] = {
                'shape': list(_dsctx_val.shape),
                'columns': [str(_c) for _c in _dsctx_val.columns.tolist()],
                'dtypes': {str(_c): str(_t) for _c, _t in _dsctx_val.dtypes.items()},
                'sample': _dsctx_sample,
                'memory_mb': round(_dsctx_val.memory_usage(deep=True).sum() / 1024**2, 2)
            }
        except Exception:
            pass
except Exception:
    pass
print(_dsctx_json.dumps(_dsctx_result))
`.trim();
export class NotebookReader {
    constructor(tracker) {
        /**
         * Cache for DataFrame schemas.  Invalidated whenever the max execution
         * count across all cells changes (i.e. after any cell is run).
         */
        this._dfCache = null;
        this.tracker = tracker;
    }
    /**
     * Returns the full context of the currently active notebook.
     * Returns null if no notebook is open.
     */
    getFullContext() {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return null;
        }
        return this._extractContext(panel);
    }
    _extractContext(panel) {
        var _a, _b, _c;
        const notebook = panel.content;
        const activeCellIndex = notebook.activeCellIndex;
        const cells = [];
        notebook.widgets.forEach((cell, index) => {
            var _a;
            const model = cell.model;
            cells.push({
                index,
                type: model.type,
                source: model.sharedModel.getSource(),
                executionCount: model.type === 'code'
                    ? (_a = model.executionCount) !== null && _a !== void 0 ? _a : null
                    : null,
                output: model.type === 'code' ? this._extractOutput(model) : null,
                imageOutput: model.type === 'code' ? this._extractImage(model) : null
            });
        });
        return {
            cells,
            activeCellIndex,
            notebookPath: panel.context.path,
            kernelName: (_c = (_b = (_a = panel.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : undefined,
            selection: this._getSelection(panel)
        };
    }
    /**
     * Returns the text currently selected by the user in the active code cell,
     * or null when there is no meaningful selection (cursor only / empty).
     */
    _getSelection(panel) {
        const notebook = panel.content;
        const activeCell = notebook.activeCell;
        if (!activeCell) {
            return null;
        }
        const editor = activeCell.editor;
        if (!editor) {
            return null;
        }
        const selection = editor.getSelection();
        const { start, end } = selection;
        // A cursor position (no text selected) has start === end
        if (start.line === end.line && start.column === end.column) {
            return null;
        }
        const source = activeCell.model.sharedModel.getSource();
        const lines = source.split('\n');
        // Extract the selected lines (inclusive)
        const selectedLines = lines.slice(start.line, end.line + 1);
        // Trim partial first/last lines to the exact column boundaries
        if (selectedLines.length > 0) {
            selectedLines[selectedLines.length - 1] = selectedLines[selectedLines.length - 1].slice(0, end.column);
            selectedLines[0] = selectedLines[0].slice(start.column);
        }
        const text = selectedLines.join('\n');
        if (!text.trim()) {
            return null;
        }
        return {
            cellIndex: notebook.activeCellIndex,
            text,
            startLine: start.line,
            endLine: end.line
        };
    }
    /**
     * Extracts a plain-text representation of a code cell's outputs.
     * Handles: execute_result, display_data, stream (stdout/stderr), error.
     * Caps at 2000 chars to keep context size reasonable.
     */
    _extractOutput(model) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const outputs = model.outputs;
        if (!outputs || outputs.length === 0) {
            return null;
        }
        // Non-error outputs and error outputs are budgeted separately so a
        // long traceback is never silently dropped when stdout fills the limit.
        const regularParts = [];
        const errorParts = [];
        for (let i = 0; i < outputs.length; i++) {
            const output = outputs.get ? outputs.get(i) : outputs[i];
            if (!output)
                continue;
            // JupyterLab wraps raw nbformat dicts in IOutputModel objects.
            // ename / evalue / traceback are NOT direct properties on the model —
            // toJSON() returns the underlying nbformat dict with all fields intact.
            const raw = typeof output.toJSON === 'function' ? output.toJSON() : output;
            const outputType = (_d = (_c = (_b = (_a = raw.output_type) !== null && _a !== void 0 ? _a : raw.type) !== null && _b !== void 0 ? _b : output.output_type) !== null && _c !== void 0 ? _c : output.type) !== null && _d !== void 0 ? _d : '';
            if (outputType === 'stream') {
                const text = (_f = (_e = raw.text) !== null && _e !== void 0 ? _e : output.text) !== null && _f !== void 0 ? _f : '';
                const content = Array.isArray(text) ? text.join('') : String(text);
                if (content.trim())
                    regularParts.push(content.trim());
            }
            else if (outputType === 'execute_result' || outputType === 'display_data') {
                const data = (_h = (_g = raw.data) !== null && _g !== void 0 ? _g : output.data) !== null && _h !== void 0 ? _h : {};
                const plain = (_j = data['text/plain']) !== null && _j !== void 0 ? _j : '';
                const content = Array.isArray(plain) ? plain.join('') : String(plain);
                if (content.trim())
                    regularParts.push(content.trim());
            }
            else if (outputType === 'error') {
                const ename = (_l = (_k = raw.ename) !== null && _k !== void 0 ? _k : output.ename) !== null && _l !== void 0 ? _l : 'Error';
                const evalue = (_o = (_m = raw.evalue) !== null && _m !== void 0 ? _m : output.evalue) !== null && _o !== void 0 ? _o : '';
                const rawTb = (_p = raw.traceback) !== null && _p !== void 0 ? _p : output.traceback;
                if (rawTb && Array.isArray(rawTb) && rawTb.length > 0) {
                    // eslint-disable-next-line no-control-regex
                    const tbClean = rawTb.join('\n').replace(/\x1b\[[0-9;]*m/g, '');
                    errorParts.push(`${ename}: ${evalue}\n${tbClean}`);
                }
                else {
                    errorParts.push(`${ename}: ${evalue}`);
                }
            }
        }
        if (regularParts.length === 0 && errorParts.length === 0)
            return null;
        const regularText = regularParts.join('\n');
        const errorText = errorParts.join('\n');
        const cappedRegular = regularText.length > CELL_OUTPUT_MAX_CHARS
            ? regularText.slice(0, CELL_OUTPUT_MAX_CHARS) + '\n[...output truncated]'
            : regularText;
        const cappedError = errorText.length > CELL_OUTPUT_MAX_CHARS
            ? errorText.slice(0, CELL_OUTPUT_MAX_CHARS) + '\n[...traceback truncated]'
            : errorText;
        return [cappedRegular, cappedError].filter(s => s.trim()).join('\n') || null;
    }
    /**
     * Extracts the first image/png output from a code cell, returned as a
     * base64 string (no data-URI prefix).  Returns null if no image present.
     */
    _extractImage(model) {
        var _a;
        const outputs = model.outputs;
        if (!outputs || outputs.length === 0)
            return null;
        for (let i = 0; i < outputs.length; i++) {
            const output = outputs.get ? outputs.get(i) : outputs[i];
            if (!output)
                continue;
            const data = (_a = output.data) !== null && _a !== void 0 ? _a : {};
            const png = data['image/png'];
            if (png) {
                // Strip data URI prefix if present, return raw base64
                const raw = Array.isArray(png) ? png.join('') : String(png);
                return raw.replace(/^data:image\/png;base64,/, '').trim();
            }
        }
        return null;
    }
    // ─────────────────────────────────────────────────────────────
    // DataFrame schema detection (live kernel inspection)
    // ─────────────────────────────────────────────────────────────
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
    async getDataFrameSchemas() {
        var _a;
        const panel = this.tracker.currentWidget;
        if (!panel)
            return [];
        const kernel = (_a = panel.sessionContext.session) === null || _a === void 0 ? void 0 : _a.kernel;
        if (!kernel)
            return [];
        const cacheKey = this._executionCountKey(panel);
        if (this._dfCache && this._dfCache.key === cacheKey) {
            return this._dfCache.schemas;
        }
        try {
            const schemas = await this._inspectKernel(kernel);
            this._dfCache = { key: cacheKey, schemas };
            return schemas;
        }
        catch (_b) {
            // Never crash the chat flow due to schema detection failure
            return [];
        }
    }
    /**
     * Computes a cache-key from the current max execution count across all
     * cells.  Changes as soon as any cell is executed.
     */
    _executionCountKey(panel) {
        return panel.content.widgets.reduce((max, cell) => {
            var _a;
            const ec = (_a = cell.model.executionCount) !== null && _a !== void 0 ? _a : 0;
            return Math.max(max, typeof ec === 'number' ? ec : 0);
        }, 0);
    }
    /**
     * Runs the DataFrame inspection snippet in the kernel and parses the JSON
     * written to stdout.
     */
    _inspectKernel(kernel) {
        return new Promise((resolve, reject) => {
            let stdout = '';
            const future = kernel.requestExecute({
                code: DATAFRAME_INSPECTION_CODE,
                silent: true,
                store_history: false
            });
            future.onIOPub = (msg) => {
                var _a, _b;
                if (msg.header.msg_type === 'stream' &&
                    ((_a = msg.content) === null || _a === void 0 ? void 0 : _a.name) === 'stdout') {
                    stdout += (_b = msg.content.text) !== null && _b !== void 0 ? _b : '';
                }
            };
            future.done.then(() => {
                try {
                    const raw = JSON.parse(stdout.trim() || '{}');
                    const schemas = Object.entries(raw).map(([name, info]) => ({
                        name,
                        shape: info.shape,
                        columns: info.columns,
                        dtypes: info.dtypes,
                        sample: info.sample,
                        memoryMb: info.memory_mb
                    }));
                    resolve(schemas);
                }
                catch (_a) {
                    resolve([]);
                }
            }, reject);
        });
    }
    /**
     * Returns a single cell by index, or null if out of bounds.
     */
    getCell(index) {
        var _a;
        const context = this.getFullContext();
        if (!context) {
            return null;
        }
        return (_a = context.cells[index]) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Returns an inclusive slice of cells from start to end.
     */
    getCellRange(start, end) {
        const context = this.getFullContext();
        if (!context) {
            return [];
        }
        return context.cells.slice(start, end + 1);
    }
    /**
     * Finds cells whose source matches the given regex pattern.
     */
    findCells(pattern) {
        const context = this.getFullContext();
        if (!context) {
            return [];
        }
        return context.cells.filter(cell => pattern.test(cell.source));
    }
    /**
     * Returns the index of the currently active cell in the notebook.
     */
    getCurrentCellIndex() {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return 0;
        }
        return panel.content.activeCellIndex;
    }
}
