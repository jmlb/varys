"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSAssistantSidebar = exports.setExternalMessageListener = void 0;
const react_1 = __importStar(require("react"));
const apputils_1 = require("@jupyterlab/apputils");
const marked_1 = require("marked");
const dompurify_1 = __importDefault(require("dompurify"));
const VariableResolver_1 = require("../context/VariableResolver");
const DiffView_1 = require("../ui/DiffView");
const ReproPanel_1 = require("../reproducibility/ReproPanel");
const TagsPanel_1 = require("../tags/TagsPanel");
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
//# sourceMappingURL=SidebarWidget.js.map