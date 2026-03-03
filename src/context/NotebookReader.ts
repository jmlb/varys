/**
 * NotebookReader - Extracts full context from the active JupyterLab notebook.
 */

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { CellInfo, NotebookContext, TextSelection, DataFrameSchema } from '../api/client';

/**
 * Maximum characters captured from each cell's output before truncation.
 * Must match CELL_CONTENT_LIMIT in varys/llm/context_utils.py
 * so the backend and frontend agree on the same cap.
 */
const CELL_OUTPUT_MAX_CHARS = 2_000;

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
  private tracker: INotebookTracker;

  /**
   * Cache for DataFrame schemas.  Invalidated whenever the max execution
   * count across all cells changes (i.e. after any cell is run).
   */
  private _dfCache: { key: number; schemas: DataFrameSchema[] } | null = null;

  constructor(tracker: INotebookTracker) {
    this.tracker = tracker;
  }

  /**
   * Returns the full context of the currently active notebook.
   * Returns null if no notebook is open.
   */
  getFullContext(): NotebookContext | null {
    const panel = this.tracker.currentWidget;
    if (!panel) {
      return null;
    }
    return this._extractContext(panel);
  }

  private _extractContext(panel: NotebookPanel): NotebookContext {
    const notebook = panel.content;
    const activeCellIndex = notebook.activeCellIndex;
    const cells: CellInfo[] = [];

    notebook.widgets.forEach((cell, index) => {
      const model = cell.model;
      cells.push({
        index,
        type: model.type as 'code' | 'markdown',
        source: model.sharedModel.getSource(),
        executionCount:
          model.type === 'code'
            ? (model as any).executionCount ?? null
            : null,
        output: model.type === 'code' ? this._extractOutput(model) : null,
        imageOutput: model.type === 'code' ? this._extractImage(model) : null
      });
    });

    return {
      cells,
      activeCellIndex,
      notebookPath: panel.context.path,
      kernelName: panel.sessionContext.session?.kernel?.name ?? undefined,
      selection: this._getSelection(panel)
    };
  }

  /**
   * Returns the text currently selected by the user in the active code cell,
   * or null when there is no meaningful selection (cursor only / empty).
   */
  private _getSelection(panel: NotebookPanel): TextSelection | null {
    const notebook = panel.content;
    const activeCell = notebook.activeCell;
    if (!activeCell) {
      return null;
    }

    const editor = activeCell.editor;
    if (!editor) {
      return null;
    }

    const selection: CodeEditor.IRange = editor.getSelection();
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
      selectedLines[selectedLines.length - 1] = selectedLines[
        selectedLines.length - 1
      ].slice(0, end.column);
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
  private _extractOutput(model: any): string | null {
    const outputs = model.outputs;
    if (!outputs || outputs.length === 0) {
      return null;
    }

    const parts: string[] = [];

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs.get ? outputs.get(i) : outputs[i];
      if (!output) continue;

      const outputType: string = output.output_type ?? output.type ?? '';

      if (outputType === 'stream') {
        const text = output.text ?? '';
        const content = Array.isArray(text) ? text.join('') : String(text);
        if (content.trim()) parts.push(content.trim());

      } else if (outputType === 'execute_result' || outputType === 'display_data') {
        const data = output.data ?? {};
        const plain = data['text/plain'] ?? '';
        const content = Array.isArray(plain) ? plain.join('') : String(plain);
        if (content.trim()) parts.push(content.trim());

      } else if (outputType === 'error') {
        const ename = output.ename ?? 'Error';
        const evalue = output.evalue ?? '';
        parts.push(`${ename}: ${evalue}`);
      }
    }

    if (parts.length === 0) return null;
    const full = parts.join('\n');
    return full.length > CELL_OUTPUT_MAX_CHARS
      ? full.slice(0, CELL_OUTPUT_MAX_CHARS) + '\n[...output truncated]'
      : full;
  }

  /**
   * Extracts the first image/png output from a code cell, returned as a
   * base64 string (no data-URI prefix).  Returns null if no image present.
   */
  private _extractImage(model: any): string | null {
    const outputs = model.outputs;
    if (!outputs || outputs.length === 0) return null;

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs.get ? outputs.get(i) : outputs[i];
      if (!output) continue;
      const data = output.data ?? {};
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
  async getDataFrameSchemas(): Promise<DataFrameSchema[]> {
    const panel = this.tracker.currentWidget;
    if (!panel) return [];

    const kernel = panel.sessionContext.session?.kernel;
    if (!kernel) return [];

    const cacheKey = this._executionCountKey(panel);
    if (this._dfCache && this._dfCache.key === cacheKey) {
      return this._dfCache.schemas;
    }

    try {
      const schemas = await this._inspectKernel(kernel);
      this._dfCache = { key: cacheKey, schemas };
      return schemas;
    } catch {
      // Never crash the chat flow due to schema detection failure
      return [];
    }
  }

  /**
   * Computes a cache-key from the current max execution count across all
   * cells.  Changes as soon as any cell is executed.
   */
  private _executionCountKey(panel: NotebookPanel): number {
    return panel.content.widgets.reduce((max, cell) => {
      const ec = (cell.model as any).executionCount ?? 0;
      return Math.max(max, typeof ec === 'number' ? ec : 0);
    }, 0);
  }

  /**
   * Runs the DataFrame inspection snippet in the kernel and parses the JSON
   * written to stdout.
   */
  private _inspectKernel(kernel: any): Promise<DataFrameSchema[]> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      const future = kernel.requestExecute({
        code: DATAFRAME_INSPECTION_CODE,
        silent: true,          // don't add to notebook history
        store_history: false
      });

      future.onIOPub = (msg: any) => {
        if (
          msg.header.msg_type === 'stream' &&
          msg.content?.name === 'stdout'
        ) {
          stdout += msg.content.text ?? '';
        }
      };

      future.done.then(() => {
        try {
          const raw: Record<string, any> = JSON.parse(stdout.trim() || '{}');
          const schemas: DataFrameSchema[] = Object.entries(raw).map(
            ([name, info]) => ({
              name,
              shape: info.shape as [number, number],
              columns: info.columns as string[],
              dtypes: info.dtypes as Record<string, string>,
              sample: info.sample as Record<string, unknown>[],
              memoryMb: info.memory_mb as number | undefined
            })
          );
          resolve(schemas);
        } catch {
          resolve([]);
        }
      }, reject);
    });
  }

  /**
   * Returns a single cell by index, or null if out of bounds.
   */
  getCell(index: number): CellInfo | null {
    const context = this.getFullContext();
    if (!context) {
      return null;
    }
    return context.cells[index] ?? null;
  }

  /**
   * Returns an inclusive slice of cells from start to end.
   */
  getCellRange(start: number, end: number): CellInfo[] {
    const context = this.getFullContext();
    if (!context) {
      return [];
    }
    return context.cells.slice(start, end + 1);
  }

  /**
   * Finds cells whose source matches the given regex pattern.
   */
  findCells(pattern: RegExp): CellInfo[] {
    const context = this.getFullContext();
    if (!context) {
      return [];
    }
    return context.cells.filter(cell => pattern.test(cell.source));
  }

  /**
   * Returns the index of the currently active cell in the notebook.
   */
  getCurrentCellIndex(): number {
    const panel = this.tracker.currentWidget;
    if (!panel) {
      return 0;
    }
    return panel.content.activeCellIndex;
  }
}
