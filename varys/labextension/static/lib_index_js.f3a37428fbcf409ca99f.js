"use strict";
(self["webpackChunkvarys"] = self["webpackChunkvarys"] || []).push([["lib_index_js"],{

/***/ "./lib/api/client.js"
/*!***************************!*\
  !*** ./lib/api/client.js ***!
  \***************************/
(__unused_webpack_module, exports) {


/**
 * API client for communicating with the Varys backend.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.APIClient = void 0;
class APIClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || '/varys';
    }
    async executeTask(request) {
        const response = await fetch(`${this.baseUrl}/task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken()
            },
            body: JSON.stringify(request)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Task failed: ${response.status} - ${error}`);
        }
        return response.json();
    }
    /**
     * Execute a task with optional SSE streaming for chat/advisory mode.
     *
     * - If the backend returns `text/event-stream` (chat mode), `onChunk` is
     *   called progressively with each text token, and the resolved promise
     *   contains the final `TaskResponse`.
     * - For all other modes the backend returns JSON; `onChunk` is never called
     *   and the resolved promise contains the complete response directly.
     */
    async executeTaskStreaming(request, onChunk, onProgress, onJsonDelta, signal) {
        var _a, _b;
        const response = await fetch(`${this.baseUrl}/task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken()
            },
            body: JSON.stringify(Object.assign(Object.assign({}, request), { stream: true })),
            signal,
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Task failed: ${response.status} - ${error}`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream') && response.body) {
            // Parse SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let lastDone = null;
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = (_a = parts.pop()) !== null && _a !== void 0 ? _a : '';
                for (const part of parts) {
                    if (!part.startsWith('data: '))
                        continue;
                    try {
                        const event = JSON.parse(part.slice(6));
                        if (event.type === 'chunk' && event.text) {
                            onChunk(event.text);
                        }
                        else if (event.type === 'progress' && event.text) {
                            onProgress === null || onProgress === void 0 ? void 0 : onProgress(event.text);
                        }
                        else if (event.type === 'json_delta' && event.text) {
                            onJsonDelta === null || onJsonDelta === void 0 ? void 0 : onJsonDelta(event.text);
                        }
                        else if (event.type === 'done') {
                            lastDone = event;
                        }
                        else if (event.type === 'error') {
                            // Surface API-level errors (billing, rate-limit, auth, etc.) as
                            // a real throw so the caller shows the actual message to the user
                            // rather than falling through to "Done — no cell changes".
                            const errMsg = (_b = event.error) !== null && _b !== void 0 ? _b : 'An API error occurred.';
                            throw new Error(errMsg);
                        }
                    }
                    catch (_c) {
                        // skip malformed events
                    }
                }
            }
            return lastDone !== null && lastDone !== void 0 ? lastDone : {
                operationId: 'unknown',
                steps: [],
                requiresApproval: false,
                cellInsertionMode: 'chat',
            };
        }
        // Regular JSON response (non-chat modes ignore stream: true)
        return response.json();
    }
    async fetchCompletion(request) {
        const response = await fetch(`${this.baseUrl}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken()
            },
            body: JSON.stringify(request)
        });
        if (!response.ok) {
            throw new Error(`Completion failed: ${response.status}`);
        }
        return response.json();
    }
    async getSettings() {
        const response = await fetch(`${this.baseUrl}/settings`, {
            headers: { 'X-XSRFToken': this.getXSRFToken() }
        });
        if (!response.ok)
            throw new Error(`Failed to load settings: ${response.status}`);
        return response.json();
    }
    async saveSettings(settings) {
        const response = await fetch(`${this.baseUrl}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken()
            },
            body: JSON.stringify(settings)
        });
        if (!response.ok)
            throw new Error(`Failed to save settings: ${response.status}`);
        return response.json();
    }
    // ── Report generation ───────────────────────────────────────────────────
    async generateReport(notebookPath) {
        const response = await fetch(`${this.baseUrl}/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken()
            },
            body: JSON.stringify({ notebookPath })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || `Report failed: ${response.status}`);
        }
        return response.json();
    }
    // ── Skills ──────────────────────────────────────────────────────────────
    async getSkills(notebookPath = '') {
        const qs = notebookPath ? `?notebookPath=${encodeURIComponent(notebookPath)}` : '';
        const response = await fetch(`${this.baseUrl}/skills${qs}`, {
            headers: { 'X-XSRFToken': this.getXSRFToken() }
        });
        if (!response.ok)
            throw new Error(`Failed to load skills: ${response.status}`);
        return response.json();
    }
    async refreshSkills(notebookPath = '') {
        const qs = notebookPath ? `?notebookPath=${encodeURIComponent(notebookPath)}` : '';
        const response = await fetch(`${this.baseUrl}/skills${qs}`, {
            method: 'POST',
            headers: { 'X-XSRFToken': this.getXSRFToken() }
        });
        if (!response.ok)
            throw new Error(`Failed to refresh skills: ${response.status}`);
        return response.json();
    }
    async getSkillContent(name, notebookPath = '') {
        const qs = notebookPath ? `?notebookPath=${encodeURIComponent(notebookPath)}` : '';
        const response = await fetch(`${this.baseUrl}/skills/${encodeURIComponent(name)}${qs}`, {
            headers: { 'X-XSRFToken': this.getXSRFToken() }
        });
        if (!response.ok)
            throw new Error(`Failed to load skill '${name}': ${response.status}`);
        return response.json();
    }
    async saveSkill(name, updates, notebookPath = '') {
        const qs = notebookPath ? `?notebookPath=${encodeURIComponent(notebookPath)}` : '';
        const response = await fetch(`${this.baseUrl}/skills/${encodeURIComponent(name)}${qs}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken()
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok)
            throw new Error(`Failed to save skill '${name}': ${response.status}`);
        return response.json();
    }
    // ── Bundled skill library ─────────────────────────────────────────────────
    async getBundledSkills(notebookPath = '') {
        const qs = notebookPath ? `?notebookPath=${encodeURIComponent(notebookPath)}` : '';
        const response = await fetch(`${this.baseUrl}/bundled-skills${qs}`, {
            headers: { 'X-XSRFToken': this.getXSRFToken() }
        });
        if (!response.ok)
            throw new Error(`Failed to load bundled skills: ${response.status}`);
        return response.json();
    }
    async importBundledSkill(name, notebookPath = '', overwrite = false) {
        const response = await fetch(`${this.baseUrl}/bundled-skills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken()
            },
            body: JSON.stringify({ name, notebookPath, overwrite })
        });
        if (!response.ok)
            throw new Error(`Failed to import bundled skill '${name}': ${response.status}`);
        return response.json();
    }
    // ── Reproducibility Guardian ──────────────────────────────────────────────
    async analyzeReproducibility(payload) {
        const response = await fetch(`${this.baseUrl}/reproducibility/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken(),
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok)
            throw new Error(`Reproducibility analysis failed: ${response.status}`);
        return response.json();
    }
    async dismissReproIssue(payload) {
        const response = await fetch(`${this.baseUrl}/reproducibility/dismiss`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken(),
            },
            body: JSON.stringify({ notebookPath: payload.notebookPath, issueId: payload.issueId }),
        });
        if (!response.ok)
            throw new Error(`Dismiss failed: ${response.status}`);
        return response.json();
    }
    async getReproIssues(notebookPath) {
        const response = await fetch(`${this.baseUrl}/reproducibility?notebook_path=${encodeURIComponent(notebookPath)}`, { headers: { 'X-XSRFToken': this.getXSRFToken() } });
        if (!response.ok)
            throw new Error(`Load issues failed: ${response.status}`);
        return response.json();
    }
    // ── Slash commands ─────────────────────────────────────────────────────────
    /** Fetch all available slash commands (built-ins + skill commands). */
    async getCommands() {
        var _a;
        try {
            const response = await fetch(`${this.baseUrl}/commands`, {
                headers: { 'X-XSRFToken': this.getXSRFToken() },
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return ((_a = data.commands) !== null && _a !== void 0 ? _a : []);
        }
        catch (_b) {
            return [];
        }
    }
    // ── Chat thread persistence ────────────────────────────────────────────────
    /** Load all threads for a notebook. Returns empty chat file if none saved yet. */
    async loadChatHistory(notebookPath) {
        var _a, _b, _c;
        const response = await fetch(`${this.baseUrl}/chat-history?notebook=${encodeURIComponent(notebookPath)}`, { headers: { 'X-XSRFToken': this.getXSRFToken() } });
        if (!response.ok)
            throw new Error(`loadChatHistory failed: ${response.status}`);
        const raw = await response.json();
        // normalise snake_case from Python → camelCase
        return {
            notebookPath: (_a = raw.notebook_path) !== null && _a !== void 0 ? _a : notebookPath,
            lastThreadId: (_b = raw.last_thread_id) !== null && _b !== void 0 ? _b : null,
            threads: ((_c = raw.threads) !== null && _c !== void 0 ? _c : []).map((t) => {
                var _a, _b, _c, _d, _e;
                return ({
                    id: t.id,
                    name: t.name,
                    createdAt: (_a = t.created_at) !== null && _a !== void 0 ? _a : '',
                    updatedAt: (_b = t.updated_at) !== null && _b !== void 0 ? _b : '',
                    messages: ((_c = t.messages) !== null && _c !== void 0 ? _c : []),
                    tokenUsage: t.token_usage
                        ? { input: (_d = t.token_usage.input) !== null && _d !== void 0 ? _d : 0,
                            output: (_e = t.token_usage.output) !== null && _e !== void 0 ? _e : 0 }
                        : undefined,
                });
            }),
        };
    }
    /** Upsert a thread (create or update) and set it as the last active thread. */
    async saveChatThread(notebookPath, thread) {
        const response = await fetch(`${this.baseUrl}/chat-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken(),
            },
            body: JSON.stringify({
                notebookPath,
                thread: Object.assign({ id: thread.id, name: thread.name, created_at: thread.createdAt, messages: thread.messages }, (thread.tokenUsage ? { token_usage: thread.tokenUsage } : {})),
            }),
        });
        if (!response.ok)
            throw new Error(`saveChatThread failed: ${response.status}`);
    }
    /** Delete a thread by id. */
    async deleteChatThread(notebookPath, threadId) {
        const response = await fetch(`${this.baseUrl}/chat-history?notebook=${encodeURIComponent(notebookPath)}&threadId=${encodeURIComponent(threadId)}`, {
            method: 'DELETE',
            headers: { 'X-XSRFToken': this.getXSRFToken() },
        });
        if (!response.ok)
            throw new Error(`deleteChatThread failed: ${response.status}`);
    }
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (!response.ok)
                return { status: 'error' };
            return response.json();
        }
        catch (_a) {
            return { status: 'error' };
        }
    }
    // ── RAG knowledge-base ─────────────────────────────────────────────────
    /**
     * Index a file or directory into the local knowledge base.
     * Returns an EventSource-compatible response (SSE).
     * Calls onProgress(msg) for each progress event, resolves with the
     * final result object on "done".
     */
    async ragLearn(path, onProgress, force = false, notebookPath = '') {
        var _a, _b, _c;
        const response = await fetch(`${this.baseUrl}/rag/learn`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken(),
            },
            body: JSON.stringify({ path, force, notebookPath }),
        });
        if (!response.ok) {
            throw new Error(`RAG learn failed: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let result = null;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = (_a = lines.pop()) !== null && _a !== void 0 ? _a : '';
            for (const line of lines) {
                if (!line.startsWith('data: '))
                    continue;
                try {
                    const evt = JSON.parse(line.slice(6));
                    if (evt.type === 'progress') {
                        onProgress((_b = evt.text) !== null && _b !== void 0 ? _b : '');
                    }
                    else if (evt.type === 'done') {
                        result = evt.result;
                    }
                    else if (evt.type === 'error') {
                        throw new Error((_c = evt.text) !== null && _c !== void 0 ? _c : 'RAG learn error');
                    }
                }
                catch (e) {
                    if (e instanceof Error && e.message.startsWith('RAG'))
                        throw e;
                }
            }
        }
        return result !== null && result !== void 0 ? result : { total: 0, processed: 0, skipped: 0, errors: [] };
    }
    /** Return a summary of the current knowledge-base index. */
    async ragStatus(notebookPath = '') {
        const qs = notebookPath ? `?notebookPath=${encodeURIComponent(notebookPath)}` : '';
        const response = await fetch(`${this.baseUrl}/rag/status${qs}`, {
            headers: { 'X-XSRFToken': this.getXSRFToken() },
        });
        if (!response.ok)
            throw new Error(`RAG status failed: ${response.status}`);
        return response.json();
    }
    /** Remove a specific file from the knowledge-base index. */
    async ragForget(path, notebookPath = '') {
        const response = await fetch(`${this.baseUrl}/rag/forget`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRFToken': this.getXSRFToken(),
            },
            body: JSON.stringify({ path, notebookPath }),
        });
        if (!response.ok)
            throw new Error(`RAG forget failed: ${response.status}`);
        return response.json();
    }
    getXSRFToken() {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === '_xsrf') {
                return decodeURIComponent(value);
            }
        }
        return '';
    }
}
exports.APIClient = APIClient;


/***/ },

/***/ "./lib/completion/InlineCompletionProvider.js"
/*!****************************************************!*\
  !*** ./lib/completion/InlineCompletionProvider.js ***!
  \****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/**
 * DSAssistantInlineProvider — implements JupyterLab's IInlineCompletionProvider
 * interface so JupyterLab handles all ghost text rendering, debouncing,
 * Tab/Esc/Alt+Right keyboard shortcuts, and settings UI natively.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DSAssistantInlineProvider = void 0;
const completer_1 = __webpack_require__(/*! @jupyterlab/completer */ "webpack/sharing/consume/default/@jupyterlab/completer");
const notebook_1 = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
class DSAssistantInlineProvider {
    constructor(apiClient, tracker) {
        this.name = 'Varys';
        this.identifier = 'varys-inline';
        /**
         * Schema contributed to JupyterLab's Inline Completer settings panel.
         * Only the toggle is exposed here — model selection is done in .env.
         */
        this.schema = {
            type: 'object',
            properties: {
                enabled: {
                    title: 'Enable Varys Inline Completion',
                    description: 'Show ghost-text suggestions as you type. ' +
                        'Model and provider are configured in .env.',
                    type: 'boolean',
                    default: true
                }
            }
        };
        this._enabled = true;
        this._apiClient = apiClient;
        this._tracker = tracker;
    }
    /** Called by JupyterLab when user changes settings for this provider. */
    configure(settings) {
        var _a;
        this._enabled = (_a = settings['enabled']) !== null && _a !== void 0 ? _a : true;
    }
    /**
     * Main entry point called by JupyterLab on each inline completion request.
     *
     * JupyterLab already handles:
     *  - Debouncing (configurable via Inline Completer settings, default 200ms)
     *  - Ghost text rendering
     *  - Tab / Esc / Alt+Right keyboard shortcuts
     *  - Cancellation of in-flight requests when user keeps typing
     */
    async fetch(request, context) {
        const empty = { items: [] };
        if (!this._enabled) {
            return empty;
        }
        const prefix = request.text.slice(0, request.offset);
        const suffix = request.text.slice(request.offset);
        // Skip trivially short prefixes to avoid noisy requests
        if (prefix.trimEnd().length < 2) {
            return empty;
        }
        // Explicit Ctrl+Space → multiline; auto trigger → single-line
        const completionType = context.triggerKind === completer_1.InlineCompletionTriggerKind.Invoke
            ? 'multiline'
            : 'inline';
        // Map JupyterLab mimeType to a language hint for the backend
        const language = request.mimeType === 'text/x-python'
            ? 'python'
            : request.mimeType === 'text/x-r-source'
                ? 'r'
                : request.mimeType === 'text/x-julia'
                    ? 'julia'
                    : 'python'; // default: most notebooks are Python
        const previousCells = this._gatherPreviousCells(context);
        try {
            const result = await this._apiClient.fetchCompletion({
                prefix,
                suffix,
                language,
                previousCells,
                completionType
            });
            if (!result.suggestion) {
                return empty;
            }
            return { items: [{ insertText: result.suggestion }] };
        }
        catch (err) {
            console.error('[DSAssistant] completion fetch error:', err);
            return empty;
        }
    }
    /** Collect the last 5 cells before the active one for context. */
    _gatherPreviousCells(context) {
        const widget = context.widget;
        if (!(widget instanceof notebook_1.NotebookPanel)) {
            // Fall back to tracker's current widget
            const panel = this._tracker.currentWidget;
            if (!panel) {
                return [];
            }
            return this._extractCells(panel);
        }
        return this._extractCells(widget);
    }
    _extractCells(panel) {
        const notebook = panel.content;
        const active = notebook.activeCellIndex;
        const start = Math.max(0, active - 5);
        const cells = [];
        for (let i = start; i < active; i++) {
            const cell = notebook.widgets[i];
            if (cell) {
                cells.push({
                    index: i,
                    type: cell.model.type,
                    source: cell.model.sharedModel.getSource()
                });
            }
        }
        return cells;
    }
}
exports.DSAssistantInlineProvider = DSAssistantInlineProvider;


/***/ },

/***/ "./lib/completion/index.js"
/*!*********************************!*\
  !*** ./lib/completion/index.js ***!
  \*********************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DSAssistantInlineProvider = void 0;
var InlineCompletionProvider_1 = __webpack_require__(/*! ./InlineCompletionProvider */ "./lib/completion/InlineCompletionProvider.js");
Object.defineProperty(exports, "DSAssistantInlineProvider", ({ enumerable: true, get: function () { return InlineCompletionProvider_1.DSAssistantInlineProvider; } }));


/***/ },

/***/ "./lib/context/NotebookReader.js"
/*!***************************************!*\
  !*** ./lib/context/NotebookReader.js ***!
  \***************************************/
(__unused_webpack_module, exports) {


/**
 * NotebookReader - Extracts full context from the active JupyterLab notebook.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotebookReader = void 0;
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
class NotebookReader {
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
        var _a, _b, _c, _d, _e, _f, _g;
        const outputs = model.outputs;
        if (!outputs || outputs.length === 0) {
            return null;
        }
        const parts = [];
        for (let i = 0; i < outputs.length; i++) {
            const output = outputs.get ? outputs.get(i) : outputs[i];
            if (!output)
                continue;
            const outputType = (_b = (_a = output.output_type) !== null && _a !== void 0 ? _a : output.type) !== null && _b !== void 0 ? _b : '';
            if (outputType === 'stream') {
                const text = (_c = output.text) !== null && _c !== void 0 ? _c : '';
                const content = Array.isArray(text) ? text.join('') : String(text);
                if (content.trim())
                    parts.push(content.trim());
            }
            else if (outputType === 'execute_result' || outputType === 'display_data') {
                const data = (_d = output.data) !== null && _d !== void 0 ? _d : {};
                const plain = (_e = data['text/plain']) !== null && _e !== void 0 ? _e : '';
                const content = Array.isArray(plain) ? plain.join('') : String(plain);
                if (content.trim())
                    parts.push(content.trim());
            }
            else if (outputType === 'error') {
                const ename = (_f = output.ename) !== null && _f !== void 0 ? _f : 'Error';
                const evalue = (_g = output.evalue) !== null && _g !== void 0 ? _g : '';
                parts.push(`${ename}: ${evalue}`);
            }
        }
        if (parts.length === 0)
            return null;
        const full = parts.join('\n');
        return full.length > CELL_OUTPUT_MAX_CHARS
            ? full.slice(0, CELL_OUTPUT_MAX_CHARS) + '\n[...output truncated]'
            : full;
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
exports.NotebookReader = NotebookReader;


/***/ },

/***/ "./lib/context/VariableResolver.js"
/*!*****************************************!*\
  !*** ./lib/context/VariableResolver.js ***!
  \*****************************************/
(__unused_webpack_module, exports) {


/**
 * VariableResolver — parses @variable_name references from chat messages,
 * evaluates them in the active kernel, and returns smart, token-budget-aware
 * summaries for injection into the LLM prompt.
 *
 * Supports:
 *   @df                plain variable
 *   @df.head(20)       method call on a variable
 *   @df[['a','b']]     column subset
 *   @model_accuracy    scalar / string
 *
 * Serialisation tiers for DataFrames:
 *   ≤ 20 rows  × ≤ 10 cols → full markdown table
 *   ≤ 10,000 rows           → stats + head(5) sample
 *   > 10,000 rows           → stats + random 10-row sample + note
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VariableResolver = exports.parseVariableRefs = void 0;
// ── Constants ─────────────────────────────────────────────────────────────────
/** Regex that matches @varName or @varName.method() or @varName[...] */
const AT_REF_RE = /@([A-Za-z_]\w*(?:\.[A-Za-z_]\w*(?:\([\w\s,'".]*\))?|(?:\[[\w\s,'":\[\]]*\]))*)/g;
/** Maximum total characters sent to the LLM for all resolved variables */
const MAX_VAR_CONTEXT_CHARS = 4000;
// ── Python introspection script ───────────────────────────────────────────────
// Injected into the kernel with a list of expressions to evaluate.
// Returns a JSON array of summaries, one per expression.
const INSPECT_PY = `
import json as _j
def _dsa_inspect(exprs):
    results = []
    for expr in exprs:
        try:
            val = eval(expr)
        except Exception as exc:
            results.append({"type": "error", "expr": expr, "error": str(exc)})
            continue
        t = type(val).__name__
        try:
            import pandas as _pd
            if isinstance(val, _pd.DataFrame):
                nr, nc = val.shape
                out = {
                    "type": "dataframe", "expr": expr,
                    "shape": [nr, nc],
                    "columns": list(val.columns),
                    "dtypes": {c: str(dt) for c, dt in val.dtypes.items()},
                    "memory_mb": round(val.memory_usage(deep=True).sum() / 1e6, 2),
                    "missing": {c: int(n) for c, n in val.isnull().sum().items() if n > 0},
                }
                try:
                    if nr <= 20 and nc <= 10:
                        out["full_table"] = val.to_markdown(index=False)
                    elif nr <= 10000:
                        out["stats"] = val.describe(include="all").round(4).to_markdown()
                        out["head"] = val.head(5).to_markdown(index=False)
                    else:
                        out["stats"] = val.describe(include="all").round(4).to_markdown()
                        out["sample"] = val.sample(min(10, nr), random_state=42).to_markdown(index=False)
                        out["note"] = f"Large dataset ({nr:,} rows) — summary only. Use @{expr}.head() or @{expr}[cols] for subsets."
                except Exception:
                    out["head_str"] = str(val.head(5))
                results.append(out)
                continue
            if isinstance(val, _pd.Series):
                results.append({
                    "type": "series", "expr": expr,
                    "name": str(val.name), "dtype": str(val.dtype),
                    "length": len(val),
                    "stats": val.describe().to_markdown() if hasattr(val.describe(), "to_markdown") else str(val.describe()),
                })
                continue
        except ImportError:
            pass
        try:
            import numpy as _np
            if isinstance(val, _np.ndarray):
                results.append({
                    "type": "ndarray", "expr": expr,
                    "shape": list(val.shape), "dtype": str(val.dtype),
                    "sample": val.flat[:20].tolist(),
                })
                continue
        except ImportError:
            pass
        if isinstance(val, (int, float, bool)):
            results.append({"type": t, "expr": expr, "value": val})
        elif isinstance(val, str):
            results.append({"type": "str", "expr": expr, "length": len(val),
                           "value": val if len(val) <= 300 else val[:300] + "..."})
        elif isinstance(val, (list, tuple)):
            results.append({"type": t, "expr": expr, "length": len(val),
                           "sample": list(val[:15])})
        elif isinstance(val, dict):
            keys = list(val.keys())
            results.append({"type": "dict", "expr": expr, "length": len(keys),
                           "keys": keys[:20],
                           "sample": {str(k): str(v)[:80] for k, v in list(val.items())[:5]}})
        else:
            results.append({"type": t, "expr": expr, "repr": repr(val)[:400]})
    print(_j.dumps(results))
_dsa_inspect(EXPRS_PLACEHOLDER)
`.trim();
// ── Helpers ───────────────────────────────────────────────────────────────────
/** Extract all unique @variable_ref expressions from a message string. */
function parseVariableRefs(message) {
    const refs = [];
    AT_REF_RE.lastIndex = 0;
    let m;
    while ((m = AT_REF_RE.exec(message)) !== null) {
        const expr = m[1];
        if (!refs.includes(expr))
            refs.push(expr);
    }
    return refs;
}
exports.parseVariableRefs = parseVariableRefs;
/**
 * Cap the total JSON size of resolved variables to MAX_VAR_CONTEXT_CHARS by
 * progressively stripping large fields (full_table → head → stats → sample)
 * until the budget is met.
 */
function applyTokenBudget(vars) {
    const DROP_ORDER = ['full_table', 'stats', 'head', 'sample', 'head_str'];
    let total = JSON.stringify(vars).length;
    if (total <= MAX_VAR_CONTEXT_CHARS)
        return vars;
    // Deep-clone so we don't mutate the originals
    const trimmed = vars.map(v => (Object.assign(Object.assign({}, v), { summary: Object.assign({}, v.summary) })));
    for (const field of DROP_ORDER) {
        if (total <= MAX_VAR_CONTEXT_CHARS)
            break;
        for (const v of trimmed) {
            if (field in v.summary) {
                delete v.summary[field];
                total = JSON.stringify(trimmed).length;
                if (total <= MAX_VAR_CONTEXT_CHARS)
                    break;
            }
        }
    }
    return trimmed;
}
// ── Main class ────────────────────────────────────────────────────────────────
class VariableResolver {
    constructor(tracker) {
        this._tracker = tracker;
    }
    /**
     * Resolve all @variable_ref expressions in `message`.
     * Returns an array of { expr, summary } objects ready to be attached to
     * the TaskRequest.  Returns [] if no @refs found or no kernel is available.
     */
    async resolve(message) {
        var _a, _b, _c;
        const refs = parseVariableRefs(message);
        if (refs.length === 0)
            return [];
        const kernel = (_c = (_b = (_a = this._tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.sessionContext) === null || _b === void 0 ? void 0 : _b.session) === null || _c === void 0 ? void 0 : _c.kernel;
        if (!kernel)
            return [];
        const code = INSPECT_PY.replace('EXPRS_PLACEHOLDER', JSON.stringify(refs));
        return new Promise(resolve => {
            const future = kernel.requestExecute({
                code,
                silent: true,
                store_history: false,
                allow_stdin: false,
                stop_on_error: false,
            });
            let stdout = '';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            future.onIOPub = (msg) => {
                if (msg.header.msg_type === 'stream' && msg.content.name === 'stdout') {
                    stdout += msg.content.text;
                }
            };
            future.done
                .then(() => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const parsed = JSON.parse(stdout.trim());
                    const results = parsed.map((summary, i) => ({
                        expr: refs[i],
                        summary,
                    }));
                    resolve(applyTokenBudget(results));
                }
                catch (_a) {
                    resolve([]);
                }
            })
                .catch(() => resolve([]));
        });
    }
}
exports.VariableResolver = VariableResolver;


/***/ },

/***/ "./lib/editor/CellEditor.js"
/*!**********************************!*\
  !*** ./lib/editor/CellEditor.js ***!
  \**********************************/
(__unused_webpack_module, exports, __webpack_require__) {


/**
 * CellEditor - Inserts, modifies, deletes, highlights, and executes notebook cells.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CellEditor = void 0;
const notebook_1 = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
class CellEditor {
    constructor(tracker) {
        this.pendingOperations = new Map();
        this.highlightedCells = new Set();
        this.tracker = tracker;
    }
    /**
     * Applies a list of operation steps to the notebook, tracks the operation
     * for undo, and highlights the affected cells.
     *
     * Returns an ApplyResult with:
     *  - stepIndexMap: step array index → actual notebook cell index
     *  - capturedOriginals: step array index → original source (for diff view)
     *
     * Steps are applied in safe order (modifies first, then inserts ascending,
     * then deletes descending) to prevent index-shift errors.
     */
    async applyOperations(operationId, steps) {
        var _a, _b, _c;
        const stepIndexMap = new Map();
        /** Keyed by notebook cell index — used internally for undo */
        const originalContentsByNbIdx = new Map();
        /** Keyed by step array index — returned to caller for diff view */
        const capturedOriginals = new Map();
        // --- Modifications (no index shifting) ---
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (step.type !== 'modify')
                continue;
            const original = this.getCellSource(step.cellIndex);
            if (original !== null) {
                originalContentsByNbIdx.set(step.cellIndex, original);
                capturedOriginals.set(i, original);
            }
            this.updateCell(step.cellIndex, (_a = step.content) !== null && _a !== void 0 ? _a : '');
            stepIndexMap.set(i, step.cellIndex);
        }
        // --- Inserts (ascending order to keep index arithmetic correct) ---
        const insertPairs = steps
            .map((s, i) => ({ step: s, originalIdx: i }))
            .filter(p => p.step.type === 'insert')
            .sort((a, b) => a.step.cellIndex - b.step.cellIndex);
        for (const { step, originalIdx } of insertPairs) {
            const notebookIdx = await this.insertCell(step.cellIndex, (_b = step.cellType) !== null && _b !== void 0 ? _b : 'code', (_c = step.content) !== null && _c !== void 0 ? _c : '');
            stepIndexMap.set(originalIdx, notebookIdx);
            // Inserts have no original content — capturedOriginals entry omitted (treated as '')
        }
        // --- Deletes (descending order to avoid index shifting) ---
        //     Capture content BEFORE deleting so the diff view can show what was removed.
        const deletePairs = steps
            .map((s, i) => ({ step: s, originalIdx: i }))
            .filter(p => p.step.type === 'delete')
            .sort((a, b) => b.step.cellIndex - a.step.cellIndex);
        for (const { step, originalIdx } of deletePairs) {
            const original = this.getCellSource(step.cellIndex);
            if (original !== null) {
                capturedOriginals.set(originalIdx, original);
                // Deleted cells cannot be restored by notebook index (they're gone), so we
                // store under the step index in originalContentsByNbIdx for undo to find them.
                originalContentsByNbIdx.set(step.cellIndex, original);
            }
            this.deleteCell(step.cellIndex);
            stepIndexMap.set(originalIdx, step.cellIndex);
        }
        // --- run_cell: record the index but don't modify the cell ---
        for (let i = 0; i < steps.length; i++) {
            if (steps[i].type === 'run_cell') {
                stepIndexMap.set(i, steps[i].cellIndex);
            }
        }
        // Collect all unique notebook indices that were changed (not deletes/run_cell)
        const affectedIndices = [];
        for (let i = 0; i < steps.length; i++) {
            const t = steps[i].type;
            if (t === 'insert' || t === 'modify') {
                const idx = stepIndexMap.get(i);
                if (idx !== undefined && !affectedIndices.includes(idx)) {
                    affectedIndices.push(idx);
                }
            }
        }
        // Record pending operation for undo support
        this.pendingOperations.set(operationId, {
            operationId,
            cellIndices: affectedIndices,
            originalContents: originalContentsByNbIdx
        });
        // Highlight cells that were inserted or modified
        for (const idx of affectedIndices) {
            this.highlightCell(idx);
        }
        return { stepIndexMap, capturedOriginals };
    }
    /**
     * Inserts a new cell of the given type at the specified position.
     * Returns the actual index the cell landed at.
     */
    async insertCell(index, type, content) {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            throw new Error('No active notebook');
        }
        const notebook = panel.content;
        const totalCells = notebook.widgets.length;
        // When inserting at 0 into a non-empty notebook use insertAbove on cell 0,
        // otherwise insertBelow on the cell just before the target index.
        if (totalCells === 0) {
            // Notebook is empty: insert below will create first cell
            notebook_1.NotebookActions.insertBelow(notebook);
        }
        else if (index <= 0) {
            notebook.activeCellIndex = 0;
            notebook_1.NotebookActions.insertAbove(notebook);
        }
        else {
            notebook.activeCellIndex = Math.min(index - 1, totalCells - 1);
            notebook_1.NotebookActions.insertBelow(notebook);
        }
        // Change type if needed (default is code)
        if (type === 'markdown') {
            notebook_1.NotebookActions.changeCellType(notebook, 'markdown');
        }
        const newIndex = notebook.activeCellIndex;
        const cell = notebook.activeCell;
        if (cell) {
            cell.model.sharedModel.setSource(content);
        }
        return newIndex;
    }
    /**
     * Overwrites the source of an existing cell at the given index.
     */
    updateCell(index, content) {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return;
        }
        const cell = panel.content.widgets[index];
        if (cell) {
            cell.model.sharedModel.setSource(content);
        }
    }
    /**
     * Deletes the cell at the given index.
     */
    deleteCell(index) {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return;
        }
        const notebook = panel.content;
        notebook.activeCellIndex = index;
        notebook_1.NotebookActions.deleteCells(notebook);
    }
    /**
     * Returns the source text of a cell, or null if the index is invalid.
     */
    getCellSource(index) {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return null;
        }
        const cell = panel.content.widgets[index];
        return cell ? cell.model.sharedModel.getSource() : null;
    }
    /**
     * Executes the cell at the given index using NotebookActions.run(),
     * which is the proper JupyterLab path and correctly updates the
     * execution count display ([N]) in the notebook gutter.
     */
    async executeCell(index) {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return;
        }
        const notebook = panel.content;
        const sessionContext = panel.sessionContext;
        // Make the target cell active so NotebookActions.run operates on it
        notebook.activeCellIndex = index;
        // NotebookActions.run returns a Promise<boolean> — await it so callers
        // can sequence multiple executions without race conditions.
        await notebook_1.NotebookActions.run(notebook, sessionContext);
    }
    /**
     * Adds the pending-highlight CSS class to a cell node.
     */
    highlightCell(index) {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return;
        }
        const cell = panel.content.widgets[index];
        if (cell) {
            cell.node.classList.add('ds-assistant-pending');
            this.highlightedCells.add(index);
        }
    }
    /**
     * Removes the pending-highlight CSS class from cells.
     * Clears all highlighted cells when no indices are provided.
     */
    clearHighlighting(indices) {
        const panel = this.tracker.currentWidget;
        if (!panel) {
            return;
        }
        const toClear = indices !== null && indices !== void 0 ? indices : Array.from(this.highlightedCells);
        for (const idx of toClear) {
            const cell = panel.content.widgets[idx];
            if (cell) {
                cell.node.classList.remove('ds-assistant-pending');
            }
            this.highlightedCells.delete(idx);
        }
    }
    /**
     * Applies per-hunk decisions for a pending operation.
     *
     * For 'modify' cells: if the caller computed a partial finalContent from
     *   reconstructFromHunks, that content is written to the cell.  If
     *   finalContent is undefined the cell already holds the correct LLM content
     *   (all hunks were accepted) — no write needed.
     *
     * For 'insert' cells: if decision.accept === false the inserted cell is
     *   deleted.  Otherwise it is kept as-is.
     *
     * For 'delete' cells: currently the cell is already gone in preview mode;
     *   if the user rejects the deletion we restore from originalContents and
     *   re-insert at the original index.
     *
     * Highlighting is cleared and the operation is removed from the pending map.
     */
    partialAcceptOperation(operationId, decisions) {
        const op = this.pendingOperations.get(operationId);
        if (!op)
            return;
        // Process decisions in reverse index order to avoid index shifting
        const sorted = [...decisions].sort((a, b) => b.cellIndex - a.cellIndex);
        for (const d of sorted) {
            if (d.opType === 'modify') {
                if (d.finalContent !== undefined) {
                    // Partial mix: write reconstructed content
                    this.updateCell(d.cellIndex, d.finalContent);
                }
                // If finalContent is undefined: all hunks accepted → cell is already correct
            }
            else if (d.opType === 'insert') {
                if (!d.accept) {
                    this.deleteCell(d.cellIndex);
                }
            }
            else if (d.opType === 'delete') {
                if (!d.accept) {
                    // Restore the original content.  The cell was deleted so we re-insert
                    // it at the original index.  originalContents is keyed by cell index.
                    const original = op.originalContents.get(d.cellIndex);
                    if (original !== undefined) {
                        // insertCell is async but we accept the fire-and-forget here since
                        // the index is known and no further operations depend on it.
                        void this.insertCell(d.cellIndex, 'code', original);
                    }
                }
            }
        }
        this.clearHighlighting(op.cellIndices);
        this.pendingOperations.delete(operationId);
    }
    /**
     * Marks an operation as accepted and clears its highlighting.
     */
    acceptOperation(operationId) {
        const op = this.pendingOperations.get(operationId);
        if (op) {
            this.clearHighlighting(op.cellIndices);
        }
        this.pendingOperations.delete(operationId);
    }
    /**
     * Reverses an operation: restores original content for modified cells,
     * deletes inserted cells, and clears highlighting.
     */
    undoOperation(operationId) {
        const op = this.pendingOperations.get(operationId);
        if (!op) {
            return;
        }
        // Reverse order to handle index shifts correctly
        const reversedIndices = [...op.cellIndices].reverse();
        for (const idx of reversedIndices) {
            if (op.originalContents.has(idx)) {
                // Was a modify — restore original source
                this.updateCell(idx, op.originalContents.get(idx));
            }
            else {
                // Was an insert — delete the cell
                this.deleteCell(idx);
            }
        }
        this.clearHighlighting(op.cellIndices);
        this.pendingOperations.delete(operationId);
    }
}
exports.CellEditor = CellEditor;


/***/ },

/***/ "./lib/icon.js"
/*!*********************!*\
  !*** ./lib/icon.js ***!
  \*********************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.dsAssistantIcon = void 0;
const ui_components_1 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const DS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
  <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAJ5UlEQVR42oWXW2xc13WGv733OXPnDGd4EWlxKImULVoUadkqCMGyJUuVbORao06QC2ojqNPcWqAt0L74oUVqBGhSFw2C9qVF66aFawOG48YwktZObMuR5cRSQUFmJMqUxJFIDkUOxZnh3Dhzzt67D2dEUrGTHOBgZs5l1lr/+tf61xLGGGut5dcdQojgi7VgDUI5G/csYI0GLEI6iC3vBdcFtN+/9T83yutEXUUy6mCtxeE3HJvGDUiFQOLXSzSvn6G5eB5dXsC0qiBAhmI4yX5CfaOEsxM4iV4AtPaRyuFivsoPzi5z7lqFLx3u5xP39KLNb3HgViRSOfiNMtWzz1O/+Bq6toQQAqFcUCqI0hpa85M0LryKimcI736IxP4vohLbsMYSDSliYUmlqVn3AsStAOfXwS+E2DBez52h9PozmNI8IpJAuUmMaWGNxpoWCIuQCqlCCMfF+j6N939I8+rP6Lj/j4kMH+OOVIh6U/MH9/cFuQOEBaG1th8JvdEI5bB2/lXKr/99kF9hMdpDRlM4nf2oZC8inERIMK0qXqUAtSVso4R0HKQbolUvk/3sP/BPl4ZIyjqPP7iDRssn4iqAD6dAtOEUyqF68acUf/xtBGCVIjSwn/jeE4Sz+3GSfQipbiMegK4uUZs7R/PqWzRmT5HO7uP99V1czpd55gu7McYSDQUEhI9AQBDA2SxcZek/voqtr+Hu2E/ng08S3TWxYdAYgzEaKQRCCBqe4ey1Kgd3pwnJ4Blv/j1UJMlfvp3i8THNWKaB6LoTYcxGdTgfjh6sNaz+73fxS8ukjn6N9JE/QioHawzGGkAglUJKibEWhOBMrsxfvHCZoyMpjo50sqc/Qbp3ghdO59nTG2Z87UVunPof+h5/HlSoXcRiiwNb8l65+Ca1C2/S89jTpA48irUmIBwChERKSS6XY3l5mTvv2kO6M0Wp7nFPNs6hkR5mCnXevLTAwmqDuZvrPPu1+9CVu/FL/0b1/Msk7/sCVvsg1a9wQEgsUDr5LOmH/zQwrn2QEoREtFGampri/PnzxGIx8vkFjj38Md6aLvL07w9Rvv5LDu3ro7vvLl46u8iZq1XSIY278zDpj/0N1Xf/mcTYowgnEjSwWxy4lfv6tXOU332B/s//7YaX1oKxFq/V4u2TJ1kuLJNIJNg+kKW3M8rJpRQGySd3tXjltZMoKdg9PMQDDzwABCmzOkD35hvPEO4fI3H3I1jtI2/rq0Bz8QMyR7+ymZa2c46SXJq+wMpqkYGBLImOJK4SRLp3cm6uzu+NJZm/scLgwHZ2Dw2xsJAnd+0a1kq0NiAl1hpSB5/ErywFrV3IwAEhBCiF0T5u/wihbUNBmYjAv1pL8+q5Ap19WU4cniAWkmB87hkZ4vkzBY7tTXNz4QpN39DymkhHIaWgUa/fiiHQBcCJpQkNTuC3GggpkVvFRiqHxI7xzVJrM3xqocZfvXyFZ95Y5Y2FGKJvjLvvneCns5rVuubBHQ7VpiESDuH7mlaziVKK69evo7Xe1BQEWEusbwQnHMNaGyBgrUUIQblcZnZ2Fs/zNgRQANdWGhzek+HR/d14xvKjqRJ/9/oyT714mR1dURJhRaozTSQSYcfgII7jMDg4SD6fp1gsBuVqTNCojOFaLkehsIIQItACIQStVoupqSkqlQrNZpORkRGUhMXSOqcvr/HNT2/nRu4D7ogZHjs2zI26Iqwko3fEcCJxMhlLrVrF8zy6urqYnp4mkUgwOTnJ8ePHN4Kcn5/nwsWLRKNRDhw4cHsZWms3zzY3vv/OIo+Mppi7fIGaJ/G9FqWpafp6uvjO54bbFJUk4jF8z6PRaCClZHBwENd1uXTpEo1Gg2g0smFj66dz60coFGJ0dJTV1VUGBrII4MzVEuWaz4nRDP/9w1OEXJeOjg4ASms1rl/P07utl0g4jO9rqtUqUkqKxSJKKQqFAslkkkgkEswz1pDNZrHWEo/H6ejoCBwQQmCtJZ1Ok06nsRY8bXju9BJf/93tCCFQUuE6DkopuroyRKMxlJKsNxpgLPVGHcdxSCaTKKVYXV0lFottIWDAJyklu3bt2kBBbr2rfY/ylUmEsLz43hK7eyPs6U9QKq9hjCY7OIgxhmKxxNzcHOVyeeOsVquUSiUWFhaoVqsopRgYGKBWq+H7/qYjQlDPX8Rv1kGILQ4Yg3RcnOYaC4tLvHulyhMP9KONoTPVSSQSIZfLMT8/jzEGay2e51Eul6lUKxvkdV2XWq3G0tISuVyO7u5uQqFQUAUC/FqR5txZnFA0sLlVB4wxxPce4dlf1PjUvT0kYyGMsSglOXr0KMVikYGBAXp6enBdl7m5ORYXF/FaHrOzsywvL6OkIpvNEo/H0Vpz6NAhjDEIaxBCUjr1Lzjx7naXNZuNyFiLkpKfXy7S0JKHd/lowJECozXxeJzx8XHy+TwzMzMUCgWy2SxSSlZurhCLxejt7WV+YZ6ZmRlKpVJQZo6D8T2k41I5/yMaM+8Qv+uhjU4r2VBmQdPTPP+LFZ6YSHDjH79M8Y3vI6RESIn2PcbHxzl48CDVapVYLEaj0aBSqZDJZFhZWQFAKYW1lmPHjrFzxyBa+zihMNVLb1N46SkS9z2GDEWhPbY7t6J3pOTFd5fY0xdhz/YOZp1OvJe+jams0v3xb6DcMFr7DA8PE4/HeOed06ysrDA2Nsbo6F5u3rzJ9PQ0qVSSh44cIdGRxAISKJ7+T0qvfQ+39y6SBz6DtWZDZ4Tna6ukIF9s8q1XZvnO54aJRUM0F6+w8N0/xDTKhHeOkTnxJIl9DwW7BuD5Gr/VJBqLoX0P5bjUanVi8RiiLcLruUmKb/0rzdkzIAXbHv8e8aGJYGnZdMC3jlJ88+Ur3H9nihP7uvF9H8dxKE/+hBv//lQwKwhFeOdeEgceITr8O4R7BpBuuJ2+wKA0muZqnkbuHNX3X6OVm8Sisdon8/E/J3P/FzHaR0i12QkdpTj1QZGWbzmxrxttLKotzal7j2O8JsvPPQ3GsJ67QP3yJDKawM1sQ6V6UYlUwJHGGv5aAV1ewqxXkK6LUApjDJkTf3Kb8duGsHXPt3/9g6t8+cgd7N4Wxxi7oeFW+0jHpTrzf9z4r2/h5a+gogmE62C1jzUeYAL5VhIRchGOC9ZgWjVUup+eT/4ZybHjGK0RUt6mAwCi6fm2UPHYng7zq0uStRZrNMpx8ddr3PzJc5R//gp+YT6YD10H4aj2rGHA+lgBKr2N5H2PkDn8BG6y60Ow34aAMdoKIdDaIqXYXBi29HDbnpYF4Ner1C69R/3KOVrL17CNNRAWGUvidg8QHRonducEoY5MsD1vgf0jHdBa2/bg81vXc9vemMTW9XzLu7dd1z5CSBCC37T+/z9CoeX1+S+GAgAAAABJRU5ErkJggg==" x="0" y="0" width="32" height="32"/>
</svg>`;
exports.dsAssistantIcon = new ui_components_1.LabIcon({
    name: 'varys:icon',
    svgstr: DS_ICON_SVG,
});


/***/ },

/***/ "./lib/index.js"
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
(__unused_webpack_module, exports, __webpack_require__) {


/**
 * Varys — your DS assistant for Jupyter Notebook
 * Two plugins:
 *  1. Main plugin  — sidebar chat widget
 *  2. Completion plugin — inline AI completion (ghost text)
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const application_1 = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const completer_1 = __webpack_require__(/*! @jupyterlab/completer */ "webpack/sharing/consume/default/@jupyterlab/completer");
const notebook_1 = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
const settingregistry_1 = __webpack_require__(/*! @jupyterlab/settingregistry */ "webpack/sharing/consume/default/@jupyterlab/settingregistry");
const widgets_1 = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
const SidebarWidget_1 = __webpack_require__(/*! ./sidebar/SidebarWidget */ "./lib/sidebar/SidebarWidget.js");
const NotebookReader_1 = __webpack_require__(/*! ./context/NotebookReader */ "./lib/context/NotebookReader.js");
const CellEditor_1 = __webpack_require__(/*! ./editor/CellEditor */ "./lib/editor/CellEditor.js");
const client_1 = __webpack_require__(/*! ./api/client */ "./lib/api/client.js");
const completion_1 = __webpack_require__(/*! ./completion */ "./lib/completion/index.js");
const store_1 = __webpack_require__(/*! ./reproducibility/store */ "./lib/reproducibility/store.js");
const icon_1 = __webpack_require__(/*! ./icon */ "./lib/icon.js");
const cellTagOverlay_1 = __webpack_require__(/*! ./tags/cellTagOverlay */ "./lib/tags/cellTagOverlay.js");
const outputOverlay_1 = __webpack_require__(/*! ./outputs/outputOverlay */ "./lib/outputs/outputOverlay.js");
const PLUGIN_ID = 'varys:plugin';
const COMPLETION_PLUGIN_ID = 'varys:inline-completion';
// ---------------------------------------------------------------------------
// Plugin 1 — Sidebar chat
// ---------------------------------------------------------------------------
const plugin = {
    id: PLUGIN_ID,
    description: 'AI-powered data science assistant for JupyterLab',
    autoStart: true,
    requires: [notebook_1.INotebookTracker],
    optional: [apputils_1.ICommandPalette, application_1.ILayoutRestorer],
    activate: (app, notebookTracker, palette, restorer) => {
        console.log('Varys extension activated!');
        const apiClient = new client_1.APIClient();
        const notebookReader = new NotebookReader_1.NotebookReader(notebookTracker);
        const cellEditor = new CellEditor_1.CellEditor(notebookTracker);
        const sidebar = new SidebarWidget_1.DSAssistantSidebar({
            apiClient,
            notebookReader,
            cellEditor,
            notebookTracker
        });
        sidebar.id = 'varys-sidebar';
        sidebar.title.caption = 'Varys';
        sidebar.title.label = '';
        sidebar.title.icon = icon_1.dsAssistantIcon;
        app.shell.add(sidebar, 'right', { rank: 500 });
        if (restorer) {
            restorer.add(sidebar, PLUGIN_ID);
        }
        // ── Commands ────────────────────────────────────────────────────────────
        const commandOpen = 'varys:open';
        app.commands.addCommand(commandOpen, {
            label: 'Open Varys',
            icon: icon_1.dsAssistantIcon,
            execute: () => app.shell.activateById(sidebar.id)
        });
        const commandAnalyze = 'varys:check-reproducibility';
        app.commands.addCommand(commandAnalyze, {
            label: 'Varys: Check Reproducibility',
            execute: async () => {
                var _a;
                app.shell.activateById(sidebar.id);
                const ctx = notebookReader.getFullContext();
                if (!ctx || !ctx.cells.length)
                    return;
                try {
                    const result = await apiClient.analyzeReproducibility({
                        notebookPath: (_a = ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
                        cells: ctx.cells,
                    });
                    store_1.reproStore.emit(result.issues);
                }
                catch (err) {
                    console.warn('Varys: reproducibility check failed', err);
                }
            }
        });
        if (palette) {
            palette.addItem({ command: commandOpen, category: 'Varys' });
            palette.addItem({ command: commandAnalyze, category: 'Varys' });
        }
        // ── AI cell actions — context menu + palette ─────────────────────────────
        /**
         * Return a short description of the currently active cell.
         * Uses the execution count (the [N] shown beside code cells) so the
         * message matches what the user sees on screen; falls back to the
         * 0-based index if no execution count is available.
         */
        /**
         * Extract the text the user has selected in the active cell's CodeMirror
         * editor.  Returns null when nothing is selected (cursor only).
         */
        const getEditorSelection = () => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const cell = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content.activeCell;
            if (!(cell === null || cell === void 0 ? void 0 : cell.editor))
                return null;
            const sel = cell.editor.getSelection();
            const { start, end } = sel;
            // A collapsed range means no selection.
            if (start.line === end.line && start.column === end.column)
                return null;
            const lines = cell.model.sharedModel.source.split('\n');
            if (start.line === end.line) {
                return (_c = (_b = lines[start.line]) === null || _b === void 0 ? void 0 : _b.slice(start.column, end.column)) !== null && _c !== void 0 ? _c : null;
            }
            const parts = [];
            parts.push((_e = (_d = lines[start.line]) === null || _d === void 0 ? void 0 : _d.slice(start.column)) !== null && _e !== void 0 ? _e : '');
            for (let l = start.line + 1; l < end.line; l++)
                parts.push((_f = lines[l]) !== null && _f !== void 0 ? _f : '');
            parts.push((_h = (_g = lines[end.line]) === null || _g === void 0 ? void 0 : _g.slice(0, end.column)) !== null && _h !== void 0 ? _h : '');
            return parts.join('\n') || null;
        };
        const getActiveCellRef = () => {
            var _a;
            const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
            if (!nb)
                return null;
            const cell = nb.activeCell;
            if (!cell)
                return null;
            const source = cell.model.sharedModel.source.trim();
            const type = cell.model.type;
            const execCount = cell.model.executionCount;
            const ref = execCount != null ? `exec:[${execCount}]` : `cell[${nb.activeCellIndex}]`;
            const selection = getEditorSelection();
            return { ref, source, type, selection };
        };
        /**
         * Wraps any action prompt with a selection-scope fence when text is highlighted.
         * The fence explicitly tells the LLM: only touch the selected snippet and
         * return the full cell with only that part changed.
         */
        function withSelectionScope(base) {
            return (ref, src, selection) => {
                if (!selection)
                    return base(ref, src);
                return (`In ${ref}, you MUST limit your changes to ONLY the selected snippet shown below.\n` +
                    `Do NOT modify any other lines — keep everything else in the cell exactly as-is.\n\n` +
                    `**Selected snippet to work on:**\n\`\`\`\n${selection}\n\`\`\`\n\n` +
                    `**Full cell for context (do not change lines outside the snippet):**\n\`\`\`\n${src}\n\`\`\`\n\n` +
                    `IMPORTANT: the \`content\` field in your modify step MUST contain the COMPLETE cell source ` +
                    `— copy every line outside the snippet verbatim and insert only the changed snippet in its place. ` +
                    `Do NOT drop any trailing statements, calls, or unrelated code.\n\n` +
                    `Task: ${base(ref, src)}`);
            };
        }
        const AI_ACTIONS = [
            {
                id: 'varys:explain-cell',
                label: 'Explain this cell',
                icon: '🔍',
                selector: '.jp-Notebook .jp-Cell',
                autoSend: true,
                prompt: withSelectionScope((ref, src) => `Explain what ${ref} does in plain language:\n\`\`\`\n${src}\n\`\`\``),
            },
            {
                id: 'varys:fix-errors',
                label: 'Fix errors',
                icon: '🔧',
                selector: '.jp-Notebook .jp-CodeCell',
                autoSend: true,
                prompt: withSelectionScope((ref, _src) => `Fix any bugs or errors in ${ref} and explain what was wrong.`),
            },
            {
                id: 'varys:optimize-code',
                label: 'Optimize code',
                icon: '⚡',
                selector: '.jp-Notebook .jp-CodeCell',
                autoSend: true,
                prompt: withSelectionScope((ref, _src) => `Optimize ${ref} for better performance and readability. Show the changes as a diff.`),
            },
            {
                id: 'varys:add-documentation',
                label: 'Add documentation',
                icon: '📝',
                selector: '.jp-Notebook .jp-CodeCell',
                autoSend: true,
                prompt: withSelectionScope((ref, _src) => `Add a docstring and clear inline comments to ${ref}.`),
            },
            {
                id: 'varys:generate-tests',
                label: 'Generate tests',
                icon: '🧪',
                selector: '.jp-Notebook .jp-CodeCell',
                autoSend: true,
                prompt: withSelectionScope((ref, _src) => `Generate pytest unit tests for the functions defined in ${ref}. Insert the tests in a new cell after it.`),
            },
            {
                id: 'varys:refactor-cell',
                label: 'Refactor cell',
                icon: '♻️',
                selector: '.jp-Notebook .jp-CodeCell',
                autoSend: true,
                prompt: withSelectionScope((ref, _src) => `Refactor ${ref} to improve code quality, separation of concerns, and readability.`),
            },
            {
                id: 'varys:edit-with-ai',
                label: 'Edit with AI…',
                icon: '✏️',
                selector: '.jp-Notebook .jp-Cell',
                autoSend: false,
                useContextPrefix: true,
                prompt: (ref, src, selection) => {
                    // This entire string becomes the hidden contextPrefix.
                    // The user's typed instruction is appended to it at send time.
                    if (selection) {
                        return (`Edit the selected snippet in ${ref}.\n` +
                            `**IMPORTANT: only change the selected lines — keep ALL other lines exactly as-is, ` +
                            `including any trailing calls or statements outside the selection.**\n\n` +
                            `Selected snippet:\n\`\`\`\n${selection}\n\`\`\`\n\n` +
                            `Full cell for context:\n\`\`\`\n${src}\n\`\`\`\n\n` +
                            `Your modify step MUST return the COMPLETE cell (every line), with only the selected ` +
                            `snippet replaced. Do NOT drop any lines outside the selection.\n\n` +
                            `User instruction: `);
                    }
                    return (`Edit ${ref}.\n` +
                        `Full cell source:\n\`\`\`\n${src}\n\`\`\`\n\n` +
                        `Your modify step MUST return the COMPLETE cell — copy every line you are NOT changing ` +
                        `verbatim (including trailing calls, global statements, etc.).\n\n` +
                        `User instruction: `);
                },
                display: (ref, sel) => sel ? `✏️ Edit selected snippet in ${ref}` : `✏️ Edit ${ref}`,
            },
        ];
        /**
         * Returns a short human-readable label for the chat bubble.
         * Uses the action's `display()` fn if defined, otherwise builds a default.
         */
        function chatLabel(action, ref, sel) {
            if (action.display)
                return action.display(ref, sel);
            const scope = sel ? `selected snippet in ${ref}` : ref;
            return `${action.icon} ${action.label} — ${scope}`;
        }
        // Register each command
        for (const action of AI_ACTIONS) {
            const { id, label, icon, autoSend, prompt } = action;
            app.commands.addCommand(id, {
                label: `${icon} ${label}`,
                caption: `Varys: ${label}`,
                execute: () => {
                    var _a;
                    const cell = getActiveCellRef();
                    if (!cell)
                        return;
                    app.shell.activateById(sidebar.id);
                    const fullPrompt = prompt(cell.ref, cell.source, cell.selection);
                    const displayText = chatLabel(action, cell.ref, cell.selection);
                    if (action.useContextPrefix) {
                        // The large code context goes as a hidden prefix; textarea is empty
                        // so the user just types a short instruction.
                        // Build a concise chip label + preview for the visible chip.
                        const previewText = (_a = cell.selection) !== null && _a !== void 0 ? _a : cell.source;
                        const firstLine = previewText.split('\n')[0].trim();
                        const chipLabel = `${cell.ref}${firstLine ? ' — ' + firstLine.slice(0, 48) + (firstLine.length > 48 ? '…' : '') : ''}`;
                        const chip = { label: chipLabel, preview: previewText };
                        sidebar.sendMessage('', false, displayText, fullPrompt, chip);
                    }
                    else {
                        sidebar.sendMessage(fullPrompt, autoSend, displayText);
                    }
                },
                isEnabled: () => { var _a; return !!((_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content.activeCell); },
            });
            if (palette) {
                palette.addItem({ command: id, category: 'Varys — AI Cell Actions' });
            }
        }
        // Build a "🤖 AI Actions" submenu so the context menu stays tidy
        const aiSubmenu = new widgets_1.Menu({ commands: app.commands });
        aiSubmenu.title.label = '🤖 Varys';
        for (const action of AI_ACTIONS) {
            // Insert a separator before the last item ("Edit with AI…")
            if (action.id === 'varys:edit-with-ai') {
                aiSubmenu.addItem({ type: 'separator' });
            }
            aiSubmenu.addItem({ command: action.id });
        }
        // Attach the submenu to the cell context menu
        // rank 100 puts it after standard JupyterLab items (Cut/Copy/Paste at ~1)
        // but before extension items that typically use 500+
        app.contextMenu.addItem({
            type: 'submenu',
            submenu: aiSubmenu,
            selector: '.jp-Notebook .jp-Cell',
            rank: 100,
        });
        // ── Auto-inject %%ai magic into every new kernel ─────────────────────────
        // When a notebook is opened (or its kernel is restarted), silently execute
        // `%load_ext varys.magic` so %%ai is available without
        // any manual setup.
        //
        // If loading fails (e.g. the package is not installed in the kernel env)
        // a console.warn is emitted with the exact error and the manual fallback
        // command, so the user can diagnose the issue from the browser console.
        const _injectMagic = (panel) => {
            const session = panel.sessionContext;
            const doInject = async () => {
                var _a;
                const kernel = (_a = session.session) === null || _a === void 0 ? void 0 : _a.kernel;
                if (!kernel)
                    return;
                // Resolve the server URL and token from JupyterLab's own service
                // manager so we don't rely on env vars that may not be set in the
                // kernel process.
                const { baseUrl, token } = app.serviceManager.serverSettings;
                const serverUrl = baseUrl.replace(/\/$/, '') || 'http://localhost:8888';
                // Inject server info as env vars before loading the extension, so
                // _server_url() / _token() in magic.py always find the right values.
                const code = [
                    'import os as _ds_os',
                    `_ds_os.environ['JUPYTER_SERVER_URL'] = '${serverUrl}'`,
                    ...(token ? [`_ds_os.environ['JUPYTER_TOKEN'] = '${token}'`] : []),
                    'del _ds_os',
                    '%load_ext varys.magic',
                ].join('\n');
                try {
                    const future = kernel.requestExecute({
                        code,
                        silent: false,
                        store_history: false,
                        allow_stdin: false,
                        stop_on_error: false,
                    });
                    // Watch for Python-level errors (ImportError, etc.)
                    let errorSeen = false;
                    future.onIOPub = (msg) => {
                        if (msg.header.msg_type === 'error') {
                            errorSeen = true;
                            const { ename, evalue } = msg.content;
                            console.warn(`[Varys] %%ai magic auto-load failed — ${ename}: ${evalue}\n` +
                                `To enable manually, run this in a notebook cell:\n` +
                                `  %load_ext varys.magic`);
                        }
                    };
                    await future.done;
                    if (!errorSeen) {
                        console.log('[Varys] %%ai magic loaded into kernel');
                    }
                }
                catch (err) {
                    console.warn('[Varys] %%ai magic auto-load skipped (kernel not available):', err);
                }
            };
            // Fire on first kernel ready, and again after every kernel restart
            void session.ready.then(doInject);
            session.kernelChanged.connect(doInject);
        };
        notebookTracker.widgetAdded.connect((_tracker, panel) => {
            _injectMagic(panel);
        });
        // Also cover already-open panels (e.g. restored from a previous session)
        notebookTracker.forEach(panel => _injectMagic(panel));
        // ── Tag panel command ────────────────────────────────────────────────────
        const commandTags = 'varys:open-tags';
        app.commands.addCommand(commandTags, {
            label: '🏷️ Varys: Open Tags Panel',
            caption: 'Open the Cell Tags & Metadata panel',
            execute: () => {
                app.shell.activateById(sidebar.id);
                sidebar.openTagsPanel();
            },
        });
        // Context-menu shortcut: right-click any cell → "🏷️ Edit Tags"
        app.contextMenu.addItem({
            command: commandTags,
            selector: '.jp-Notebook .jp-Cell',
            rank: 99, // just before the AI Actions submenu
        });
        if (palette) {
            palette.addItem({ command: commandTags, category: 'Varys' });
        }
        // ── Cell tag overlay (tag pills rendered directly on cells) ──────────────
        (0, cellTagOverlay_1.initCellTagOverlay)(notebookTracker);
        // ── Output overlay: badges + context menu (D + C + E) ────────────────────
        (0, outputOverlay_1.initOutputOverlay)(notebookTracker, output => {
            sidebar.sendOutputToChat(output);
        });
        // ── Cell execution listener ──────────────────────────────────────────────
        // After every cell execution, run the reproducibility rules in the
        // background and push results to the panel via reproStore.
        notebook_1.NotebookActions.executed.connect(async (_sender, { notebook: _nb }) => {
            var _a;
            // Only act when a real notebook is focused
            const panel = notebookTracker.currentWidget;
            if (!panel)
                return;
            try {
                const ctx = notebookReader.getFullContext();
                if (!ctx || !ctx.cells.length)
                    return;
                const result = await apiClient.analyzeReproducibility({
                    notebookPath: (_a = ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
                    cells: ctx.cells,
                });
                store_1.reproStore.emit(result.issues);
            }
            catch (_b) {
                // Non-fatal: reproducibility check is best-effort
            }
        });
    }
};
// ---------------------------------------------------------------------------
// Plugin 2 — Inline completion (ghost text)
// ---------------------------------------------------------------------------
const completionPlugin = {
    id: COMPLETION_PLUGIN_ID,
    description: 'Inline AI code completion for Varys',
    autoStart: true,
    requires: [notebook_1.INotebookTracker, completer_1.ICompletionProviderManager],
    optional: [settingregistry_1.ISettingRegistry],
    activate: (_app, notebookTracker, completionManager, settingRegistry) => {
        console.log('Varys: completion plugin activating...');
        try {
            const apiClient = new client_1.APIClient();
            const provider = new completion_1.DSAssistantInlineProvider(apiClient, notebookTracker);
            console.log('Varys: calling registerInlineProvider...');
            completionManager.registerInlineProvider(provider);
            console.log('Varys: registerInlineProvider succeeded');
            // Expose provider on window so we can test from browser console
            window.__dsAssistantProvider = provider;
            console.log('Varys: provider exposed as window.__dsAssistantProvider');
            // Sync our plugin.json toggle → provider enabled state
            if (settingRegistry) {
                settingRegistry
                    .load(PLUGIN_ID)
                    .then(settings => {
                    const apply = () => {
                        var _a;
                        const enabled = (_a = settings.get('inlineCompletion').composite) !== null && _a !== void 0 ? _a : true;
                        console.log(`Varys: inline completion ${enabled ? 'enabled' : 'disabled'} (from settings)`);
                        provider.configure({ enabled });
                    };
                    settings.changed.connect(apply);
                    apply();
                })
                    .catch(err => {
                    console.warn('Varys: could not load settings, defaulting to enabled', err);
                    provider.configure({ enabled: true });
                });
            }
            else {
                console.log('Varys: no settings registry, defaulting to enabled');
                provider.configure({ enabled: true });
            }
        }
        catch (err) {
            console.error('Varys: completion plugin activation FAILED:', err);
        }
    }
};
exports["default"] = [plugin, completionPlugin];


/***/ },

/***/ "./lib/outputs/outputOverlay.js"
/*!**************************************!*\
  !*** ./lib/outputs/outputOverlay.js ***!
  \**************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.initOutputOverlay = exports.extractPlotLabels = void 0;
// ─── C: Semantic label extraction from source code ───────────────────────────
/**
 * Split cell source into "plot segments" by detecting plt.show() / plt.close()
 * calls, then extract a semantic label for each segment.
 *
 * Returns an array of labels — one per image output, in order.
 * Labels fall back to '' when nothing useful can be extracted.
 */
function extractPlotLabels(source) {
    // Patterns that signal the end of one plot and the start of the next
    const showSplit = /plt\s*\.\s*(?:show|close|figure)\s*\(/g;
    const segments = [];
    let last = 0;
    let m;
    while ((m = showSplit.exec(source)) !== null) {
        segments.push(source.slice(last, m.index));
        last = m.index + m[0].length;
    }
    // Don't push the trailing segment (it's after the last plt.show)
    return segments.map(seg => {
        // 1. plt.title('…') or plt.suptitle('…')
        let match = seg.match(/plt\s*\.\s*(?:title|suptitle)\s*\(\s*['"`]([^'"`\n]+)['"`]/);
        if (match)
            return match[1].trim();
        // 2. ax.set_title('…') or axes.set_title('…')
        match = seg.match(/\.\s*set_title\s*\(\s*['"`]([^'"`\n]+)['"`]/);
        if (match)
            return match[1].trim();
        // 3. seaborn title= keyword
        match = seg.match(/\btitle\s*=\s*['"`]([^'"`\n]+)['"`]/);
        if (match)
            return match[1].trim();
        // 4. f-string or variable title: title=f'…'  (simplified)
        match = seg.match(/\btitle\s*=\s*f['"`]([^'"`\n]+)['"`]/);
        if (match)
            return match[1].replace(/\{[^}]+\}/g, '…').trim();
        // 5. df['col'].hist/plot/bar/scatter → "col histogram"
        match = seg.match(/\[['"`]([^'"`]+)['"`]\]\s*\.\s*(hist|plot|bar|scatter|boxplot|violinplot|kde)/);
        if (match)
            return `${match[1]} ${match[2]}`;
        // 6. sns.xxx(…, y='col', …) or sns.xxx(…, x='col', …)
        match = seg.match(/sns\s*\.\s*\w+\s*\([^)]*?[yx]\s*=\s*['"`]([^'"`]+)['"`]/);
        if (match)
            return match[1].trim();
        // 7. Well-known function name → humanise it
        match = seg.match(/\b(plot_\w+|draw_\w+|show_\w+|visualize_\w+|display_\w+)\s*\(/);
        if (match)
            return match[1].replace(/_/g, ' ');
        return '';
    });
}
exports.extractPlotLabels = extractPlotLabels;
/** Determine the dominant MIME type for a single output model object. */
function dominantMime(output) {
    var _a, _b, _c;
    const type = (_b = (_a = output.output_type) !== null && _a !== void 0 ? _a : output.type) !== null && _b !== void 0 ? _b : '';
    if (type === 'stream')
        return 'text/plain';
    if (type === 'error')
        return 'error';
    const data = (_c = output.data) !== null && _c !== void 0 ? _c : {};
    if (data['image/png'])
        return 'image/png';
    if (data['image/jpeg'])
        return 'image/jpeg';
    if (data['image/svg+xml'])
        return 'image/svg+xml';
    if (data['text/html'])
        return 'text/html';
    if (data['application/vnd.plotly.v1+json'])
        return 'application/vnd.plotly.v1+json';
    if (data['text/plain'])
        return 'text/plain';
    return 'unknown';
}
/** Extract a plain-text representation of a table/HTML output for the LLM. */
function tableToText(output) {
    var _a, _b;
    const data = (_a = output.data) !== null && _a !== void 0 ? _a : {};
    const html = data['text/html'];
    if (html) {
        const raw = Array.isArray(html) ? html.join('') : String(html);
        // Strip HTML tags, collapse whitespace
        return raw
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 3000)
            .trim();
    }
    const plain = (_b = data['text/plain']) !== null && _b !== void 0 ? _b : '';
    const text = Array.isArray(plain) ? plain.join('') : String(plain);
    return text.slice(0, 3000).trim();
}
/** Extract raw base64 from an image output (strips data-URI prefix). */
function extractBase64(output) {
    var _a;
    const data = (_a = output.data) !== null && _a !== void 0 ? _a : {};
    const png = data['image/png'];
    const jpeg = data['image/jpeg'];
    const raw = png !== null && png !== void 0 ? png : jpeg;
    if (!raw)
        return undefined;
    const str = Array.isArray(raw) ? raw.join('') : String(raw);
    return str.replace(/^data:image\/[^;]+;base64,/, '').trim();
}
// ─── E: Badge injection ───────────────────────────────────────────────────────
const BADGE_ATTR = 'data-ds-output-idx';
const MENU_CLASS = 'ds-output-ctx-menu';
function makeBadge(idx, label, mime) {
    const badge = document.createElement('div');
    badge.className = 'ds-output-badge';
    badge.setAttribute(BADGE_ATTR, String(idx));
    const typeIcon = mime.startsWith('image') ? '📊'
        : mime === 'text/html' ? '📋'
            : mime === 'error' ? '🔴'
                : '📝';
    badge.innerHTML =
        `<span class="ds-output-badge-num">[${idx + 1}]</span>` +
            `<span class="ds-output-badge-icon">${typeIcon}</span>` +
            (label ? `<span class="ds-output-badge-label">${label}</span>` : '');
    return badge;
}
// ─── D: Context menu ─────────────────────────────────────────────────────────
let _activeMenu = null;
function closeActiveMenu() {
    _activeMenu === null || _activeMenu === void 0 ? void 0 : _activeMenu.remove();
    _activeMenu = null;
}
function showOutputContextMenu(x, y, outputInfo, onSend) {
    closeActiveMenu();
    const menu = document.createElement('div');
    menu.className = MENU_CLASS;
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:9999`;
    const title = document.createElement('div');
    title.className = 'ds-output-ctx-menu-title';
    title.textContent = outputInfo.label;
    menu.appendChild(title);
    const btn = document.createElement('div');
    btn.className = 'ds-output-ctx-menu-item';
    btn.textContent = '🤖 Ask Varys about this output';
    btn.onclick = () => {
        closeActiveMenu();
        onSend(outputInfo);
    };
    menu.appendChild(btn);
    document.body.appendChild(menu);
    _activeMenu = menu;
    // Close on any click outside
    const close = (e) => {
        if (!menu.contains(e.target)) {
            closeActiveMenu();
            document.removeEventListener('mousedown', close);
        }
    };
    setTimeout(() => document.addEventListener('mousedown', close), 10);
}
// ─── Core: per-cell setup ─────────────────────────────────────────────────────
/**
 * Inject output badges and context-menu handlers for every output element in
 * a single code cell.
 *
 * @param cell        The JupyterLab Cell widget (or its DOM node).
 * @param cellModel   The raw cell model (for output data access).
 * @param cellIndex   0-based index of this cell in the notebook.
 * @param onSend      Called when the user triggers "Ask Varys".
 */
function setupCellOutputs(cellNode, cellModel, cellIndex, onSend) {
    var _a, _b, _c;
    const outputArea = cellNode.querySelector('.jp-Cell-outputWrapper .jp-OutputArea');
    if (!outputArea)
        return;
    const children = outputArea.querySelectorAll(':scope > .jp-OutputArea-child');
    if (!children.length)
        return;
    // Collect outputs from model
    const rawOutputs = [];
    const modelOutputs = cellModel === null || cellModel === void 0 ? void 0 : cellModel.outputs;
    if (modelOutputs) {
        const len = typeof modelOutputs.length === 'number' ? modelOutputs.length : 0;
        for (let i = 0; i < len; i++) {
            const o = modelOutputs.get ? modelOutputs.get(i) : modelOutputs[i];
            if (o)
                rawOutputs.push(o);
        }
    }
    // Derive semantic labels for image outputs
    const source = (_c = (_b = (_a = cellModel === null || cellModel === void 0 ? void 0 : cellModel.value) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : cellModel === null || cellModel === void 0 ? void 0 : cellModel.source) !== null && _c !== void 0 ? _c : '';
    const plotLabels = extractPlotLabels(source);
    let imageCount = 0;
    children.forEach((child, domIdx) => {
        var _a;
        const el = child;
        // Skip if already decorated
        if (el.querySelector('.ds-output-badge'))
            return;
        const rawOutput = rawOutputs[domIdx];
        const mime = rawOutput ? dominantMime(rawOutput) : 'unknown';
        // Skip errors and unknown (nothing useful to send)
        if (mime === 'error' || mime === 'unknown')
            return;
        // Derive label
        let semanticLabel = '';
        if (mime.startsWith('image')) {
            semanticLabel = (_a = plotLabels[imageCount]) !== null && _a !== void 0 ? _a : '';
            imageCount++;
        }
        else if (mime === 'text/html') {
            semanticLabel = 'DataFrame';
        }
        const fullLabel = semanticLabel
            ? `${semanticLabel} — cell ${cellIndex + 1}, output ${domIdx + 1}`
            : `Output ${domIdx + 1} — cell ${cellIndex + 1}`;
        // Inject badge
        const badge = makeBadge(domIdx, semanticLabel || (mime === 'text/html' ? 'DataFrame' : ''), mime);
        el.style.position = 'relative';
        el.insertBefore(badge, el.firstChild);
        // Build the SelectedOutput payload
        const buildPayload = () => {
            if (mime.startsWith('image')) {
                const imgData = rawOutput ? extractBase64(rawOutput) : undefined;
                return {
                    label: fullLabel,
                    preview: semanticLabel ? `[${mime === 'image/png' ? 'PNG' : 'Image'}: ${semanticLabel}]` : `[Image]`,
                    mimeType: mime,
                    imageData: imgData,
                    cellIndex,
                    outputIndex: domIdx,
                };
            }
            else {
                const text = rawOutput ? tableToText(rawOutput) : '';
                const firstLine = text.split('\n')[0].slice(0, 80);
                return {
                    label: fullLabel,
                    preview: firstLine || '[table/text output]',
                    mimeType: mime,
                    textData: text,
                    cellIndex,
                    outputIndex: domIdx,
                };
            }
        };
        // Hover highlight
        el.addEventListener('mouseenter', () => el.classList.add('ds-output-child--hover'));
        el.addEventListener('mouseleave', () => el.classList.remove('ds-output-child--hover'));
        // Badge click → Varys menu (native right-click is intentionally
        // NOT intercepted so the browser's Copy / Save options remain accessible)
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            showOutputContextMenu(e.clientX, e.clientY, buildPayload(), onSend);
        });
    });
}
// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Initialise the output overlay system for all notebooks managed by
 * `tracker`.  Re-decorates cells whenever:
 *   - A new notebook is opened
 *   - A cell is executed (outputs change)
 *   - Cells are added or removed
 */
function initOutputOverlay(tracker, onSend) {
    // Observers per cell node, keyed by node identity
    const cellObservers = new WeakMap();
    function decorateCell(cellWidget, cellIndex) {
        const node = cellWidget.node;
        const model = cellWidget.model;
        // Only decorate code cells that have outputs
        if ((model === null || model === void 0 ? void 0 : model.type) !== 'code')
            return;
        setupCellOutputs(node, model, cellIndex, onSend);
        // Watch for output changes (re-execution) on this cell's output area
        const outputArea = node.querySelector('.jp-Cell-outputWrapper');
        if (!outputArea)
            return;
        let existing = cellObservers.get(outputArea);
        if (!existing) {
            const obs = new MutationObserver(() => {
                // Re-decorate after a small delay to let JupyterLab finish rendering
                setTimeout(() => setupCellOutputs(node, model, cellIndex, onSend), 100);
            });
            obs.observe(outputArea, { childList: true, subtree: true });
            cellObservers.set(outputArea, obs);
            existing = obs;
        }
    }
    function decorateNotebook(notebook) {
        var _a, _b, _c;
        if (!(notebook === null || notebook === void 0 ? void 0 : notebook.widgets))
            return;
        notebook.widgets.forEach((cell, idx) => decorateCell(cell, idx));
        // Watch for cell additions/deletions
        (_c = (_b = (_a = notebook.model) === null || _a === void 0 ? void 0 : _a.cells) === null || _b === void 0 ? void 0 : _b.changed) === null || _c === void 0 ? void 0 : _c.connect(() => {
            setTimeout(() => {
                if (!notebook.widgets)
                    return;
                notebook.widgets.forEach((cell, idx) => decorateCell(cell, idx));
            }, 200);
        });
    }
    // Current notebook
    if (tracker.currentWidget) {
        decorateNotebook(tracker.currentWidget.content);
    }
    // Notebook switches / new notebooks
    tracker.currentChanged.connect((_, widget) => {
        if (!widget)
            return;
        widget.context.ready.then(() => {
            decorateNotebook(widget.content);
            // Also re-decorate when any cell is executed
            widget.content.activeCellChanged.connect(() => {
                if (!widget.content.widgets)
                    return;
                widget.content.widgets.forEach((cell, idx) => decorateCell(cell, idx));
            });
        });
    });
}
exports.initOutputOverlay = initOutputOverlay;


/***/ },

/***/ "./lib/reproducibility/ReproPanel.js"
/*!*******************************************!*\
  !*** ./lib/reproducibility/ReproPanel.js ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReproPanel = void 0;
const react_1 = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const store_1 = __webpack_require__(/*! ./store */ "./lib/reproducibility/store.js");
const IssueCard = ({ issue, onFix, onDismiss }) => {
    const [fixing, setFixing] = (0, react_1.useState)(false);
    const [dismissing, setDismissing] = (0, react_1.useState)(false);
    const handleFix = async () => {
        setFixing(true);
        try {
            await onFix(issue);
        }
        finally {
            setFixing(false);
        }
    };
    const handleDismiss = async () => {
        setDismissing(true);
        try {
            await onDismiss(issue);
        }
        finally {
            setDismissing(false);
        }
    };
    return (react_1.default.createElement("div", { className: `ds-repro-card ds-repro-card--${issue.severity}` },
        react_1.default.createElement("div", { className: "ds-repro-card-header" },
            react_1.default.createElement("span", { className: "ds-repro-card-title" }, issue.title),
            react_1.default.createElement("span", { className: "ds-repro-card-loc" },
                "Cell ",
                issue.cell_index)),
        react_1.default.createElement("div", { className: "ds-repro-card-message" }, issue.message),
        react_1.default.createElement("details", { className: "ds-repro-card-details" },
            react_1.default.createElement("summary", null, "Why it matters"),
            react_1.default.createElement("div", { className: "ds-repro-card-explanation" }, issue.explanation)),
        react_1.default.createElement("div", { className: "ds-repro-card-suggestion" }, issue.suggestion),
        react_1.default.createElement("div", { className: "ds-repro-card-actions" },
            issue.fix_code && (react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--fix", disabled: fixing, onClick: handleFix }, fixing ? '…' : '⚡ Fix')),
            react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--dismiss", disabled: dismissing, onClick: handleDismiss }, dismissing ? '…' : 'Dismiss'))));
};
const Section = ({ severity, label, icon, issues, onFix, onDismiss }) => {
    if (issues.length === 0)
        return null;
    return (react_1.default.createElement("div", { className: `ds-repro-section ds-repro-section--${severity}` },
        react_1.default.createElement("div", { className: "ds-repro-section-title" },
            icon,
            " ",
            label,
            " ",
            react_1.default.createElement("span", { className: "ds-repro-section-count" },
                "(",
                issues.length,
                ")")),
        issues.map(issue => (react_1.default.createElement(IssueCard, { key: issue.id, issue: issue, onFix: onFix, onDismiss: onDismiss })))));
};
// ---------------------------------------------------------------------------
// ReproPanel
// ---------------------------------------------------------------------------
const ReproPanel = ({ apiClient, cellEditor, notebookReader }) => {
    const [issues, setIssues] = (0, react_1.useState)(store_1.reproStore.current);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [lastAnalyzed, setLastAnalyzed] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    // Subscribe to updates pushed from index.ts cell-execution listener
    (0, react_1.useEffect)(() => {
        const handler = (newIssues) => {
            setIssues(newIssues);
            setLastAnalyzed(new Date());
            setError(null);
        };
        store_1.reproStore.subscribe(handler);
        // Load persisted issues for the current notebook on mount
        const ctx = notebookReader.getFullContext();
        if (ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) {
            apiClient.getReproIssues(ctx.notebookPath).then(result => {
                if (result.issues.length > 0) {
                    setIssues(result.issues);
                }
            }).catch(() => { });
        }
        return () => store_1.reproStore.unsubscribe(handler);
    }, []);
    const handleAnalyze = (0, react_1.useCallback)(async () => {
        var _a, _b, _c;
        setLoading(true);
        setError(null);
        try {
            const ctx = notebookReader.getFullContext();
            const result = await apiClient.analyzeReproducibility({
                notebookPath: (_a = ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
                cells: (_b = ctx === null || ctx === void 0 ? void 0 : ctx.cells) !== null && _b !== void 0 ? _b : [],
            });
            setIssues(result.issues);
            setLastAnalyzed(new Date());
            store_1.reproStore.emit(result.issues);
        }
        catch (err) {
            setError((_c = err === null || err === void 0 ? void 0 : err.message) !== null && _c !== void 0 ? _c : 'Analysis failed');
        }
        finally {
            setLoading(false);
        }
    }, [apiClient, notebookReader]);
    const handleFix = (0, react_1.useCallback)(async (issue) => {
        var _a;
        if (!issue.fix_code)
            return;
        // Insert/update the cell at the issue's cell_index with the fix code
        try {
            await cellEditor.updateCell(issue.cell_index, issue.fix_code);
        }
        catch (_b) {
            // If updateCell fails (e.g., insert-type fix), insert a new cell
            cellEditor.insertCell(issue.cell_index + 1, 'code', issue.fix_code);
        }
        // Dismiss from DB so it disappears from the panel
        const ctx = notebookReader.getFullContext();
        await apiClient.dismissReproIssue({
            notebookPath: (_a = ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
            issueId: issue.id,
        });
        setIssues(prev => prev.filter(i => i.id !== issue.id));
    }, [apiClient, cellEditor, notebookReader]);
    const handleDismiss = (0, react_1.useCallback)(async (issue) => {
        var _a;
        const ctx = notebookReader.getFullContext();
        await apiClient.dismissReproIssue({
            notebookPath: (_a = ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
            issueId: issue.id,
        });
        setIssues(prev => prev.filter(i => i.id !== issue.id));
    }, [apiClient, notebookReader]);
    const handleFixAll = (0, react_1.useCallback)(async () => {
        const fixable = issues.filter(i => i.fix_code);
        for (const issue of fixable) {
            await handleFix(issue);
        }
    }, [issues, handleFix]);
    const critical = issues.filter(i => i.severity === 'critical');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');
    return (react_1.default.createElement("div", { className: "ds-repro-panel" },
        react_1.default.createElement("div", { className: "ds-repro-panel-header" },
            react_1.default.createElement("span", { className: "ds-repro-panel-title" }, "\uD83D\uDEE1\uFE0F Reproducibility"),
            issues.length > 0 && (react_1.default.createElement("span", { className: `ds-repro-badge ds-repro-badge--${critical.length > 0 ? 'critical' : 'warning'}` }, issues.length))),
        issues.length > 0 && (react_1.default.createElement("div", { className: "ds-repro-counts" },
            critical.length > 0 && react_1.default.createElement("span", { className: "ds-repro-count ds-repro-count--critical" },
                "\u274C ",
                critical.length,
                " critical"),
            warnings.length > 0 && react_1.default.createElement("span", { className: "ds-repro-count ds-repro-count--warning" },
                "\u26A0\uFE0F ",
                warnings.length,
                " warning",
                warnings.length !== 1 ? 's' : ''),
            info.length > 0 && react_1.default.createElement("span", { className: "ds-repro-count ds-repro-count--info" },
                "\u2139\uFE0F ",
                info.length))),
        react_1.default.createElement("div", { className: "ds-repro-issues" },
            issues.length === 0 && !loading && (react_1.default.createElement("div", { className: "ds-repro-all-ok" },
                "\u2705 No reproducibility issues found",
                lastAnalyzed && (react_1.default.createElement("div", { className: "ds-repro-timestamp" },
                    "Analyzed ",
                    lastAnalyzed.toLocaleTimeString())))),
            react_1.default.createElement(Section, { severity: "critical", label: "Critical", icon: "\u274C", issues: critical, onFix: handleFix, onDismiss: handleDismiss }),
            react_1.default.createElement(Section, { severity: "warning", label: "Warnings", icon: "\u26A0\uFE0F", issues: warnings, onFix: handleFix, onDismiss: handleDismiss }),
            react_1.default.createElement(Section, { severity: "info", label: "Info", icon: "\u2139\uFE0F", issues: info, onFix: handleFix, onDismiss: handleDismiss })),
        error && react_1.default.createElement("div", { className: "ds-repro-error" }, error),
        react_1.default.createElement("div", { className: "ds-repro-footer" },
            react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--analyze", onClick: handleAnalyze, disabled: loading }, loading ? '⏳ Analyzing…' : '🔍 Analyze'),
            issues.some(i => i.fix_code) && (react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--fixall", onClick: handleFixAll }, "\u26A1 Fix All")),
            lastAnalyzed && issues.length > 0 && (react_1.default.createElement("span", { className: "ds-repro-timestamp" }, lastAnalyzed.toLocaleTimeString())))));
};
exports.ReproPanel = ReproPanel;


/***/ },

/***/ "./lib/reproducibility/store.js"
/*!**************************************!*\
  !*** ./lib/reproducibility/store.js ***!
  \**************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reproStore = void 0;
class ReproStore {
    constructor() {
        this._listeners = [];
        this._issues = [];
    }
    emit(issues) {
        this._issues = issues;
        this._listeners.forEach(fn => fn(issues));
    }
    get current() {
        return this._issues;
    }
    subscribe(fn) {
        this._listeners.push(fn);
    }
    unsubscribe(fn) {
        this._listeners = this._listeners.filter(l => l !== fn);
    }
}
exports.reproStore = new ReproStore();


/***/ },

/***/ "./lib/sidebar/SidebarWidget.js"
/*!**************************************!*\
  !*** ./lib/sidebar/SidebarWidget.js ***!
  \**************************************/
(__unused_webpack_module, exports, __webpack_require__) {


/**
 * SidebarWidget - Main chat interface for Varys.
 * Renders as a ReactWidget in the JupyterLab right sidebar.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DSAssistantSidebar = exports.setExternalMessageListener = void 0;
const react_1 = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const marked_1 = __webpack_require__(/*! marked */ "./node_modules/marked/lib/marked.esm.js");
const dompurify_1 = __importDefault(__webpack_require__(/*! dompurify */ "./node_modules/dompurify/dist/purify.cjs.js"));
const VariableResolver_1 = __webpack_require__(/*! ../context/VariableResolver */ "./lib/context/VariableResolver.js");
const DiffView_1 = __webpack_require__(/*! ../ui/DiffView */ "./lib/ui/DiffView.js");
const ReproPanel_1 = __webpack_require__(/*! ../reproducibility/ReproPanel */ "./lib/reproducibility/ReproPanel.js");
const TagsPanel_1 = __webpack_require__(/*! ../tags/TagsPanel */ "./lib/tags/TagsPanel.js");
// ---------------------------------------------------------------------------
// Markdown renderer (shared by assistant, system, code-review messages)
// ---------------------------------------------------------------------------
// Configure marked once: GFM (tables, task lists, etc.) with line breaks.
marked_1.marked.setOptions({ breaks: true, gfm: true });
/**
 * Extract all fenced code blocks from a markdown string.
 * Returns the code content without the fence lines.
 */
function extractCodeBlocks(text) {
    const blocks = [];
    const fenceRe = /```(?:\w*)\n([\s\S]*?)```/g;
    let m;
    while ((m = fenceRe.exec(text)) !== null) {
        const code = m[1].trim();
        if (code)
            blocks.push(code);
    }
    return blocks;
}
// Custom marked renderer: wraps fenced code blocks in a container div so the
// delegated click handler can locate the copy button and its code sibling.
const _markedRenderer = new marked_1.marked.Renderer();
_markedRenderer.code = function ({ text, lang }) {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const langAttr = lang ? ` class="language-${lang}"` : '';
    return (`<div class="ds-code-block-wrapper">` +
        `<button class="ds-copy-code-btn" aria-label="Copy code">Copy</button>` +
        `<pre><code${langAttr}>${escaped}</code></pre>` +
        `</div>`);
};
function renderMarkdown(text) {
    // Guard against null/undefined during streaming
    if (!text)
        return '';
    try {
        const raw = marked_1.marked.parse(text, { renderer: _markedRenderer });
        // Sanitize to prevent XSS while keeping all formatting elements.
        // 'button' is added so copy buttons survive the sanitizer.
        return dompurify_1.default.sanitize(raw, {
            ALLOWED_TAGS: [
                'p', 'br', 'b', 'i', 'strong', 'em', 's', 'code', 'pre', 'blockquote',
                'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'a', 'hr', 'span', 'div', 'button',
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'aria-label'],
        });
    }
    catch (_a) {
        return text;
    }
}
// Report generation is triggered only by the explicit /report command.
// Keyword-based detection was removed: it was fragile (e.g. "write a report
// on cell 5" or "don't generate a report" both matched incorrectly).
// ---------------------------------------------------------------------------
// Advisory disambiguation — phrases that suggest a discussion/question intent
// When detected on a plain (non-command) message, we surface two options to
// the user instead of silently guessing.
// ---------------------------------------------------------------------------
const _ADVISORY_STARTS = [
    'what ', 'how ', 'why ', 'when ', 'where ', 'who ', 'which ',
    'explain ', 'describe ', 'tell me', 'can you tell',
    'summarize ', 'summarise ', 'give me a summary', 'give me an overview',
    'what is ', 'what are ', 'what does ', 'what do ',
    'how does ', 'how do ', 'how can ', 'how would ',
    'is there ', 'are there ',
    'interpret ', 'analyse ', 'analyze ',
    'look at ',
];
function looksAdvisory(message, phrases = _ADVISORY_STARTS) {
    const low = message.toLowerCase().trim();
    if (low.endsWith('?'))
        return true;
    return phrases.some(p => low.startsWith(p.toLowerCase()));
}
const DisambiguationCard = ({ originalMessage, msgId, onChoice, }) => {
    const preview = originalMessage.length > 55
        ? originalMessage.slice(0, 55) + '…'
        : originalMessage;
    const cmdPreview = originalMessage.length > 40
        ? originalMessage.slice(0, 40) + '…'
        : originalMessage;
    return (react_1.default.createElement("div", { className: "ds-disambig-card" },
        react_1.default.createElement("div", { className: "ds-disambig-header" },
            react_1.default.createElement("span", { className: "ds-disambig-icon" }, "\u2753"),
            react_1.default.createElement("span", { className: "ds-disambig-title" }, "Where should the answer go?")),
        react_1.default.createElement("div", { className: "ds-disambig-hint" },
            react_1.default.createElement("em", null,
                "\"",
                preview,
                "\"")),
        react_1.default.createElement("div", { className: "ds-disambig-options" },
            react_1.default.createElement("button", { className: "ds-disambig-btn ds-disambig-btn--chat", onClick: () => onChoice('chat', msgId), title: `/chat ${originalMessage}` },
                react_1.default.createElement("span", { className: "ds-disambig-btn-icon" }, "\uD83D\uDCAC"),
                react_1.default.createElement("span", { className: "ds-disambig-btn-body" },
                    react_1.default.createElement("strong", null, "Answer in chat"),
                    react_1.default.createElement("code", null,
                        "/chat ",
                        cmdPreview))),
            react_1.default.createElement("button", { className: "ds-disambig-btn ds-disambig-btn--cell", onClick: () => onChoice('cell', msgId), title: originalMessage },
                react_1.default.createElement("span", { className: "ds-disambig-btn-icon" }, "\uD83D\uDCDD"),
                react_1.default.createElement("span", { className: "ds-disambig-btn-body" },
                    react_1.default.createElement("strong", null, "Write to notebook"),
                    react_1.default.createElement("code", null, cmdPreview))))));
};
let _extMsgListener = null;
/** Called by the React component on mount to subscribe. */
function setExternalMessageListener(fn) {
    _extMsgListener = fn;
}
exports.setExternalMessageListener = setExternalMessageListener;
/** Called by the widget's sendMessage() method. */
function _dispatchExternalMessage(msg) {
    _extMsgListener === null || _extMsgListener === void 0 ? void 0 : _extMsgListener(msg);
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
// ---------------------------------------------------------------------------
// Provider badge helpers
// ---------------------------------------------------------------------------
function providerLabel(p) {
    return p === 'ollama' ? '🖥' : '☁';
}
function shortModel(model) {
    var _a;
    const base = model.split(':')[0];
    if (base.startsWith('claude-')) {
        const parts = base.split('-');
        return (_a = parts[1]) !== null && _a !== void 0 ? _a : base; // "sonnet", "haiku"
    }
    return base.split('-')[0]; // "qwen2.5", "codellama"
}
const ProviderBadge = ({ status }) => {
    const { chat, inline, multiline } = status.providers;
    const allSame = chat.provider === inline.provider && chat.provider === multiline.provider;
    const tooltipLines = [
        `chat: ${chat.provider} / ${chat.model || '—'}`,
        `inline: ${inline.provider} / ${inline.model || '—'}`,
        `multiline: ${multiline.provider} / ${multiline.model || '—'}`
    ].join('\n');
    if (allSame) {
        return (react_1.default.createElement("span", { className: `ds-provider-badge ds-provider-badge-${chat.provider}`, title: tooltipLines },
            providerLabel(chat.provider),
            "\u00A0",
            react_1.default.createElement("span", { className: "ds-provider-model" }, shortModel(chat.model))));
    }
    const completionProvider = inline.provider;
    return (react_1.default.createElement("span", { className: "ds-provider-badge ds-provider-badge-hybrid", title: tooltipLines },
        react_1.default.createElement("span", { className: `ds-provider-segment ds-provider-segment-${chat.provider}` },
            providerLabel(chat.provider),
            "\u00A0chat"),
        react_1.default.createElement("span", { className: "ds-provider-separator" }, "\u00B7"),
        react_1.default.createElement("span", { className: `ds-provider-segment ds-provider-segment-${completionProvider}` },
            providerLabel(completionProvider),
            "\u00A0\u21B9")));
};
// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------
const PROVIDER_LIST = ['ANTHROPIC', 'OPENAI', 'GOOGLE', 'BEDROCK', 'AZURE', 'OPENROUTER', 'OLLAMA'];
/** Default model zoo per provider — shown if the user has nothing in .env yet. */
const DEFAULT_ZOO = {
    ANTHROPIC_MODELS: [
        'claude-sonnet-4-6',
        'claude-haiku-4-5-20251001',
        'claude-opus-4',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
    ],
    OPENAI_MODELS: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini'],
    GOOGLE_MODELS: [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
    ],
    BEDROCK_MODELS: [
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'anthropic.claude-3-5-haiku-20241022-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'meta.llama3-70b-instruct-v1:0',
        'mistral.mistral-large-2402-v1:0',
    ],
    AZURE_MODELS: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    OPENROUTER_MODELS: [
        'anthropic/claude-sonnet-4-6',
        'anthropic/claude-haiku-4-5',
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'google/gemini-2.0-flash',
        'google/gemini-2.0-flash-lite',
        'meta-llama/llama-3.3-70b-instruct',
        'mistralai/mistral-large-2',
        'deepseek/deepseek-r1',
        'qwen/qwen-2.5-72b-instruct',
    ],
    OLLAMA_MODELS: [
        'qwen2.5-coder:7b-instruct',
        'qwen2.5-coder:1.5b-instruct',
        'llama3.2:3b',
        'mistral:7b',
        'deepseek-coder-v2',
    ],
};
const parseZoo = (raw) => raw.split(',').map(s => s.trim()).filter(Boolean);
const serializeZoo = (models) => models.join(',');
/** Return models from the zoo value, falling back to built-in defaults. */
const getZooModels = (zooKey, values) => {
    var _a, _b;
    const raw = (_a = values[zooKey]) !== null && _a !== void 0 ? _a : '';
    return raw.trim() ? parseZoo(raw) : (_b = DEFAULT_ZOO[zooKey]) !== null && _b !== void 0 ? _b : [];
};
const TAB_GROUPS = [
    {
        id: 'routing',
        label: 'Routing',
        providerKey: null,
        zooKey: null,
        fields: [
            { key: 'DS_CHAT_PROVIDER', label: 'Chat', type: 'select' },
            { key: 'DS_INLINE_PROVIDER', label: 'Inline', type: 'select' },
            { key: 'DS_MULTILINE_PROVIDER', label: 'Multiline', type: 'select' },
            { key: 'DS_EMBED_PROVIDER', label: 'Embedding', type: 'select' },
        ]
    },
    {
        id: 'anthropic',
        label: 'Anthropic',
        providerKey: 'ANTHROPIC',
        zooKey: 'ANTHROPIC_MODELS',
        fields: [
            { key: 'ANTHROPIC_API_KEY', label: 'API key', type: 'password' },
            { key: 'ANTHROPIC_CHAT_MODEL', label: 'Chat model', type: 'model-select' },
            { key: 'ANTHROPIC_INLINE_MODEL', label: 'Inline model', type: 'model-select' },
            { key: 'ANTHROPIC_MULTILINE_MODEL', label: 'Multiline model', type: 'model-select' },
            { key: 'ANTHROPIC_EMBED_MODEL', label: 'Embedding model', type: 'model-select' },
        ]
    },
    {
        id: 'openai',
        label: 'OpenAI',
        providerKey: 'OPENAI',
        zooKey: 'OPENAI_MODELS',
        fields: [
            { key: 'OPENAI_API_KEY', label: 'API key', type: 'password' },
            { key: 'OPENAI_CHAT_MODEL', label: 'Chat model', type: 'model-select' },
            { key: 'OPENAI_INLINE_MODEL', label: 'Inline model', type: 'model-select' },
            { key: 'OPENAI_MULTILINE_MODEL', label: 'Multiline model', type: 'model-select' },
            { key: 'OPENAI_EMBED_MODEL', label: 'Embedding model', type: 'model-select' },
        ]
    },
    {
        id: 'google',
        label: 'Google',
        providerKey: 'GOOGLE',
        zooKey: 'GOOGLE_MODELS',
        fields: [
            { key: 'GOOGLE_API_KEY', label: 'API key', type: 'password' },
            { key: 'GOOGLE_CHAT_MODEL', label: 'Chat model', type: 'model-select' },
            { key: 'GOOGLE_INLINE_MODEL', label: 'Inline model', type: 'model-select' },
            { key: 'GOOGLE_MULTILINE_MODEL', label: 'Multiline model', type: 'model-select' },
            { key: 'GOOGLE_EMBED_MODEL', label: 'Embedding model', type: 'model-select' },
        ]
    },
    {
        id: 'bedrock',
        label: 'Bedrock',
        providerKey: 'BEDROCK',
        zooKey: 'BEDROCK_MODELS',
        fields: [
            { key: 'AWS_ACCESS_KEY_ID', label: 'Access key ID', type: 'password' },
            { key: 'AWS_SECRET_ACCESS_KEY', label: 'Secret access key', type: 'password' },
            { key: 'AWS_SESSION_TOKEN', label: 'Session token', type: 'password', placeholder: '(optional)' },
            { key: 'AWS_REGION', label: 'Region', type: 'text', placeholder: 'us-east-1' },
            { key: 'BEDROCK_CHAT_MODEL', label: 'Chat model ID', type: 'model-select' },
            { key: 'BEDROCK_INLINE_MODEL', label: 'Inline model ID', type: 'model-select' },
            { key: 'BEDROCK_MULTILINE_MODEL', label: 'Multiline model ID', type: 'model-select' },
            { key: 'BEDROCK_EMBED_MODEL', label: 'Embedding model', type: 'model-select' },
        ]
    },
    {
        id: 'azure',
        label: 'Azure',
        providerKey: 'AZURE',
        zooKey: 'AZURE_MODELS',
        fields: [
            { key: 'AZURE_OPENAI_API_KEY', label: 'API key', type: 'password' },
            { key: 'AZURE_OPENAI_ENDPOINT', label: 'Endpoint URL', type: 'text', placeholder: 'https://YOUR-RESOURCE.openai.azure.com/' },
            { key: 'AZURE_OPENAI_API_VERSION', label: 'API version', type: 'text', placeholder: '2024-02-01' },
            { key: 'AZURE_CHAT_MODEL', label: 'Chat deployment', type: 'model-select' },
            { key: 'AZURE_INLINE_MODEL', label: 'Inline deployment', type: 'model-select' },
            { key: 'AZURE_MULTILINE_MODEL', label: 'Multiline deployment', type: 'model-select' },
            { key: 'AZURE_EMBED_MODEL', label: 'Embedding deployment', type: 'model-select' },
        ]
    },
    {
        id: 'openrouter',
        label: 'OpenRouter',
        providerKey: 'OPENROUTER',
        zooKey: 'OPENROUTER_MODELS',
        fields: [
            { key: 'OPENROUTER_API_KEY', label: 'API key', type: 'password' },
            { key: 'OPENROUTER_SITE_URL', label: 'Site URL (optional)', type: 'text', placeholder: 'https://your-app.com' },
            { key: 'OPENROUTER_SITE_NAME', label: 'Site name (optional)', type: 'text', placeholder: 'Varys' },
            { key: 'OPENROUTER_CHAT_MODEL', label: 'Chat model', type: 'model-select' },
            { key: 'OPENROUTER_INLINE_MODEL', label: 'Inline model', type: 'model-select' },
            { key: 'OPENROUTER_MULTILINE_MODEL', label: 'Multiline model', type: 'model-select' },
            { key: 'OPENROUTER_EMBED_MODEL', label: 'Embedding model', type: 'model-select' },
        ]
    },
    {
        id: 'ollama',
        label: 'Ollama',
        providerKey: 'OLLAMA',
        zooKey: 'OLLAMA_MODELS',
        fields: [
            { key: 'OLLAMA_URL', label: 'Server URL', type: 'text', placeholder: 'http://localhost:11434' },
            { key: 'OLLAMA_CHAT_MODEL', label: 'Chat model', type: 'model-select' },
            { key: 'OLLAMA_INLINE_MODEL', label: 'Inline model', type: 'model-select' },
            { key: 'OLLAMA_MULTILINE_MODEL', label: 'Multiline model', type: 'model-select' },
            { key: 'OLLAMA_EMBED_MODEL', label: 'Embedding model', type: 'model-select' },
        ]
    },
    {
        id: 'rag',
        label: 'Knowledge',
        providerKey: null,
        zooKey: null,
        fields: [] // no form fields here — just the index status widget below
    },
];
const RAGStatusSection = ({ apiClient, notebookPath = '' }) => {
    var _a;
    const [status, setStatus] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const refresh = async () => {
        setLoading(true);
        try {
            const s = await apiClient.ragStatus(notebookPath);
            setStatus(s);
        }
        catch (_a) {
            setStatus(null);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => { void refresh(); }, []);
    if (loading) {
        return (react_1.default.createElement("div", { className: "ds-rag-status" },
            react_1.default.createElement("span", { className: "ds-rag-status-loading" }, "Checking index\u2026")));
    }
    if (!status)
        return null;
    if (!status.available) {
        return (react_1.default.createElement("div", { className: "ds-rag-status ds-rag-status--unavailable" },
            react_1.default.createElement("p", null, "\u26A0\uFE0F RAG dependencies not installed."),
            react_1.default.createElement("code", null, (_a = status.hint) !== null && _a !== void 0 ? _a : 'pip install chromadb sentence-transformers')));
    }
    return (react_1.default.createElement("div", { className: "ds-rag-status" },
        react_1.default.createElement("div", { className: "ds-rag-status-header" },
            react_1.default.createElement("span", { className: "ds-rag-status-title" }, "\uD83D\uDCDA Knowledge base"),
            react_1.default.createElement("button", { className: "ds-rag-status-refresh", onClick: () => void refresh(), title: "Refresh" }, "\u21BB")),
        react_1.default.createElement("div", { className: "ds-rag-status-stats" },
            react_1.default.createElement("span", null,
                react_1.default.createElement("strong", null, status.total_chunks),
                " chunks"),
            react_1.default.createElement("span", null,
                react_1.default.createElement("strong", null, status.indexed_files),
                " files indexed")),
        status.indexed_files > 0 && (react_1.default.createElement("div", { className: "ds-rag-status-files" },
            status.files.slice(0, 8).map((f) => (react_1.default.createElement("div", { key: f, className: "ds-rag-status-file", title: f }, f.split('/').pop()))),
            status.files.length > 8 && (react_1.default.createElement("div", { className: "ds-rag-status-file ds-rag-status-file--more" },
                "+",
                status.files.length - 8,
                " more\u2026")))),
        status.indexed_files === 0 && status.available && (react_1.default.createElement("div", { className: "ds-rag-status-empty" },
            "No files indexed yet. Drop files in ",
            react_1.default.createElement("code", null, ".jupyter-assistant/knowledge/"),
            " then run ",
            react_1.default.createElement("code", null, "/index"),
            " in chat."))));
};
const ModelZooSection = ({ zooKey, values, onChange }) => {
    const [newModel, setNewModel] = (0, react_1.useState)('');
    const models = getZooModels(zooKey, values);
    const commit = (updated) => onChange(zooKey, serializeZoo(updated));
    const handleAdd = () => {
        const name = newModel.trim();
        if (!name || models.includes(name))
            return;
        commit([...models, name]);
        setNewModel('');
    };
    const handleRemove = (name) => commit(models.filter(m => m !== name));
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };
    return (react_1.default.createElement("div", { className: "ds-settings-zoo" },
        react_1.default.createElement("div", { className: "ds-settings-zoo-header" },
            react_1.default.createElement("span", { className: "ds-settings-zoo-title" }, "Model Zoo"),
            react_1.default.createElement("span", { className: "ds-settings-zoo-count" }, models.length)),
        react_1.default.createElement("div", { className: "ds-settings-zoo-chips" },
            models.map(m => (react_1.default.createElement("span", { key: m, className: "ds-settings-zoo-chip", title: m },
                react_1.default.createElement("span", { className: "ds-settings-zoo-chip-name" }, m),
                react_1.default.createElement("button", { className: "ds-settings-zoo-chip-remove", onClick: () => handleRemove(m), title: `Remove ${m}` }, "\u00D7")))),
            models.length === 0 && (react_1.default.createElement("span", { className: "ds-settings-zoo-empty" }, "No models yet \u2014 add one below."))),
        react_1.default.createElement("div", { className: "ds-settings-zoo-add" },
            react_1.default.createElement("input", { className: "ds-settings-zoo-add-input", value: newModel, onChange: e => setNewModel(e.target.value), onKeyDown: handleKeyDown, placeholder: "Type model name and press Enter\u2026", autoComplete: "off", spellCheck: false }),
            react_1.default.createElement("button", { className: "ds-settings-zoo-add-btn", onClick: handleAdd, disabled: !newModel.trim() || models.includes(newModel.trim()), title: "Add to zoo" }, "+ Add"))));
};
// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------
const ModelsPanel = ({ apiClient, onClose, onSaved, notebookPath = '', }) => {
    var _a, _b, _c, _d, _e;
    const [values, setValues] = (0, react_1.useState)({});
    const [masked, setMasked] = (0, react_1.useState)({});
    const [envPath, setEnvPath] = (0, react_1.useState)('');
    const [envExists, setEnvExists] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)('routing');
    const [status, setStatus] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        apiClient
            .getSettings()
            .then(data => {
            var _a, _b, _c;
            const v = {};
            const m = {};
            for (const [k, entry] of Object.entries(data)) {
                if (k.startsWith('_'))
                    continue;
                const e = entry;
                v[k] = (_a = e.value) !== null && _a !== void 0 ? _a : '';
                m[k] = (_b = e.masked) !== null && _b !== void 0 ? _b : false;
            }
            // Pre-seed zoo defaults so dropdowns always have options
            for (const zooKey of Object.keys(DEFAULT_ZOO)) {
                if (!v[zooKey])
                    v[zooKey] = DEFAULT_ZOO[zooKey].join(',');
            }
            setValues(v);
            setMasked(m);
            setEnvPath(String((_c = data._env_path) !== null && _c !== void 0 ? _c : ''));
            setEnvExists(Boolean(data._env_exists));
            setLoading(false);
        })
            .catch(err => {
            setStatus({ type: 'error', text: `Failed to load: ${err}` });
            setLoading(false);
        });
    }, [apiClient]);
    const handleChange = (key, value) => {
        setValues(v => (Object.assign(Object.assign({}, v), { [key]: value })));
        if (masked[key])
            setMasked(m => (Object.assign(Object.assign({}, m), { [key]: false })));
    };
    const handleSave = async () => {
        var _a;
        setSaving(true);
        setStatus(null);
        try {
            const result = await apiClient.saveSettings(values);
            if (result.error) {
                setStatus({ type: 'error', text: result.error });
            }
            else {
                setStatus({
                    type: 'success',
                    text: `Saved ${((_a = result.updated) !== null && _a !== void 0 ? _a : []).length} setting(s). Active immediately.`
                });
                // Notify parent so the model switcher refreshes immediately.
                onSaved === null || onSaved === void 0 ? void 0 : onSaved();
            }
        }
        catch (err) {
            setStatus({ type: 'error', text: `Save failed: ${err}` });
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return react_1.default.createElement("div", { className: "ds-settings-loading" }, "Loading settings\u2026");
    }
    const activeProviders = new Set([
        ((_a = values['DS_CHAT_PROVIDER']) !== null && _a !== void 0 ? _a : '').toUpperCase(),
        ((_b = values['DS_INLINE_PROVIDER']) !== null && _b !== void 0 ? _b : '').toUpperCase(),
        ((_c = values['DS_MULTILINE_PROVIDER']) !== null && _c !== void 0 ? _c : '').toUpperCase(),
        ((_d = values['DS_EMBED_PROVIDER']) !== null && _d !== void 0 ? _d : '').toUpperCase(),
    ]);
    const currentGroup = (_e = TAB_GROUPS.find(g => g.id === activeTab)) !== null && _e !== void 0 ? _e : TAB_GROUPS[0];
    const TASK_LABELS = {
        DS_CHAT_PROVIDER: 'Chat',
        DS_INLINE_PROVIDER: 'Inline',
        DS_MULTILINE_PROVIDER: 'Multiline',
        DS_EMBED_PROVIDER: 'Embedding',
    };
    return (react_1.default.createElement("div", { className: "ds-settings-panel" },
        react_1.default.createElement("div", { className: "ds-settings-tabbar" }, TAB_GROUPS.map(tab => {
            const isActive = tab.id === activeTab;
            const hasDot = tab.providerKey !== null && activeProviders.has(tab.providerKey);
            return (react_1.default.createElement("button", { key: tab.id, className: `ds-settings-tab${isActive ? ' ds-settings-tab--active' : ''}`, onClick: () => setActiveTab(tab.id), title: tab.label },
                tab.label,
                hasDot && react_1.default.createElement("span", { className: "ds-settings-tab-dot", title: "Active for one or more tasks" })));
        })),
        react_1.default.createElement("div", { className: "ds-settings-tab-content" }, currentGroup.id === 'routing' ? (react_1.default.createElement("div", { className: "ds-settings-routing-grid" }, currentGroup.fields.map(field => {
            var _a, _b;
            return (react_1.default.createElement(react_1.default.Fragment, { key: field.key },
                react_1.default.createElement("label", { className: "ds-settings-label" }, (_a = TASK_LABELS[field.key]) !== null && _a !== void 0 ? _a : field.label),
                react_1.default.createElement("select", { className: "ds-settings-select", value: (_b = values[field.key]) !== null && _b !== void 0 ? _b : '', onChange: e => handleChange(field.key, e.target.value) },
                    react_1.default.createElement("option", { value: "" }, "\u2014 select provider \u2014"),
                    PROVIDER_LIST.map(p => (react_1.default.createElement("option", { key: p, value: p }, p))))));
        }))) : (react_1.default.createElement(react_1.default.Fragment, null,
            currentGroup.fields.map(field => {
                var _a, _b, _c;
                if (field.type === 'model-select') {
                    const zoo = currentGroup.zooKey ? getZooModels(currentGroup.zooKey, values) : [];
                    const cur = (_a = values[field.key]) !== null && _a !== void 0 ? _a : '';
                    const options = cur && !zoo.includes(cur) ? [cur, ...zoo] : zoo;
                    return (react_1.default.createElement("div", { key: field.key, className: "ds-settings-row" },
                        react_1.default.createElement("label", { className: "ds-settings-label" }, field.label),
                        react_1.default.createElement("select", { className: "ds-settings-select", value: cur, onChange: e => handleChange(field.key, e.target.value) },
                            options.length === 0 && (react_1.default.createElement("option", { value: "" }, "\u2014 add models to zoo below \u2014")),
                            options.map(m => (react_1.default.createElement("option", { key: m, value: m }, m))))));
                }
                return (react_1.default.createElement("div", { key: field.key, className: "ds-settings-row" },
                    react_1.default.createElement("label", { className: "ds-settings-label" }, field.label),
                    react_1.default.createElement("input", { className: "ds-settings-input", type: field.type === 'password' && masked[field.key] ? 'password' : 'text', value: (_b = values[field.key]) !== null && _b !== void 0 ? _b : '', onChange: e => handleChange(field.key, e.target.value), placeholder: field.type === 'password' ? '(unchanged)' : ((_c = field.placeholder) !== null && _c !== void 0 ? _c : ''), autoComplete: "off" })));
            }),
            currentGroup.id === 'rag' && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "ds-rag-routing-summary" },
                    react_1.default.createElement("div", { className: "ds-rag-routing-row" },
                        react_1.default.createElement("span", { className: "ds-rag-routing-label" }, "Embedding provider"),
                        react_1.default.createElement("span", { className: "ds-rag-routing-value" }, (values['DS_EMBED_PROVIDER'] || '—').toUpperCase())),
                    react_1.default.createElement("div", { className: "ds-rag-routing-row" },
                        react_1.default.createElement("span", { className: "ds-rag-routing-label" }, "Embedding model"),
                        react_1.default.createElement("span", { className: "ds-rag-routing-value" }, (() => {
                            var _a;
                            const p = ((_a = values['DS_EMBED_PROVIDER']) !== null && _a !== void 0 ? _a : '').toUpperCase();
                            return p ? (values[`${p}_EMBED_MODEL`] || '— (use model zoo)') : '—';
                        })())),
                    react_1.default.createElement("p", { className: "ds-rag-routing-hint" },
                        "Configure the provider in ",
                        react_1.default.createElement("strong", null, "Routing \u2192 Embedding"),
                        " and the model in the provider tab's ",
                        react_1.default.createElement("em", null, "Embedding model"),
                        " field.")),
                react_1.default.createElement("div", { className: "ds-rag-storage-hint" },
                    react_1.default.createElement("strong", null, "How to add knowledge"),
                    react_1.default.createElement("p", null,
                        "Drop PDFs, notebooks, or markdown files into",
                        ' ',
                        react_1.default.createElement("code", null, ".jupyter-assistant/knowledge/"),
                        ", then run",
                        ' ',
                        react_1.default.createElement("code", null, "/index"),
                        " in the chat to index them."),
                    react_1.default.createElement("p", null,
                        "Indexed content is stored as vectors in",
                        ' ',
                        react_1.default.createElement("code", null, ".jupyter-assistant/rag/chroma/"),
                        " \u2014 original files are never moved or copied. Only files inside the",
                        ' ',
                        react_1.default.createElement("code", null, "knowledge/"),
                        " folder can be indexed.")),
                react_1.default.createElement(RAGStatusSection, { apiClient: apiClient, notebookPath: notebookPath }))),
            currentGroup.zooKey && (react_1.default.createElement(ModelZooSection, { zooKey: currentGroup.zooKey, values: values, onChange: handleChange }))))),
        react_1.default.createElement("div", { className: "ds-settings-footer" },
            status && (react_1.default.createElement("div", { className: `ds-settings-status ds-settings-status-${status.type}` }, status.text)),
            react_1.default.createElement("div", { className: "ds-settings-path" }, envExists ? envPath : `Will create: ${envPath}`),
            react_1.default.createElement("div", { className: "ds-settings-actions" },
                react_1.default.createElement("button", { className: "ds-settings-save-btn", onClick: () => void handleSave(), disabled: saving }, saving ? 'Saving…' : 'Save & Apply'),
                react_1.default.createElement("button", { className: "ds-settings-cancel-btn", onClick: onClose }, "Cancel")))));
};
const SkillsPanel = ({ apiClient, notebookPath = '' }) => {
    const [skills, setSkills] = (0, react_1.useState)([]);
    const [skillsDir, setSkillsDir] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [selectedName, setSelectedName] = (0, react_1.useState)(null);
    const [editorTab, setEditorTab] = (0, react_1.useState)('skill');
    const [editContent, setEditContent] = (0, react_1.useState)('');
    const [editReadme, setEditReadme] = (0, react_1.useState)('');
    const [dirty, setDirty] = (0, react_1.useState)(false);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [saveStatus, setSaveStatus] = (0, react_1.useState)(null);
    const [newName, setNewName] = (0, react_1.useState)('');
    const [creatingNew, setCreatingNew] = (0, react_1.useState)(false);
    // Bundled skill library
    const [libraryOpen, setLibraryOpen] = (0, react_1.useState)(false);
    const [library, setLibrary] = (0, react_1.useState)([]);
    const [libraryLoading, setLibraryLoading] = (0, react_1.useState)(false);
    const [importing, setImporting] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        apiClient.getSkills(notebookPath)
            .then(d => { setSkills(d.skills); setSkillsDir(d.skills_dir); setLoading(false); })
            .catch(() => setLoading(false));
    }, [apiClient, notebookPath]);
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const d = await apiClient.refreshSkills(notebookPath);
            setSkills(d.skills);
            setSkillsDir(d.skills_dir);
        }
        catch ( /* ignore */_a) { /* ignore */ }
        finally {
            setRefreshing(false);
        }
    };
    const handleEdit = async (name) => {
        var _a;
        try {
            const d = await apiClient.getSkillContent(name, notebookPath);
            setSelectedName(name);
            setEditContent(d.content);
            setEditReadme((_a = d.readme) !== null && _a !== void 0 ? _a : '');
            setEditorTab('skill');
            setDirty(false);
            setSaveStatus(null);
        }
        catch ( /* ignore */_b) { /* ignore */ }
    };
    const handleToggle = async (name, enabled) => {
        setSkills(prev => prev.map(s => s.name === name ? Object.assign(Object.assign({}, s), { enabled }) : s));
        try {
            await apiClient.saveSkill(name, { enabled }, notebookPath);
        }
        catch (_a) {
            setSkills(prev => prev.map(s => s.name === name ? Object.assign(Object.assign({}, s), { enabled: !enabled }) : s));
        }
    };
    const handleSaveContent = async () => {
        if (!selectedName)
            return;
        setSaving(true);
        setSaveStatus(null);
        try {
            const updates = editorTab === 'skill'
                ? { content: editContent }
                : { readme: editReadme };
            await apiClient.saveSkill(selectedName, updates, notebookPath);
            setDirty(false);
            setSaveStatus('ok');
            setTimeout(() => setSaveStatus(null), 2000);
        }
        catch (_a) {
            setSaveStatus('err');
        }
        finally {
            setSaving(false);
        }
    };
    const handleCreateNew = async () => {
        const name = newName.trim().replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
        if (!name)
            return;
        const starter = `# ${name.replace(/_/g, ' ')}\n\nDescribe this skill here.\n`;
        const readme = `# ${name.replace(/_/g, ' ')}\n\nDocumentation for the **${name}** skill.\n\n## Purpose\n\n...\n`;
        try {
            await apiClient.saveSkill(name, { content: starter, readme, enabled: true }, notebookPath);
            setSkills(prev => [...prev, { name, enabled: true }]);
            setNewName('');
            setCreatingNew(false);
            await handleEdit(name);
        }
        catch ( /* ignore */_a) { /* ignore */ }
    };
    const handleToggleLibrary = async () => {
        const willOpen = !libraryOpen;
        setLibraryOpen(willOpen);
        if (willOpen && library.length === 0) {
            setLibraryLoading(true);
            try {
                const d = await apiClient.getBundledSkills(notebookPath);
                setLibrary(d.bundled);
            }
            catch ( /* ignore */_a) { /* ignore */ }
            finally {
                setLibraryLoading(false);
            }
        }
    };
    const handleImport = async (name) => {
        setImporting(name);
        try {
            await apiClient.importBundledSkill(name, notebookPath);
            // Mark as imported in library list and add to active skills list
            setLibrary(prev => prev.map(b => b.name === name ? Object.assign(Object.assign({}, b), { imported: true }) : b));
            setSkills(prev => prev.some(s => s.name === name) ? prev : [...prev, { name, enabled: true }]);
        }
        catch ( /* ignore */_a) { /* ignore */ }
        finally {
            setImporting(null);
        }
    };
    return (react_1.default.createElement("div", { className: "ds-skills-panel" },
        react_1.default.createElement("div", { className: "ds-skills-list" },
            react_1.default.createElement("div", { className: "ds-skills-list-header" },
                react_1.default.createElement("span", { className: "ds-skills-list-title" }, "Skills"),
                react_1.default.createElement("button", { className: `ds-skills-refresh-btn${refreshing ? ' ds-skills-refresh-btn--spinning' : ''}`, onClick: () => void handleRefresh(), disabled: refreshing, title: "Reload all skill files from disk" }, "\u21BA")),
            loading ? (react_1.default.createElement("div", { className: "ds-skills-empty" }, "Loading\u2026")) : skills.length === 0 ? (react_1.default.createElement("div", { className: "ds-skills-empty" },
                "No skills yet.",
                '\n',
                skillsDir)) : (skills.map(skill => (react_1.default.createElement("div", { key: skill.name, className: `ds-skill-row${selectedName === skill.name ? ' ds-skill-row--active' : ''}`, onClick: () => void handleEdit(skill.name), title: "Click to edit" },
                react_1.default.createElement("span", { className: "ds-skill-name", title: skill.name }, skill.name),
                react_1.default.createElement("button", { role: "switch", "aria-checked": skill.enabled, className: `ds-skill-toggle${skill.enabled ? ' ds-skill-toggle--on' : ''}`, onClick: e => { e.stopPropagation(); void handleToggle(skill.name, !skill.enabled); }, title: skill.enabled ? 'Enabled — click to disable' : 'Disabled — click to enable' }))))),
            creatingNew ? (react_1.default.createElement("div", { className: "ds-skill-new-row" },
                react_1.default.createElement("input", { className: "ds-skill-new-input", value: newName, onChange: e => setNewName(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                        void handleCreateNew(); if (e.key === 'Escape')
                        setCreatingNew(false); }, placeholder: "skill_name", autoFocus: true, spellCheck: false }),
                react_1.default.createElement("button", { className: "ds-skill-new-ok", onClick: () => void handleCreateNew(), title: "Create" }, "\u2713"),
                react_1.default.createElement("button", { className: "ds-skill-new-cancel", onClick: () => setCreatingNew(false), title: "Cancel" }, "\u2715"))) : (react_1.default.createElement("button", { className: "ds-skill-add-btn", onClick: () => setCreatingNew(true) }, "+ New skill")),
            react_1.default.createElement("div", { className: "ds-skill-library" },
                react_1.default.createElement("button", { className: "ds-skill-library-header", onClick: () => void handleToggleLibrary(), title: "Browse factory-default skills bundled with the extension" },
                    react_1.default.createElement("span", { className: "ds-skill-library-chevron" }, libraryOpen ? '▾' : '▸'),
                    react_1.default.createElement("span", null, "\uD83D\uDCE6 Skill Library")),
                libraryOpen && (react_1.default.createElement("div", { className: "ds-skill-library-body" }, libraryLoading ? (react_1.default.createElement("div", { className: "ds-skill-library-msg" }, "Loading\u2026")) : library.length === 0 ? (react_1.default.createElement("div", { className: "ds-skill-library-msg" }, "No bundled skills found.")) : (library.map(b => (react_1.default.createElement("div", { key: b.name, className: `ds-skill-library-row${b.imported ? ' ds-skill-library-row--imported' : ''}` },
                    react_1.default.createElement("div", { className: "ds-skill-library-info" },
                        react_1.default.createElement("span", { className: "ds-skill-library-name" }, b.name),
                        b.command && react_1.default.createElement("span", { className: "ds-skill-library-cmd" }, b.command),
                        b.description && react_1.default.createElement("span", { className: "ds-skill-library-desc" }, b.description)),
                    b.imported ? (react_1.default.createElement("span", { className: "ds-skill-library-check", title: "Already in your project" }, "\u2713")) : (react_1.default.createElement("button", { className: "ds-skill-library-import-btn", onClick: () => void handleImport(b.name), disabled: importing === b.name, title: `Import ${b.name} into this project` }, importing === b.name ? '…' : '↓ Import')))))))))),
        react_1.default.createElement("div", { className: "ds-skill-editor" }, !selectedName ? (react_1.default.createElement("div", { className: "ds-skill-editor-placeholder" },
            react_1.default.createElement("span", null, "Click a skill to edit it"))) : (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "ds-skill-editor-tabs" },
                react_1.default.createElement("button", { className: `ds-skill-editor-tab${editorTab === 'skill' ? ' ds-skill-editor-tab--active' : ''}`, onClick: () => { setEditorTab('skill'); setDirty(false); setSaveStatus(null); } }, "SKILL.md"),
                react_1.default.createElement("button", { className: `ds-skill-editor-tab${editorTab === 'readme' ? ' ds-skill-editor-tab--active' : ''}`, onClick: () => { setEditorTab('readme'); setDirty(false); setSaveStatus(null); } }, "README.md"),
                react_1.default.createElement("div", { className: "ds-skill-editor-tabs-spacer" }),
                dirty && react_1.default.createElement("span", { className: "ds-skill-editor-dirty", title: "Unsaved changes" }, "\u25CF"),
                saveStatus === 'ok' && react_1.default.createElement("span", { className: "ds-skill-editor-saved" }, "\u2713 Saved"),
                saveStatus === 'err' && react_1.default.createElement("span", { className: "ds-skill-editor-error" }, "\u2717 Error"),
                react_1.default.createElement("button", { className: "ds-skill-editor-save-btn", onClick: () => void handleSaveContent(), disabled: saving || !dirty, title: "Save (Ctrl+S)" }, saving ? '…' : 'Save')),
            react_1.default.createElement("div", { className: "ds-skill-editor-filepath" },
                selectedName,
                "/",
                editorTab === 'skill' ? 'SKILL.md' : 'README.md'),
            react_1.default.createElement("textarea", { key: `${selectedName}-${editorTab}`, className: "ds-skill-editor-textarea", value: editorTab === 'skill' ? editContent : editReadme, onChange: e => {
                    if (editorTab === 'skill')
                        setEditContent(e.target.value);
                    else
                        setEditReadme(e.target.value);
                    setDirty(true);
                    setSaveStatus(null);
                }, spellCheck: false, placeholder: editorTab === 'readme' ? 'No README.md yet — start writing user documentation here…' : '', onKeyDown: e => {
                    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        void handleSaveContent();
                    }
                } }))))));
};
// ---------------------------------------------------------------------------
// SettingsPanel — top-level wrapper with [Models | Skills] tabs
// ---------------------------------------------------------------------------
const SettingsPanel = ({ apiClient, onClose, onSaved, notebookPath = '' }) => {
    const [topTab, setTopTab] = (0, react_1.useState)('models');
    return (react_1.default.createElement("div", { className: "ds-settings-outer" },
        react_1.default.createElement("div", { className: "ds-settings-top-tabs" },
            react_1.default.createElement("button", { className: `ds-settings-top-tab${topTab === 'models' ? ' ds-settings-top-tab--active' : ''}`, onClick: () => setTopTab('models') }, "\u2699 Models"),
            react_1.default.createElement("button", { className: `ds-settings-top-tab${topTab === 'skills' ? ' ds-settings-top-tab--active' : ''}`, onClick: () => setTopTab('skills') }, "\uD83D\uDCDA Skills")),
        topTab === 'models' ? (react_1.default.createElement(ModelsPanel, { apiClient: apiClient, onClose: onClose, onSaved: onSaved, notebookPath: notebookPath })) : (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(SkillsPanel, { apiClient: apiClient, notebookPath: notebookPath }),
            react_1.default.createElement("div", { className: "ds-settings-footer" },
                react_1.default.createElement("div", { className: "ds-settings-actions" },
                    react_1.default.createElement("button", { className: "ds-settings-cancel-btn", onClick: onClose }, "Close")))))));
};
// ---------------------------------------------------------------------------
// ModelSwitcher — inline model picker below the chat textarea
// ---------------------------------------------------------------------------
const shortModelName = (model) => model.includes('/') ? model.split('/').slice(1).join('/') : model;
/** Accent color per provider — used on the button left-border and popup header */
const PROVIDER_COLORS = {
    ANTHROPIC: '#d97757',
    OPENAI: '#10a37f',
    GOOGLE: '#4285f4',
    BEDROCK: '#ff9900',
    AZURE: '#0078d4',
    OPENROUTER: '#7c3aed',
    OLLAMA: '#0ea5e9',
};
const providerColor = (p) => { var _a; return (_a = PROVIDER_COLORS[p.toUpperCase()]) !== null && _a !== void 0 ? _a : '#1976d2'; };
const ModelSwitcher = ({ provider, model, zoo, saving, onSelect }) => {
    const [open, setOpen] = (0, react_1.useState)(false);
    const wrapperRef = (0, react_1.useRef)(null);
    const color = providerColor(provider);
    // Close popup when clicking outside
    (0, react_1.useEffect)(() => {
        if (!open)
            return;
        const onDown = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);
    const noProvider = !provider;
    const displayName = noProvider ? 'No provider set — open Settings' : (shortModelName(model) || '—');
    const displayProvider = (!provider || provider === 'unknown') ? '?' : provider.toUpperCase();
    return (react_1.default.createElement("div", { className: "ds-model-switcher", ref: wrapperRef },
        open && (react_1.default.createElement("div", { className: "ds-model-switcher-popup" },
            react_1.default.createElement("div", { className: "ds-model-switcher-popup-header", style: { borderLeftColor: color, color } },
                react_1.default.createElement("span", { className: "ds-model-switcher-popup-provider" }, displayProvider),
                react_1.default.createElement("span", { className: "ds-model-switcher-popup-label" }, "Chat model")),
            zoo.length === 0 ? (react_1.default.createElement("div", { className: "ds-model-switcher-empty" },
                "No models in zoo.",
                '\n',
                "Go to \u2699 Settings \u2192 ",
                displayProvider,
                " tab.")) : (react_1.default.createElement("div", { className: "ds-model-switcher-list" }, zoo.map(m => {
                const isActive = m === model;
                return (react_1.default.createElement("button", { key: m, className: `ds-model-switcher-option${isActive ? ' ds-model-switcher-option--active' : ''}`, style: isActive ? { borderLeftColor: color } : undefined, onClick: () => { onSelect(m); setOpen(false); }, title: m },
                    react_1.default.createElement("span", { className: "ds-model-switcher-option-name" }, m),
                    isActive && (react_1.default.createElement("span", { className: "ds-model-switcher-check", style: { color } }, "\u2713"))));
            }))))),
        react_1.default.createElement("button", { className: `ds-model-switcher-btn${open ? ' ds-model-switcher-btn--open' : ''}${saving ? ' ds-model-switcher-btn--saving' : ''}${noProvider ? ' ds-model-switcher-btn--unconfigured' : ''}`, onClick: () => !saving && setOpen(o => !o), title: noProvider ? 'No provider configured — open Settings to configure' : `${displayProvider} · ${model}\nClick to switch chat model`, disabled: saving },
            react_1.default.createElement("span", { className: "ds-model-switcher-model-name" }, saving ? 'Switching…' : displayName),
            react_1.default.createElement("span", { className: "ds-model-switcher-chevron" }))));
};
// ---------------------------------------------------------------------------
// Slash-command helpers
// ---------------------------------------------------------------------------
/** Parse a /command prefix from the start of a message.
 *  Returns { command: "/eda", rest: "rest of message" } or null if no command. */
function parseSlashCommand(input) {
    var _a;
    const m = input.match(/^(\/[\w-]+)(?:\s+(.*))?$/s);
    if (!m)
        return null;
    return { command: m[1].toLowerCase(), rest: ((_a = m[2]) !== null && _a !== void 0 ? _a : '').trim() };
}
const CommandAutocomplete = ({ commands, query, onSelect, onClose, }) => {
    const filtered = react_1.default.useMemo(() => {
        const q = query.toLowerCase();
        return commands.filter(c => c.command.startsWith(q) || c.description.toLowerCase().includes(q));
    }, [commands, query]);
    const popupRef = (0, react_1.useRef)(null);
    const [activeIdx, setActiveIdx] = (0, react_1.useState)(0);
    // Reset active index when filter changes
    (0, react_1.useEffect)(() => { setActiveIdx(0); }, [filtered.length]);
    // Close on outside click
    (0, react_1.useEffect)(() => {
        const handler = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target))
                onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);
    // Keyboard navigation — exposed via a global keydown handler attached to
    // the textarea when this component is visible.
    (0, react_1.useEffect)(() => {
        const handler = (e) => {
            if (!filtered.length)
                return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx(i => Math.max(i - 1, 0));
            }
            else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (filtered[activeIdx])
                    onSelect(filtered[activeIdx]);
            }
            else if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handler, true);
        return () => document.removeEventListener('keydown', handler, true);
    }, [filtered, activeIdx, onSelect, onClose]);
    if (!filtered.length)
        return null;
    return (react_1.default.createElement("div", { className: "ds-cmd-popup", ref: popupRef }, filtered.map((cmd, i) => (react_1.default.createElement("div", { key: cmd.command, className: `ds-cmd-item${i === activeIdx ? ' ds-cmd-item-active' : ''}`, onMouseEnter: () => setActiveIdx(i), onClick: () => onSelect(cmd) },
        react_1.default.createElement("span", { className: "ds-cmd-name" }, cmd.command),
        react_1.default.createElement("span", { className: "ds-cmd-badge ds-cmd-badge-{cmd.type}" }, cmd.type),
        react_1.default.createElement("span", { className: "ds-cmd-desc" }, cmd.description))))));
};
// ---------------------------------------------------------------------------
// Thread helpers
// ---------------------------------------------------------------------------
function makeNewThread(name) {
    const now = new Date().toISOString();
    return {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name,
        createdAt: now,
        updatedAt: now,
        messages: [],
    };
}
const ThreadBar = ({ threads, currentId, notebookName, onSwitch, onNew, onRename, onDelete, }) => {
    var _a;
    const [open, setOpen] = (0, react_1.useState)(false);
    const [editingId, setEditingId] = (0, react_1.useState)('');
    const [editValue, setEditValue] = (0, react_1.useState)('');
    const popupRef = (0, react_1.useRef)(null);
    const current = threads.find(t => t.id === currentId);
    const idx = threads.findIndex(t => t.id === currentId);
    (0, react_1.useEffect)(() => {
        if (!open)
            return;
        const handler = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setOpen(false);
                setEditingId('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);
    return (react_1.default.createElement("div", { className: "ds-thread-bar", ref: popupRef },
        react_1.default.createElement("button", { className: "ds-thread-toggle", onClick: () => setOpen(o => !o), title: "Switch or manage chat threads" },
            react_1.default.createElement("span", { className: "ds-thread-icon" }, "\u2261"),
            react_1.default.createElement("span", { className: "ds-thread-name" }, (_a = current === null || current === void 0 ? void 0 : current.name) !== null && _a !== void 0 ? _a : 'Thread'),
            react_1.default.createElement("span", { className: "ds-thread-count" },
                "(",
                idx + 1,
                "/",
                threads.length,
                ")"),
            react_1.default.createElement("span", { className: `ds-thread-chevron ${open ? 'ds-thread-chevron-up' : ''}` }, "\u203A")),
        open && (react_1.default.createElement("div", { className: "ds-thread-popup" },
            notebookName && (react_1.default.createElement("div", { className: "ds-thread-popup-notebook" },
                react_1.default.createElement("span", { className: "ds-thread-popup-nb-icon" }, "\uD83D\uDCD3"),
                react_1.default.createElement("span", { className: "ds-thread-popup-nb-name", title: notebookName }, notebookName))),
            threads.map(t => (react_1.default.createElement("div", { key: t.id, className: `ds-thread-item${t.id === currentId ? ' ds-thread-item-active' : ''}` },
                editingId === t.id ? (react_1.default.createElement("input", { className: "ds-thread-rename-input", value: editValue, autoFocus: true, onChange: e => setEditValue(e.target.value), onBlur: () => {
                        if (editValue.trim())
                            onRename(t.id, editValue.trim());
                        setEditingId('');
                    }, onKeyDown: e => {
                        if (e.key === 'Enter') {
                            if (editValue.trim())
                                onRename(t.id, editValue.trim());
                            setEditingId('');
                        }
                        if (e.key === 'Escape')
                            setEditingId('');
                    } })) : (react_1.default.createElement("span", { className: "ds-thread-item-name", onClick: () => { onSwitch(t.id); setOpen(false); } },
                    t.id === currentId && react_1.default.createElement("span", { className: "ds-thread-check" }, "\u2713"),
                    t.name)),
                react_1.default.createElement("span", { className: "ds-thread-action-btn", onClick: e => { e.stopPropagation(); setEditingId(t.id); setEditValue(t.name); }, title: "Rename" }, "\u270E"),
                threads.length > 1 && (react_1.default.createElement("span", { className: "ds-thread-action-btn ds-thread-delete-btn", onClick: e => { e.stopPropagation(); onDelete(t.id); setOpen(false); }, title: "Delete thread" }, "\u2715"))))),
            react_1.default.createElement("div", { className: "ds-thread-new-item", onClick: () => { onNew(); setOpen(false); } }, "+ New thread")))));
};
// ---------------------------------------------------------------------------
// ContextChipBubble — collapsible code-context chip shown in sent user bubbles
// ---------------------------------------------------------------------------
const ContextChipBubble = ({ chip }) => {
    const [expanded, setExpanded] = react_1.default.useState(false);
    return (react_1.default.createElement("div", { className: "ds-ctx-chip ds-ctx-chip--bubble" },
        react_1.default.createElement("div", { className: "ds-ctx-chip-header" },
            react_1.default.createElement("span", { className: "ds-ctx-chip-icon" }, "\uD83D\uDCCE"),
            react_1.default.createElement("span", { className: "ds-ctx-chip-label" }, chip.label),
            react_1.default.createElement("button", { className: "ds-ctx-chip-toggle", onClick: () => setExpanded(x => !x), title: expanded ? 'Collapse' : 'Expand context', "aria-label": expanded ? 'Collapse context' : 'Expand context' }, expanded ? '▲' : '▼')),
        expanded && (react_1.default.createElement("pre", { className: "ds-ctx-chip-preview" }, chip.preview))));
};
// ---------------------------------------------------------------------------
// Chat component
// ---------------------------------------------------------------------------
const DSAssistantChat = ({ apiClient, notebookReader, cellEditor, notebookTracker }) => {
    var _a, _b;
    // Resolves @variable_name references typed in the chat input
    const variableResolver = react_1.default.useMemo(() => new VariableResolver_1.VariableResolver(notebookTracker), [notebookTracker]);
    const [messages, setMessages] = (0, react_1.useState)([
        {
            id: '0',
            role: 'system',
            content: 'Varys ready. Open a notebook and ask me anything!',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    // ── Collapsible long messages ───────────────────────────────────────────
    // Messages whose content length exceeds this threshold start collapsed.
    const COLLAPSE_THRESHOLD = 800;
    const [collapsedMsgs, setCollapsedMsgs] = (0, react_1.useState)(new Set());
    const toggleCollapse = (id) => setCollapsedMsgs(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    // ── Streaming animation queue ──────────────────────────────────────────
    // Chunks from the SSE stream are pushed here and drained by a setInterval
    // at 30 ms, decoupling rendering from React 18 automatic batching and from
    // Tornado's TCP flush timing. This guarantees visible token-by-token
    // streaming regardless of how the backend sends the events.
    const streamQueueRef = (0, react_1.useRef)([]);
    const streamMsgIdRef = (0, react_1.useRef)('');
    const streamTimerRef = (0, react_1.useRef)(null);
    // ── Tool-call JSON delta content extractor ────────────────────────────
    // The Anthropic/OpenAI APIs stream the tool-call JSON payload character by
    // character as `input_json_delta` events.  We parse out the "content" field
    // values so the user can watch the cell content being written in real time,
    // eliminating the silent gap while the LLM generates the operation plan.
    //
    // State machine: scan the accumulated JSON for the last `"content": "` and
    // extract the unescaped chars that follow it up to the current position.
    // When a new "content" field begins (unescaped length shrinks), reset the
    // cursor and start streaming the new field.
    const jsonExtractorRef = (0, react_1.useRef)({
        accumulated: '',
        lastLen: 0,
        headerEmitted: false,
        feed(partial) {
            this.accumulated += partial;
            // Match from the last "content": " to the current end of string.
            // The regex intentionally anchors to $ so it tracks the LATEST field.
            const match = this.accumulated.match(/"content"\s*:\s*"((?:[^"\\]|\\[\s\S])*)$/);
            if (!match)
                return '';
            // Unescape JSON string escapes so we show readable text
            const unescaped = match[1]
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            if (unescaped.length < this.lastLen) {
                // A new content field has started — reset cursor
                this.lastLen = 0;
            }
            const delta = unescaped.slice(this.lastLen);
            this.lastLen = unescaped.length;
            return delta;
        },
        reset() {
            this.accumulated = '';
            this.lastLen = 0;
            this.headerEmitted = false;
        },
    });
    const startStreamQueue = (msgId) => {
        streamMsgIdRef.current = msgId;
        streamQueueRef.current = [];
        setActiveStreamId(msgId);
        if (streamTimerRef.current)
            clearInterval(streamTimerRef.current);
        streamTimerRef.current = setInterval(() => {
            if (streamQueueRef.current.length === 0)
                return;
            // Drain up to 4 chunks per frame (~120 chars/sec at 30ms interval)
            const batch = streamQueueRef.current.splice(0, 4).join('');
            setMessages(prev => prev.map(m => m.id === streamMsgIdRef.current
                ? Object.assign(Object.assign({}, m), { content: m.content + batch }) : m));
        }, 30);
    };
    const pushToStreamQueue = (text) => {
        if (text)
            streamQueueRef.current.push(text);
    };
    const stopStreamQueue = () => {
        if (streamTimerRef.current) {
            clearInterval(streamTimerRef.current);
            streamTimerRef.current = null;
        }
        // Flush any remaining items immediately
        if (streamQueueRef.current.length > 0) {
            const remaining = streamQueueRef.current.splice(0).join('');
            setMessages(prev => prev.map(m => m.id === streamMsgIdRef.current
                ? Object.assign(Object.assign({}, m), { content: m.content + remaining }) : m));
        }
        setActiveStreamId('');
    };
    // Clean up the animation timer when the component unmounts
    (0, react_1.useEffect)(() => () => {
        if (streamTimerRef.current)
            clearInterval(streamTimerRef.current);
    }, []);
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [showRepro, setShowRepro] = (0, react_1.useState)(false);
    const [showTags, setShowTags] = (0, react_1.useState)(false);
    // Chat window theme toggle: 'day' (light) or 'night' (dark), persisted in
    // localStorage so it survives JupyterLab restarts independently of the
    // global IDE theme.
    const [chatTheme, setChatTheme] = (0, react_1.useState)(() => {
        try {
            return localStorage.getItem('ds-assistant-chat-theme') || 'day';
        }
        catch (_a) {
            return 'day';
        }
    });
    const toggleChatTheme = () => {
        setChatTheme(prev => {
            const next = prev === 'day' ? 'night' : 'day';
            try {
                localStorage.setItem('ds-assistant-chat-theme', next);
            }
            catch ( /* ignore */_a) { /* ignore */ }
            return next;
        });
    };
    const [cellMode, setCellMode] = (0, react_1.useState)(() => {
        try {
            return localStorage.getItem('ds-assistant-cell-mode') || 'auto';
        }
        catch (_a) {
            return 'auto';
        }
    });
    // ── Input area resize (drag from top) ─────────────────────────────────────
    const MIN_INPUT_HEIGHT = 56;
    const MAX_INPUT_HEIGHT = 400;
    const [inputHeight, setInputHeight] = (0, react_1.useState)(() => {
        try {
            const saved = localStorage.getItem('ds-assistant-input-height');
            return saved ? Math.max(MIN_INPUT_HEIGHT, parseInt(saved, 10)) : 80;
        }
        catch (_a) {
            return 80;
        }
    });
    const dragStateRef = (0, react_1.useRef)(null);
    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        dragStateRef.current = { startY: e.clientY, startH: inputHeight };
        const onMove = (mv) => {
            if (!dragStateRef.current)
                return;
            // Dragging UP (negative delta) → increase height
            const delta = dragStateRef.current.startY - mv.clientY;
            const next = Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, dragStateRef.current.startH + delta));
            setInputHeight(next);
        };
        const onUp = () => {
            dragStateRef.current = null;
            setInputHeight(h => {
                try {
                    localStorage.setItem('ds-assistant-input-height', String(h));
                }
                catch ( /* */_a) { /* */ }
                return h;
            });
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };
    const cycleCellMode = () => {
        setCellMode(prev => {
            const next = prev === 'chat' ? 'auto' : prev === 'auto' ? 'doc' : 'chat';
            try {
                localStorage.setItem('ds-assistant-cell-mode', next);
            }
            catch ( /* ignore */_a) { /* ignore */ }
            return next;
        });
    };
    const CELL_MODE_LABEL = {
        chat: '💬',
        auto: '⚡',
        doc: '📝',
    };
    const CELL_MODE_TITLE = {
        chat: 'Chat Only — responses stay in chat, no cells are created',
        auto: 'Auto — skill/AI decides whether to create cells (default)',
        doc: 'Document — always write results to notebook cells',
    };
    const [pendingOps, setPendingOps] = (0, react_1.useState)([]);
    // Tracks which fix indices have been applied per code-review message id
    const [appliedFixes, setAppliedFixes] = (0, react_1.useState)(new Map());
    const [progressText, setProgressText] = (0, react_1.useState)('');
    // ID of the assistant message currently being streamed — used to render a
    // typing cursor and to append step results without creating a new bubble.
    const [activeStreamId, setActiveStreamId] = (0, react_1.useState)('');
    // ── Chat thread state ──────────────────────────────────────────────────────
    const [threads, setThreads] = (0, react_1.useState)([]);
    const [currentThreadId, setCurrentThreadId] = (0, react_1.useState)('');
    const [currentNotebookPath, setCurrentNotebookPath] = (0, react_1.useState)('');
    // AbortController for the current streaming request — allows the user to
    // cancel mid-stream by clicking the stop button.
    const abortControllerRef = (0, react_1.useRef)(null);
    // Refs mirror the state above so that async callbacks (handleSend, auto-save)
    // always see the latest values without stale closures.
    const threadsRef = (0, react_1.useRef)([]);
    const currentThreadIdRef = (0, react_1.useRef)('');
    const currentNotebookPathRef = (0, react_1.useRef)('');
    (0, react_1.useEffect)(() => { threadsRef.current = threads; }, [threads]);
    (0, react_1.useEffect)(() => { currentThreadIdRef.current = currentThreadId; }, [currentThreadId]);
    (0, react_1.useEffect)(() => { currentNotebookPathRef.current = currentNotebookPath; }, [currentNotebookPath]);
    // ── Thread persistence helpers ─────────────────────────────────────────────
    const _saveThread = async (threadId, threadName, msgs, 
    /** Explicit notebook path — pass this to avoid reading a stale ref when
     *  the save fires after a notebook switch. */
    explicitPath) => {
        var _a, _b;
        const nbPath = explicitPath
            || currentNotebookPathRef.current
            || ((_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.context.path)
            || '';
        if (!nbPath || !threadId)
            return;
        const saved = msgs
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
        }));
        const now = new Date().toISOString();
        const existing = threadsRef.current.find(t => t.id === threadId);
        try {
            await apiClient.saveChatThread(nbPath, {
                id: threadId,
                name: threadName || (existing === null || existing === void 0 ? void 0 : existing.name) || 'Thread',
                createdAt: (_b = existing === null || existing === void 0 ? void 0 : existing.createdAt) !== null && _b !== void 0 ? _b : now,
                updatedAt: now,
                messages: saved,
                tokenUsage: existing === null || existing === void 0 ? void 0 : existing.tokenUsage,
            });
        }
        catch (err) {
            console.warn('[DSAssistant] Could not save chat thread:', err);
        }
    };
    // Debounced auto-save: 1.5 s after the last message change.
    // Capture path + threadId at schedule time so a notebook switch that
    // happens before the timer fires doesn't corrupt the wrong file.
    const saveTimerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        var _a;
        const threadId = currentThreadIdRef.current;
        const nbPath = currentNotebookPathRef.current
            || ((_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.context.path)
            || '';
        if (!threadId || !nbPath)
            return;
        if (!messages.some(m => m.role === 'user' || m.role === 'assistant'))
            return;
        // Snapshot values NOW, before any possible notebook switch
        const snapshotPath = nbPath;
        const snapshotTid = threadId;
        const snapshotMsgs = messages;
        if (saveTimerRef.current)
            clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            var _a, _b;
            const tName = (_b = (_a = threadsRef.current.find(t => t.id === snapshotTid)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Thread';
            // Pass snapshotPath explicitly so even a notebook switch between
            // scheduling and firing doesn't corrupt the wrong file.
            void _saveThread(snapshotTid, tName, snapshotMsgs, snapshotPath);
        }, 1500);
        return () => {
            if (saveTimerRef.current)
                clearTimeout(saveTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);
    // ── Auto-load chat history when the active notebook changes ───────────────
    (0, react_1.useEffect)(() => {
        const loadForNotebook = async (newPath) => {
            var _a, _b, _c;
            if (!newPath)
                return;
            // Skip if the same notebook is already active (e.g. a panel focus event
            // that doesn't actually change the notebook).
            if (newPath === currentNotebookPathRef.current)
                return;
            // ── 1. Flush any pending save for the OUTGOING notebook immediately ──
            //    The debounced timer may not have fired yet. Capture its path and
            //    messages before we switch.
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
            const outgoingPath = currentNotebookPathRef.current;
            const outgoingTid = currentThreadIdRef.current;
            const outgoingMsgs = messagesRef.current;
            if (outgoingPath && outgoingTid && outgoingMsgs.length > 0) {
                const tName = (_b = (_a = threadsRef.current.find(t => t.id === outgoingTid)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Thread';
                // Pass outgoingPath explicitly — currentNotebookPathRef is about to
                // be updated to newPath, so we must not rely on the ref here.
                void _saveThread(outgoingTid, tName, outgoingMsgs, outgoingPath);
            }
            // ── 2. Switch path refs immediately so any save that arrives later
            //       from a race condition writes to the correct file ──────────────
            setCurrentNotebookPath(newPath);
            currentNotebookPathRef.current = newPath;
            // ── 3. Clear UI immediately so the old notebook's messages aren't
            //       visible while the new ones are loading ──────────────────────
            setMessages([]);
            setThreads([]);
            setCurrentThreadId('');
            currentThreadIdRef.current = '';
            threadsRef.current = [];
            // ── 4. Load the new notebook's history ───────────────────────────────
            try {
                const chatFile = await apiClient.loadChatHistory(newPath);
                if (chatFile.threads.length > 0) {
                    const lastId = (_c = chatFile.lastThreadId) !== null && _c !== void 0 ? _c : chatFile.threads[0].id;
                    const lastThread = chatFile.threads.find(t => t.id === lastId);
                    setThreads(chatFile.threads);
                    threadsRef.current = chatFile.threads;
                    setCurrentThreadId(lastId);
                    currentThreadIdRef.current = lastId;
                    setMessages(lastThread && lastThread.messages.length > 0
                        ? lastThread.messages.map(m => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                            timestamp: new Date(m.timestamp),
                        }))
                        : []);
                }
                else {
                    const t = makeNewThread('Main');
                    setThreads([t]);
                    threadsRef.current = [t];
                    setCurrentThreadId(t.id);
                    currentThreadIdRef.current = t.id;
                    setMessages([]);
                }
            }
            catch (err) {
                console.warn('[DSAssistant] Could not load chat history:', err);
                const t = makeNewThread('Main');
                setThreads([t]);
                threadsRef.current = [t];
                setCurrentThreadId(t.id);
                currentThreadIdRef.current = t.id;
                setMessages([]);
            }
        };
        const current = notebookTracker.currentWidget;
        if (current === null || current === void 0 ? void 0 : current.context.path)
            void loadForNotebook(current.context.path);
        const handler = (_, widget) => {
            var _a;
            const nbWidget = widget;
            if ((_a = nbWidget === null || nbWidget === void 0 ? void 0 : nbWidget.context) === null || _a === void 0 ? void 0 : _a.path)
                void loadForNotebook(nbWidget.context.path);
        };
        notebookTracker.currentChanged.connect(handler);
        return () => { notebookTracker.currentChanged.disconnect(handler); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [providerStatus, setProviderStatus] = (0, react_1.useState)({
        provider: 'unknown',
        model: '',
        healthy: false,
        providers: {
            chat: { provider: 'unknown', model: '' },
            inline: { provider: 'unknown', model: '' },
            multiline: { provider: 'unknown', model: '' }
        }
    });
    // Model switcher state
    const [chatModel, setChatModel] = (0, react_1.useState)('');
    const [chatProvider, setChatProvider] = (0, react_1.useState)('');
    const [chatZoo, setChatZoo] = (0, react_1.useState)([]);
    const [modelSwitching, setModelSwitching] = (0, react_1.useState)(false);
    // ── Advisory phrases (loaded from .jupyter-assistant/rules/advisory-phrases.md) ──
    // Initialised with the hardcoded defaults; overwritten by server response.
    const [advisoryPhrases, setAdvisoryPhrases] = (0, react_1.useState)(_ADVISORY_STARTS);
    // ── Slash-command state ────────────────────────────────────────────────────
    const [commands, setCommands] = (0, react_1.useState)([]);
    const [showCmdPopup, setShowCmdPopup] = (0, react_1.useState)(false);
    const [activeCommand, setActiveCommand] = (0, react_1.useState)(null);
    const messagesEndRef = (0, react_1.useRef)(null);
    // Load slash commands on mount (and re-load after skills refresh)
    (0, react_1.useEffect)(() => {
        apiClient.getCommands().then(cmds => {
            if (cmds.length)
                setCommands(cmds);
        }).catch(() => { });
    }, [apiClient]);
    // Reusable settings loader — called on mount and after settings panel closes.
    const loadModelSettings = () => {
        apiClient
            .getSettings()
            .then((data) => {
            var _a, _b, _c, _d, _e;
            const vals = {};
            for (const [k, entry] of Object.entries(data)) {
                if (!k.startsWith('_')) {
                    vals[k] = (_a = entry.value) !== null && _a !== void 0 ? _a : '';
                }
            }
            // No fallback: if DS_CHAT_PROVIDER is empty the user must configure it in settings
            const provider = ((_b = vals['DS_CHAT_PROVIDER']) !== null && _b !== void 0 ? _b : '').toUpperCase();
            const zooRaw = provider ? ((_c = vals[`${provider}_MODELS`]) !== null && _c !== void 0 ? _c : '') : '';
            const zoo = zooRaw.trim() ? parseZoo(zooRaw) : (provider ? ((_d = DEFAULT_ZOO[`${provider}_MODELS`]) !== null && _d !== void 0 ? _d : []) : []);
            const modelFromEnv = provider ? ((_e = vals[`${provider}_CHAT_MODEL`]) !== null && _e !== void 0 ? _e : '') : '';
            const model = modelFromEnv;
            setChatProvider(provider);
            setChatModel(model);
            setChatZoo(zoo);
            // Load user-configured advisory phrases from the rules file.
            const phrases = data['_advisoryPhrases'];
            if (Array.isArray(phrases) && phrases.length > 0) {
                setAdvisoryPhrases(phrases);
            }
        })
            .catch((err) => {
            console.warn('[Varys] settings load failed:', err);
            /* switcher shows — */
        });
    };
    // Load provider info + current chat model + zoo on mount
    (0, react_1.useEffect)(() => {
        apiClient
            .healthCheck()
            .then((info) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const raw = ((_a = info.providers) !== null && _a !== void 0 ? _a : {});
            setProviderStatus({
                provider: info.provider || 'unknown',
                model: info.model || '',
                healthy: info.status === 'ok',
                providers: {
                    chat: {
                        provider: ((_b = raw.chat) === null || _b === void 0 ? void 0 : _b.provider) || info.provider || 'unknown',
                        model: ((_c = raw.chat) === null || _c === void 0 ? void 0 : _c.model) || info.model || ''
                    },
                    inline: {
                        provider: ((_d = raw.inline) === null || _d === void 0 ? void 0 : _d.provider) || info.provider || 'unknown',
                        model: ((_e = raw.inline) === null || _e === void 0 ? void 0 : _e.model) || ''
                    },
                    multiline: {
                        provider: ((_f = raw.multiline) === null || _f === void 0 ? void 0 : _f.provider) || info.provider || 'unknown',
                        model: ((_g = raw.multiline) === null || _g === void 0 ? void 0 : _g.model) || ''
                    }
                }
            });
        })
            .catch(() => { });
        loadModelSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiClient]);
    // Auto-scroll to bottom when new messages arrive
    (0, react_1.useEffect)(() => {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    // Auto-collapse long messages once they finish streaming
    (0, react_1.useEffect)(() => {
        setCollapsedMsgs(prev => {
            const next = new Set(prev);
            messages.forEach(m => {
                var _a, _b;
                const collapsible = ['user', 'assistant', 'code-review'].includes(m.role);
                const isLong = ((_b = (_a = m.content) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= COLLAPSE_THRESHOLD;
                const isStreaming = m.id === activeStreamId;
                if (collapsible && isLong && !isStreaming && !next.has(m.id)) {
                    next.add(m.id);
                }
            });
            return next;
        });
    }, [messages, activeStreamId]);
    const addMessage = (role, content, displayContent) => {
        const id = generateId();
        setMessages(prev => [
            ...prev,
            { id, role, content, displayContent, timestamp: new Date() }
        ]);
    };
    const addMessageWithChip = (role, content, displayContent, contextChipData) => {
        const id = generateId();
        setMessages(prev => [
            ...prev,
            { id, role, content, displayContent, contextChip: contextChipData, timestamp: new Date() }
        ]);
    };
    // -------------------------------------------------------------------------
    // External message listener — invoked by context-menu AI Actions commands
    // -------------------------------------------------------------------------
    // Use a ref so the effect closure always captures the latest version of
    // handleSend without needing to re-register the listener on every render.
    const handleSendRef = (0, react_1.useRef)(null);
    /** Mirror of messages kept in a ref so the notebook-switch handler can read
     *  the current value synchronously (React state is async). */
    const messagesRef = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => { messagesRef.current = messages; }, [messages]);
    /** Holds the hidden LLM context that will be prepended on the next send. */
    const contextPrefixRef = (0, react_1.useRef)('');
    /** Visible chip above the textarea showing what code context is attached. */
    const [contextChip, setContextChip] = (0, react_1.useState)(null);
    /** Whether the chip preview is expanded in the input area. */
    const [chipExpanded, setChipExpanded] = (0, react_1.useState)(false);
    /** A specific output the user selected via the output overlay (right-click). */
    const selectedOutputRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        setExternalMessageListener(({ text, autoSend, openTags, displayText, contextPrefix, contextChip: chip, selectedOutput }) => {
            if (openTags) {
                setShowTags(true);
                return;
            }
            // Store the hidden LLM context prefix and its visible chip representation.
            contextPrefixRef.current = contextPrefix !== null && contextPrefix !== void 0 ? contextPrefix : '';
            setContextChip(chip !== null && chip !== void 0 ? chip : null);
            setChipExpanded(false);
            selectedOutputRef.current = selectedOutput !== null && selectedOutput !== void 0 ? selectedOutput : null;
            setInput(text);
            if (autoSend && handleSendRef.current) {
                setTimeout(() => { var _a; return (_a = handleSendRef.current) === null || _a === void 0 ? void 0 : _a.call(handleSendRef, text, displayText); }, 0);
            }
        });
        return () => setExternalMessageListener(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // -------------------------------------------------------------------------
    // Send handler
    // -------------------------------------------------------------------------
    const handleSend = async (overrideText, displayText, skipAdvisory = false) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const typedText = (overrideText !== null && overrideText !== void 0 ? overrideText : input).trim();
        if (!typedText || isLoading)
            return;
        if (!chatProvider) {
            setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '⚠️ No provider configured. Please open **Settings** and select a provider and model for Chat.',
                    timestamp: new Date(),
                }]);
            return;
        }
        // Grab and clear the hidden LLM context prefix + visible chip.
        const prefix = contextPrefixRef.current;
        const chip = contextChip;
        contextPrefixRef.current = '';
        setContextChip(null);
        setChipExpanded(false);
        const rawInput = prefix ? `${prefix}${typedText}` : typedText;
        // The chat bubble shows either the caller-supplied short label, or just the
        // user's typed text (without the hidden prefix).
        const bubbleDisplay = displayText !== null && displayText !== void 0 ? displayText : (prefix ? typedText : undefined);
        // ── Slash-command parsing ────────────────────────────────────────────
        // If the input starts with a /command, extract it and use the remainder
        // as the actual user message sent to the LLM.
        const parsed = parseSlashCommand(rawInput);
        let slashCommand;
        let message;
        if (parsed) {
            // Check if it is a built-in command
            const knownBuiltin = commands.find(c => c.type === 'builtin' && c.command === parsed.command);
            if (knownBuiltin) {
                setInput('');
                setActiveCommand(null);
                setShowCmdPopup(false);
                // /index [path]: route to the RAG index flow (async).
                // No path → index the whole knowledge folder (backend defaults to it).
                if (parsed.command === '/index') {
                    await handleIndexCommand((_b = (_a = parsed.rest) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '');
                    return;
                }
                // /rag: show knowledge-base status
                if (parsed.command === '/rag') {
                    await handleRagStatus();
                    return;
                }
                // /ask <query>: fall through to the task flow with command='/ask'
                // so the backend can do RAG retrieval.  /ask with NO args shows help.
                if (parsed.command === '/ask' && parsed.rest) {
                    slashCommand = '/ask';
                    message = parsed.rest.trim();
                    // Don't return early — fall through to the main task flow below.
                }
                else if (parsed.command === '/chat' && parsed.rest) {
                    // /chat <message>: force advisory/chat mode for this single request.
                    // The backend skips tool-use and streams a plain markdown answer.
                    slashCommand = '/chat';
                    message = parsed.rest.trim();
                    // Don't return early — fall through to the main task flow below.
                }
                else {
                    // All other built-ins (including no-arg /ask, /index, /rag)
                    handleBuiltinCommand(parsed.command);
                    return;
                }
            }
            else {
                slashCommand = parsed.command;
                message = parsed.rest || rawInput; // fall back to full text if no args
            }
        }
        else {
            message = rawInput;
        }
        // Clear command UI state
        setActiveCommand(null);
        setShowCmdPopup(false);
        // ── Disambiguation check ─────────────────────────────────────────────
        // When the user types a plain message (no /command) that looks like a
        // discussion/question, and the sidebar is in Auto mode (intent unknown),
        // surface two options instead of guessing silently:
        //   💬 /chat <message>  — answer in chat only
        //   📝 <message>        — write result to notebook cells
        //
        // This is skipped when:
        //   - A slash command was explicitly typed
        //   - The user already chose via a disambiguation card (skipAdvisory=true)
        //   - The sidebar is locked to Chat or Document mode (intent is clear)
        //   - A context chip is attached (specific targeted action)
        if (!skipAdvisory &&
            !slashCommand &&
            cellMode === 'auto' &&
            !chip &&
            !selectedOutputRef.current &&
            looksAdvisory(typedText, advisoryPhrases)) {
            setInput('');
            const disambigId = generateId();
            setMessages(prev => [...prev, {
                    id: disambigId,
                    role: 'disambiguation',
                    content: typedText,
                    timestamp: new Date(),
                }]);
            return;
        }
        // Capture conversation history BEFORE adding the new user message.
        // We only include user/assistant turns (not system/warning/report/code-review),
        // and cap at the last 6 turns (3 exchanges) to limit token usage.
        const MAX_HISTORY_TURNS = 6;
        const chatHistory = messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .slice(-MAX_HISTORY_TURNS)
            .map(m => ({ role: m.role, content: m.content }));
        setInput('');
        // Show the raw input in the user bubble; if a short display label was
        // provided (e.g. from a context-menu action), show that instead so the
        // chat isn't cluttered with large code blocks.
        addMessageWithChip('user', rawInput, bubbleDisplay, chip !== null && chip !== void 0 ? chip : undefined);
        setIsLoading(true);
        setProgressText('Reading notebook context...');
        let progressTimer;
        try {
            const context = notebookReader.getFullContext();
            if (!context) {
                addMessage('system', 'No active notebook. Please open a notebook first.');
                return;
            }
            // ── Attach selected output (from right-click output overlay) ─────
            if (selectedOutputRef.current) {
                context.selectedOutput = selectedOutputRef.current;
                selectedOutputRef.current = null; // consume once
            }
            // ── Enrich context with live DataFrame schemas from kernel ───────
            setProgressText('Inspecting kernel variables…');
            const dataframes = await notebookReader.getDataFrameSchemas();
            if (dataframes.length > 0) {
                context.dataframes = dataframes;
            }
            // ── Resolve @variable_name references in the message ─────────────
            let resolvedVariables = [];
            const varRefs = (0, VariableResolver_1.parseVariableRefs)(message);
            if (varRefs.length > 0) {
                setProgressText(`Resolving ${varRefs.map(r => '@' + r).join(', ')}…`);
                resolvedVariables = await variableResolver.resolve(message);
                if (resolvedVariables.length > 0) {
                    const badges = resolvedVariables.map(v => {
                        var _a, _b, _c;
                        const s = v.summary;
                        if (s.type === 'dataframe') {
                            return `📎 @${v.expr} (${(_b = (_a = s.shape) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.toLocaleString()}×${(_c = s.shape) === null || _c === void 0 ? void 0 : _c[1]})`;
                        }
                        if (s.type === 'error') {
                            return `⚠️ @${v.expr}: ${s.error}`;
                        }
                        const val = s.value !== undefined ? ` = ${s.value}` : '';
                        return `📎 @${v.expr}${val}`;
                    }).join('  ');
                    addMessage('system', badges);
                }
            }
            // ── /learn command: save user preference to memory ───────────────
            // Route through the task endpoint with an explicit save-to-memory
            // instruction prepended so the LLM records it in preferences.md.
            if (slashCommand === '/learn' && message.trim()) {
                // Override the message to clearly instruct the backend to persist this.
                message = `Save this preference to memory and confirm it was recorded: ${message.trim()}`;
                // fall through to the normal task flow
            }
            // ── Report generation shortcut ──────────────────────────────────
            if (slashCommand === '/report') {
                const notebookPath = context.notebookPath;
                if (!notebookPath) {
                    addMessage('system', 'Cannot generate report: no notebook path found. Please open a notebook.');
                    return;
                }
                setProgressText('Analyzing notebook and generating report…');
                try {
                    const result = await apiClient.generateReport(notebookPath);
                    const id = generateId();
                    setMessages(prev => [...prev, {
                            id,
                            role: 'report',
                            content: `Report generated successfully.`,
                            timestamp: new Date(),
                            reportMeta: {
                                filename: result.filename,
                                relativePath: result.relativePath,
                                stats: result.stats,
                                imagesCount: result.imagesCount,
                                wordCount: result.wordCount,
                            },
                        }]);
                }
                catch (err) {
                    addMessage('system', `Report generation failed: ${(_c = err === null || err === void 0 ? void 0 : err.message) !== null && _c !== void 0 ? _c : err}`);
                }
                return;
            }
            // ────────────────────────────────────────────────────────────────
            setProgressText('Sending to AI…');
            // Fallback timer: if no SSE progress event arrives within 3s, cycle
            // through messages so the UI never looks completely frozen.
            const FALLBACK_MESSAGES = [
                'Sending to AI…',
                'Reading notebook…',
                'Generating…',
                'Almost there…',
            ];
            let progressIdx = 0;
            progressTimer = setInterval(() => {
                progressIdx = (progressIdx + 1) % FALLBACK_MESSAGES.length;
                setProgressText(FALLBACK_MESSAGES[progressIdx]);
            }, 3000);
            // Streaming strategy:
            //  - chat/advisory: LLM streams the full text response token by token
            //  - auto/preview:  LLM streams a 1-3 sentence explanation, then calls the
            //                   tool. We render that explanation live in the chat bubble,
            //                   then append the step summary once operations are applied.
            //  - manual:        no chunk streaming (JSON response), uses progress only.
            const streamMsgId = `stream-${Date.now()}`;
            let streamStarted = false;
            jsonExtractorRef.current.reset();
            // Ensure the streaming bubble exists and the queue is running
            const ensureStreamStarted = () => {
                if (!streamStarted) {
                    clearInterval(progressTimer);
                    setProgressText('');
                    setMessages(prev => [...prev, {
                            id: streamMsgId,
                            role: 'assistant',
                            content: '',
                            timestamp: new Date()
                        }]);
                    startStreamQueue(streamMsgId);
                    streamStarted = true;
                }
            };
            // Helper: append text to the streaming message (or add a new one if no stream)
            const appendToStream = (suffix) => {
                if (streamStarted) {
                    setMessages(prev => prev.map(m => m.id === streamMsgId ? Object.assign(Object.assign({}, m), { content: m.content + suffix }) : m));
                }
                else {
                    addMessage('assistant', suffix);
                }
            };
            // Helper: mark the streaming message as having produced cell operations.
            // This suppresses the "Push code to cell" fallback button.
            const markHadCellOps = (opId) => {
                setMessages(prev => prev.map(m => m.id === streamMsgId ? Object.assign(Object.assign({}, m), { hadCellOps: true, operationId: opId }) : m));
            };
            // If a skill command is active, show a badge in the chat so the user knows
            // which skill was activated.
            if (slashCommand) {
                const skillCmd = commands.find(c => c.command === slashCommand && c.type === 'skill');
                if (skillCmd) {
                    addMessage('system', `🔧 Skill activated: **${skillCmd.command}** — ${skillCmd.description}`);
                }
            }
            // Create a fresh abort controller for this request so the stop button
            // can cancel the fetch mid-stream without affecting future requests.
            const abortCtrl = new AbortController();
            abortControllerRef.current = abortCtrl;
            const response = await apiClient.executeTaskStreaming(Object.assign(Object.assign({ message, notebookContext: context, chatHistory, variables: resolvedVariables }, (slashCommand ? { command: slashCommand } : {})), { cellMode }), 
            // onChunk — explanation text Claude emits before the tool call
            (chunk) => {
                ensureStreamStarted();
                pushToStreamQueue(chunk);
            }, 
            // onProgress — status label while the tool-call JSON is being generated
            (text) => {
                clearInterval(progressTimer);
                setProgressText(text);
            }, 
            // onJsonDelta — raw partial JSON from the tool call; extract cell content
            (partial) => {
                const extractor = jsonExtractorRef.current;
                if (!extractor.headerEmitted) {
                    ensureStreamStarted();
                    pushToStreamQueue('\n\n✍ ');
                    extractor.headerEmitted = true;
                }
                const newChars = extractor.feed(partial);
                if (newChars) {
                    pushToStreamQueue(newChars);
                }
            }, abortCtrl.signal);
            clearInterval(progressTimer);
            stopStreamQueue();
            // ── Accumulate token usage for the current thread ─────────────────
            if (response.tokenUsage) {
                const tid = currentThreadIdRef.current;
                if (tid) {
                    setThreads(prev => prev.map(t => {
                        var _a;
                        if (t.id !== tid)
                            return t;
                        const existing = (_a = t.tokenUsage) !== null && _a !== void 0 ? _a : { input: 0, output: 0 };
                        return Object.assign(Object.assign({}, t), { tokenUsage: {
                                input: existing.input + (response.tokenUsage.input || 0),
                                output: existing.output + (response.tokenUsage.output || 0),
                            } });
                    }));
                }
            }
            // Surface backend warnings (e.g. vision not supported)
            if (response.warnings && response.warnings.length > 0) {
                for (const w of response.warnings) {
                    addMessage('warning', w);
                }
            }
            // ── Composite pipeline mode ──────────────────────────────────────
            if (response.cellInsertionMode === 'composite' && response.compositePlan) {
                // Defined here to close over appendToStream, setProgressText, etc.
                const runCompositePipeline = async (compositeName, pipelineSteps) => {
                    const masterOpId = `pipeline_${Date.now()}`;
                    const allDiffs = [];
                    const allOpIds = [];
                    const displayName = compositeName.replace(/-/g, ' ');
                    appendToStream(`\n\n⚙️ **Pipeline: ${displayName}** — ${pipelineSteps.length} steps\n`);
                    for (let si = 0; si < pipelineSteps.length; si++) {
                        const step = pipelineSteps[si];
                        const stepLabel = step.skill_name.replace(/-/g, ' ');
                        appendToStream(`\n**Step ${si + 1}/${pipelineSteps.length}:** ${stepLabel}…`);
                        setProgressText(`Step ${si + 1}/${pipelineSteps.length}: ${stepLabel}…`);
                        const freshContext = notebookReader.getFullContext();
                        if (!freshContext) {
                            appendToStream(` ✗ (no active notebook)`);
                            break;
                        }
                        const dfs = await notebookReader.getDataFrameSchemas();
                        if (dfs.length > 0)
                            freshContext.dataframes = dfs;
                        try {
                            const stepOpId = `${masterOpId}_s${si}`;
                            const stepResponse = await apiClient.executeTaskStreaming({
                                message: step.prompt,
                                notebookContext: freshContext,
                                operationId: stepOpId,
                                forceAutoMode: true,
                                chatHistory: [],
                            }, () => { }, txt => setProgressText(txt));
                            if (stepResponse.steps && stepResponse.steps.length > 0) {
                                const { stepIndexMap: sMap, capturedOriginals: sOrig } = await cellEditor.applyOperations(stepResponse.operationId, stepResponse.steps);
                                const stepDiffs = stepResponse.steps
                                    .filter(s => s.type === 'insert' || s.type === 'modify' || s.type === 'delete')
                                    .map((s, k) => {
                                    var _a, _b, _c, _d;
                                    return ({
                                        cellIndex: (_a = sMap.get(k)) !== null && _a !== void 0 ? _a : s.cellIndex,
                                        opType: s.type,
                                        cellType: ((_b = s.cellType) !== null && _b !== void 0 ? _b : 'code'),
                                        original: (_c = sOrig.get(k)) !== null && _c !== void 0 ? _c : '',
                                        modified: s.type === 'delete' ? '' : ((_d = s.content) !== null && _d !== void 0 ? _d : ''),
                                        description: s.description,
                                    });
                                });
                                allDiffs.push(...stepDiffs);
                                allOpIds.push(stepResponse.operationId);
                                appendToStream(` ✓ (${stepResponse.steps.length} cell(s))`);
                            }
                            else {
                                appendToStream(` ✓ (no cells)`);
                            }
                        }
                        catch (err) {
                            const errMsg = err instanceof Error ? err.message : String(err);
                            appendToStream(` ✗ (${errMsg})`);
                            console.warn(`[DSAssistant] Pipeline step ${si + 1} failed:`, err);
                        }
                    }
                    setProgressText('');
                    if (allDiffs.length > 0) {
                        const uniqueIndices = allDiffs
                            .map(d => d.cellIndex)
                            .filter((v, idx, arr) => arr.indexOf(v) === idx);
                        setPendingOps(prev => [
                            ...prev,
                            {
                                operationId: masterOpId,
                                cellIndices: uniqueIndices,
                                steps: [],
                                description: `Pipeline: ${displayName} — ${allDiffs.length} change(s)`,
                                diffs: allDiffs,
                                compositeOpIds: allOpIds,
                            }
                        ]);
                        markHadCellOps(masterOpId);
                        appendToStream(`\n\n✅ Pipeline complete — ${allDiffs.length} cell change(s) across ${pipelineSteps.length} steps.\nReview the diff below then Accept or Undo all.`);
                    }
                    else {
                        appendToStream(`\n\n✅ Pipeline complete — no cell changes.`);
                    }
                };
                await runCompositePipeline((_d = response.compositeName) !== null && _d !== void 0 ? _d : 'pipeline', response.compositePlan);
                return;
            }
            // ── Manual mode (code-review) ────────────────────────────────────
            if (response.cellInsertionMode === 'manual') {
                const id = generateId();
                setMessages(prev => {
                    var _a, _b, _c;
                    return [...prev, {
                            id,
                            role: 'code-review',
                            content: (_b = (_a = response.chatResponse) !== null && _a !== void 0 ? _a : response.summary) !== null && _b !== void 0 ? _b : 'Code review complete.',
                            timestamp: new Date(),
                            codeReviewSteps: (_c = response.steps) !== null && _c !== void 0 ? _c : [],
                        }];
                });
                return;
            }
            // ── Chat / advisory mode ─────────────────────────────────────────
            if (response.cellInsertionMode === 'chat' && response.chatResponse) {
                if (streamStarted) {
                    setMessages(prev => prev.map(m => m.id === streamMsgId
                        ? Object.assign(Object.assign({}, m), { content: response.chatResponse }) : m));
                }
                else {
                    addMessage('assistant', response.chatResponse);
                }
                // Show RAG source citations if the response was augmented
                if (response.ragSources && Array.isArray(response.ragSources) && response.ragSources.length > 0) {
                    const sources = response.ragSources
                        .map((s, i) => {
                        const file = s.source ? s.source.split('/').pop() : 'unknown';
                        const loc = s.cell_idx != null ? `, cell ${s.cell_idx}` : s.page != null ? `, page ${s.page}` : '';
                        const score = typeof s.score === 'number' ? ` (score: ${s.score.toFixed(2)})` : '';
                        return `${i + 1}. **${file}**${loc}${score}`;
                    })
                        .join('\n');
                    addMessage('system', `📎 **Sources from knowledge base:**\n${sources}`);
                }
                // When the user's "Chat Only" toggle prevented a skill from writing cells,
                // show a gentle advisory note so they know they can switch mode.
                if (response.skillWantedCells) {
                    addMessage('system', '⚠️ **Chat Only mode is active** — this skill would normally create notebook cells. ' +
                        'Switch to **⚡ Auto** or **📝 Document** mode (button next to ✏️) to enable cell writing.');
                }
                return;
            }
            // ── Clarification needed (no tool call) ──────────────────────────
            if (response.clarificationNeeded) {
                appendToStream(streamStarted ? `\n\n${response.clarificationNeeded}` : response.clarificationNeeded);
                return;
            }
            if (!response.steps || response.steps.length === 0) {
                appendToStream(streamStarted
                    ? `\n\n${(_e = response.summary) !== null && _e !== void 0 ? _e : 'Done — no cell changes were required.'}`
                    : ((_f = response.summary) !== null && _f !== void 0 ? _f : 'Done — no cell changes were required.'));
                return;
            }
            setProgressText(`Applying ${response.steps.length} operation(s)…`);
            const { stepIndexMap, capturedOriginals } = await cellEditor.applyOperations(response.operationId, response.steps);
            // Execute cells flagged for auto-run
            if (!response.requiresApproval) {
                for (let i = 0; i < response.steps.length; i++) {
                    const step = response.steps[i];
                    const shouldRun = step.type === 'run_cell' ||
                        (step.autoExecute === true && step.type !== 'delete');
                    if (shouldRun) {
                        const notebookIndex = (_g = stepIndexMap.get(i)) !== null && _g !== void 0 ? _g : step.cellIndex;
                        setProgressText(`Running cell ${notebookIndex}…`);
                        try {
                            await cellEditor.executeCell(notebookIndex);
                        }
                        catch (err) {
                            console.warn(`[DSAssistant] auto-execution of cell ${notebookIndex} failed:`, err);
                        }
                    }
                }
            }
            const affectedIndices = Array.from(stepIndexMap.values());
            const stepSummary = response.steps
                .map(s => { var _a; return `- ${(_a = s.description) !== null && _a !== void 0 ? _a : `${s.type} cell at index ${s.cellIndex}`}`; })
                .join('\n');
            // ── Auto mode ────────────────────────────────────────────────────
            const isAutoMode = response.cellInsertionMode === 'auto' && !response.requiresApproval;
            if (isAutoMode) {
                cellEditor.acceptOperation(response.operationId);
                markHadCellOps(response.operationId);
                appendToStream(`\n\n✓ Done\n\n${stepSummary}`);
                return;
            }
            // ── Build per-cell diff data for the visual diff panel ────────────
            const diffs = response.steps
                .filter(s => s.type === 'insert' || s.type === 'modify' || s.type === 'delete')
                .map((s, i) => {
                var _a, _b, _c, _d;
                const notebookIdx = (_a = stepIndexMap.get(i)) !== null && _a !== void 0 ? _a : s.cellIndex;
                const original = (_b = capturedOriginals.get(i)) !== null && _b !== void 0 ? _b : '';
                const modified = s.type === 'delete' ? '' : ((_c = s.content) !== null && _c !== void 0 ? _c : '');
                return {
                    cellIndex: notebookIdx,
                    opType: s.type,
                    cellType: ((_d = s.cellType) !== null && _d !== void 0 ? _d : 'code'),
                    original,
                    modified,
                    description: s.description
                };
            });
            // ── Preview mode (default) ────────────────────────────────────────
            const op = {
                operationId: response.operationId,
                cellIndices: affectedIndices,
                steps: response.steps,
                description: (_h = response.summary) !== null && _h !== void 0 ? _h : `Created/modified ${response.steps.length} cell(s)`,
                diffs
            };
            setPendingOps(prev => [...prev, op]);
            // Mark the chat bubble so the Push-to-cell button is hidden while the
            // diff view is shown (and after the user accepts/undoes).
            markHadCellOps(response.operationId);
            // Append step summary + review prompt to the streamed explanation bubble
            const reviewPrompt = response.requiresApproval
                ? '\n\n⚠️ This operation requires approval before execution.'
                : '\n\nReview the highlighted cell(s) then Accept or Undo.';
            appendToStream(`\n\n${stepSummary}${reviewPrompt}`);
        }
        catch (error) {
            clearInterval(progressTimer);
            // AbortError means the user clicked "Stop" — silently discard
            if (error instanceof Error && error.name === 'AbortError') {
                stopStreamQueue();
                // leave any already-streamed text visible
            }
            else {
                const msg = error instanceof Error ? error.message : 'Unknown error occurred';
                // If the message already starts with an error indicator (⛔ / ❌ / Error:)
                // don't prefix it again to avoid "Error: ⛔ ..."
                const display = /^(⛔|❌|Error:|error:)/i.test(msg) ? msg : `❌ Error: ${msg}`;
                addMessage('system', display);
            }
        }
        finally {
            abortControllerRef.current = null;
            setIsLoading(false);
            setProgressText('');
        }
    };
    // -------------------------------------------------------------------------
    // Accept / Undo handlers
    // -------------------------------------------------------------------------
    // ── Apply an individual code-review fix ────────────────────────────────────
    const handleApplyFix = async (msgId, stepIdx, step) => {
        const fixOpId = `fix_${msgId}_${stepIdx}`;
        try {
            await cellEditor.applyOperations(fixOpId, [step]);
            cellEditor.acceptOperation(fixOpId);
            setAppliedFixes(prev => {
                var _a;
                const next = new Map(prev);
                const set = new Set((_a = next.get(msgId)) !== null && _a !== void 0 ? _a : []);
                set.add(stepIdx);
                next.set(msgId, set);
                return next;
            });
        }
        catch (err) {
            addMessage('system', `Failed to apply fix: ${err instanceof Error ? err.message : err}`);
        }
    };
    const _acceptSingleOrComposite = (op) => {
        if (op.compositeOpIds) {
            op.compositeOpIds.forEach(id => cellEditor.acceptOperation(id));
        }
        else {
            cellEditor.acceptOperation(op.operationId);
        }
    };
    const handleAccept = (operationId) => {
        const op = pendingOps.find(o => o.operationId === operationId);
        if (op)
            _acceptSingleOrComposite(op);
        setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
        addMessage('system', 'Changes accepted.');
    };
    const handleAcceptAndRun = async (operationId) => {
        const op = pendingOps.find(o => o.operationId === operationId);
        if (op)
            _acceptSingleOrComposite(op);
        setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
        if (!op)
            return;
        const codeIndices = op.diffs
            .filter(d => d.cellType === 'code' && d.opType !== 'delete')
            .map(d => d.cellIndex)
            .filter((v, i, arr) => arr.indexOf(v) === i);
        if (codeIndices.length === 0) {
            addMessage('system', 'Changes accepted.');
            return;
        }
        addMessage('system', `Accepted — running ${codeIndices.length} cell(s)…`);
        for (const idx of codeIndices) {
            try {
                await cellEditor.executeCell(idx);
            }
            catch (err) {
                console.warn(`[DSAssistant] Accept & Run: execution of cell ${idx} failed:`, err);
            }
        }
        addMessage('system', `✓ Done — executed ${codeIndices.length} cell(s).`);
    };
    const handleUndo = (operationId) => {
        const op = pendingOps.find(o => o.operationId === operationId);
        if (op === null || op === void 0 ? void 0 : op.compositeOpIds) {
            // Reverse order so later steps (which may have inserted cells) are undone first
            [...op.compositeOpIds].reverse().forEach(id => cellEditor.undoOperation(id));
        }
        else {
            cellEditor.undoOperation(operationId);
        }
        setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
        addMessage('system', 'Changes undone.');
    };
    const handleApplySelection = (operationId, decisions) => {
        cellEditor.partialAcceptOperation(operationId, decisions);
        setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
        const accepted = decisions.filter(d => d.accept).length;
        const rejected = decisions.filter(d => !d.accept).length;
        const hunkNote = decisions.some(d => d.finalContent !== undefined)
            ? ' (partial hunk selection applied)'
            : '';
        addMessage('system', `Applied: ${accepted} accepted, ${rejected} discarded${hunkNote}.`);
    };
    // -------------------------------------------------------------------------
    // Model switcher handler
    // -------------------------------------------------------------------------
    const handleModelSelect = async (newModel) => {
        const prev = chatModel;
        setChatModel(newModel); // optimistic
        setModelSwitching(true);
        try {
            await apiClient.saveSettings({ [`${chatProvider}_CHAT_MODEL`]: newModel });
        }
        catch (_a) {
            setChatModel(prev); // revert on error
        }
        finally {
            setModelSwitching(false);
        }
    };
    // -------------------------------------------------------------------------
    // Thread management
    // -------------------------------------------------------------------------
    const handleNewThread = () => {
        var _a, _b;
        const t = makeNewThread(`Thread ${threads.length + 1}`);
        // Persist the current thread before switching
        const curId = currentThreadIdRef.current;
        const curName = (_b = (_a = threadsRef.current.find(th => th.id === curId)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Thread';
        void _saveThread(curId, curName, messages);
        const updated = [...threadsRef.current, t];
        setThreads(updated);
        threadsRef.current = updated;
        setCurrentThreadId(t.id);
        currentThreadIdRef.current = t.id;
        stopStreamQueue();
        setMessages([{
                id: `welcome-${t.id}`,
                role: 'system',
                content: `✨ Thread "${t.name}" started.`,
                timestamp: new Date(),
            }]);
        setInput('');
        setProgressText('');
        setPendingOps([]);
        setAppliedFixes(new Map());
        setIsLoading(false);
        setActiveStreamId('');
    };
    const handleSwitchThread = (threadId) => {
        var _a, _b;
        if (threadId === currentThreadIdRef.current)
            return;
        // Save the current thread
        const curId = currentThreadIdRef.current;
        const curName = (_b = (_a = threadsRef.current.find(t => t.id === curId)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Thread';
        void _saveThread(curId, curName, messages);
        const thread = threadsRef.current.find(t => t.id === threadId);
        if (!thread)
            return;
        setCurrentThreadId(threadId);
        currentThreadIdRef.current = threadId;
        const restored = thread.messages.length > 0
            ? thread.messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp),
            }))
            : [{
                    id: `welcome-${threadId}`,
                    role: 'system',
                    content: `Switched to "${thread.name}".`,
                    timestamp: new Date(),
                }];
        stopStreamQueue();
        setMessages(restored);
        setPendingOps([]);
        setAppliedFixes(new Map());
        setProgressText('');
        setActiveStreamId('');
    };
    const handleRenameThread = async (threadId, newName) => {
        var _a, _b;
        const updated = threadsRef.current.map(t => t.id === threadId ? Object.assign(Object.assign({}, t), { name: newName }) : t);
        setThreads(updated);
        threadsRef.current = updated;
        // Save with new name — use live messages for the current thread
        const msgs = threadId === currentThreadIdRef.current
            ? messages
            : ((_b = (_a = updated.find(t => t.id === threadId)) === null || _a === void 0 ? void 0 : _a.messages) !== null && _b !== void 0 ? _b : []).map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp),
            }));
        void _saveThread(threadId, newName, msgs);
    };
    const handleDeleteThread = async (threadId) => {
        var _a;
        if (threadsRef.current.length <= 1)
            return;
        const updated = threadsRef.current.filter(t => t.id !== threadId);
        setThreads(updated);
        threadsRef.current = updated;
        if (threadId === currentThreadIdRef.current) {
            handleSwitchThread(updated[0].id);
        }
        const nbPath = currentNotebookPathRef.current
            || ((_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.context.path)
            || '';
        if (nbPath) {
            try {
                await apiClient.deleteChatThread(nbPath, threadId);
            }
            catch (err) {
                console.warn('[DSAssistant] Could not delete thread:', err);
            }
        }
    };
    // -------------------------------------------------------------------------
    // Built-in slash command handler
    // -------------------------------------------------------------------------
    const handleBuiltinCommand = (cmd) => {
        switch (cmd) {
            case '/clear':
                handleNewThread();
                break;
            case '/help': {
                const builtins = commands.filter(c => c.type === 'builtin');
                const skills = commands.filter(c => c.type === 'skill');
                const rows = (arr) => arr.map(c => `  **${c.command}** — ${c.description}`).join('\n');
                const helpText = '### Varys Commands\n\n' +
                    '**Built-in**\n' + rows(builtins) + '\n\n' +
                    (skills.length ? '**Skills**\n' + rows(skills) : '_(No skills installed)_');
                addMessage('assistant', helpText);
                break;
            }
            case '/skills': {
                const skill_cmds = commands.filter(c => c.type === 'skill');
                if (!skill_cmds.length) {
                    addMessage('system', 'No skill commands installed. Add skills in Settings → Skills.');
                }
                else {
                    const list = skill_cmds
                        .map(c => `  **${c.command}** — ${c.description}`)
                        .join('\n');
                    addMessage('assistant', '### Available skill commands\n\n' + list);
                }
                break;
            }
            case '/chat':
                // With no args: show usage. With args, handleSend routes to chat flow.
                addMessage('system', '### 💬 Chat-only mode\n\n' +
                    'Type `/chat <your request>` to get a response **in the chat window only** — no notebook cells will be created or modified, regardless of any skill defaults.\n\n' +
                    '**Example:** `/chat Compute the delta diff for this table: …`');
                break;
            case '/ask':
                // With no args: show usage. With args, handleSend routes to RAG flow.
                addMessage('system', '### 📚 Knowledge Base Query\n\n' +
                    'Type `/ask <your question>` to search indexed documents and get an answer with citations.\n\n' +
                    'Run `/index <path>` first to index files into the knowledge base.');
                break;
            case '/learn':
                // /learn is handled in handleSend when the full message is available
                addMessage('system', 'Type `/learn <your preference>` and press Enter to save it to memory.');
                break;
            case '/index':
                // No args → index the whole knowledge folder immediately.
                void handleIndexCommand('');
                break;
            case '/rag':
                // Show RAG status — handled async in handleSend-style flow
                void handleRagStatus();
                break;
            case '/newnotebook':
                addMessage('system', 'New notebook creation is not yet implemented. Coming soon!');
                break;
            default:
                addMessage('system', `Unknown command: ${cmd}`);
        }
    };
    // -------------------------------------------------------------------------
    // RAG-specific handlers
    // -------------------------------------------------------------------------
    const handleIndexCommand = async (path) => {
        const displayPath = path || '.jupyter-assistant/knowledge';
        setIsLoading(true);
        const progressId = generateId();
        setMessages(prev => [...prev, {
                id: progressId,
                role: 'system',
                content: `📂 Indexing **${displayPath}**…`,
                timestamp: new Date()
            }]);
        try {
            const result = await apiClient.ragLearn(path, (msg) => {
                setMessages(prev => prev.map(m => m.id === progressId ? Object.assign(Object.assign({}, m), { content: msg }) : m));
            }, false, currentNotebookPathRef.current);
            const summary = `✅ **Indexing complete** — \`${displayPath}\`\n\n` +
                `- Files found: **${result.total}**\n` +
                `- Indexed: **${result.processed}**\n` +
                `- Skipped (unchanged): **${result.skipped}**\n` +
                (result.errors.length
                    ? `- Errors: ${result.errors.map((e) => `\n  - ${e}`).join('')}`
                    : '');
            setMessages(prev => prev.map(m => m.id === progressId ? Object.assign(Object.assign({}, m), { content: summary }) : m));
        }
        catch (err) {
            setMessages(prev => prev.map(m => m.id === progressId
                ? Object.assign(Object.assign({}, m), { content: `❌ Indexing failed: ${err.message}` }) : m));
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleRagStatus = async () => {
        setIsLoading(true);
        try {
            const status = await apiClient.ragStatus(currentNotebookPathRef.current);
            if (!status.available) {
                addMessage('system', '⚠️ **RAG not available**\n\n' +
                    (status.hint || 'Install with: `pip install chromadb sentence-transformers`'));
                return;
            }
            const fileList = status.files.length
                ? status.files.slice(0, 20).map((f) => `- \`${f.split('/').pop()}\``).join('\n') +
                    (status.files.length > 20 ? `\n- _...and ${status.files.length - 20} more_` : '')
                : '_No files indexed yet_';
            addMessage('assistant', `### 📚 Knowledge Base Status\n\n` +
                `- **Total chunks**: ${status.total_chunks}\n` +
                `- **Indexed files**: ${status.indexed_files}\n\n` +
                `**Files:**\n${fileList}\n\n` +
                `Drop documents in \`.jupyter-assistant/knowledge/\` and run \`/index\` to index them.`);
        }
        catch (err) {
            addMessage('system', `❌ Could not get RAG status: ${err.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Keep the ref pointing at the latest handleSend so the external-message
    // listener can invoke it without capturing a stale closure.
    (0, react_1.useEffect)(() => { handleSendRef.current = handleSend; });
    // Stop the current streaming request when the user clicks the stop button.
    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };
    // -------------------------------------------------------------------------
    // Keyboard handler - Enter to send, Shift+Enter for newline
    // -------------------------------------------------------------------------
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };
    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    if (showSettings) {
        return (react_1.default.createElement("div", { className: "ds-assistant-sidebar" },
            react_1.default.createElement("div", { className: "ds-assistant-header" },
                react_1.default.createElement("span", { className: "ds-assistant-title" }, "DS Assistant \u2014 Settings"),
                react_1.default.createElement("button", { className: "ds-settings-close-btn", onClick: () => setShowSettings(false), title: "Back to chat" }, "\u2715")),
            react_1.default.createElement(SettingsPanel, { apiClient: apiClient, onClose: () => { setShowSettings(false); loadModelSettings(); }, onSaved: loadModelSettings, notebookPath: currentNotebookPath })));
    }
    if (showRepro) {
        return (react_1.default.createElement("div", { className: "ds-assistant-sidebar" },
            react_1.default.createElement("div", { className: "ds-assistant-header" },
                react_1.default.createElement("span", { className: "ds-assistant-title" }, "DS Assistant \u2014 Reproducibility"),
                react_1.default.createElement("button", { className: "ds-settings-close-btn", onClick: () => setShowRepro(false), title: "Back to chat" }, "\u2715")),
            react_1.default.createElement(ReproPanel_1.ReproPanel, { apiClient: apiClient, cellEditor: cellEditor, notebookReader: notebookReader })));
    }
    if (showTags) {
        return (react_1.default.createElement("div", { className: "ds-assistant-sidebar" },
            react_1.default.createElement("div", { className: "ds-assistant-header" },
                react_1.default.createElement("span", { className: "ds-assistant-title" }, "DS Assistant \u2014 Tags"),
                react_1.default.createElement("button", { className: "ds-settings-close-btn", onClick: () => setShowTags(false), title: "Back to chat" }, "\u2715")),
            react_1.default.createElement(TagsPanel_1.TagsPanel, { notebookTracker: notebookTracker })));
    }
    return (react_1.default.createElement("div", { className: `ds-assistant-sidebar ds-chat-${chatTheme}` },
        react_1.default.createElement("div", { className: "ds-assistant-header" },
            react_1.default.createElement("span", { className: "ds-assistant-title" }, "DS Assistant"),
            providerStatus.provider !== 'unknown' && (react_1.default.createElement(ProviderBadge, { status: providerStatus })),
            react_1.default.createElement("button", { className: "ds-tags-panel-btn", onClick: () => setShowTags(true), title: "Cell Tags & Metadata" }, "\uD83C\uDFF7\uFE0F"),
            react_1.default.createElement("button", { className: "ds-repro-shield-btn", onClick: () => setShowRepro(true), title: "Reproducibility Guardian" }, "\uD83D\uDEE1\uFE0F"),
            react_1.default.createElement("button", { className: "ds-theme-toggle-btn", onClick: toggleChatTheme, title: chatTheme === 'day' ? 'Switch to night mode' : 'Switch to day mode', "aria-label": chatTheme === 'day' ? 'Switch to night mode' : 'Switch to day mode' }, chatTheme === 'day' ? '🌙' : '☀️'),
            react_1.default.createElement("button", { className: "ds-wiki-help-btn", onClick: () => window.open('/varys/wiki', '_blank'), title: "Open documentation wiki" }, "?"),
            react_1.default.createElement("button", { className: "ds-settings-gear-btn", onClick: () => setShowSettings(true), title: "Configure providers and models" }, "\u2699")),
        react_1.default.createElement(ThreadBar, { threads: threads, currentId: currentThreadId, notebookName: currentNotebookPath
                ? (_b = (_a = currentNotebookPath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace(/\.ipynb$/, '')) !== null && _b !== void 0 ? _b : ''
                : '', onSwitch: handleSwitchThread, onNew: handleNewThread, onRename: (id, name) => void handleRenameThread(id, name), onDelete: (id) => void handleDeleteThread(id) }),
        react_1.default.createElement("div", { className: "ds-assistant-messages", onClick: (e) => {
                var _a, _b, _c;
                const btn = e.target.closest('.ds-copy-code-btn');
                if (!btn)
                    return;
                const code = (_c = (_b = (_a = btn.closest('.ds-code-block-wrapper')) === null || _a === void 0 ? void 0 : _a.querySelector('code')) === null || _b === void 0 ? void 0 : _b.textContent) !== null && _c !== void 0 ? _c : '';
                void navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = '✓ Copied';
                    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                });
            } },
            messages.map(msg => {
                var _a, _b, _c, _d;
                return (react_1.default.createElement("div", { key: msg.id, className: `ds-assistant-message ds-assistant-message-${msg.role}` }, msg.role === 'disambiguation' ? (
                /* ── Disambiguation card ───────────────────────────── */
                react_1.default.createElement(DisambiguationCard, { originalMessage: msg.content, msgId: msg.id, onChoice: (mode, id) => {
                        // Remove the disambiguation message
                        setMessages(prev => prev.filter(m => m.id !== id));
                        if (mode === 'chat') {
                            // Re-send with /chat prefix so the backend uses advisory mode
                            void handleSend(`/chat ${msg.content}`, msg.content, true);
                        }
                        else {
                            // Re-send plain — skip the advisory check this time
                            void handleSend(msg.content, undefined, true);
                        }
                    } })) : msg.role === 'report' && msg.reportMeta ? (react_1.default.createElement("div", { className: "ds-report-card" },
                    react_1.default.createElement("div", { className: "ds-report-card-header" },
                        react_1.default.createElement("span", { className: "ds-report-card-icon" }, "\uD83D\uDCC4"),
                        react_1.default.createElement("span", { className: "ds-report-card-title" }, "Report ready")),
                    react_1.default.createElement("div", { className: "ds-report-card-filename" }, msg.reportMeta.filename),
                    react_1.default.createElement("div", { className: "ds-report-card-stats" },
                        react_1.default.createElement("span", null,
                            msg.reportMeta.wordCount.toLocaleString(),
                            " words"),
                        react_1.default.createElement("span", null, "\u00B7"),
                        react_1.default.createElement("span", null,
                            msg.reportMeta.imagesCount,
                            " image",
                            msg.reportMeta.imagesCount !== 1 ? 's' : ''),
                        react_1.default.createElement("span", null, "\u00B7"),
                        react_1.default.createElement("span", null,
                            msg.reportMeta.stats.total,
                            " cells")),
                    react_1.default.createElement("a", { className: "ds-report-card-download", href: `${window.location.origin}/files/${msg.reportMeta.relativePath}`, target: "_blank", rel: "noreferrer", download: msg.reportMeta.filename }, "\uD83D\uDCE5 Download report"))) : msg.role === 'code-review' ? (
                /* ── Code-review message ──────────────────────────────────── */
                react_1.default.createElement("div", { className: `ds-code-review-message ds-msg-collapsible-wrap${collapsedMsgs.has(msg.id) ? ' ds-msg-collapsed' : ''}` },
                    collapsedMsgs.has(msg.id) && react_1.default.createElement("div", { className: "ds-msg-fade", "aria-hidden": "true" }),
                    react_1.default.createElement("div", { className: "ds-assistant-message-content ds-markdown", dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }),
                    msg.codeReviewSteps && msg.codeReviewSteps.length > 0 && (react_1.default.createElement("div", { className: "ds-fix-panel" },
                        react_1.default.createElement("div", { className: "ds-fix-panel-header" },
                            "\uD83D\uDD27 Available Fixes (",
                            msg.codeReviewSteps.length,
                            ")"),
                        msg.codeReviewSteps.map((step, i) => {
                            var _a, _b, _c;
                            const applied = (_b = (_a = appliedFixes.get(msg.id)) === null || _a === void 0 ? void 0 : _a.has(i)) !== null && _b !== void 0 ? _b : false;
                            return (react_1.default.createElement("div", { key: i, className: `ds-fix-card${applied ? ' ds-fix-card--applied' : ''}` },
                                react_1.default.createElement("div", { className: "ds-fix-card-desc" }, (_c = step.description) !== null && _c !== void 0 ? _c : `Fix for cell ${step.cellIndex}`),
                                react_1.default.createElement("details", { className: "ds-fix-card-toggle" },
                                    react_1.default.createElement("summary", null, "View code"),
                                    react_1.default.createElement("pre", { className: "ds-fix-card-code" }, step.content)),
                                react_1.default.createElement("button", { className: "ds-fix-card-btn", disabled: applied, onClick: () => handleApplyFix(msg.id, i, step) }, applied ? '✓ Applied' : 'Apply Fix')));
                        }))),
                    ((_b = (_a = msg.content) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= COLLAPSE_THRESHOLD && (react_1.default.createElement("button", { className: "ds-msg-toggle-btn", title: collapsedMsgs.has(msg.id) ? 'Expand' : 'Collapse', onClick: () => toggleCollapse(msg.id) }, collapsedMsgs.has(msg.id) ? '⌄' : '⌃')))) : (react_1.default.createElement(react_1.default.Fragment, null,
                    (() => {
                        var _a, _b, _c;
                        const isStreaming = msg.id === activeStreamId;
                        const isLong = ((_b = (_a = msg.content) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= COLLAPSE_THRESHOLD;
                        const collapsed = !isStreaming && isLong && collapsedMsgs.has(msg.id);
                        return (react_1.default.createElement("div", { className: `ds-msg-collapsible-wrap${collapsed ? ' ds-msg-collapsed' : ''}` },
                            react_1.default.createElement("div", { className: "ds-assistant-message-content ds-markdown", dangerouslySetInnerHTML: { __html: renderMarkdown((_c = msg.displayContent) !== null && _c !== void 0 ? _c : msg.content) } }),
                            msg.role === 'user' && msg.contextChip && (react_1.default.createElement(ContextChipBubble, { chip: msg.contextChip })),
                            isStreaming && (react_1.default.createElement("span", { className: "ds-typing-cursor", "aria-hidden": "true" },
                                react_1.default.createElement("span", null))),
                            collapsed && react_1.default.createElement("div", { className: "ds-msg-fade", "aria-hidden": "true" })));
                    })(),
                    !activeStreamId || msg.id !== activeStreamId ? (((_d = (_c = msg.content) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) >= COLLAPSE_THRESHOLD ? (react_1.default.createElement("button", { className: "ds-msg-toggle-btn", title: collapsedMsgs.has(msg.id) ? 'Expand' : 'Collapse', onClick: () => toggleCollapse(msg.id) }, collapsedMsgs.has(msg.id) ? '⌄' : '⌃')) : null) : null,
                    msg.role === 'assistant' && msg.id !== activeStreamId && !msg.hadCellOps && (() => {
                        const blocks = extractCodeBlocks(msg.content);
                        if (blocks.length === 0)
                            return null;
                        const allCode = blocks.join('\n\n');
                        return (react_1.default.createElement("button", { className: "ds-push-to-cell-btn", title: "Push to cell", onClick: () => {
                                var _a, _b;
                                const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
                                const insertIdx = nb
                                    ? ((_b = nb.activeCellIndex) !== null && _b !== void 0 ? _b : nb.model.cells.length - 1) + 1
                                    : 0;
                                void cellEditor.insertCell(insertIdx, 'code', allCode)
                                    .then(() => {
                                    addMessage('system', `✓ Code pushed to new cell at pos:${insertIdx}.`);
                                });
                            } }, "\u21B5"));
                    })()))));
            }),
            isLoading && progressText && !activeStreamId && (react_1.default.createElement("div", { className: "ds-assistant-message ds-assistant-message-system" },
                react_1.default.createElement("span", { className: "ds-assistant-loading" },
                    progressText,
                    react_1.default.createElement("span", { className: "ds-thinking-dots", "aria-hidden": "true" },
                        react_1.default.createElement("span", null),
                        react_1.default.createElement("span", null),
                        react_1.default.createElement("span", null))))),
            react_1.default.createElement("div", { ref: messagesEndRef })),
        pendingOps.length > 0 && (react_1.default.createElement("div", { className: "ds-assistant-pending-ops" }, pendingOps.map(op => (react_1.default.createElement(DiffView_1.DiffView, { key: op.operationId, operationId: op.operationId, description: op.description, diffs: op.diffs, hasCodeCells: op.diffs.some(d => d.cellType === 'code' && d.opType !== 'delete'), onAccept: handleAccept, onAcceptAndRun: handleAcceptAndRun, onUndo: handleUndo, onApplySelection: handleApplySelection }))))),
        react_1.default.createElement("div", { className: "ds-assistant-input-area" },
            react_1.default.createElement("div", { className: "ds-input-resize-handle", onMouseDown: handleResizeMouseDown, title: "Drag to resize input", "aria-label": "Resize input area" },
                react_1.default.createElement("span", { className: "ds-input-resize-grip" })),
            showCmdPopup && (react_1.default.createElement(CommandAutocomplete, { commands: commands, query: input, onSelect: cmd => {
                    if (cmd.type === 'builtin') {
                        // Handle built-ins immediately without going to the backend
                        handleBuiltinCommand(cmd.command);
                        setInput('');
                    }
                    else {
                        // Fill the input with the command prefix so the user can add args
                        setInput(cmd.command + ' ');
                        setActiveCommand(cmd);
                    }
                    setShowCmdPopup(false);
                }, onClose: () => setShowCmdPopup(false) })),
            activeCommand && (react_1.default.createElement("div", { className: "ds-cmd-active-badge" },
                react_1.default.createElement("span", { className: "ds-cmd-active-name" }, activeCommand.command),
                react_1.default.createElement("span", { className: "ds-cmd-active-desc" }, activeCommand.description),
                react_1.default.createElement("span", { className: "ds-cmd-active-clear", onClick: () => {
                        setActiveCommand(null);
                        setInput('');
                    }, title: "Clear command" }, "\u2715"))),
            contextChip && (react_1.default.createElement("div", { className: "ds-ctx-chip" },
                react_1.default.createElement("span", { className: "ds-ctx-chip-icon" }, "\uD83D\uDCCE"),
                react_1.default.createElement("span", { className: "ds-ctx-chip-label" }, contextChip.label),
                react_1.default.createElement("button", { className: "ds-ctx-chip-toggle", onClick: () => setChipExpanded(x => !x), title: chipExpanded ? 'Collapse' : 'Expand context', "aria-label": chipExpanded ? 'Collapse context' : 'Expand context' }, chipExpanded ? '▲' : '▼'),
                react_1.default.createElement("button", { className: "ds-ctx-chip-remove", onClick: () => { setContextChip(null); contextPrefixRef.current = ''; }, title: "Remove context", "aria-label": "Remove context" }, "\u2715"),
                chipExpanded && (react_1.default.createElement("pre", { className: "ds-ctx-chip-preview" }, contextChip.preview)))),
            react_1.default.createElement("textarea", { className: "ds-assistant-input", value: input, style: { height: inputHeight }, onChange: e => {
                    const val = e.target.value;
                    setInput(val);
                    // Show autocomplete when line starts with "/"
                    if (val.match(/^\/[\w-]*/)) {
                        setShowCmdPopup(true);
                    }
                    else {
                        setShowCmdPopup(false);
                        setActiveCommand(null);
                    }
                }, onKeyDown: handleKeyDown, placeholder: contextChip ? `Describe your edit for ${contextChip.label}…` : "Ask Varys… (/command or Enter to send)", disabled: isLoading }),
            react_1.default.createElement("div", { className: "ds-assistant-input-bottom" },
                react_1.default.createElement(ModelSwitcher, { provider: chatProvider, model: chatModel, zoo: chatZoo, saving: modelSwitching, onSelect: m => void handleModelSelect(m) }),
                (() => {
                    var _a;
                    const usage = (_a = threads.find(t => t.id === currentThreadId)) === null || _a === void 0 ? void 0 : _a.tokenUsage;
                    if (!usage || (usage.input === 0 && usage.output === 0))
                        return null;
                    const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
                    return (react_1.default.createElement("span", { className: "ds-token-counter", title: `Input: ${usage.input.toLocaleString()} tokens\nOutput: ${usage.output.toLocaleString()} tokens` },
                        react_1.default.createElement("span", { className: "ds-token-in" },
                            "\u2191",
                            fmt(usage.input)),
                        react_1.default.createElement("span", { className: "ds-token-out" },
                            "\u2193",
                            fmt(usage.output))));
                })(),
                react_1.default.createElement("button", { className: "ds-new-session-btn", onClick: handleNewThread, disabled: isLoading, title: "New thread", "aria-label": "New thread" },
                    react_1.default.createElement("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("polyline", { points: "3 6 5 6 21 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
                        react_1.default.createElement("path", { d: "M19 6l-1 14H6L5 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
                        react_1.default.createElement("path", { d: "M10 11v6M14 11v6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
                        react_1.default.createElement("path", { d: "M9 6V4h6v2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }))),
                react_1.default.createElement("button", { className: `ds-cell-mode-btn ds-cell-mode-${cellMode}`, onClick: cycleCellMode, title: CELL_MODE_TITLE[cellMode], "aria-label": CELL_MODE_TITLE[cellMode] }, CELL_MODE_LABEL[cellMode]),
                isLoading ? (
                /* Stop button — circle with a filled square inside */
                react_1.default.createElement("button", { className: "ds-assistant-send-btn ds-send-stop", onClick: handleStop, title: "Stop generation", "aria-label": "Stop generation" },
                    react_1.default.createElement("svg", { viewBox: "0 0 24 24", width: "10", height: "10", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "2" }),
                        react_1.default.createElement("rect", { x: "8", y: "8", width: "8", height: "8", rx: "1", fill: "currentColor" })))) : (
                /* Send button — upward arrow */
                react_1.default.createElement("button", { className: "ds-assistant-send-btn", onClick: () => void handleSend(), disabled: !input.trim(), title: "Send message", "aria-label": "Send message" },
                    react_1.default.createElement("svg", { viewBox: "0 0 24 24", width: "10", height: "10", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("path", { d: "M12 20V4M12 4L6 10M12 4L18 10", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" }))))))));
};
// ---------------------------------------------------------------------------
// Lumino widget wrapper
// ---------------------------------------------------------------------------
class DSAssistantSidebar extends apputils_1.ReactWidget {
    constructor(props) {
        super();
        this._props = props;
        this.addClass('jp-ReactWidget');
    }
    /**
     * Send a message into the chat panel.
     * If autoSend is true the message is submitted immediately (e.g. context-menu
     * actions); if false the text is pre-filled so the user can review/edit it.
     */
    sendMessage(text, autoSend = true, displayText, contextPrefix, contextChip, selectedOutput) {
        _dispatchExternalMessage({ text, autoSend, displayText, contextPrefix, contextChip, selectedOutput });
    }
    /** Convenience: send a specific notebook output to the chat input. */
    sendOutputToChat(output) {
        const chip = { label: output.label, preview: output.preview };
        _dispatchExternalMessage({
            text: '',
            autoSend: false,
            contextChip: chip,
            selectedOutput: output,
        });
    }
    /** Open the Tags & Metadata panel inside the sidebar. */
    openTagsPanel() {
        _dispatchExternalMessage({ text: '', autoSend: false, openTags: true });
    }
    render() {
        return react_1.default.createElement(DSAssistantChat, Object.assign({}, this._props));
    }
}
exports.DSAssistantSidebar = DSAssistantSidebar;


/***/ },

/***/ "./lib/tags/TagsPanel.js"
/*!*******************************!*\
  !*** ./lib/tags/TagsPanel.js ***!
  \*******************************/
(__unused_webpack_module, exports, __webpack_require__) {


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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TagsPanel = void 0;
const react_1 = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
// ── Tag colour helpers ────────────────────────────────────────────────────────
const TAG_PALETTE = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#ec4899',
    '#14b8a6',
    '#6366f1', // indigo
];
function tagColor(tag) {
    let h = 0;
    for (let i = 0; i < tag.length; i++)
        h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    return TAG_PALETTE[h % TAG_PALETTE.length];
}
const TagChip = ({ tag, onRemove, onClick, count }) => (react_1.default.createElement("span", { className: "ds-tag-chip", style: { '--tag-color': tagColor(tag) }, onClick: onClick, title: onClick ? `Jump to next cell tagged "${tag}"` : tag },
    tag,
    count !== undefined && react_1.default.createElement("span", { className: "ds-tag-chip-count" }, count),
    onRemove && (react_1.default.createElement("button", { className: "ds-tag-chip-remove", onClick: e => { e.stopPropagation(); onRemove(); }, title: "Remove tag" }, "\u00D7"))));
const TagsPanel = ({ notebookTracker }) => {
    const [activeTags, setActiveTags] = (0, react_1.useState)([]);
    const [customMeta, setCustomMeta] = (0, react_1.useState)('{}');
    const [metaError, setMetaError] = (0, react_1.useState)('');
    const [metaSaved, setMetaSaved] = (0, react_1.useState)(false);
    const [newTag, setNewTag] = (0, react_1.useState)('');
    const [tagError, setTagError] = (0, react_1.useState)('');
    const [allTags, setAllTags] = (0, react_1.useState)(new Map());
    const [taggedCells, setTaggedCells] = (0, react_1.useState)([]);
    const [activeCellIdx, setActiveCellIdx] = (0, react_1.useState)(-1);
    const [filterText, setFilterText] = (0, react_1.useState)('');
    const [section, setSection] = (0, react_1.useState)('cell');
    const activeCellRef = (0, react_1.useRef)(null);
    // ── Read notebook ───────────────────────────────────────────────────────────
    const refreshNotebook = (0, react_1.useCallback)(() => {
        var _a, _b, _c, _d;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!(nb === null || nb === void 0 ? void 0 : nb.model)) {
            setAllTags(new Map());
            setTaggedCells([]);
            return;
        }
        const counts = new Map();
        const cells = [];
        for (let i = 0; i < nb.model.cells.length; i++) {
            const cm = nb.model.cells.get(i);
            const tags = (_b = cm.metadata['tags']) !== null && _b !== void 0 ? _b : [];
            if (tags.length > 0) {
                for (const t of tags)
                    counts.set(t, ((_c = counts.get(t)) !== null && _c !== void 0 ? _c : 0) + 1);
                const src = cm.sharedModel.source;
                cells.push({
                    index: i,
                    execCount: (_d = cm.executionCount) !== null && _d !== void 0 ? _d : null,
                    tags,
                    preview: src.slice(0, 70).replace(/\n/g, ' ') + (src.length > 70 ? '…' : ''),
                    type: cm.type,
                });
            }
        }
        setAllTags(counts);
        setTaggedCells(cells);
    }, [notebookTracker]);
    // ── Read active cell ────────────────────────────────────────────────────────
    const refreshActiveCell = (0, react_1.useCallback)(() => {
        var _a, _b, _c, _d;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        const cell = (_b = nb === null || nb === void 0 ? void 0 : nb.activeCell) !== null && _b !== void 0 ? _b : null;
        activeCellRef.current = cell;
        setActiveCellIdx((_c = nb === null || nb === void 0 ? void 0 : nb.activeCellIndex) !== null && _c !== void 0 ? _c : -1);
        if (!cell) {
            setActiveTags([]);
            setCustomMeta('{}');
            return;
        }
        const meta = cell.model.metadata;
        const tags = (_d = meta['tags']) !== null && _d !== void 0 ? _d : [];
        setActiveTags([...tags]);
        // Build custom metadata dict (everything except 'tags')
        const custom = {};
        for (const [k, v] of Object.entries(meta)) {
            if (k !== 'tags')
                custom[k] = v;
        }
        setCustomMeta(JSON.stringify(custom, null, 2));
        setMetaError('');
        setMetaSaved(false);
    }, [notebookTracker]);
    const refresh = (0, react_1.useCallback)(() => {
        refreshActiveCell();
        refreshNotebook();
    }, [refreshActiveCell, refreshNotebook]);
    // ── Subscriptions ───────────────────────────────────────────────────────────
    (0, react_1.useEffect)(() => {
        notebookTracker.activeCellChanged.connect(refresh);
        notebookTracker.currentChanged.connect(refresh);
        refresh();
        return () => {
            notebookTracker.activeCellChanged.disconnect(refresh);
            notebookTracker.currentChanged.disconnect(refresh);
        };
    }, [notebookTracker, refresh]);
    // ── Tag mutations ───────────────────────────────────────────────────────────
    const applyTags = (tags) => {
        var _a, _b, _c;
        const cell = activeCellRef.current;
        if (!cell)
            return;
        if (tags.length > 0) {
            cell.model.setMetadata('tags', tags);
        }
        else {
            // Remove key entirely when empty
            const meta = Object.assign({}, cell.model.metadata);
            delete meta['tags'];
            // JupyterLab 4.x: iterate keys and remove
            for (const k of Object.keys(cell.model.metadata)) {
                if (k !== 'tags')
                    continue;
                (_c = (_b = (_a = cell.model).deleteMetadata) === null || _b === void 0 ? void 0 : _b.call(_a, 'tags')) !== null && _c !== void 0 ? _c : cell.model.setMetadata('tags', undefined);
            }
        }
        setActiveTags([...tags]);
        refreshNotebook();
    };
    const addTag = () => {
        const raw = newTag.trim().toLowerCase().replace(/\s+/g, '-');
        if (!raw)
            return;
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
    const removeTag = (tag) => {
        applyTags(activeTags.filter(t => t !== tag));
    };
    const saveCustomMeta = () => {
        const cell = activeCellRef.current;
        if (!cell)
            return;
        try {
            const obj = JSON.parse(customMeta);
            for (const [k, v] of Object.entries(obj)) {
                cell.model.setMetadata(k, v);
            }
            setMetaError('');
            setMetaSaved(true);
            setTimeout(() => setMetaSaved(false), 2000);
        }
        catch (_a) {
            setMetaError('Invalid JSON — check syntax');
        }
    };
    // ── Navigation ──────────────────────────────────────────────────────────────
    const jumpToTag = (tag) => {
        var _a, _b;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!(nb === null || nb === void 0 ? void 0 : nb.model))
            return;
        const total = nb.model.cells.length;
        const start = nb.activeCellIndex;
        for (let offset = 1; offset <= total; offset++) {
            const idx = (start + offset) % total;
            const tags = (_b = nb.model.cells.get(idx).metadata['tags']) !== null && _b !== void 0 ? _b : [];
            if (tags.includes(tag)) {
                nb.activeCellIndex = idx;
                // scroll into view
                const cellWidget = nb.widgets[idx];
                cellWidget === null || cellWidget === void 0 ? void 0 : cellWidget.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                return;
            }
        }
    };
    const jumpToCell = (index) => {
        var _a, _b;
        const nb = (_a = notebookTracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
        if (!nb)
            return;
        nb.activeCellIndex = index;
        (_b = nb.widgets[index]) === null || _b === void 0 ? void 0 : _b.node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    // ── Render ──────────────────────────────────────────────────────────────────
    const hasNotebook = !!notebookTracker.currentWidget;
    const filteredTags = [...allTags.entries()].filter(([t]) => !filterText || t.includes(filterText.toLowerCase())).sort((a, b) => b[1] - a[1]); // sort by count desc
    const cellRef = activeCellIdx >= 0
        ? `cell[${activeCellIdx}]`
        : '—';
    return (react_1.default.createElement("div", { className: "ds-tags-panel" },
        react_1.default.createElement("div", { className: "ds-tags-section-bar" },
            react_1.default.createElement("button", { className: `ds-tags-section-btn${section === 'cell' ? ' active' : ''}`, onClick: () => setSection('cell') }, "Active Cell"),
            react_1.default.createElement("button", { className: `ds-tags-section-btn${section === 'notebook' ? ' active' : ''}`, onClick: () => setSection('notebook') },
                "Notebook (",
                allTags.size,
                " tag",
                allTags.size !== 1 ? 's' : '',
                ")"),
            react_1.default.createElement("button", { className: "ds-tags-refresh-btn", onClick: refresh, title: "Refresh" }, "\u21BB")),
        !hasNotebook && (react_1.default.createElement("p", { className: "ds-tags-empty" }, "No notebook open.")),
        hasNotebook && section === 'cell' && (react_1.default.createElement("div", { className: "ds-tags-cell-section" },
            react_1.default.createElement("div", { className: "ds-tags-cell-ref" },
                cellRef,
                activeTags.length === 0 && (react_1.default.createElement("span", { className: "ds-tags-cell-ref-hint" }, "no tags"))),
            activeTags.length > 0 && (react_1.default.createElement("div", { className: "ds-tags-chips-row" }, activeTags.map(t => (react_1.default.createElement(TagChip, { key: t, tag: t, onRemove: () => removeTag(t) }))))),
            react_1.default.createElement("div", { className: "ds-tags-add-row" },
                react_1.default.createElement("input", { className: "ds-tags-input", placeholder: "new-tag", value: newTag, onChange: e => { setNewTag(e.target.value); setTagError(''); }, onKeyDown: e => { if (e.key === 'Enter')
                        addTag(); }, disabled: !activeCellRef.current }),
                react_1.default.createElement("button", { className: "ds-tags-add-btn", onClick: addTag, disabled: !activeCellRef.current || !newTag.trim() }, "+ Add")),
            tagError && react_1.default.createElement("p", { className: "ds-tags-error" }, tagError),
            allTags.size > 0 && (react_1.default.createElement("div", { className: "ds-tags-quickpick" },
                react_1.default.createElement("span", { className: "ds-tags-quickpick-label" }, "Quick-add:"),
                [...allTags.keys()].filter(t => !activeTags.includes(t)).map(t => (react_1.default.createElement("button", { key: t, className: "ds-tags-quickpick-btn", style: { '--tag-color': tagColor(t) }, onClick: () => { applyTags([...activeTags, t]); } }, t))))),
            react_1.default.createElement("div", { className: "ds-tags-meta-section" },
                react_1.default.createElement("div", { className: "ds-tags-meta-header" },
                    react_1.default.createElement("span", null, "Custom metadata"),
                    react_1.default.createElement("button", { className: "ds-tags-meta-save-btn", onClick: saveCustomMeta, disabled: !activeCellRef.current }, metaSaved ? '✓ Saved' : 'Save')),
                react_1.default.createElement("textarea", { className: `ds-tags-meta-editor${metaError ? ' ds-tags-meta-error' : ''}`, value: customMeta, onChange: e => { setCustomMeta(e.target.value); setMetaError(''); setMetaSaved(false); }, rows: 6, spellCheck: false, disabled: !activeCellRef.current, placeholder: '{}' }),
                metaError && react_1.default.createElement("p", { className: "ds-tags-error" }, metaError),
                react_1.default.createElement("p", { className: "ds-tags-meta-hint" },
                    "JSON key/value pairs saved to cell metadata. Reserved key ",
                    react_1.default.createElement("code", null, "tags"),
                    " is managed above.")))),
        hasNotebook && section === 'notebook' && (react_1.default.createElement("div", { className: "ds-tags-notebook-section" },
            allTags.size === 0 && (react_1.default.createElement("p", { className: "ds-tags-empty" }, "No tagged cells in this notebook yet.")),
            allTags.size > 0 && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "ds-tags-filter-row" },
                    react_1.default.createElement("input", { className: "ds-tags-filter-input", placeholder: "Filter tags\u2026", value: filterText, onChange: e => setFilterText(e.target.value) })),
                react_1.default.createElement("div", { className: "ds-tags-cloud" }, filteredTags.map(([tag, count]) => (react_1.default.createElement(TagChip, { key: tag, tag: tag, count: count, onClick: () => jumpToTag(tag) })))),
                react_1.default.createElement("div", { className: "ds-tags-divider" }),
                react_1.default.createElement("div", { className: "ds-tags-cells-list" }, taggedCells
                    .filter(c => !filterText ||
                    c.tags.some(t => t.includes(filterText.toLowerCase())))
                    .map(c => {
                    const ref = c.execCount != null
                        ? `exec:[${c.execCount}]`
                        : `cell[${c.index}]`;
                    return (react_1.default.createElement("div", { key: c.index, className: "ds-tags-cell-row", onClick: () => jumpToCell(c.index), title: `Go to ${ref}` },
                        react_1.default.createElement("div", { className: "ds-tags-cell-row-header" },
                            react_1.default.createElement("span", { className: "ds-tags-cell-row-ref" }, ref),
                            react_1.default.createElement("span", { className: "ds-tags-cell-row-type" }, c.type)),
                        react_1.default.createElement("div", { className: "ds-tags-cell-row-preview" }, c.preview),
                        react_1.default.createElement("div", { className: "ds-tags-cell-row-tags" }, c.tags.map(t => (react_1.default.createElement(TagChip, { key: t, tag: t, onClick: () => jumpToTag(t) }))))));
                }))))))));
};
exports.TagsPanel = TagsPanel;


/***/ },

/***/ "./lib/tags/cellTagOverlay.js"
/*!************************************!*\
  !*** ./lib/tags/cellTagOverlay.js ***!
  \************************************/
(__unused_webpack_module, exports) {


/**
 * Cell Tag & Position Overlay
 *
 * Injects a thin bar at the top of every notebook cell that shows:
 *   • LEFT  — coloured tag pills (only when the cell carries tags)
 *   • RIGHT — a small "#N" position badge (always, on every cell)
 *
 * The position number reflects the cell's 1-based index in the notebook and
 * updates automatically whenever:
 *   • The active cell or notebook changes
 *   • Cells are inserted, deleted, or moved (model.cells.changed signal)
 *   • A periodic 1.5 s fallback fires (catches metadata edits in the panel)
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.initCellTagOverlay = void 0;
const OVERLAY_CLASS = 'ds-cell-tag-overlay';
const INTERVAL_MS = 1500;
const TAG_PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
];
function tagColor(tag) {
    let h = 0;
    for (let i = 0; i < tag.length; i++)
        h = (h * 31 + tag.charCodeAt(i)) >>> 0;
    return TAG_PALETTE[h % TAG_PALETTE.length];
}
/** Remove all existing overlays from the page. */
function clearOverlays() {
    document.querySelectorAll(`.${OVERLAY_CLASS}`).forEach(el => el.remove());
}
/** Render tag + position overlays for every cell in the current notebook. */
function renderOverlays(tracker) {
    var _a, _b;
    clearOverlays();
    const nb = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content;
    if (!(nb === null || nb === void 0 ? void 0 : nb.model))
        return;
    const total = nb.model.cells.length;
    for (let i = 0; i < total; i++) {
        const cellModel = nb.model.cells.get(i);
        const cellWidget = nb.widgets[i];
        if (!cellWidget)
            continue;
        const tags = (_b = cellModel.metadata['tags']) !== null && _b !== void 0 ? _b : [];
        // Insert the overlay bar as a sibling BEFORE .jp-Cell-inputWrapper so it
        // spans the full width of the cell above the code/text area.
        const inputWrapper = cellWidget.node.querySelector('.jp-Cell-inputWrapper');
        if (!inputWrapper)
            continue;
        const bar = document.createElement('div');
        bar.className = OVERLAY_CLASS;
        // ── Left: tag pills (only when the cell has tags) ──────────────────────
        if (tags.length > 0) {
            const pillsGroup = document.createElement('span');
            pillsGroup.className = 'ds-overlay-tags';
            for (const tag of tags) {
                const pill = document.createElement('span');
                pill.className = 'ds-cell-tag-pill';
                pill.textContent = tag;
                pill.style.setProperty('--pill-color', tagColor(tag));
                pillsGroup.appendChild(pill);
            }
            bar.appendChild(pillsGroup);
        }
        // ── Right: position badge "#N" ─────────────────────────────────────────
        const badge = document.createElement('span');
        badge.className = 'ds-cell-position-badge';
        badge.textContent = `#${i + 1}`;
        bar.appendChild(badge);
        cellWidget.node.insertBefore(bar, inputWrapper);
    }
}
// Track the model-level signal disconnect so we can rewire when the notebook
// switches.
let _disconnectModelSignal = null;
function connectModelSignal(tracker, refresh) {
    var _a, _b;
    _disconnectModelSignal === null || _disconnectModelSignal === void 0 ? void 0 : _disconnectModelSignal();
    _disconnectModelSignal = null;
    const model = (_b = (_a = tracker.currentWidget) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.model;
    if (!model)
        return;
    const handler = (_, __) => refresh();
    model.cells.changed.connect(handler);
    _disconnectModelSignal = () => model.cells.changed.disconnect(handler);
}
/**
 * Initialise the cell tag + position overlay system.
 * Call once from the main plugin activate() function.
 * Returns a cleanup function.
 */
function initCellTagOverlay(tracker) {
    const refresh = () => renderOverlays(tracker);
    // Re-render and rewire the model signal whenever the active notebook changes.
    const onNotebookChanged = () => {
        connectModelSignal(tracker, refresh);
        refresh();
    };
    tracker.activeCellChanged.connect(refresh);
    tracker.currentChanged.connect(onNotebookChanged);
    // Wire the initial notebook (if one is already open).
    connectModelSignal(tracker, refresh);
    const timer = setInterval(refresh, INTERVAL_MS);
    refresh();
    return () => {
        tracker.activeCellChanged.disconnect(refresh);
        tracker.currentChanged.disconnect(onNotebookChanged);
        _disconnectModelSignal === null || _disconnectModelSignal === void 0 ? void 0 : _disconnectModelSignal();
        _disconnectModelSignal = null;
        clearInterval(timer);
        clearOverlays();
    };
}
exports.initCellTagOverlay = initCellTagOverlay;


/***/ },

/***/ "./lib/ui/DiffView.js"
/*!****************************!*\
  !*** ./lib/ui/DiffView.js ***!
  \****************************/
(__unused_webpack_module, exports, __webpack_require__) {


/**
 * DiffView - Visual diff panel for pending AI edits.
 *
 * For 'modify' operations: shows per-hunk Accept / Reject toggles so the user
 * can keep only some of the AI's changes.  An "Apply" button reconstructs the
 * final cell content and calls onApplySelection.
 *
 * For 'insert' / 'delete' operations: a whole-cell Accept / Reject toggle.
 *
 * The existing "Accept All" / "Accept & Run" / "Undo All" buttons are still
 * available at the top of the card.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DiffView = void 0;
const react_1 = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const diffUtils_1 = __webpack_require__(/*! ../utils/diffUtils */ "./lib/utils/diffUtils.js");
/** A single diff line rendered with gutter prefix + coloured background */
const DiffLineRow = ({ line }) => {
    if (line.text === '…') {
        return react_1.default.createElement("div", { className: "ds-diff-line ds-diff-line--ellipsis" }, "\u2026");
    }
    const prefix = line.type === 'insert' ? '+' : line.type === 'delete' ? '−' : ' ';
    const cls = line.type === 'insert' ? 'ds-diff-line ds-diff-line--insert'
        : line.type === 'delete' ? 'ds-diff-line ds-diff-line--delete'
            : 'ds-diff-line ds-diff-line--equal';
    return (react_1.default.createElement("div", { className: cls },
        react_1.default.createElement("span", { className: "ds-diff-gutter" }, prefix),
        react_1.default.createElement("span", { className: "ds-diff-content" }, line.text || '\u00a0')));
};
// ────────────────────────────────────────────────────────────────
// Per-hunk section inside a modify cell
// ────────────────────────────────────────────────────────────────
const HunkSection = ({ hunk, decision, onDecide }) => {
    const hasChanges = hunk.deletedLines.length > 0 || hunk.insertedLines.length > 0;
    const banner = decision === 'accepted' ? 'ds-hunk-banner--accepted'
        : decision === 'rejected' ? 'ds-hunk-banner--rejected'
            : '';
    return (react_1.default.createElement("div", { className: `ds-hunk-section ${banner}` },
        react_1.default.createElement("div", { className: "ds-hunk-bar" },
            react_1.default.createElement("span", { className: "ds-hunk-label" },
                hunk.deletedLines.length > 0 && (react_1.default.createElement("span", { className: "ds-hunk-del" },
                    "\u2212",
                    hunk.deletedLines.length)),
                hunk.insertedLines.length > 0 && (react_1.default.createElement("span", { className: "ds-hunk-ins" },
                    "+",
                    hunk.insertedLines.length)),
                "\u00A0lines"),
            hasChanges && (react_1.default.createElement("span", { className: "ds-hunk-btns" },
                react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--accept ${decision === 'accepted' ? 'ds-hunk-btn--active' : ''}`, onClick: () => onDecide(hunk.id, decision === 'accepted' ? 'pending' : 'accepted'), title: "Accept this change" }, "\u2713 Accept"),
                react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--reject ${decision === 'rejected' ? 'ds-hunk-btn--active' : ''}`, onClick: () => onDecide(hunk.id, decision === 'rejected' ? 'pending' : 'rejected'), title: "Reject this change" }, "\u2715 Reject")))),
        react_1.default.createElement("div", { className: "ds-diff-lines ds-diff-lines--hunk" }, hunk.displayLines.map((line, i) => (react_1.default.createElement(DiffLineRow, { key: i, line: line }))))));
};
// ────────────────────────────────────────────────────────────────
// Per-cell expandable section
// ────────────────────────────────────────────────────────────────
const CellDiffSection = ({ info, defaultOpen, onCellDecisions }) => {
    const [open, setOpen] = (0, react_1.useState)(defaultOpen);
    const diffLines = (0, react_1.useMemo)(() => (0, diffUtils_1.computeLineDiff)(info.original, info.modified), [info.original, info.modified]);
    const stats = (0, react_1.useMemo)(() => (0, diffUtils_1.getDiffStats)(diffLines), [diffLines]);
    const hunks = (0, react_1.useMemo)(() => (0, diffUtils_1.splitIntoHunks)(diffLines, 2), [diffLines]);
    // For 'modify' ops: per-hunk decisions
    const [hunkDecisions, setHunkDecisions] = (0, react_1.useState)({});
    // For 'insert'/'delete' ops: whole-cell decision
    const [wholeDecision, setWholeDecision] = (0, react_1.useState)('pending');
    const opLabel = info.opType === 'insert' ? 'new' : info.opType === 'delete' ? 'deleted' : 'modified';
    const statsLabel = info.opType === 'insert' ? `+${stats.insertions}`
        : info.opType === 'delete' ? `−${stats.deletions}`
            : `+${stats.insertions} / −${stats.deletions}`;
    const hasChanges = stats.insertions > 0 || stats.deletions > 0;
    // Determine if any decision has been made in this cell
    const decidedHunks = Object.values(hunkDecisions).filter(d => d !== 'pending').length;
    const totalHunks = hunks.length;
    const hasWholeChoice = info.opType !== 'modify' && wholeDecision !== 'pending';
    // Notify parent whenever decisions change for this cell
    const handleHunkDecide = (id, d) => {
        const next = Object.assign(Object.assign({}, hunkDecisions), { [id]: d });
        setHunkDecisions(next);
        // Reconstruct and bubble up
        const finalContent = (0, diffUtils_1.reconstructFromHunks)(diffLines, hunks, Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v === 'pending' ? 'accepted' : v])));
        onCellDecisions(info.cellIndex, finalContent, true);
    };
    const handleWholeDecide = (d) => {
        setWholeDecision(d);
        onCellDecisions(info.cellIndex, undefined, d !== 'rejected');
    };
    return (react_1.default.createElement("div", { className: "ds-diff-cell-section" },
        react_1.default.createElement("button", { className: "ds-diff-cell-header", onClick: () => setOpen(o => !o), title: info.description },
            react_1.default.createElement("span", { className: "ds-diff-cell-toggle" }, open ? '▾' : '▸'),
            react_1.default.createElement("span", { className: `ds-diff-op-badge ds-diff-op-badge--${info.opType}` }, opLabel),
            react_1.default.createElement("span", { className: "ds-diff-cell-type" }, info.cellType),
            react_1.default.createElement("span", { className: "ds-diff-cell-pos" },
                "pos:",
                info.cellIndex),
            info.description && react_1.default.createElement("span", { className: "ds-diff-cell-desc" }, info.description),
            hasChanges && react_1.default.createElement("span", { className: `ds-diff-stats ds-diff-stats--${info.opType}` }, statsLabel),
            info.opType === 'modify' && totalHunks > 0 && (react_1.default.createElement("span", { className: "ds-hunk-progress" },
                decidedHunks,
                "/",
                totalHunks,
                " decided"))),
        open && (react_1.default.createElement("div", { className: "ds-diff-cell-body" },
            info.opType !== 'modify' && (react_1.default.createElement("div", { className: "ds-hunk-bar ds-hunk-bar--whole" },
                react_1.default.createElement("span", { className: "ds-hunk-label" }, info.opType === 'insert' ? 'New cell' : 'Deleted cell'),
                react_1.default.createElement("span", { className: "ds-hunk-btns" },
                    react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--accept ${wholeDecision === 'accepted' ? 'ds-hunk-btn--active' : ''}`, onClick: () => handleWholeDecide(wholeDecision === 'accepted' ? 'pending' : 'accepted'), title: "Accept this cell" }, "\u2713 Accept"),
                    react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--reject ${wholeDecision === 'rejected' ? 'ds-hunk-btn--active' : ''}`, onClick: () => handleWholeDecide(wholeDecision === 'rejected' ? 'pending' : 'rejected'), title: "Reject this cell" }, "\u2715 Reject")),
                (hasWholeChoice) && (react_1.default.createElement("span", { className: `ds-hunk-status ${wholeDecision === 'accepted' ? 'ds-hunk-status--accepted' : 'ds-hunk-status--rejected'}` }, wholeDecision === 'accepted' ? '✓ Will keep' : '✕ Will discard')))),
            info.opType === 'modify' && hunks.length === 0 && (react_1.default.createElement("div", { className: "ds-diff-line ds-diff-line--equal" },
                react_1.default.createElement("span", { className: "ds-diff-gutter" }, " "),
                react_1.default.createElement("span", { className: "ds-diff-content ds-diff-empty" }, "(no changes)"))),
            info.opType === 'modify' && hunks.map(hunk => {
                var _a;
                return (react_1.default.createElement(HunkSection, { key: hunk.id, hunk: hunk, decision: (_a = hunkDecisions[hunk.id]) !== null && _a !== void 0 ? _a : 'pending', onDecide: handleHunkDecide }));
            }),
            info.opType !== 'modify' && (react_1.default.createElement("div", { className: "ds-diff-lines" }, (0, diffUtils_1.collapseContext)(diffLines, 3).map((line, i) => (react_1.default.createElement(DiffLineRow, { key: i, line: line })))))))));
};
// ────────────────────────────────────────────────────────────────
// Main DiffView component
// ────────────────────────────────────────────────────────────────
const DiffView = ({ operationId, description, diffs, onAccept, onAcceptAndRun, onUndo, onApplySelection, hasCodeCells, }) => {
    // Parent-level aggregation of per-cell decisions from child sections.
    // Key: cellIndex, Value: {finalContent, accept}
    const [cellDecisions, setCellDecisions] = (0, react_1.useState)(new Map());
    const handleCellDecision = (cellIndex, finalContent, accept) => {
        setCellDecisions(prev => {
            const next = new Map(prev);
            next.set(cellIndex, { finalContent, accept });
            return next;
        });
    };
    const decidedCount = cellDecisions.size;
    const hasAnyDecision = decidedCount > 0;
    const handleApply = () => {
        const decisions = diffs.map(d => {
            var _a;
            const cd = cellDecisions.get(d.cellIndex);
            return {
                cellIndex: d.cellIndex,
                opType: d.opType,
                finalContent: cd === null || cd === void 0 ? void 0 : cd.finalContent,
                accept: (_a = cd === null || cd === void 0 ? void 0 : cd.accept) !== null && _a !== void 0 ? _a : true, // default: accept
            };
        });
        onApplySelection(operationId, decisions);
    };
    const totalCells = diffs.length;
    const cellLabel = `${totalCells} cell${totalCells !== 1 ? 's' : ''}`;
    const defaultOpen = diffs.length === 1;
    const totalInsertions = diffs.reduce((s, d) => s + (0, diffUtils_1.getDiffStats)((0, diffUtils_1.computeLineDiff)(d.original, d.modified)).insertions, 0);
    const totalDeletions = diffs.reduce((s, d) => s + (0, diffUtils_1.getDiffStats)((0, diffUtils_1.computeLineDiff)(d.original, d.modified)).deletions, 0);
    const statsLabel = totalInsertions > 0 && totalDeletions > 0 ? `+${totalInsertions} / −${totalDeletions}`
        : totalInsertions > 0 ? `+${totalInsertions}`
            : totalDeletions > 0 ? `−${totalDeletions}`
                : '';
    return (react_1.default.createElement("div", { className: "ds-diff-view" },
        react_1.default.createElement("div", { className: "ds-diff-header" },
            react_1.default.createElement("div", { className: "ds-diff-header-info" },
                react_1.default.createElement("span", { className: "ds-diff-header-cells" }, cellLabel),
                description && (react_1.default.createElement("span", { className: "ds-diff-header-desc", title: description }, description)),
                statsLabel && react_1.default.createElement("span", { className: "ds-diff-header-stats" }, statsLabel)),
            react_1.default.createElement("div", { className: "ds-diff-header-actions" },
                react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-accept", onClick: () => onAccept(operationId), title: "Accept all changes in all cells" }, "\u2713 All"),
                hasCodeCells && (react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-accept-run", onClick: () => onAcceptAndRun(operationId), title: "Accept all changes and run code cells" }, "\u25B6 All & Run")),
                react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-apply", onClick: handleApply, disabled: !hasAnyDecision, title: hasAnyDecision
                        ? `Apply your ${decidedCount} cell decision(s)`
                        : 'Make at least one Accept/Reject choice below' }, "\u2726 Apply"),
                react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-undo", onClick: () => onUndo(operationId), title: "Undo all changes" }, "\u2715 Undo"))),
        !hasAnyDecision && (react_1.default.createElement("div", { className: "ds-diff-hint" },
            "Use \u2713 / \u2715 buttons on each change block to pick what to keep, then click ",
            react_1.default.createElement("strong", null, "\u2726 Apply"),
            ". Or use ",
            react_1.default.createElement("strong", null, "\u2713 All"),
            " to accept everything at once.")),
        react_1.default.createElement("div", { className: "ds-diff-cells" }, diffs.map((d, i) => (react_1.default.createElement(CellDiffSection, { key: i, info: d, defaultOpen: defaultOpen, onCellDecisions: handleCellDecision }))))));
};
exports.DiffView = DiffView;


/***/ },

/***/ "./lib/utils/diffUtils.js"
/*!********************************!*\
  !*** ./lib/utils/diffUtils.js ***!
  \********************************/
(__unused_webpack_module, exports) {


/**
 * diffUtils - LCS-based line-by-line diff computation.
 *
 * Produces a unified diff of two text strings at line granularity.
 * Kept dependency-free and small enough for typical notebook cell sizes.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.collapseContext = exports.reconstructFromHunks = exports.splitIntoHunks = exports.getDiffStats = exports.computeLineDiff = void 0;
/**
 * Compute a line-level diff between `original` and `modified`.
 * Returns a flat array of DiffLine items in document order.
 */
function computeLineDiff(original, modified) {
    const a = original === '' ? [] : original.split('\n');
    const b = modified === '' ? [] : modified.split('\n');
    const m = a.length;
    const n = b.length;
    // Build LCS table (O(m*n) — fine for cell-size content)
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    // Backtrack to produce diff sequence
    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
            result.unshift({ type: 'equal', text: a[i - 1], origLine: i, newLine: j });
            i--;
            j--;
        }
        else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ type: 'insert', text: b[j - 1], newLine: j });
            j--;
        }
        else {
            result.unshift({ type: 'delete', text: a[i - 1], origLine: i });
            i--;
        }
    }
    return result;
}
exports.computeLineDiff = computeLineDiff;
/** Count insertions and deletions in a diff. */
function getDiffStats(lines) {
    return lines.reduce((acc, l) => {
        if (l.type === 'insert')
            acc.insertions++;
        else if (l.type === 'delete')
            acc.deletions++;
        return acc;
    }, { insertions: 0, deletions: 0 });
}
exports.getDiffStats = getDiffStats;
/**
 * Split a flat diff into independently decidable hunks.
 * Each hunk covers one contiguous block of change lines.
 * `contextLines` equal lines on each side are included in `displayLines`
 * for readability but are NOT part of the hunk's range.
 */
function splitIntoHunks(lines, contextLines = 2) {
    const hunks = [];
    let hunkId = 0;
    let i = 0;
    while (i < lines.length) {
        if (lines[i].type === 'equal') {
            i++;
            continue;
        }
        // Collect the entire change block (delete/insert may be interleaved)
        const startIdx = i;
        while (i < lines.length && lines[i].type !== 'equal')
            i++;
        const endIdx = i;
        const deletedLines = [];
        const insertedLines = [];
        for (let j = startIdx; j < endIdx; j++) {
            if (lines[j].type === 'delete')
                deletedLines.push(lines[j].text);
            else if (lines[j].type === 'insert')
                insertedLines.push(lines[j].text);
        }
        // Build display lines with surrounding context
        const dispStart = Math.max(0, startIdx - contextLines);
        const dispEnd = Math.min(lines.length, endIdx + contextLines);
        const displayLines = lines.slice(dispStart, dispEnd);
        hunks.push({ id: hunkId++, startIdx, endIdx, deletedLines, insertedLines, displayLines });
    }
    return hunks;
}
exports.splitIntoHunks = splitIntoHunks;
/**
 * Reconstruct the final cell content by applying per-hunk decisions.
 *  - 'accepted' (default for 'pending') → use the new (inserted) lines
 *  - 'rejected'                         → use the original (deleted) lines
 * Equal lines are always kept verbatim.
 */
function reconstructFromHunks(lines, hunks, decisions) {
    var _a;
    // Build a lookup: line index → owning hunk
    const lineToHunk = new Map();
    for (const hunk of hunks) {
        for (let j = hunk.startIdx; j < hunk.endIdx; j++)
            lineToHunk.set(j, hunk);
    }
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (line.type === 'equal') {
            out.push(line.text === '…' ? '' : line.text);
            i++;
            continue;
        }
        const hunk = lineToHunk.get(i);
        const decision = (_a = decisions[hunk.id]) !== null && _a !== void 0 ? _a : 'accepted';
        if (decision === 'accepted') {
            out.push(...hunk.insertedLines);
        }
        else {
            out.push(...hunk.deletedLines);
        }
        i = hunk.endIdx; // skip past the whole hunk block
    }
    return out.join('\n');
}
exports.reconstructFromHunks = reconstructFromHunks;
/**
 * Trim equal lines around changes, keeping `contextLines` unchanged lines
 * before and after each hunk for readability.
 */
function collapseContext(lines, contextLines = 3) {
    if (lines.length === 0)
        return lines;
    // Mark lines to keep
    const keep = new Array(lines.length).fill(false);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].type !== 'equal') {
            const start = Math.max(0, i - contextLines);
            const end = Math.min(lines.length - 1, i + contextLines);
            for (let k = start; k <= end; k++)
                keep[k] = true;
        }
    }
    const result = [];
    let skipping = false;
    for (let i = 0; i < lines.length; i++) {
        if (keep[i]) {
            skipping = false;
            result.push(lines[i]);
        }
        else if (!skipping) {
            result.push({ type: 'equal', text: '…' });
            skipping = true;
        }
    }
    return result;
}
exports.collapseContext = collapseContext;


/***/ }

}]);
//# sourceMappingURL=lib_index_js.f3a37428fbcf409ca99f.js.map