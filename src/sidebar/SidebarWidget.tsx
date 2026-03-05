/**
 * SidebarWidget - Main chat interface for Varys.
 * Renders as a ReactWidget in the JupyterLab right sidebar.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { APIClient, TaskResponse, OperationStep, ChatTurn, CompositeStep, ResolvedVariable, ChatThread, SlashCommand } from '../api/client';
import { NotebookReader } from '../context/NotebookReader';
import { VariableResolver, parseVariableRefs } from '../context/VariableResolver';
import { CellEditor } from '../editor/CellEditor';
import { DiffView, DiffInfo, CellDecision } from '../ui/DiffView';
import { ReproPanel } from '../reproducibility/ReproPanel';
import { TagsPanel } from '../tags/TagsPanel';

// ---------------------------------------------------------------------------
// Markdown renderer (shared by assistant, system, code-review messages)
// ---------------------------------------------------------------------------

// Configure marked once: GFM (tables, task lists, etc.) with line breaks.
marked.setOptions({ breaks: true, gfm: true });

/**
 * Extract all fenced code blocks from a markdown string.
 * Returns the code content without the fence lines.
 */
function extractCodeBlocks(text: string): string[] {
  const blocks: string[] = [];
  const fenceRe = /```(?:\w*)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(text)) !== null) {
    const code = m[1].trim();
    if (code) blocks.push(code);
  }
  return blocks;
}

// Custom marked renderer: wraps fenced code blocks in a container div so the
// delegated click handler can locate the copy button and its code sibling.
const _markedRenderer = new marked.Renderer();
_markedRenderer.code = function (
  { text, lang }: { text: string; lang?: string }
): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const langAttr = lang ? ` class="language-${lang}"` : '';
  return (
    `<div class="ds-code-block-wrapper">` +
    `<button class="ds-copy-code-btn" aria-label="Copy code">Copy</button>` +
    `<pre><code${langAttr}>${escaped}</code></pre>` +
    `</div>`
  );
};

function renderMarkdown(text: string): string {
  // Guard against null/undefined during streaming
  if (!text) return '';
  try {
    const raw = marked.parse(text, { renderer: _markedRenderer }) as string;
    // Sanitize to prevent XSS while keeping all formatting elements.
    // 'button' is added so copy buttons survive the sanitizer.
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'p','br','b','i','strong','em','s','code','pre','blockquote',
        'ul','ol','li','h1','h2','h3','h4','h5','h6',
        'table','thead','tbody','tr','th','td',
        'a','hr','span','div','button',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'aria-label'],
    });
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'warning' | 'report' | 'code-review' | 'disambiguation';
  content: string;
  /**
   * Optional short label shown in the chat bubble instead of the full content.
   * The full content is still used for LLM context and history.
   * Used by context-menu actions that pre-fill the prompt with large code blocks.
   */
  displayContent?: string;
  /**
   * True when this assistant turn produced ≥1 cell operations (insert/modify/delete).
   * Suppresses the "Push code to cell" fallback button so it only appears when
   * the LLM genuinely returned code in chat with no corresponding cell plan.
   */
  hadCellOps?: boolean;
  /**
   * Code context chip attached by "Edit with AI" (or similar actions).
   * Shown as a collapsible snippet card below the user's instruction in the
   * chat bubble, and as a chip in the input area before sending.
   */
  contextChip?: { label: string; preview: string };
  /**
   * The operationId returned by the backend for this turn, if any.
   * Used to correlate the chat bubble with its pending DiffView.
   */
  operationId?: string;
  timestamp: Date;
  /** For report messages: metadata returned by the backend */
  reportMeta?: {
    filename: string;
    relativePath: string;
    stats: { total: number; code: number; markdown: number; with_outputs: number; errors: number };
    imagesCount: number;
    wordCount: number;
  };
  /** For code-review messages: individually applicable fix steps */
  codeReviewSteps?: OperationStep[];
  /**
   * True when this assistant turn was produced by /chat (advisory-only mode).
   * Used to always show the push-to-cell button so the user can save the
   * response as a markdown cell even when there are no code blocks.
   */
  isChatOnly?: boolean;
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

function looksAdvisory(message: string, phrases: string[] = _ADVISORY_STARTS): boolean {
  const low = message.toLowerCase().trim();
  if (low.endsWith('?')) return true;
  return phrases.some(p => low.startsWith(p.toLowerCase()));
}

// ---------------------------------------------------------------------------
// DisambiguationCard — shown when a plain message looks like a question/
// discussion but the user hasn't specified whether they want a chat answer
// or a notebook cell.
// ---------------------------------------------------------------------------
interface DisambiguationCardProps {
  originalMessage: string;
  msgId: string;
  onChoice: (mode: 'chat' | 'cell', msgId: string) => void;
}

const DisambiguationCard: React.FC<DisambiguationCardProps> = ({
  originalMessage, msgId, onChoice,
}) => {
  const preview = originalMessage.length > 55
    ? originalMessage.slice(0, 55) + '…'
    : originalMessage;
  const cmdPreview = originalMessage.length > 40
    ? originalMessage.slice(0, 40) + '…'
    : originalMessage;
  return (
    <div className="ds-disambig-card">
      <div className="ds-disambig-header">
        <span className="ds-disambig-icon">❓</span>
        <span className="ds-disambig-title">Where should the answer go?</span>
      </div>
      <div className="ds-disambig-hint">
        <em>"{preview}"</em>
      </div>
      <div className="ds-disambig-options">
        <button
          className="ds-disambig-btn ds-disambig-btn--chat"
          onClick={() => onChoice('chat', msgId)}
          title={`/chat ${originalMessage}`}
        >
          <span className="ds-disambig-btn-icon">💬</span>
          <span className="ds-disambig-btn-body">
            <strong>Answer in chat</strong>
            <code>/chat {cmdPreview}</code>
          </span>
        </button>
        <button
          className="ds-disambig-btn ds-disambig-btn--cell"
          onClick={() => onChoice('cell', msgId)}
          title={originalMessage}
        >
          <span className="ds-disambig-btn-icon">📝</span>
          <span className="ds-disambig-btn-body">
            <strong>Write to notebook</strong>
            <code>{cmdPreview}</code>
          </span>
        </button>
      </div>
    </div>
  );
};

interface PendingOp {
  operationId: string;
  cellIndices: number[];
  steps: OperationStep[];
  description: string;
  diffs: DiffInfo[];
  /**
   * For composite pipeline operations: the individual step operationIds
   * registered in CellEditor, in execution order.  Accept/Undo iterates these.
   */
  compositeOpIds?: string[];
}

export interface SidebarProps {
  apiClient: APIClient;
  notebookReader: NotebookReader;
  cellEditor: CellEditor;
  notebookTracker: INotebookTracker;
}

// ---------------------------------------------------------------------------
// External message dispatch
// Allows commands registered in index.ts to send messages into the chat
// without any tight coupling between the widget class and the React tree.
// ---------------------------------------------------------------------------

export interface ExternalMessage {
  /** Text to inject into the chat input (or auto-send). */
  text: string;
  /** When true the message is sent immediately; when false it pre-fills the input. */
  autoSend: boolean;
  /** When true the Tags panel is opened instead of sending a message. */
  openTags?: boolean;
  /**
   * Short human-readable label to show in the chat bubble in place of the full
   * prompt text (which may contain large code blocks). The full text is still
   * sent to the LLM.
   */
  displayText?: string;
  /**
   * Hidden context that is prepended to the user's typed input just before
   * sending to the backend. It is NEVER shown in the textarea or chat bubble.
   * Used by "Edit with AI" to pass the selected snippet + full cell context
   * without cluttering the input box.
   */
  contextPrefix?: string;
  /**
   * Visible chip shown in the input area (and in the sent bubble) so the user
   * knows what code context is attached without seeing the full text.
   */
  contextChip?: { label: string; preview: string };
  /**
   * A specific notebook output selected by the user (right-click → Ask DS
   * Assistant). When present the task request includes this output so the LLM
   * can focus its answer on it.
   */
  selectedOutput?: {
    label:      string;
    mimeType:   string;
    imageData?: string;
    textData?:  string;
    cellIndex:  number;
    outputIndex: number;
  };
}

type ExternalMsgListener = (msg: ExternalMessage) => void;
let _extMsgListener: ExternalMsgListener | null = null;

/** Called by the React component on mount to subscribe. */
export function setExternalMessageListener(fn: ExternalMsgListener | null): void {
  _extMsgListener = fn;
}

/** Called by the widget's sendMessage() method. */
function _dispatchExternalMessage(msg: ExternalMessage): void {
  _extMsgListener?.(msg);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Chat component
// ---------------------------------------------------------------------------




// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------

const PROVIDER_LIST = ['ANTHROPIC', 'OPENAI', 'GOOGLE', 'BEDROCK', 'AZURE', 'OPENROUTER', 'OLLAMA'];

/** Default model zoo per provider — shown if the user has nothing in .env yet. */
const DEFAULT_ZOO: Record<string, string[]> = {
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

const parseZoo = (raw: string): string[] =>
  raw.split(',').map(s => s.trim()).filter(Boolean);

const serializeZoo = (models: string[]): string => models.join(',');

/** Return models from the zoo value, falling back to built-in defaults. */
const getZooModels = (zooKey: string, values: Record<string, string>): string[] => {
  const raw = values[zooKey] ?? '';
  return raw.trim() ? parseZoo(raw) : DEFAULT_ZOO[zooKey] ?? [];
};

interface TabGroup {
  id: string;
  label: string;
  providerKey: string | null;
  zooKey: string | null;
  fields: { key: string; label: string; type: string; placeholder?: string }[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    id: 'routing',
    label: 'Routing',
    providerKey: null,
    zooKey: null,
    fields: [
      { key: 'DS_CHAT_PROVIDER',        label: 'Chat',        type: 'select' },
      { key: 'DS_COMPLETION_PROVIDER',  label: 'Completion',  type: 'select' },
      { key: 'DS_EMBED_PROVIDER',       label: 'Embedding',   type: 'select' },
    ]
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    providerKey: 'ANTHROPIC',
    zooKey: 'ANTHROPIC_MODELS',
    fields: [
      { key: 'ANTHROPIC_API_KEY',            label: 'API key',          type: 'password' },
      { key: 'ANTHROPIC_CHAT_MODEL',         label: 'Chat model',       type: 'model-select' },
      { key: 'ANTHROPIC_COMPLETION_MODEL',   label: 'Completion model', type: 'model-select' },
      { key: 'ANTHROPIC_EMBED_MODEL',        label: 'Embedding model',  type: 'model-select' },
    ]
  },
  {
    id: 'openai',
    label: 'OpenAI',
    providerKey: 'OPENAI',
    zooKey: 'OPENAI_MODELS',
    fields: [
      { key: 'OPENAI_API_KEY',            label: 'API key',          type: 'password' },
      { key: 'OPENAI_CHAT_MODEL',         label: 'Chat model',       type: 'model-select' },
      { key: 'OPENAI_COMPLETION_MODEL',   label: 'Completion model', type: 'model-select' },
      { key: 'OPENAI_EMBED_MODEL',        label: 'Embedding model',  type: 'model-select' },
    ]
  },
  {
    id: 'google',
    label: 'Google',
    providerKey: 'GOOGLE',
    zooKey: 'GOOGLE_MODELS',
    fields: [
      { key: 'GOOGLE_API_KEY',            label: 'API key',          type: 'password' },
      { key: 'GOOGLE_CHAT_MODEL',         label: 'Chat model',       type: 'model-select' },
      { key: 'GOOGLE_COMPLETION_MODEL',   label: 'Completion model', type: 'model-select' },
      { key: 'GOOGLE_EMBED_MODEL',        label: 'Embedding model',  type: 'model-select' },
    ]
  },
  {
    id: 'bedrock',
    label: 'Bedrock',
    providerKey: 'BEDROCK',
    zooKey: 'BEDROCK_MODELS',
    fields: [
      { key: 'AWS_PROFILE',                   label: 'AWS profile',      type: 'text', placeholder: 'e.g. default, np  (leave blank for explicit keys)' },
      { key: 'AWS_AUTH_REFRESH',              label: 'Auth refresh command', type: 'text', placeholder: 'e.g. aws-azure-login --profile ITOSS --no-prompt  (runs only when token is expired)' },
      { key: 'AWS_ACCESS_KEY_ID',             label: 'Access key ID',    type: 'password', placeholder: '(leave blank when using AWS_PROFILE)' },
      { key: 'AWS_SECRET_ACCESS_KEY',         label: 'Secret access key',type: 'password', placeholder: '(leave blank when using AWS_PROFILE)' },
      { key: 'AWS_SESSION_TOKEN',             label: 'Session token',    type: 'password', placeholder: '(optional)' },
      { key: 'AWS_REGION',                    label: 'Region',           type: 'text', placeholder: 'us-east-1' },
      { key: 'BEDROCK_CHAT_MODEL',            label: 'Chat model ID',    type: 'model-select' },
      { key: 'BEDROCK_COMPLETION_MODEL',      label: 'Completion model ID', type: 'model-select' },
      { key: 'BEDROCK_EMBED_MODEL',           label: 'Embedding model',  type: 'model-select' },
    ]
  },
  {
    id: 'azure',
    label: 'Azure',
    providerKey: 'AZURE',
    zooKey: 'AZURE_MODELS',
    fields: [
      { key: 'AZURE_OPENAI_API_KEY',          label: 'API key',              type: 'password' },
      { key: 'AZURE_OPENAI_ENDPOINT',         label: 'Endpoint URL',         type: 'text', placeholder: 'https://YOUR-RESOURCE.openai.azure.com/' },
      { key: 'AZURE_OPENAI_API_VERSION',      label: 'API version',          type: 'text', placeholder: '2024-02-01' },
      { key: 'AZURE_CHAT_MODEL',              label: 'Chat deployment',       type: 'model-select' },
      { key: 'AZURE_COMPLETION_MODEL',        label: 'Completion deployment', type: 'model-select' },
      { key: 'AZURE_EMBED_MODEL',             label: 'Embedding deployment',  type: 'model-select' },
    ]
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    providerKey: 'OPENROUTER',
    zooKey: 'OPENROUTER_MODELS',
    fields: [
      { key: 'OPENROUTER_API_KEY',             label: 'API key',              type: 'password' },
      { key: 'OPENROUTER_SITE_URL',            label: 'Site URL (optional)',  type: 'text', placeholder: 'https://your-app.com' },
      { key: 'OPENROUTER_SITE_NAME',           label: 'Site name (optional)', type: 'text', placeholder: 'Varys' },
      { key: 'OPENROUTER_CHAT_MODEL',          label: 'Chat model',           type: 'model-select' },
      { key: 'OPENROUTER_COMPLETION_MODEL',    label: 'Completion model',     type: 'model-select' },
      { key: 'OPENROUTER_EMBED_MODEL',         label: 'Embedding model',      type: 'model-select' },
    ]
  },
  {
    id: 'ollama',
    label: 'Ollama',
    providerKey: 'OLLAMA',
    zooKey: 'OLLAMA_MODELS',
    fields: [
      { key: 'OLLAMA_URL',                     label: 'Server URL',       type: 'text', placeholder: 'http://localhost:11434' },
      { key: 'OLLAMA_CHAT_MODEL',              label: 'Chat model',       type: 'model-select' },
      { key: 'OLLAMA_COMPLETION_MODEL',        label: 'Completion model', type: 'model-select' },
      { key: 'OLLAMA_EMBED_MODEL',             label: 'Embedding model',  type: 'model-select' },
    ]
  },
  {
    id: 'rag',
    label: 'Knowledge',
    providerKey: null,
    zooKey: null,
    fields: []   // no form fields here — just the index status widget below
  },
];

// ---------------------------------------------------------------------------
// RAGStatusSection — live knowledge-base stats shown on the Knowledge tab
// ---------------------------------------------------------------------------

interface RAGStatusSectionProps {
  apiClient: APIClient;
  notebookPath?: string;
}

const RAGStatusSection: React.FC<RAGStatusSectionProps> = ({ apiClient, notebookPath = '' }) => {
  const [status, setStatus] = useState<{
    available: boolean;
    total_chunks: number;
    indexed_files: number;
    files: string[];
    hint?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const s = await apiClient.ragStatus(notebookPath);
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  if (loading) {
    return (
      <div className="ds-rag-status">
        <span className="ds-rag-status-loading">Checking index…</span>
      </div>
    );
  }

  if (!status) return null;

  if (!status.available) {
    return (
      <div className="ds-rag-status ds-rag-status--unavailable">
        <p>⚠️ RAG dependencies not installed.</p>
        <code>{status.hint ?? 'pip install chromadb sentence-transformers'}</code>
      </div>
    );
  }

  return (
    <div className="ds-rag-status">
      <div className="ds-rag-status-header">
        <span className="ds-rag-status-title">📚 Knowledge base</span>
        <button className="ds-rag-status-refresh" onClick={() => void refresh()} title="Refresh">↻</button>
      </div>
      <div className="ds-rag-status-stats">
        <span><strong>{status.total_chunks}</strong> chunks</span>
        <span><strong>{status.indexed_files}</strong> files indexed</span>
      </div>
      {status.indexed_files > 0 && (
        <div className="ds-rag-status-files">
          {status.files.slice(0, 8).map((f: string) => (
            <div key={f} className="ds-rag-status-file" title={f}>
              {f.split('/').pop()}
            </div>
          ))}
          {status.files.length > 8 && (
            <div className="ds-rag-status-file ds-rag-status-file--more">
              +{status.files.length - 8} more…
            </div>
          )}
        </div>
      )}
      {status.indexed_files === 0 && status.available && (
        <div className="ds-rag-status-empty">
          No files indexed yet. Drop files in <code>.jupyter-assistant/knowledge/</code> then run <code>/index</code> in chat.
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ModelZooSection — add/remove model names for a provider
// ---------------------------------------------------------------------------

interface ModelZooProps {
  zooKey: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const ModelZooSection: React.FC<ModelZooProps> = ({ zooKey, values, onChange }) => {
  const [newModel, setNewModel] = useState('');
  const models = getZooModels(zooKey, values);

  const commit = (updated: string[]) => onChange(zooKey, serializeZoo(updated));

  const handleAdd = () => {
    const name = newModel.trim();
    if (!name || models.includes(name)) return;
    commit([...models, name]);
    setNewModel('');
  };

  const handleRemove = (name: string) => commit(models.filter(m => m !== name));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  };

  return (
    <div className="ds-settings-zoo">
      <div className="ds-settings-zoo-header">
        <span className="ds-settings-zoo-title">Model Zoo</span>
        <span className="ds-settings-zoo-count">{models.length}</span>
      </div>
      <div className="ds-settings-zoo-chips">
        {models.map(m => (
          <span key={m} className="ds-settings-zoo-chip" title={m}>
            <span className="ds-settings-zoo-chip-name">{m}</span>
            <button
              className="ds-settings-zoo-chip-remove"
              onClick={() => handleRemove(m)}
              title={`Remove ${m}`}
            >×</button>
          </span>
        ))}
        {models.length === 0 && (
          <span className="ds-settings-zoo-empty">No models yet — add one below.</span>
        )}
      </div>
      <div className="ds-settings-zoo-add">
        <input
          className="ds-settings-zoo-add-input"
          value={newModel}
          onChange={e => setNewModel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type model name and press Enter…"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className="ds-settings-zoo-add-btn"
          onClick={handleAdd}
          disabled={!newModel.trim() || models.includes(newModel.trim())}
          title="Add to zoo"
        >+ Add</button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------

const ModelsPanel: React.FC<{ apiClient: APIClient; onClose: () => void; onSaved?: () => void; notebookPath?: string }> = ({
  apiClient,
  onClose,
  onSaved,
  notebookPath = '',
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [masked, setMasked] = useState<Record<string, boolean>>({});
  const [envPath, setEnvPath] = useState('');
  const [envExists, setEnvExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('routing');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiClient
      .getSettings()
      .then(data => {
        const v: Record<string, string> = {};
        const m: Record<string, boolean> = {};
        for (const [k, entry] of Object.entries(data)) {
          if (k.startsWith('_')) continue;
          const e = entry as { value: string; masked: boolean };
          v[k] = e.value ?? '';
          m[k] = e.masked ?? false;
        }
        // Pre-seed zoo defaults so dropdowns always have options
        for (const zooKey of Object.keys(DEFAULT_ZOO)) {
          if (!v[zooKey]) v[zooKey] = DEFAULT_ZOO[zooKey].join(',');
        }
        setValues(v);
        setMasked(m);
        setEnvPath(String((data as any)._env_path ?? ''));
        setEnvExists(Boolean((data as any)._env_exists));
        setLoading(false);
      })
      .catch(err => {
        setStatus({ type: 'error', text: `Failed to load: ${err}` });
        setLoading(false);
      });
  }, [apiClient]);

  const handleChange = (key: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }));
    if (masked[key]) setMasked(m => ({ ...m, [key]: false }));
  };

  const _validateBeforeSave = (): string | null => {
    const PROVIDER_API_KEYS: Record<string, string> = {
      ANTHROPIC:   'ANTHROPIC_API_KEY',
      OPENAI:      'OPENAI_API_KEY',
      GOOGLE:      'GOOGLE_API_KEY',
      AZURE:       'AZURE_OPENAI_API_KEY',
      OPENROUTER:  'OPENROUTER_API_KEY',
      // BEDROCK is intentionally absent: it supports profile-based auth via
      // AWS_PROFILE / ~/.aws/credentials with no explicit key required.
    };
    const PROVIDER_MODEL_KEYS: Record<string, Record<string, string>> = {
      ANTHROPIC:   { chat: 'ANTHROPIC_CHAT_MODEL',    completion: 'ANTHROPIC_COMPLETION_MODEL' },
      OPENAI:      { chat: 'OPENAI_CHAT_MODEL',        completion: 'OPENAI_COMPLETION_MODEL' },
      GOOGLE:      { chat: 'GOOGLE_CHAT_MODEL',        completion: 'GOOGLE_COMPLETION_MODEL' },
      AZURE:       { chat: 'AZURE_CHAT_MODEL',         completion: 'AZURE_COMPLETION_MODEL' },
      OPENROUTER:  { chat: 'OPENROUTER_CHAT_MODEL',   completion: 'OPENROUTER_COMPLETION_MODEL' },
      BEDROCK:     { chat: 'BEDROCK_CHAT_MODEL',       completion: 'BEDROCK_COMPLETION_MODEL' },
      OLLAMA:      { chat: 'OLLAMA_CHAT_MODEL',        completion: 'OLLAMA_COMPLETION_MODEL' },
    };

    const chatProvider = (values['DS_CHAT_PROVIDER'] ?? '').toUpperCase();
    const completionProvider = (values['DS_COMPLETION_PROVIDER'] ?? '').toUpperCase();

    // Check that chat provider is set
    if (!chatProvider) {
      return 'DS_CHAT_PROVIDER is empty. Select a provider for Chat in the Routing tab.';
    }

    // Check API key for chat provider (skip Ollama — no key needed)
    if (chatProvider in PROVIDER_API_KEYS) {
      const keyField = PROVIDER_API_KEYS[chatProvider];
      const keyVal = (values[keyField] ?? '').trim();
      if (!keyVal || keyVal === '••••••••') {
        return `${keyField} is empty. Set the API key for ${chatProvider} in its tab.`;
      }
    }

    // Check chat model
    const chatModelKey = PROVIDER_MODEL_KEYS[chatProvider]?.['chat'];
    if (chatModelKey && !(values[chatModelKey] ?? '').trim()) {
      return `${chatModelKey} is empty. Select a chat model for ${chatProvider}.`;
    }

    // If a completion provider is set, validate it too
    if (completionProvider) {
      if (completionProvider in PROVIDER_API_KEYS) {
        const keyField = PROVIDER_API_KEYS[completionProvider];
        const keyVal = (values[keyField] ?? '').trim();
        if (!keyVal || keyVal === '••••••••') {
          return `${keyField} is empty. Set the API key for ${completionProvider} in its tab.`;
        }
      }
      const completionModelKey = PROVIDER_MODEL_KEYS[completionProvider]?.['completion'];
      if (completionModelKey && !(values[completionModelKey] ?? '').trim()) {
        return `${completionModelKey} is empty. Select a completion model for ${completionProvider}.`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    setStatus(null);
    const validationError = _validateBeforeSave();
    if (validationError) {
      setStatus({ type: 'error', text: validationError });
      return;
    }
    setSaving(true);
    try {
      const result = await apiClient.saveSettings(values);
      if (result.error) {
        setStatus({ type: 'error', text: result.error });
      } else {
        setStatus({
          type: 'success',
          text: `Saved ${(result.updated ?? []).length} setting(s). Active immediately.`
        });
        onSaved?.();
      }
    } catch (err) {
      setStatus({ type: 'error', text: `Save failed: ${err}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="ds-settings-loading">Loading settings…</div>;
  }

  const activeProviders = new Set([
    (values['DS_CHAT_PROVIDER']       ?? '').toUpperCase(),
    (values['DS_COMPLETION_PROVIDER'] ?? '').toUpperCase(),
    (values['DS_EMBED_PROVIDER']      ?? '').toUpperCase(),
  ]);

  const currentGroup = TAB_GROUPS.find(g => g.id === activeTab) ?? TAB_GROUPS[0];

  const TASK_LABELS: Record<string, string> = {
    DS_CHAT_PROVIDER:       'Chat',
    DS_COMPLETION_PROVIDER: 'Completion',
    DS_EMBED_PROVIDER:      'Embedding',
  };

  return (
    <div className="ds-settings-panel">
      {/* Tab bar */}
      <div className="ds-settings-tabbar">
        {TAB_GROUPS.map(tab => {
          const isActive = tab.id === activeTab;
          const hasDot = tab.providerKey !== null && activeProviders.has(tab.providerKey);
          return (
            <button
              key={tab.id}
              className={`ds-settings-tab${isActive ? ' ds-settings-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              {tab.label}
              {hasDot && <span className="ds-settings-tab-dot" title="Active for one or more tasks" />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="ds-settings-tab-content">
        {currentGroup.id === 'routing' ? (
          <div className="ds-settings-routing-grid">
            {currentGroup.fields.map(field => (
              <React.Fragment key={field.key}>
                <label className="ds-settings-label">{TASK_LABELS[field.key] ?? field.label}</label>
                {field.key === 'DS_COMPLETION_PROVIDER' ? (
                  <div className="ds-settings-routing-controls">
                    <select
                      className="ds-settings-select"
                      value={values[field.key] ?? ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                    >
                      <option value="">— select provider —</option>
                      {PROVIDER_LIST.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <label className="ds-settings-token-label" title="Max tokens returned per completion">
                      Tokens
                      <input
                        className="ds-settings-token-input"
                        type="number"
                        min={16}
                        max={2048}
                        step={16}
                        value={values['COMPLETION_MAX_TOKENS'] ?? '128'}
                        onChange={e => handleChange('COMPLETION_MAX_TOKENS', e.target.value)}
                        title="Max tokens returned per completion (default: 128)"
                      />
                    </label>
                  </div>
                ) : (
                  <select
                    className="ds-settings-select"
                    value={values[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                  >
                    <option value="">— select provider —</option>
                    {PROVIDER_LIST.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <>
            {currentGroup.fields.map(field => {
              if (field.type === 'model-select') {
                const zoo = currentGroup.zooKey ? getZooModels(currentGroup.zooKey, values) : [];
                const cur = values[field.key] ?? '';
                const options = cur && !zoo.includes(cur) ? [cur, ...zoo] : zoo;
                const isEmpty = !cur;
                return (
                  <div key={field.key} className="ds-settings-row">
                    <label className="ds-settings-label">
                      {field.label}
                      {isEmpty && <span className="ds-settings-required" title="Required"> *</span>}
                    </label>
                    <select
                      className={`ds-settings-select${isEmpty ? ' ds-settings-select--empty' : ''}`}
                      value={cur}
                      onChange={e => handleChange(field.key, e.target.value)}
                    >
                      <option value="">
                        {options.length === 0 ? '— add models to zoo below —' : '— select model —'}
                      </option>
                      {options.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              return (
                <div key={field.key} className="ds-settings-row">
                  <label className="ds-settings-label">{field.label}</label>
                  <input
                    className="ds-settings-input"
                    type={field.type === 'password' && masked[field.key] ? 'password' : 'text'}
                    value={values[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.type === 'password' ? '(unchanged)' : (field.placeholder ?? '')}
                    autoComplete="off"
                  />
                </div>
              );
            })}

            {/* Knowledge tab: embed routing summary + index status */}
            {currentGroup.id === 'rag' && (
              <>
                <div className="ds-rag-routing-summary">
                  <div className="ds-rag-routing-row">
                    <span className="ds-rag-routing-label">Embedding provider</span>
                    <span className="ds-rag-routing-value">
                      {(values['DS_EMBED_PROVIDER'] || '—').toUpperCase()}
                    </span>
                  </div>
                  <div className="ds-rag-routing-row">
                    <span className="ds-rag-routing-label">Embedding model</span>
                    <span className="ds-rag-routing-value">
                      {(() => {
                        const p = (values['DS_EMBED_PROVIDER'] ?? '').toUpperCase();
                        return p ? (values[`${p}_EMBED_MODEL`] || '— (use model zoo)') : '—';
                      })()}
                    </span>
                  </div>
                  <p className="ds-rag-routing-hint">
                    Configure the provider in <strong>Routing → Embedding</strong> and the model in
                    the provider tab's <em>Embedding model</em> field.
                  </p>
                </div>
                <div className="ds-rag-storage-hint">
                  <strong>How to add knowledge</strong>
                  <p>
                    Drop PDFs, notebooks, or markdown files into{' '}
                    <code>.jupyter-assistant/knowledge/</code>, then run{' '}
                    <code>/index</code> in the chat to index them.
                  </p>
                  <p>
                    Indexed content is stored as vectors in{' '}
                    <code>.jupyter-assistant/rag/chroma/</code> — original files are
                    never moved or copied. Only files inside the{' '}
                    <code>knowledge/</code> folder can be indexed.
                  </p>
                </div>
                <RAGStatusSection apiClient={apiClient} notebookPath={notebookPath} />
              </>
            )}

            {/* Model zoo — shown on provider tabs that have a zoo */}
            {currentGroup.zooKey && (
              <ModelZooSection
                zooKey={currentGroup.zooKey}
                values={values}
                onChange={handleChange}
              />
            )}
          </>
        )}
      </div>

      {/* Sticky footer */}
      <div className="ds-settings-footer">
        {status && (
          <div className={`ds-settings-status ds-settings-status-${status.type}`}>
            {status.text}
          </div>
        )}
        <div className="ds-settings-path">
          {envExists ? envPath : `Will create: ${envPath}`}
        </div>
        <div className="ds-settings-actions">
          <button
            className="ds-settings-save-btn"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save & Apply'}
          </button>
          <button className="ds-settings-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SkillsPanel
// ---------------------------------------------------------------------------

interface SkillEntry { name: string; enabled: boolean; }
interface BundledSkillEntry { name: string; command: string | null; description: string | null; imported: boolean; }

const SkillsPanel: React.FC<{ apiClient: APIClient; notebookPath?: string }> = ({ apiClient, notebookPath = '' }) => {
  const [skills, setSkills]             = useState<SkillEntry[]>([]);
  const [skillsDir, setSkillsDir]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [editorTab, setEditorTab]       = useState<'skill' | 'readme'>('skill');
  const [editContent, setEditContent]   = useState('');
  const [editReadme, setEditReadme]     = useState('');
  const [dirty, setDirty]               = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveStatus, setSaveStatus]     = useState<'ok' | 'err' | null>(null);
  const [newName, setNewName]           = useState('');
  const [creatingNew, setCreatingNew]   = useState(false);

  // Bundled skill library
  const [libraryOpen, setLibraryOpen]       = useState(false);
  const [library, setLibrary]               = useState<BundledSkillEntry[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [importing, setImporting]           = useState<string | null>(null);

  useEffect(() => {
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
    } catch { /* ignore */ }
    finally { setRefreshing(false); }
  };

  const handleEdit = async (name: string) => {
    try {
      const d = await apiClient.getSkillContent(name, notebookPath);
      setSelectedName(name);
      setEditContent(d.content);
      setEditReadme(d.readme ?? '');
      setEditorTab('skill');
      setDirty(false);
      setSaveStatus(null);
    } catch { /* ignore */ }
  };

  const handleToggle = async (name: string, enabled: boolean) => {
    setSkills(prev => prev.map(s => s.name === name ? { ...s, enabled } : s));
    try {
      await apiClient.saveSkill(name, { enabled }, notebookPath);
    } catch {
      setSkills(prev => prev.map(s => s.name === name ? { ...s, enabled: !enabled } : s));
    }
  };

  const handleSaveContent = async () => {
    if (!selectedName) return;
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
    } catch {
      setSaveStatus('err');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = async () => {
    const name = newName.trim().replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    if (!name) return;
    const starter = `# ${name.replace(/_/g, ' ')}\n\nDescribe this skill here.\n`;
    const readme  = `# ${name.replace(/_/g, ' ')}\n\nDocumentation for the **${name}** skill.\n\n## Purpose\n\n...\n`;
    try {
      await apiClient.saveSkill(name, { content: starter, readme, enabled: true }, notebookPath);
      setSkills(prev => [...prev, { name, enabled: true }]);
      setNewName('');
      setCreatingNew(false);
      await handleEdit(name);
    } catch { /* ignore */ }
  };

  const handleToggleLibrary = async () => {
    const willOpen = !libraryOpen;
    setLibraryOpen(willOpen);
    if (willOpen && library.length === 0) {
      setLibraryLoading(true);
      try {
        const d = await apiClient.getBundledSkills(notebookPath);
        setLibrary(d.bundled);
      } catch { /* ignore */ } finally { setLibraryLoading(false); }
    }
  };

  const handleImport = async (name: string) => {
    setImporting(name);
    try {
      await apiClient.importBundledSkill(name, notebookPath);
      // Mark as imported in library list and add to active skills list
      setLibrary(prev => prev.map(b => b.name === name ? { ...b, imported: true } : b));
      setSkills(prev => prev.some(s => s.name === name) ? prev : [...prev, { name, enabled: true }]);
    } catch { /* ignore */ } finally { setImporting(null); }
  };

  return (
    <div className="ds-skills-panel">
      {/* ── Left: skill list ── */}
      <div className="ds-skills-list">
        <div className="ds-skills-list-header">
          <span className="ds-skills-list-title">Skills</span>
          <button
            className={`ds-skills-refresh-btn${refreshing ? ' ds-skills-refresh-btn--spinning' : ''}`}
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            title="Reload all skill files from disk"
          >↺</button>
        </div>
        {loading ? (
          <div className="ds-skills-empty">Loading…</div>
        ) : skills.length === 0 ? (
          <div className="ds-skills-empty">
            No skills yet.{'\n'}{skillsDir}
          </div>
        ) : (
          skills.map(skill => (
            <div
              key={skill.name}
              className={`ds-skill-row${selectedName === skill.name ? ' ds-skill-row--active' : ''}`}
              onClick={() => void handleEdit(skill.name)}
              title="Click to edit"
            >
              <span className="ds-skill-name" title={skill.name}>{skill.name}</span>
              {/* iOS-style toggle — stop propagation so clicking toggle doesn't open editor */}
              <button
                role="switch"
                aria-checked={skill.enabled}
                className={`ds-skill-toggle${skill.enabled ? ' ds-skill-toggle--on' : ''}`}
                onClick={e => { e.stopPropagation(); void handleToggle(skill.name, !skill.enabled); }}
                title={skill.enabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
              />
            </div>
          ))
        )}

        {/* Add new skill row */}
        {creatingNew ? (
          <div className="ds-skill-new-row">
            <input
              className="ds-skill-new-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleCreateNew(); if (e.key === 'Escape') setCreatingNew(false); }}
              placeholder="skill_name"
              autoFocus
              spellCheck={false}
            />
            <button className="ds-skill-new-ok" onClick={() => void handleCreateNew()} title="Create">✓</button>
            <button className="ds-skill-new-cancel" onClick={() => setCreatingNew(false)} title="Cancel">✕</button>
          </div>
        ) : (
          <button className="ds-skill-add-btn" onClick={() => setCreatingNew(true)}>+ New skill</button>
        )}

        {/* ── Bundled skill library ── */}
        <div className="ds-skill-library">
          <button
            className="ds-skill-library-header"
            onClick={() => void handleToggleLibrary()}
            title="Browse factory-default skills bundled with the extension"
          >
            <span className="ds-skill-library-chevron">{libraryOpen ? '▾' : '▸'}</span>
            <span>📦 Skill Library</span>
          </button>

          {libraryOpen && (
            <div className="ds-skill-library-body">
              {libraryLoading ? (
                <div className="ds-skill-library-msg">Loading…</div>
              ) : library.length === 0 ? (
                <div className="ds-skill-library-msg">No bundled skills found.</div>
              ) : (
                library.map(b => (
                  <div
                    key={b.name}
                    className={`ds-skill-library-row${b.imported ? ' ds-skill-library-row--imported' : ''}`}
                  >
                    <div className="ds-skill-library-info">
                      <span className="ds-skill-library-name">{b.name}</span>
                      {b.command && <span className="ds-skill-library-cmd">{b.command}</span>}
                      {b.description && <span className="ds-skill-library-desc">{b.description}</span>}
                    </div>
                    {b.imported ? (
                      <span className="ds-skill-library-check" title="Already in your project">✓</span>
                    ) : (
                      <button
                        className="ds-skill-library-import-btn"
                        onClick={() => void handleImport(b.name)}
                        disabled={importing === b.name}
                        title={`Import ${b.name} into this project`}
                      >{importing === b.name ? '…' : '↓ Import'}</button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: editor ── */}
      <div className="ds-skill-editor">
        {!selectedName ? (
          <div className="ds-skill-editor-placeholder">
            <span>Click a skill to edit it</span>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="ds-skill-editor-tabs">
              <button
                className={`ds-skill-editor-tab${editorTab === 'skill' ? ' ds-skill-editor-tab--active' : ''}`}
                onClick={() => { setEditorTab('skill'); setDirty(false); setSaveStatus(null); }}
              >SKILL.md</button>
              <button
                className={`ds-skill-editor-tab${editorTab === 'readme' ? ' ds-skill-editor-tab--active' : ''}`}
                onClick={() => { setEditorTab('readme'); setDirty(false); setSaveStatus(null); }}
              >README.md</button>
              <div className="ds-skill-editor-tabs-spacer" />
              {dirty && <span className="ds-skill-editor-dirty" title="Unsaved changes">●</span>}
              {saveStatus === 'ok'  && <span className="ds-skill-editor-saved">✓ Saved</span>}
              {saveStatus === 'err' && <span className="ds-skill-editor-error">✗ Error</span>}
              <button
                className="ds-skill-editor-save-btn"
                onClick={() => void handleSaveContent()}
                disabled={saving || !dirty}
                title="Save (Ctrl+S)"
              >{saving ? '…' : 'Save'}</button>
            </div>
            {/* Filename hint */}
            <div className="ds-skill-editor-filepath">
              {selectedName}/{editorTab === 'skill' ? 'SKILL.md' : 'README.md'}
            </div>
            <textarea
              key={`${selectedName}-${editorTab}`}
              className="ds-skill-editor-textarea"
              value={editorTab === 'skill' ? editContent : editReadme}
              onChange={e => {
                if (editorTab === 'skill') setEditContent(e.target.value);
                else setEditReadme(e.target.value);
                setDirty(true);
                setSaveStatus(null);
              }}
              spellCheck={false}
              placeholder={editorTab === 'readme' ? 'No README.md yet — start writing user documentation here…' : ''}
              onKeyDown={e => {
                if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void handleSaveContent();
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// CommandsPanel — live list of all slash commands (builtins + skills)
// ---------------------------------------------------------------------------

const CommandsPanel: React.FC<{ apiClient: APIClient }> = ({ apiClient }) => {
  const [cmds, setCmds] = useState<SlashCommand[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    apiClient.getCommands()
      .then(list => { setCmds(list); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => { refresh(); }, [apiClient]);

  const byCmd = (a: SlashCommand, b: SlashCommand) => a.command.localeCompare(b.command);
  const builtins = cmds.filter(c => c.type === 'builtin').sort(byCmd);
  const skills   = cmds.filter(c => c.type === 'skill').sort(byCmd);

  return (
    <div className="ds-commands-panel">
      <div className="ds-commands-toolbar">
        <span className="ds-commands-count">{cmds.length} commands</span>
        <button className="ds-commands-refresh-btn" onClick={refresh} title="Reload commands">
          {loading ? '…' : '↻'}
        </button>
      </div>

      <div className="ds-commands-section">
        <div className="ds-commands-section-title">Built-in</div>
        {builtins.map(c => (
          <div key={c.command} className="ds-commands-row">
            <code className="ds-commands-name">{c.command}</code>
            <span className="ds-commands-desc">{c.description}</span>
          </div>
        ))}
      </div>

      {skills.length > 0 && (
        <div className="ds-commands-section">
          <div className="ds-commands-section-title">Skills</div>
          {skills.map(c => (
            <div key={c.command} className="ds-commands-row">
              <code className="ds-commands-name">{c.command}</code>
              <span className="ds-commands-desc">{c.description}</span>
              {c.skill_name && (
                <span className="ds-commands-skill-badge" title={`From skill: ${c.skill_name}`}>
                  {c.skill_name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && skills.length === 0 && (
        <p className="ds-commands-empty">
          No skill commands loaded yet. Import or create a skill with a <code>/command</code> in its front matter.
        </p>
      )}
    </div>
  );
};

// SettingsPanel — top-level wrapper with [Models | Skills | Commands] tabs
// ---------------------------------------------------------------------------

const SettingsPanel: React.FC<{ apiClient: APIClient; onClose: () => void; onSaved?: () => void; notebookPath?: string }> = ({
  apiClient, onClose, onSaved, notebookPath = ''
}) => {
  const [topTab, setTopTab] = useState<'models' | 'skills' | 'commands'>('models');
  return (
    <div className="ds-settings-outer">
      <div className="ds-settings-top-tabs">
        <button
          className={`ds-settings-top-tab${topTab === 'models' ? ' ds-settings-top-tab--active' : ''}`}
          onClick={() => setTopTab('models')}
        >⚙ Models</button>
        <button
          className={`ds-settings-top-tab${topTab === 'skills' ? ' ds-settings-top-tab--active' : ''}`}
          onClick={() => setTopTab('skills')}
        >📚 Skills</button>
        <button
          className={`ds-settings-top-tab${topTab === 'commands' ? ' ds-settings-top-tab--active' : ''}`}
          onClick={() => setTopTab('commands')}
        >/ Commands</button>
      </div>

      {topTab === 'models' ? (
        <ModelsPanel apiClient={apiClient} onClose={onClose} onSaved={onSaved} notebookPath={notebookPath} />
      ) : topTab === 'skills' ? (
        <>
          <SkillsPanel apiClient={apiClient} notebookPath={notebookPath} />
          <div className="ds-settings-footer">
            <div className="ds-settings-actions">
              <button className="ds-settings-cancel-btn" onClick={onClose}>Close</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <CommandsPanel apiClient={apiClient} />
          <div className="ds-settings-footer">
            <div className="ds-settings-actions">
              <button className="ds-settings-cancel-btn" onClick={onClose}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ModelSwitcher — inline model picker at the bottom of the chat textarea
// ---------------------------------------------------------------------------

const shortModelName = (model: string): string =>
  model.includes('/') ? model.split('/').slice(1).join('/') : model;

const PROVIDER_COLORS: Record<string, string> = {
  ANTHROPIC:   '#d97757',
  OPENAI:      '#10a37f',
  GOOGLE:      '#4285f4',
  BEDROCK:     '#ff9900',
  AZURE:       '#0078d4',
  OPENROUTER:  '#7c3aed',
  OLLAMA:      '#0ea5e9',
};
const providerColor = (p: string): string =>
  PROVIDER_COLORS[p.toUpperCase()] ?? '#1976d2';

interface ModelSwitcherProps {
  provider: string;
  model: string;
  zoo: string[];
  saving: boolean;
  onSelect: (model: string) => void;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  provider, model, zoo, saving, onSelect
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const color = providerColor(provider);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const noProvider    = !provider;
  const displayName   = noProvider ? 'No provider set — open Settings' : (shortModelName(model) || '—');
  const displayProvider = (!provider || provider === 'unknown') ? '?' : provider.toUpperCase();

  return (
    <div className="ds-model-switcher" ref={wrapperRef}>
      {open && (
        <div className="ds-model-switcher-popup">
          <div className="ds-model-switcher-popup-header" style={{ borderLeftColor: color, color }}>
            <span className="ds-model-switcher-popup-provider">{displayProvider}</span>
            <span className="ds-model-switcher-popup-label">Chat model</span>
          </div>
          {zoo.length === 0 ? (
            <div className="ds-model-switcher-empty">
              No models in zoo.{'\n'}Go to ⚙ Settings → {displayProvider} tab.
            </div>
          ) : (
            <div className="ds-model-switcher-list">
              {zoo.map(m => {
                const isActive = m === model;
                return (
                  <button
                    key={m}
                    className={`ds-model-switcher-option${isActive ? ' ds-model-switcher-option--active' : ''}`}
                    style={isActive ? { borderLeftColor: color } : undefined}
                    onClick={() => { onSelect(m); setOpen(false); }}
                    title={m}
                  >
                    <span className="ds-model-switcher-option-name">{m}</span>
                    {isActive && <span className="ds-model-switcher-check" style={{ color }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      <button
        className={`ds-model-switcher-btn${open ? ' ds-model-switcher-btn--open' : ''}${saving ? ' ds-model-switcher-btn--saving' : ''}${noProvider ? ' ds-model-switcher-btn--unconfigured' : ''}`}
        onClick={() => !saving && setOpen(o => !o)}
        data-tip={noProvider ? 'No provider configured — open Settings' : `${displayProvider} · ${model}`}
        disabled={saving}
      >
        <span className="ds-model-switcher-model-name">{saving ? 'Switching…' : displayName}</span>
        <span className="ds-model-switcher-chevron" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Slash-command helpers
// ---------------------------------------------------------------------------

/** Parse a /command prefix from the start of a message.
 *  Returns { command: "/eda", rest: "rest of message" } or null if no command. */
function parseSlashCommand(input: string): { command: string; rest: string } | null {
  const m = input.match(/^(\/[\w-]+)(?:\s+(.*))?$/s);
  if (!m) return null;
  return { command: m[1].toLowerCase(), rest: (m[2] ?? '').trim() };
}

// ---------------------------------------------------------------------------
// CommandAutocomplete component
// ---------------------------------------------------------------------------

interface CommandAutocompleteProps {
  commands: SlashCommand[];
  query: string;           // current partial input starting with "/"
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
}

const CommandAutocomplete: React.FC<CommandAutocompleteProps> = ({
  commands, query, onSelect, onClose,
}) => {
  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return commands.filter(c => c.command.startsWith(q) || c.description.toLowerCase().includes(q));
  }, [commands, query]);

  const popupRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset active index when filter changes
  useEffect(() => { setActiveIdx(0); }, [filtered.length]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Keyboard navigation — exposed via a global keydown handler attached to
  // the textarea when this component is visible.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!filtered.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIdx]) onSelect(filtered[activeIdx]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [filtered, activeIdx, onSelect, onClose]);

  if (!filtered.length) return null;

  return (
    <div className="ds-cmd-popup" ref={popupRef}>
      {filtered.map((cmd, i) => (
        <div
          key={cmd.command}
          className={`ds-cmd-item${i === activeIdx ? ' ds-cmd-item-active' : ''}`}
          onMouseEnter={() => setActiveIdx(i)}
          onClick={() => onSelect(cmd)}
        >
          <span className="ds-cmd-name">{cmd.command}</span>
          <span className="ds-cmd-badge ds-cmd-badge-{cmd.type}">{cmd.type}</span>
          <span className="ds-cmd-desc">{cmd.description}</span>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Thread helpers
// ---------------------------------------------------------------------------

function makeNewThread(name: string): ChatThread {
  const now = new Date().toISOString();
  return {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    name,
    createdAt: now,
    updatedAt: now,
    messages: [],
    notebookAware: true,
  };
}

// ---------------------------------------------------------------------------
// Cell identity helpers
// ---------------------------------------------------------------------------

/**
 * Rewrite stale `#N [id:XXXXXXXX]` references inside a history message so
 * they always reflect the *current* notebook position for that cell.
 *
 * The LLM is instructed (via the system prompt) to always include `[id:X]`
 * when citing a cell.  When cells are inserted or deleted between turns,
 * the number N may drift.  This pass corrects N before the history is sent
 * to the LLM so it never sees conflicting positions.
 *
 * @param text    The raw message content (user or assistant).
 * @param idMap   Map from 8-char id-prefix → current 1-based cell number.
 */
function translateCellRefs(
  text: string,
  idMap: Map<string, number>
): string {
  // Matches "#7 [id:a3f7b2c1]" or "#7  [id:a3f7b2c1]" (one or two spaces)
  return text.replace(/#(\d+)\s{1,2}\[id:([0-9a-f]{8})\]/g, (_m, numStr, prefix) => {
    const oldNum = parseInt(numStr, 10);
    if (!idMap.has(prefix)) {
      // Cell was deleted from the notebook entirely
      return `#${oldNum} [id:${prefix}] [cell no longer exists]`;
    }
    const currentNum = idMap.get(prefix)!;
    if (currentNum !== oldNum) {
      return `#${currentNum} [id:${prefix}] (was #${oldNum})`;
    }
    return `#${oldNum} [id:${prefix}]`;
  });
}

// ---------------------------------------------------------------------------
// ThreadBar component
// ---------------------------------------------------------------------------

interface ThreadBarProps {
  threads: ChatThread[];
  currentId: string;
  notebookName: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const ThreadBar: React.FC<ThreadBarProps> = ({
  threads, currentId, notebookName, onSwitch, onNew, onRename, onDuplicate, onDelete,
}) => {
  const [open, setOpen]           = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editValue, setEditValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  const tryRename = (id: string, name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const collision = threads.some(t => t.id !== id && t.name === trimmed);
    if (collision) {
      setRenameError(`"${trimmed}" already exists`);
      return false;
    }
    onRename(id, trimmed);
    setRenameError('');
    return true;
  };

  const current = threads.find(t => t.id === currentId);
  const idx     = threads.findIndex(t => t.id === currentId);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="ds-thread-bar" ref={popupRef}>
      <button
        className="ds-thread-toggle"
        onClick={() => setOpen(o => !o)}
        title="Switch or manage chat threads"
      >
        <span className="ds-thread-icon">≡</span>
        <span className="ds-thread-name">{current?.name ?? 'Thread'}</span>
        <span className="ds-thread-count">({idx + 1}/{threads.length})</span>
        <span className={`ds-thread-chevron ${open ? 'ds-thread-chevron-up' : ''}`}>›</span>
      </button>
      {open && (
        <div className="ds-thread-popup">
          {/* Notebook context header — clarifies which notebook's threads are listed */}
          {notebookName && (
            <div className="ds-thread-popup-notebook">
              <span className="ds-thread-popup-nb-icon">📓</span>
              <span className="ds-thread-popup-nb-name" title={notebookName}>{notebookName}</span>
            </div>
          )}
          {threads.map(t => (
            <div
              key={t.id}
              className={`ds-thread-item${t.id === currentId ? ' ds-thread-item-active' : ''}`}
            >
              {editingId === t.id ? (
                <div className="ds-thread-rename-wrap">
                  <input
                    className={`ds-thread-rename-input${renameError ? ' ds-thread-rename-error' : ''}`}
                    value={editValue}
                    autoFocus
                    onChange={e => { setEditValue(e.target.value); setRenameError(''); }}
                    onBlur={() => {
                      if (!tryRename(t.id, editValue)) {
                        if (!renameError) setEditingId('');
                      } else {
                        setEditingId('');
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (tryRename(t.id, editValue)) setEditingId('');
                      }
                      if (e.key === 'Escape') { setEditingId(''); setRenameError(''); }
                    }}
                  />
                  {renameError && (
                    <span className="ds-thread-rename-msg">{renameError}</span>
                  )}
                </div>
              ) : (
                <span
                  className="ds-thread-item-name"
                  onClick={() => { onSwitch(t.id); setOpen(false); }}
                >
                  {t.id === currentId && <span className="ds-thread-check">✓</span>}
                  {t.name}
                </span>
              )}
              <div className="ds-thread-actions">
                {/* Rename */}
                <span
                  className="ds-thread-action-btn"
                  onClick={e => { e.stopPropagation(); setEditingId(t.id); setEditValue(t.name); }}
                  data-tip="Rename"
                >
                  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                </span>
                {/* Duplicate */}
                <span
                  className="ds-thread-action-btn"
                  onClick={e => { e.stopPropagation(); onDuplicate(t.id); }}
                  data-tip="Duplicate thread"
                >
                  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="8" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M2 10V2a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                {/* Delete — only when more than one thread exists */}
                {threads.length > 1 && (
                  <span
                    className="ds-thread-action-btn ds-thread-action-delete"
                    onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                    data-tip="Delete thread"
                  >
                    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M6 7v3.5M8 7v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <path d="M3 4l.8 7.2a1 1 0 001 .8h4.4a1 1 0 001-.8L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div className="ds-thread-new-item" onClick={() => { onNew(); setOpen(false); }}>
            + New thread
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ContextChipBubble — collapsible code-context chip shown in sent user bubbles
// ---------------------------------------------------------------------------

const ContextChipBubble: React.FC<{ chip: { label: string; preview: string } }> = ({ chip }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className="ds-ctx-chip ds-ctx-chip--bubble">
      <div className="ds-ctx-chip-header">
        <span className="ds-ctx-chip-icon">📎</span>
        <span className="ds-ctx-chip-label">{chip.label}</span>
        <button
          className="ds-ctx-chip-toggle"
          onClick={() => setExpanded(x => !x)}
          title={expanded ? 'Collapse' : 'Expand context'}
          aria-label={expanded ? 'Collapse context' : 'Expand context'}
        >{expanded ? '▲' : '▼'}</button>
      </div>
      {expanded && (
        <pre className="ds-ctx-chip-preview">{chip.preview}</pre>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chat component
// ---------------------------------------------------------------------------

const DSAssistantChat: React.FC<SidebarProps> = ({
  apiClient,
  notebookReader,
  cellEditor,
  notebookTracker
}) => {
  // Resolves @variable_name references typed in the chat input
  const variableResolver = React.useMemo(
    () => new VariableResolver(notebookTracker),
    [notebookTracker]
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: 'Varys ready. Open a notebook and ask me anything!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Collapsible long messages ───────────────────────────────────────────
  // Messages whose content length exceeds this threshold start collapsed.
  const COLLAPSE_THRESHOLD = 800;
  const [collapsedMsgs, setCollapsedMsgs] = useState<Set<string>>(new Set());
  const toggleCollapse = (id: string) =>
    setCollapsedMsgs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Streaming animation queue ──────────────────────────────────────────
  // Chunks from the SSE stream are pushed here and drained by a setInterval
  // at 30 ms, decoupling rendering from React 18 automatic batching and from
  // Tornado's TCP flush timing. This guarantees visible token-by-token
  // streaming regardless of how the backend sends the events.
  const streamQueueRef  = useRef<string[]>([]);
  const streamMsgIdRef  = useRef<string>('');
  const streamTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const jsonExtractorRef = useRef({
    accumulated: '',
    lastLen: 0,
    headerEmitted: false,
    feed(partial: string): string {
      this.accumulated += partial;
      // Match from the last "content": " to the current end of string.
      // The regex intentionally anchors to $ so it tracks the LATEST field.
      const match = this.accumulated.match(/"content"\s*:\s*"((?:[^"\\]|\\[\s\S])*)$/);
      if (!match) return '';
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

  const startStreamQueue = (msgId: string) => {
    streamMsgIdRef.current = msgId;
    streamQueueRef.current = [];
    setActiveStreamId(msgId);
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    streamTimerRef.current = setInterval(() => {
      if (streamQueueRef.current.length === 0) return;
      // Drain up to 4 chunks per frame (~120 chars/sec at 30ms interval)
      const batch = streamQueueRef.current.splice(0, 4).join('');
      setMessages(prev => prev.map(m =>
        m.id === streamMsgIdRef.current
          ? { ...m, content: m.content + batch }
          : m
      ));
    }, 30);
  };

  const pushToStreamQueue = (text: string | null | undefined) => {
    if (text) streamQueueRef.current.push(text);
  };

  const stopStreamQueue = () => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    // Flush any remaining items immediately
    if (streamQueueRef.current.length > 0) {
      const remaining = streamQueueRef.current.splice(0).join('');
      setMessages(prev => prev.map(m =>
        m.id === streamMsgIdRef.current
          ? { ...m, content: m.content + remaining }
          : m
      ));
    }
    setActiveStreamId('');
  };

  // Clean up the animation timer when the component unmounts
  useEffect(() => () => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
  }, []);
  const [showSettings, setShowSettings]     = useState(false);
  const [showRepro,    setShowRepro]         = useState(false);
  const [showTags,     setShowTags]          = useState(false);

  // Chat window theme toggle: 'day' (light) or 'night' (dark), persisted in
  // localStorage so it survives JupyterLab restarts independently of the
  // global IDE theme.
  const [chatTheme, setChatTheme] = useState<'day' | 'night'>(() => {
    try {
      return (localStorage.getItem('ds-assistant-chat-theme') as 'day' | 'night') || 'day';
    } catch {
      return 'day';
    }
  });

  const toggleChatTheme = () => {
    setChatTheme(prev => {
      const next = prev === 'day' ? 'night' : 'day';
      try { localStorage.setItem('ds-assistant-chat-theme', next); } catch { /* ignore */ }
      return next;
    });
  };

  // Cell-writing mode toggle — persisted across sessions.
  // 'chat' = never write cells (discussion only)
  // 'auto' = skill/heuristic decides (default)
  // 'doc'  = always write cells freely
  type CellMode = 'chat' | 'auto' | 'doc';
  const [cellMode, setCellMode] = useState<CellMode>(() => {
    try {
      return (localStorage.getItem('ds-assistant-cell-mode') as CellMode) || 'auto';
    } catch {
      return 'auto';
    }
  });

  // ── Input area resize (drag from top) ─────────────────────────────────────
  const MIN_INPUT_HEIGHT = 56;
  const MAX_INPUT_HEIGHT = 400;
  const [inputHeight, setInputHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ds-assistant-input-height');
      return saved ? Math.max(MIN_INPUT_HEIGHT, parseInt(saved, 10)) : 80;
    } catch { return 80; }
  });
  const dragStateRef = useRef<{ startY: number; startH: number } | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStateRef.current = { startY: e.clientY, startH: inputHeight };

    const onMove = (mv: MouseEvent) => {
      if (!dragStateRef.current) return;
      // Dragging UP (negative delta) → increase height
      const delta = dragStateRef.current.startY - mv.clientY;
      const next = Math.min(MAX_INPUT_HEIGHT,
        Math.max(MIN_INPUT_HEIGHT, dragStateRef.current.startH + delta));
      setInputHeight(next);
    };
    const onUp = () => {
      dragStateRef.current = null;
      setInputHeight(h => {
        try { localStorage.setItem('ds-assistant-input-height', String(h)); } catch { /* */ }
        return h;
      });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const CELL_MODE_TITLE: Record<CellMode, string> = {
    chat: 'Insert to cell: No — responses stay in chat, no cells are created',
    auto: 'Insert to cell: Auto — skill/AI decides whether to create cells (default)',
    doc:  'Insert to cell: Always — always write results to notebook cells',
  };
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);
  // Tracks which fix indices have been applied per code-review message id
  const [appliedFixes, setAppliedFixes] = useState<Map<string, Set<number>>>(new Map());
  const [progressText, setProgressText] = useState<string>('');
  // ID of the assistant message currently being streamed — used to render a
  // typing cursor and to append step results without creating a new bubble.
  const [activeStreamId, setActiveStreamId] = useState<string>('');
  const [editingMsgId,   setEditingMsgId]   = useState<string | null>(null);
  const [editingText,    setEditingText]     = useState<string>('');

  // ── Chat thread state ──────────────────────────────────────────────────────
  const [threads, setThreads]                   = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId]   = useState('');

  // Derived: does the current thread have notebook context enabled?
  // Old threads without the field default to true (preserves existing behaviour).
  const notebookAware = threads.find(t => t.id === currentThreadId)?.notebookAware ?? true;

  const handleToggleNotebookAware = () => {
    setThreads(prev => prev.map(t =>
      t.id === currentThreadId
        ? { ...t, notebookAware: !(t.notebookAware ?? true) }
        : t
    ));
  };
  const [currentNotebookPath, setCurrentNotebookPath] = useState('');
  // AbortController for the current streaming request — allows the user to
  // cancel mid-stream by clicking the stop button.
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refs mirror the state above so that async callbacks (handleSend, auto-save)
  // always see the latest values without stale closures.
  const threadsRef             = useRef<ChatThread[]>([]);
  const currentThreadIdRef     = useRef('');
  const currentNotebookPathRef = useRef('');
  useEffect(() => { threadsRef.current = threads; },               [threads]);
  useEffect(() => { currentThreadIdRef.current = currentThreadId; }, [currentThreadId]);
  useEffect(() => { currentNotebookPathRef.current = currentNotebookPath; }, [currentNotebookPath]);

  // ── Thread persistence helpers ─────────────────────────────────────────────

  const _saveThread = async (
    threadId: string,
    threadName: string,
    msgs: Message[],
    /** Explicit notebook path — pass this to avoid reading a stale ref when
     *  the save fires after a notebook switch. */
    explicitPath?: string,
  ): Promise<void> => {
    const nbPath = explicitPath
      || currentNotebookPathRef.current
      || notebookTracker.currentWidget?.context.path
      || '';
    if (!nbPath || !threadId) return;
    const saved = msgs
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));
    const now = new Date().toISOString();
    const existing = threadsRef.current.find(t => t.id === threadId);
    try {
      await apiClient.saveChatThread(nbPath, {
        id: threadId,
        name: threadName || existing?.name || 'Thread',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        messages: saved,
        tokenUsage:    existing?.tokenUsage,
        notebookAware: existing?.notebookAware,
      });
    } catch (err) {
      console.warn('[DSAssistant] Could not save chat thread:', err);
    }
  };

  // Debounced auto-save: 1.5 s after the last message change.
  // Capture path + threadId at schedule time so a notebook switch that
  // happens before the timer fires doesn't corrupt the wrong file.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const threadId = currentThreadIdRef.current;
    const nbPath   = currentNotebookPathRef.current
      || notebookTracker.currentWidget?.context.path
      || '';
    if (!threadId || !nbPath) return;
    if (!messages.some(m => m.role === 'user' || m.role === 'assistant')) return;
    // Snapshot values NOW, before any possible notebook switch
    const snapshotPath = nbPath;
    const snapshotTid  = threadId;
    const snapshotMsgs = messages;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const tName = threadsRef.current.find(t => t.id === snapshotTid)?.name ?? 'Thread';
      // Pass snapshotPath explicitly so even a notebook switch between
      // scheduling and firing doesn't corrupt the wrong file.
      void _saveThread(snapshotTid, tName, snapshotMsgs, snapshotPath);
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ── Auto-load chat history when the active notebook changes ───────────────
  useEffect(() => {
    const loadForNotebook = async (newPath: string): Promise<void> => {
      if (!newPath) return;
      // Skip if the same notebook is already active (e.g. a panel focus event
      // that doesn't actually change the notebook).
      if (newPath === currentNotebookPathRef.current) return;

      // ── 1. Flush any pending save for the OUTGOING notebook immediately ──
      //    The debounced timer may not have fired yet. Capture its path and
      //    messages before we switch.
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const outgoingPath   = currentNotebookPathRef.current;
      const outgoingTid    = currentThreadIdRef.current;
      const outgoingMsgs   = messagesRef.current;
      if (outgoingPath && outgoingTid && outgoingMsgs.length > 0) {
        const tName = threadsRef.current.find(t => t.id === outgoingTid)?.name ?? 'Thread';
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
          const lastId     = chatFile.lastThreadId ?? chatFile.threads[0].id;
          const lastThread = chatFile.threads.find(t => t.id === lastId);
          setThreads(chatFile.threads);
          threadsRef.current = chatFile.threads;
          setCurrentThreadId(lastId);
          currentThreadIdRef.current = lastId;
          setMessages(
            lastThread && lastThread.messages.length > 0
              ? lastThread.messages.map(m => ({
                  id: m.id,
                  role: m.role as Message['role'],
                  content: m.content,
                  timestamp: new Date(m.timestamp),
                }))
              : []
          );
        } else {
          const t = makeNewThread('Main');
          setThreads([t]);
          threadsRef.current = [t];
          setCurrentThreadId(t.id);
          currentThreadIdRef.current = t.id;
          setMessages([]);
        }
      } catch (err) {
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
    if (current?.context.path) void loadForNotebook(current.context.path);

    const handler = (_: INotebookTracker, widget: unknown) => {
      const nbWidget = widget as { context?: { path?: string } } | null;
      if (nbWidget?.context?.path) void loadForNotebook(nbWidget.context.path);
    };
    notebookTracker.currentChanged.connect(handler);
    return () => { notebookTracker.currentChanged.disconnect(handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Model switcher state
  const [chatProvider, setChatProvider] = useState('');
  const [chatModel,    setChatModel]    = useState('');
  const [chatZoo,      setChatZoo]      = useState<string[]>([]);
  const [modelSwitching, setModelSwitching] = useState(false);

  // ── Advisory phrases (loaded from .jupyter-assistant/rules/advisory-phrases.md) ──
  // Initialised with the hardcoded defaults; overwritten by server response.
  const [advisoryPhrases, setAdvisoryPhrases] = useState<string[]>(_ADVISORY_STARTS);

  // ── Slash-command state ────────────────────────────────────────────────────
  const [commands, setCommands]       = useState<SlashCommand[]>([]);
  const [showCmdPopup, setShowCmdPopup] = useState(false);
  const [activeCommand, setActiveCommand] = useState<SlashCommand | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load slash commands on mount (and re-load after skills refresh)
  useEffect(() => {
    apiClient.getCommands().then(cmds => {
      if (cmds.length) setCommands(cmds);
    }).catch(() => { /* silently ignore */ });
  }, [apiClient]);

  // Reusable settings loader — called on mount and after settings panel closes.
  const loadModelSettings = () => {
    apiClient
      .getSettings()
      .then((data: Record<string, any>) => {
        const vals: Record<string, string> = {};
        for (const [k, entry] of Object.entries(data)) {
          if (!k.startsWith('_')) {
            vals[k] = (entry as { value: string }).value ?? '';
          }
        }
        // No fallback: if DS_CHAT_PROVIDER is empty the user must configure it in settings
        const provider     = (vals['DS_CHAT_PROVIDER'] ?? '').toUpperCase();
        const zooRaw       = provider ? (vals[`${provider}_MODELS`] ?? '') : '';
        const zoo          = zooRaw.trim() ? parseZoo(zooRaw) : (provider ? (DEFAULT_ZOO[`${provider}_MODELS`] ?? []) : []);
        const model        = provider ? (vals[`${provider}_CHAT_MODEL`] ?? '') : '';
        setChatProvider(provider);
        setChatModel(model);
        setChatZoo(zoo);
        // Load user-configured advisory phrases from the rules file.
        const phrases = data['_advisoryPhrases'];
        if (Array.isArray(phrases) && phrases.length > 0) {
          setAdvisoryPhrases(phrases as string[]);
        }
      })
      .catch((err: unknown) => {
        console.warn('[Varys] settings load failed:', err);
        /* switcher shows — */
      });
  };

  // Load provider info + current chat model + zoo on mount
  useEffect(() => {
    apiClient
      .healthCheck()
      .catch(() => { /* server not ready yet */ });

    loadModelSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-collapse long messages once they finish streaming
  useEffect(() => {
    setCollapsedMsgs(prev => {
      const next = new Set(prev);
      messages.forEach(m => {
        const collapsible = ['user', 'assistant', 'code-review'].includes(m.role);
        const isLong = (m.content?.length ?? 0) >= COLLAPSE_THRESHOLD;
        const isStreaming = m.id === activeStreamId;
        if (collapsible && isLong && !isStreaming && !next.has(m.id)) {
          next.add(m.id);
        }
      });
      return next;
    });
  }, [messages, activeStreamId]);

  const addMessage = (
    role: Message['role'],
    content: string,
    extraProps?: string | Partial<Omit<Message, 'id' | 'role' | 'content' | 'timestamp'>>
  ): void => {
    const id = generateId();
    const extra: Partial<Message> = typeof extraProps === 'string'
      ? { displayContent: extraProps }
      : (extraProps ?? {});
    setMessages(prev => [
      ...prev,
      { id, role, content, timestamp: new Date(), ...extra }
    ]);
  };

  const addMessageWithChip = (
    role: Message['role'],
    content: string,
    displayContent?: string,
    contextChipData?: { label: string; preview: string },
  ): void => {
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
  const handleSendRef = useRef<((text: string, displayText?: string, skipAdvisory?: boolean) => Promise<void>) | null>(null);
  /** Mirror of messages kept in a ref so the notebook-switch handler can read
   *  the current value synchronously (React state is async). */
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Persist token usage immediately when it changes for the active thread ──
  // The debounced message-save fires 1.5 s after any message change, so if the
  // user refreshes before that timer fires the last token count would be lost.
  // This effect listens to `threads` (which is updated every time tokenUsage
  // accumulates) and writes the thread to disk right away so the counter
  // survives hard reloads and notebook switches.
  //
  // It is placed AFTER the messagesRef sync above so messagesRef.current is
  // already up-to-date when the save reads it (React fires effects in hook-
  // definition order within the same render cycle).
  const _savedTokenRef = useRef<{ input: number; output: number } | undefined>(undefined);
  useEffect(() => {
    const tid    = currentThreadIdRef.current;
    const nbPath = currentNotebookPathRef.current;
    if (!tid || !nbPath) return;
    const usage = threads.find(t => t.id === tid)?.tokenUsage;
    if (!usage || (usage.input === 0 && usage.output === 0)) return;
    const prev = _savedTokenRef.current;
    if (prev && prev.input === usage.input && prev.output === usage.output) return;
    _savedTokenRef.current = { ...usage };
    const tName = threadsRef.current.find(t => t.id === tid)?.name ?? 'Thread';
    void _saveThread(tid, tName, messagesRef.current, nbPath);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  /** Holds the hidden LLM context that will be prepended on the next send. */
  const contextPrefixRef = useRef<string>('');
  /** Visible chip above the textarea showing what code context is attached. */
  const [contextChip, setContextChip] = useState<{ label: string; preview: string } | null>(null);
  /** Whether the chip preview is expanded in the input area. */
  const [chipExpanded, setChipExpanded] = useState(false);
  /** A specific output the user selected via the output overlay (right-click). */
  const selectedOutputRef = useRef<ExternalMessage['selectedOutput'] | null>(null);

  useEffect(() => {
    setExternalMessageListener(({ text, autoSend, openTags, displayText, contextPrefix, contextChip: chip, selectedOutput }) => {
      if (openTags) {
        setShowTags(true);
        return;
      }
      // Store the hidden LLM context prefix and its visible chip representation.
      contextPrefixRef.current = contextPrefix ?? '';
      setContextChip(chip ?? null);
      setChipExpanded(false);
      selectedOutputRef.current = selectedOutput ?? null;
      setInput(text);
      if (autoSend && handleSendRef.current) {
        setTimeout(() => handleSendRef.current?.(text, displayText), 0);
      }
    });
    return () => setExternalMessageListener(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Send handler
  // -------------------------------------------------------------------------

  const handleSend = async (
    overrideText?: string,
    displayText?: string,
    skipAdvisory = false,
  ): Promise<void> => {
    const typedText = (overrideText ?? input).trim();
    if (!typedText || isLoading) return;
    if (!chatProvider) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant' as const,
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
    const bubbleDisplay = displayText ?? (prefix ? typedText : undefined);

    // ── Slash-command parsing ────────────────────────────────────────────
    // If the input starts with a /command, extract it and use the remainder
    // as the actual user message sent to the LLM.
    const parsed = parseSlashCommand(rawInput);
    let slashCommand: string | undefined;
    let message: string;

    if (parsed) {
      // Check if it is a built-in command
      const knownBuiltin = commands.find(
        c => c.type === 'builtin' && c.command === parsed.command
      );
      if (knownBuiltin) {
        setInput('');
        setActiveCommand(null);
        setShowCmdPopup(false);

        // /index [path]: route to the RAG index flow (async).
        // No path → index the whole knowledge folder (backend defaults to it).
        if (parsed.command === '/index') {
          await handleIndexCommand(parsed.rest?.trim() ?? '');
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
          message      = parsed.rest.trim();
          // Don't return early — fall through to the main task flow below.
        } else if (parsed.command === '/chat' && parsed.rest) {
          // /chat <message>: force advisory/chat mode for this single request.
          // The backend skips tool-use and streams a plain markdown answer.
          slashCommand = '/chat';
          message      = parsed.rest.trim();
          // Don't return early — fall through to the main task flow below.
        } else {
          // All other built-ins (including no-arg /ask, /index, /rag)
          handleBuiltinCommand(parsed.command);
          return;
        }
      } else {
        // Check if it's a known skill command
        const knownSkill = commands.find(
          c => c.type === 'skill' && c.command === parsed.command
        );
        if (!knownSkill) {
          // Unknown command — reject immediately, do not send to LLM
          addMessage('system',
            `Unknown command \`${parsed.command}\`. ` +
            `Type \`/help\` to see all available commands, or check **Settings → Skills** to import skill commands.`
          );
          setInput('');
          return;
        }
        slashCommand = parsed.command;
        message      = parsed.rest || rawInput;
      }
    } else {
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
    const effectiveCellMode = notebookAware ? cellMode : 'chat';
    if (
      !skipAdvisory &&
      !slashCommand &&
      effectiveCellMode === 'auto' &&
      !chip &&
      !selectedOutputRef.current &&
      looksAdvisory(typedText, advisoryPhrases)
    ) {
      setInput('');
      const disambigId = generateId();
      setMessages(prev => [...prev, {
        id: disambigId,
        role: 'disambiguation',
        content: typedText,   // store original typed text for re-send
        timestamp: new Date(),
      }]);
      return;
    }

    // Capture conversation history BEFORE adding the new user message.
    // We only include user/assistant turns (not system/warning/report/code-review),
    // and cap at the last 6 turns (3 exchanges) to limit token usage.
    const MAX_HISTORY_TURNS = 6;

    // Build a cellId-prefix → current 1-based position map so we can rewrite
    // any stale "#N [id:X]" references that appear in older history turns.
    const idPrefixToCurrentNum = new Map<string, number>();
    const freshCtx = notebookReader.getFullContext();
    if (freshCtx) {
      for (const c of freshCtx.cells) {
        if (c.cellId) {
          const prefix = c.cellId.split('-')[0];
          idPrefixToCurrentNum.set(prefix, c.index + 1);  // 1-based
        }
      }
    }

    const chatHistory: ChatTurn[] = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-MAX_HISTORY_TURNS)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: translateCellRefs(m.content, idPrefixToCurrentNum),
      }));

    setInput('');
    // Show the raw input in the user bubble; if a short display label was
    // provided (e.g. from a context-menu action), show that instead so the
    // chat isn't cluttered with large code blocks.
    addMessageWithChip('user', rawInput, bubbleDisplay, chip ?? undefined);
    setIsLoading(true);
    setProgressText('Reading notebook context...');

    let progressTimer: ReturnType<typeof setInterval> | undefined;

    try {
      const context = notebookReader.getFullContext();
      if (!context) {
        addMessage(
          'system',
          'No active notebook. Please open a notebook first.'
        );
        return;
      }

      // ── Attach selected output (from right-click output overlay) ─────
      if (selectedOutputRef.current) {
        context.selectedOutput = selectedOutputRef.current;
        selectedOutputRef.current = null;  // consume once
      }

      // ── Strip notebook cells when this thread is not notebook-aware ───
      // Keep notebookPath so skills still know which notebook is open,
      // but remove cell content and dataframes to save tokens.
      if (!notebookAware) {
        context.cells      = [];
        context.dataframes = [];
      }

      // ── Enrich context with live DataFrame schemas from kernel ───────
      setProgressText('Inspecting kernel variables…');
      const dataframes = await notebookReader.getDataFrameSchemas();
      if (dataframes.length > 0) {
        context.dataframes = dataframes;
      }

      // ── Resolve @variable_name references in the message ─────────────
      let resolvedVariables: ResolvedVariable[] = [];
      const varRefs = parseVariableRefs(message);
      if (varRefs.length > 0) {
        setProgressText(`Resolving ${varRefs.map(r => '@' + r).join(', ')}…`);
        resolvedVariables = await variableResolver.resolve(message);
        if (resolvedVariables.length > 0) {
          const badges = resolvedVariables.map(v => {
            const s = v.summary;
            if (s.type === 'dataframe') {
              return `📎 @${v.expr} (${s.shape?.[0]?.toLocaleString()}×${s.shape?.[1]})`;
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
        } catch (err: any) {
          addMessage('system', `Report generation failed: ${err?.message ?? err}`);
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
            role: 'assistant' as const,
            content: '',
            timestamp: new Date()
          }]);
          startStreamQueue(streamMsgId);
          streamStarted = true;
        }
      };

      // Helper: append text to the streaming message (or add a new one if no stream)
      const appendToStream = (suffix: string) => {
        if (streamStarted) {
          setMessages(prev => prev.map(m =>
            m.id === streamMsgId ? { ...m, content: m.content + suffix } : m
          ));
        } else {
          addMessage('assistant', suffix);
        }
      };

      // Helper: mark the streaming message as having produced cell operations.
      // This suppresses the "Push code to cell" fallback button.
      const markHadCellOps = (opId: string) => {
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId ? { ...m, hadCellOps: true, operationId: opId } : m
        ));
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

      const response: TaskResponse = await apiClient.executeTaskStreaming(
        {
          message,
          notebookContext: context,
          chatHistory,
          variables: resolvedVariables,
          ...(slashCommand ? { command: slashCommand } : {}),
          cellMode: notebookAware ? cellMode : 'chat',
        },
        // onChunk — explanation text Claude emits before the tool call
        (chunk: string) => {
          ensureStreamStarted();
          // Skip bare "null" tokens the LLM sometimes writes instead of JSON null
          if (chunk.trim() !== 'null') {
            pushToStreamQueue(chunk);
          }
        },
        // onProgress — status label while the tool-call JSON is being generated
        (text: string) => {
          clearInterval(progressTimer);
          setProgressText(text);
        },
        // onJsonDelta — raw partial JSON from the tool call.
        // The LLM preamble text (streamed as 'chunk' events before the tool
        // call) already provides live feedback to the user.  Pushing extracted
        // json_delta content into the bubble causes artefacts ("null", garbled
        // partial JSON) when the LLM returns empty steps.  We keep the extractor
        // running so ensureStreamStarted fires (creating the bubble) but no
        // longer push the extracted characters into the queue.
        (partial: string) => {
          const extractor = jsonExtractorRef.current;
          if (!extractor.headerEmitted) {
            ensureStreamStarted();
            extractor.headerEmitted = true;
          }
          extractor.feed(partial); // keep accumulating but discard output
        },
        abortCtrl.signal,
      );
      clearInterval(progressTimer);
      stopStreamQueue();

      // Strip any stray bare-"null" tokens the LLM appended to its streaming
      // preamble (e.g. writing the JSON keyword literally instead of JSON null).
      // This must run after stopStreamQueue so all queued chunks have been
      // flushed into the message before we clean it.
      if (streamStarted) {
        setMessages(prev => prev.map(m => {
          if (m.id !== streamMsgId) return m;
          const cleaned = (m.content ?? '').replace(/(\s*\bnull\b)+\s*$/g, '').replace(/\s+$/, '');
          return cleaned !== m.content ? { ...m, content: cleaned } : m;
        }));
      }

      // ── Accumulate token usage for the current thread ─────────────────
      if (response.tokenUsage) {
        const tid = currentThreadIdRef.current;
        if (tid) {
          setThreads(prev => prev.map(t => {
            if (t.id !== tid) return t;
            const existing = t.tokenUsage ?? { input: 0, output: 0 };
            return {
              ...t,
              tokenUsage: {
                input:  existing.input  + (response.tokenUsage!.input  || 0),
                output: existing.output + (response.tokenUsage!.output || 0),
              },
            };
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
        const runCompositePipeline = async (
          compositeName: string,
          pipelineSteps: CompositeStep[]
        ): Promise<void> => {
          const masterOpId = `pipeline_${Date.now()}`;
          const allDiffs: DiffInfo[] = [];
          const allOpIds: string[] = [];
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
            if (dfs.length > 0) freshContext.dataframes = dfs;

            try {
              const stepOpId = `${masterOpId}_s${si}`;
              const stepResponse = await apiClient.executeTaskStreaming(
                {
                  message: step.prompt,
                  notebookContext: freshContext,
                  operationId: stepOpId,
                  forceAutoMode: true,
                  chatHistory: [],
                },
                () => { /* suppress inline streaming for pipeline steps */ },
                txt => setProgressText(txt),
              );

              if (stepResponse.steps && stepResponse.steps.length > 0) {
                const { stepIndexMap: sMap, capturedOriginals: sOrig } =
                  await cellEditor.applyOperations(stepResponse.operationId, stepResponse.steps);

                const stepDiffs: DiffInfo[] = stepResponse.steps
                  .filter(s => s.type === 'insert' || s.type === 'modify' || s.type === 'delete')
                  .map((s, k) => ({
                    cellIndex: sMap.get(k) ?? s.cellIndex,
                    opType: s.type as DiffInfo['opType'],
                    cellType: (s.cellType ?? 'code') as DiffInfo['cellType'],
                    original: sOrig.get(k) ?? '',
                    modified: s.type === 'delete' ? '' : (s.content ?? ''),
                    description: s.description,
                  }));

                allDiffs.push(...stepDiffs);
                allOpIds.push(stepResponse.operationId);
                appendToStream(` ✓ (${stepResponse.steps.length} cell(s))`);
              } else {
                appendToStream(` ✓ (no cells)`);
              }
            } catch (err) {
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
            appendToStream(
              `\n\n✅ Pipeline complete — ${allDiffs.length} cell change(s) across ${pipelineSteps.length} steps.\nReview the diff below then Accept or Undo all.`
            );
          } else {
            appendToStream(`\n\n✅ Pipeline complete — no cell changes.`);
          }
        };

        await runCompositePipeline(
          response.compositeName ?? 'pipeline',
          response.compositePlan
        );
        return;
      }

      // ── Manual mode (code-review) ────────────────────────────────────
      if (response.cellInsertionMode === 'manual') {
        const id = generateId();
        setMessages(prev => [...prev, {
          id,
          role: 'code-review',
          content: response.chatResponse ?? response.summary ?? 'Code review complete.',
          timestamp: new Date(),
          codeReviewSteps: response.steps ?? [],
        }]);
        return;
      }

      // ── Chat / advisory mode ─────────────────────────────────────────
      // Use chatResponse when available; fall back to summary so the message
      // is never blank. Always REPLACE (not append) so any ✍/null streaming
      // artefacts from json_delta are wiped out.
      if (response.cellInsertionMode === 'chat') {
        const chatText = (response.chatResponse
          || response.summary
          || 'Done.').replace(/(\s*\bnull\b)+\s*$/g, '').trim();
        if (streamStarted) {
          setMessages(prev => prev.map(m =>
            m.id === streamMsgId
              ? { ...m, content: chatText, isChatOnly: true }
              : m
          ));
        } else {
          addMessage('assistant', chatText, { isChatOnly: true });
        }
        // Show RAG source citations if the response was augmented
        if (response.ragSources && Array.isArray(response.ragSources) && response.ragSources.length > 0) {
          const sources = (response.ragSources as any[])
            .map((s: any, i: number) => {
              const file  = s.source ? s.source.split('/').pop() : 'unknown';
              const loc   = s.cell_idx != null ? `, cell ${s.cell_idx}` : s.page != null ? `, page ${s.page}` : '';
              const score = typeof s.score === 'number' ? ` (score: ${s.score.toFixed(2)})` : '';
              return `${i + 1}. **${file}**${loc}${score}`;
            })
            .join('\n');
          addMessage('system', `📎 **Sources from knowledge base:**\n${sources}`);
        }
        // When the user's "Chat Only" toggle prevented a skill from writing cells,
        // show a gentle advisory note so they know they can switch mode.
        if (response.skillWantedCells) {
          addMessage('system',
            '⚠️ **Chat Only mode is active** — this skill would normally create notebook cells. ' +
            'Switch to **⚡ Auto** or **📝 Document** mode (button next to ✏️) to enable cell writing.'
          );
        }
        return;
      }

      // ── Clarification needed (no tool call) ──────────────────────────
      // Guard against the LLM writing the string "null" instead of JSON null
      const realClarification = response.clarificationNeeded &&
        response.clarificationNeeded !== 'null'
          ? response.clarificationNeeded
          : null;
      if (realClarification) {
        appendToStream(
          streamStarted ? `\n\n${realClarification}` : realClarification
        );
        return;
      }

      if (!response.steps || response.steps.length === 0) {
        // Prefer chatResponse (full LLM answer) when available; otherwise fall
        // back to summary. For streamStarted messages, keep the existing
        // streamed preamble text rather than replacing it — the only thing we
        // need to strip is any stray json_delta artefacts (already prevented
        // above by not pushing ✍ and skipping null).
        const fallback = response.chatResponse
          || response.summary
          || 'Done — no cell changes were required.';
        if (streamStarted) {
          // Do nothing — the streamed preamble is already the correct content.
          // If for some reason the content is empty, fill in the fallback.
          setMessages(prev => prev.map(m => {
            if (m.id !== streamMsgId) return m;
            return m.content?.trim() ? m : { ...m, content: fallback };
          }));
        } else {
          addMessage('assistant', fallback);
        }
        return;
      }

      setProgressText(`Applying ${response.steps.length} operation(s)…`);

      const { stepIndexMap, capturedOriginals } = await cellEditor.applyOperations(
        response.operationId,
        response.steps
      );

      // Execute cells flagged for auto-run
      if (!response.requiresApproval) {
        for (let i = 0; i < response.steps.length; i++) {
          const step = response.steps[i];
          const shouldRun =
            step.type === 'run_cell' ||
            (step.autoExecute === true && step.type !== 'delete');
          if (shouldRun) {
            const notebookIndex = stepIndexMap.get(i) ?? step.cellIndex;
            setProgressText(`Running cell ${notebookIndex}…`);
            try {
              await cellEditor.executeCell(notebookIndex);
            } catch (err) {
              console.warn(`[DSAssistant] auto-execution of cell ${notebookIndex} failed:`, err);
            }
          }
        }
      }

      const affectedIndices = Array.from(stepIndexMap.values());
      const stepSummary = response.steps
        .map(s => `- ${s.description ?? `${s.type} cell at index ${s.cellIndex}`}`)
        .join('\n');

      // ── Auto mode ────────────────────────────────────────────────────
      const isAutoMode =
        response.cellInsertionMode === 'auto' && !response.requiresApproval;

      if (isAutoMode) {
        cellEditor.acceptOperation(response.operationId);
        markHadCellOps(response.operationId);
        appendToStream(`\n\n✓ Done\n\n${stepSummary}`);
        return;
      }

      // ── Build per-cell diff data for the visual diff panel ────────────
      const diffs: DiffInfo[] = response.steps
        .filter(s => s.type === 'insert' || s.type === 'modify' || s.type === 'delete')
        .map((s, i) => {
          const notebookIdx = stepIndexMap.get(i) ?? s.cellIndex;
          const original = capturedOriginals.get(i) ?? '';
          const modified = s.type === 'delete' ? '' : (s.content ?? '');
          return {
            cellIndex: notebookIdx,
            opType: s.type as DiffInfo['opType'],
            cellType: (s.cellType ?? 'code') as DiffInfo['cellType'],
            original,
            modified,
            description: s.description
          };
        });

      // ── Preview mode (default) ────────────────────────────────────────
      const op: PendingOp = {
        operationId: response.operationId,
        cellIndices: affectedIndices,
        steps: response.steps,
        description: response.summary ?? `Created/modified ${response.steps.length} cell(s)`,
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

    } catch (error: unknown) {
      clearInterval(progressTimer);
      // AbortError means the user clicked "Stop" — silently discard
      if (error instanceof Error && error.name === 'AbortError') {
        stopStreamQueue();
        // leave any already-streamed text visible
      } else {
        const msg = error instanceof Error ? error.message : 'Unknown error occurred';
        // If the message already starts with an error indicator (⛔ / ❌ / Error:)
        // don't prefix it again to avoid "Error: ⛔ ..."
        const display = /^(⛔|❌|Error:|error:)/i.test(msg) ? msg : `❌ Error: ${msg}`;
        addMessage('system', display);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setProgressText('');
    }
  };

  // -------------------------------------------------------------------------
  // Accept / Undo handlers
  // -------------------------------------------------------------------------

  // ── Apply an individual code-review fix ────────────────────────────────────
  const handleApplyFix = async (
    msgId: string,
    stepIdx: number,
    step: OperationStep
  ): Promise<void> => {
    const fixOpId = `fix_${msgId}_${stepIdx}`;
    try {
      await cellEditor.applyOperations(fixOpId, [step]);
      cellEditor.acceptOperation(fixOpId);
      setAppliedFixes(prev => {
        const next = new Map(prev);
        const set  = new Set(next.get(msgId) ?? []);
        set.add(stepIdx);
        next.set(msgId, set);
        return next;
      });
    } catch (err) {
      addMessage('system', `Failed to apply fix: ${err instanceof Error ? err.message : err}`);
    }
  };

  const _acceptSingleOrComposite = (op: PendingOp): void => {
    if (op.compositeOpIds) {
      op.compositeOpIds.forEach(id => cellEditor.acceptOperation(id));
    } else {
      cellEditor.acceptOperation(op.operationId);
    }
  };

  const handleAccept = (operationId: string): void => {
    const op = pendingOps.find(o => o.operationId === operationId);
    if (op) _acceptSingleOrComposite(op);
    setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
    addMessage('system', 'Changes accepted.');
  };

  const handleAcceptAndRun = async (operationId: string): Promise<void> => {
    const op = pendingOps.find(o => o.operationId === operationId);
    if (op) _acceptSingleOrComposite(op);
    setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
    if (!op) return;

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
      } catch (err) {
        console.warn(`[DSAssistant] Accept & Run: execution of cell ${idx} failed:`, err);
      }
    }
    addMessage('system', `✓ Done — executed ${codeIndices.length} cell(s).`);
  };

  const handleUndo = (operationId: string): void => {
    const op = pendingOps.find(o => o.operationId === operationId);
    if (op?.compositeOpIds) {
      // Reverse order so later steps (which may have inserted cells) are undone first
      [...op.compositeOpIds].reverse().forEach(id => cellEditor.undoOperation(id));
    } else {
      cellEditor.undoOperation(operationId);
    }
    setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
    addMessage('system', 'Changes undone.');
  };

  const handleApplySelection = (operationId: string, decisions: CellDecision[]): void => {
    cellEditor.partialAcceptOperation(operationId, decisions);
    setPendingOps(prev => prev.filter(o => o.operationId !== operationId));
    const accepted = decisions.filter(d => d.accept).length;
    const rejected = decisions.filter(d => !d.accept).length;
    const hunkNote =
      decisions.some(d => d.finalContent !== undefined)
        ? ' (partial hunk selection applied)'
        : '';
    addMessage('system',
      `Applied: ${accepted} accepted, ${rejected} discarded${hunkNote}.`
    );
  };

  // -------------------------------------------------------------------------
  // Model switcher handler
  // -------------------------------------------------------------------------


  // -------------------------------------------------------------------------
  const handleModelSelect = async (newModel: string): Promise<void> => {
    const prev = chatModel;
    setChatModel(newModel);
    setModelSwitching(true);
    try {
      await apiClient.saveSettings({ [`${chatProvider}_CHAT_MODEL`]: newModel });
    } catch {
      setChatModel(prev);
    } finally {
      setModelSwitching(false);
    }
  };

  // Thread management
  // -------------------------------------------------------------------------

  const handleNewThread = (): void => {
    const t = makeNewThread(`Thread ${threads.length + 1}`);
    // Persist the current thread before switching
    const curId   = currentThreadIdRef.current;
    const curName = threadsRef.current.find(th => th.id === curId)?.name ?? 'Thread';
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

  const handleSwitchThread = (threadId: string): void => {
    if (threadId === currentThreadIdRef.current) return;
    // Save the current thread
    const curId   = currentThreadIdRef.current;
    const curName = threadsRef.current.find(t => t.id === curId)?.name ?? 'Thread';
    void _saveThread(curId, curName, messages);

    const thread = threadsRef.current.find(t => t.id === threadId);
    if (!thread) return;
    setCurrentThreadId(threadId);
    currentThreadIdRef.current = threadId;
    const restored: Message[] = thread.messages.length > 0
      ? thread.messages.map(m => ({
          id: m.id,
          role: m.role as Message['role'],
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
      : [{
          id: `welcome-${threadId}`,
          role: 'system' as const,
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

  const handleRenameThread = async (threadId: string, newName: string): Promise<void> => {
    const updated = threadsRef.current.map(t =>
      t.id === threadId ? { ...t, name: newName } : t
    );
    setThreads(updated);
    threadsRef.current = updated;
    // Save with new name — use live messages for the current thread
    const msgs: Message[] = threadId === currentThreadIdRef.current
      ? messages
      : (updated.find(t => t.id === threadId)?.messages ?? []).map(m => ({
          id: m.id,
          role: m.role as Message['role'],
          content: m.content,
          timestamp: new Date(m.timestamp),
        }));
    void _saveThread(threadId, newName, msgs);
  };

  const handleDuplicateThread = (threadId: string): void => {
    const src = threadsRef.current.find(t => t.id === threadId);
    if (!src) return;
    const copy = makeNewThread(`${src.name} (copy)`);
    copy.messages = src.messages.slice();
    copy.notebookAware = src.notebookAware;
    const updated = [...threadsRef.current, copy];
    setThreads(updated);
    threadsRef.current = updated;
    // Switch to the new duplicate
    const curId   = currentThreadIdRef.current;
    const curName = threadsRef.current.find(t => t.id === curId)?.name ?? 'Thread';
    void _saveThread(curId, curName, messages);
    setCurrentThreadId(copy.id);
    currentThreadIdRef.current = copy.id;
    stopStreamQueue();
    const restored: Message[] = copy.messages.length > 0
      ? copy.messages.map(m => ({
          id: m.id,
          role: m.role as Message['role'],
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
      : [{
          id: `welcome-${copy.id}`,
          role: 'system' as const,
          content: `✨ Duplicated from "${src.name}".`,
          timestamp: new Date(),
        }];
    setMessages(restored);
    setPendingOps([]);
    setAppliedFixes(new Map());
    setProgressText('');
    setActiveStreamId('');
  };

  const handleDeleteThread = async (threadId: string): Promise<void> => {
    if (threadsRef.current.length <= 1) return;
    const updated = threadsRef.current.filter(t => t.id !== threadId);
    setThreads(updated);
    threadsRef.current = updated;
    if (threadId === currentThreadIdRef.current) {
      handleSwitchThread(updated[0].id);
    }
    const nbPath = currentNotebookPathRef.current
      || notebookTracker.currentWidget?.context.path
      || '';
    if (nbPath) {
      try { await apiClient.deleteChatThread(nbPath, threadId); }
      catch (err) { console.warn('[DSAssistant] Could not delete thread:', err); }
    }
  };

  // -------------------------------------------------------------------------
  // Built-in slash command handler
  // -------------------------------------------------------------------------

  const handleBuiltinCommand = (cmd: string): void => {
    switch (cmd) {
      case '/clear':
        handleNewThread();
        break;

      case '/help': {
        const builtins = commands.filter(c => c.type === 'builtin');
        const skills   = commands.filter(c => c.type === 'skill');
        const rows = (arr: SlashCommand[]) =>
          arr.map(c => `  **${c.command}** — ${c.description}`).join('\n');
        const helpText =
          '### Varys Commands\n\n' +
          '**Built-in**\n' + rows(builtins) + '\n\n' +
          (skills.length ? '**Skills**\n' + rows(skills) : '_(No skills installed)_');
        addMessage('assistant', helpText);
        break;
      }

      case '/skills': {
        const skill_cmds = commands.filter(c => c.type === 'skill');
        if (!skill_cmds.length) {
          addMessage('system', 'No skill commands installed. Add skills in Settings → Skills.');
        } else {
          const list = skill_cmds
            .map(c => `  **${c.command}** — ${c.description}`)
            .join('\n');
          addMessage('assistant', '### Available skill commands\n\n' + list);
        }
        break;
      }

      case '/chat':
        // With no args: show usage. With args, handleSend routes to chat flow.
        addMessage('system',
          '### 💬 Chat-only mode\n\n' +
          'Type `/chat <your request>` to get a response **in the chat window only** — no notebook cells will be created or modified, regardless of any skill defaults.\n\n' +
          '**Example:** `/chat Compute the delta diff for this table: …`'
        );
        break;

      case '/ask':
        // With no args: show usage. With args, handleSend routes to RAG flow.
        addMessage('system',
          '### 📚 Knowledge Base Query\n\n' +
          'Type `/ask <your question>` to search indexed documents and get an answer with citations.\n\n' +
          'Run `/index <path>` first to index files into the knowledge base.'
        );
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

  const handleIndexCommand = async (path: string): Promise<void> => {
    const displayPath = path || '.jupyter-assistant/knowledge';
    setIsLoading(true);
    const progressId = generateId();
    setMessages(prev => [...prev, {
      id: progressId,
      role: 'system' as const,
      content: `📂 Indexing **${displayPath}**…`,
      timestamp: new Date()
    }]);
    try {
      const result = await apiClient.ragLearn(path, (msg: string) => {
        setMessages(prev => prev.map(m =>
          m.id === progressId ? { ...m, content: msg } : m
        ));
      }, false, currentNotebookPathRef.current);
      const summary =
        `✅ **Indexing complete** — \`${displayPath}\`\n\n` +
        `- Files found: **${result.total}**\n` +
        `- Indexed: **${result.processed}**\n` +
        `- Skipped (unchanged): **${result.skipped}**\n` +
        (result.errors.length
          ? `- Errors: ${result.errors.map((e: string) => `\n  - ${e}`).join('')}`
          : '');
      setMessages(prev => prev.map(m =>
        m.id === progressId ? { ...m, content: summary } : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === progressId
          ? { ...m, content: `❌ Indexing failed: ${err.message}` }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRagStatus = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const status = await apiClient.ragStatus(currentNotebookPathRef.current);
      if (!status.available) {
        addMessage('system',
          '⚠️ **RAG not available**\n\n' +
          (status.hint || 'Install with: `pip install chromadb sentence-transformers`')
        );
        return;
      }
      const fileList = status.files.length
        ? status.files.slice(0, 20).map((f: string) => `- \`${f.split('/').pop()}\``).join('\n') +
          (status.files.length > 20 ? `\n- _...and ${status.files.length - 20} more_` : '')
        : '_No files indexed yet_';
      addMessage('assistant',
        `### 📚 Knowledge Base Status\n\n` +
        `- **Total chunks**: ${status.total_chunks}\n` +
        `- **Indexed files**: ${status.indexed_files}\n\n` +
        `**Files:**\n${fileList}\n\n` +
        `Drop documents in \`.jupyter-assistant/knowledge/\` and run \`/index\` to index them.`
      );
    } catch (err: any) {
      addMessage('system', `❌ Could not get RAG status: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep the ref pointing at the latest handleSend so the external-message
  // listener can invoke it without capturing a stale closure.
  useEffect(() => { handleSendRef.current = handleSend; });

  // Stop the current streaming request when the user clicks the stop button.
  const handleStop = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // -------------------------------------------------------------------------
  // Keyboard handler - Enter to send, Shift+Enter for newline
  // -------------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (showSettings) {
    return (
      <div className="ds-assistant-sidebar">
        <div className="ds-assistant-header">
          <span className="ds-assistant-title"><span className="ds-varys-spider">🕷️</span> Varys — Settings</span>
          <button
            className="ds-settings-close-btn"
            onClick={() => setShowSettings(false)}
            title="Back to chat"
          >✕</button>
        </div>
        <SettingsPanel
          apiClient={apiClient}
          onClose={() => { setShowSettings(false); loadModelSettings(); }}
          onSaved={loadModelSettings}
          notebookPath={currentNotebookPath}
        />
      </div>
    );
  }

  if (showRepro) {
    return (
      <div className="ds-assistant-sidebar">
        <div className="ds-assistant-header">
          <span className="ds-assistant-title"><span className="ds-varys-spider">🕷️</span> Varys — Reproducibility</span>
          <button
            className="ds-settings-close-btn"
            onClick={() => setShowRepro(false)}
            title="Back to chat"
          >✕</button>
        </div>
        <ReproPanel
          apiClient={apiClient}
          cellEditor={cellEditor}
          notebookReader={notebookReader}
        />
      </div>
    );
  }

  if (showTags) {
    return (
      <div className="ds-assistant-sidebar">
        <div className="ds-assistant-header">
          <span className="ds-assistant-title"><span className="ds-varys-spider">🕷️</span> Varys — Tags</span>
          <button
            className="ds-settings-close-btn"
            onClick={() => setShowTags(false)}
            title="Back to chat"
          >✕</button>
        </div>
        <TagsPanel notebookTracker={notebookTracker} />
      </div>
    );
  }

  return (
    <div className={`ds-assistant-sidebar ds-chat-${chatTheme}`}>
      {/* Header */}
      <div className="ds-assistant-header">
        <span className="ds-assistant-title"><span className="ds-varys-spider">🕷️</span> Varys</span>
        <button
          className="ds-tags-panel-btn"
          onClick={() => setShowTags(true)}
          data-tip="Cell Tags & Metadata"
        >🏷️</button>
        <button
          className="ds-repro-shield-btn"
          onClick={() => setShowRepro(true)}
          data-tip="Reproducibility Guardian"
        >🛡️</button>
        <button
          className="ds-theme-toggle-btn"
          onClick={toggleChatTheme}
          data-tip={chatTheme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
          aria-label={chatTheme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
        >{chatTheme === 'day' ? '🌙' : '☀️'}</button>
        <button
          className="ds-wiki-help-btn"
          onClick={() => window.open('https://github.com/jmlb/varys#readme', '_blank')}
          data-tip="Open documentation"
        >?</button>
        <button
          className="ds-settings-gear-btn"
          onClick={() => setShowSettings(true)}
          data-tip="Settings"
        >⚙</button>
      </div>

      {/* Thread bar */}
      <ThreadBar
        threads={threads}
        currentId={currentThreadId}
        notebookName={currentNotebookPath
          ? currentNotebookPath.split('/').pop()?.replace(/\.ipynb$/, '') ?? ''
          : ''}
        onSwitch={handleSwitchThread}
        onNew={handleNewThread}
        onRename={(id, name) => void handleRenameThread(id, name)}
        onDuplicate={handleDuplicateThread}
        onDelete={(id) => void handleDeleteThread(id)}
      />

      {/* Message list */}
      <div
        className="ds-assistant-messages"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          const btn = (e.target as Element).closest('.ds-copy-code-btn');
          if (!btn) return;
          const code = btn.closest('.ds-code-block-wrapper')
            ?.querySelector('code')?.textContent ?? '';
          void navigator.clipboard.writeText(code).then(() => {
            btn.textContent = '✓ Copied';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
          });
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`ds-assistant-message ds-assistant-message-${msg.role}`}
          >
            {msg.role === 'disambiguation' ? (
              /* ── Disambiguation card ───────────────────────────── */
              <DisambiguationCard
                originalMessage={msg.content}
                msgId={msg.id}
                onChoice={(mode, id) => {
                  // Remove the disambiguation message
                  setMessages(prev => prev.filter(m => m.id !== id));
                  if (mode === 'chat') {
                    // Re-send with /chat prefix so the backend uses advisory mode
                    void handleSend(`/chat ${msg.content}`, msg.content, true);
                  } else {
                    // Re-send plain — skip the advisory check this time
                    void handleSend(msg.content, undefined, true);
                  }
                }}
              />
            ) : msg.role === 'report' && msg.reportMeta ? (
              <div className="ds-report-card">
                <div className="ds-report-card-header">
                  <span className="ds-report-card-icon">📄</span>
                  <span className="ds-report-card-title">Report ready</span>
                </div>
                <div className="ds-report-card-filename">{msg.reportMeta.filename}</div>
                <div className="ds-report-card-stats">
                  <span>{msg.reportMeta.wordCount.toLocaleString()} words</span>
                  <span>·</span>
                  <span>{msg.reportMeta.imagesCount} image{msg.reportMeta.imagesCount !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{msg.reportMeta.stats.total} cells</span>
                </div>
                <a
                  className="ds-report-card-download"
                  href={`${window.location.origin}/files/${msg.reportMeta.relativePath}`}
                  target="_blank"
                  rel="noreferrer"
                  download={msg.reportMeta.filename}
                >📥 Download report</a>
              </div>
            ) : msg.role === 'code-review' ? (
              /* ── Code-review message ──────────────────────────────────── */
              <div className={`ds-code-review-message ds-msg-collapsible-wrap${collapsedMsgs.has(msg.id) ? ' ds-msg-collapsed' : ''}`}>
                {collapsedMsgs.has(msg.id) && <div className="ds-msg-fade" aria-hidden="true" />}
                <div
                  className="ds-assistant-message-content ds-markdown"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                {msg.codeReviewSteps && msg.codeReviewSteps.length > 0 && (
                  <div className="ds-fix-panel">
                    <div className="ds-fix-panel-header">
                      🔧 Available Fixes ({msg.codeReviewSteps.length})
                    </div>
                    {msg.codeReviewSteps.map((step, i) => {
                      const applied = appliedFixes.get(msg.id)?.has(i) ?? false;
                      return (
                        <div
                          key={i}
                          className={`ds-fix-card${applied ? ' ds-fix-card--applied' : ''}`}
                        >
                          <div className="ds-fix-card-desc">
                            {step.description ?? `Fix for cell ${step.cellIndex}`}
                          </div>
                          <details className="ds-fix-card-toggle">
                            <summary>View code</summary>
                            <pre className="ds-fix-card-code">{step.content}</pre>
                          </details>
                          <button
                            className="ds-fix-card-btn"
                            disabled={applied}
                            onClick={() => handleApplyFix(msg.id, i, step)}
                          >
                            {applied ? '✓ Applied' : 'Apply Fix'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(msg.content?.length ?? 0) >= COLLAPSE_THRESHOLD && (
                  <button
                    className="ds-msg-toggle-btn"
                    title={collapsedMsgs.has(msg.id) ? 'Expand' : 'Collapse'}
                    onClick={() => toggleCollapse(msg.id)}
                  >
                    {collapsedMsgs.has(msg.id) ? '⌄' : '⌃'}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* ── Top toolbar (assistant only, hidden while streaming) ── */}
                {(() => {
                  if (msg.role !== 'assistant' || msg.id === activeStreamId) return null;
                  const codeBlocks = extractCodeBlocks(msg.content);
                  const hasCode    = codeBlocks.length > 0;
                  const allCode    = hasCode ? codeBlocks.join('\n\n') : '';
                  const showPush   = !msg.hadCellOps && !!(msg.content?.trim());
                  const isLong     = (msg.content?.length ?? 0) >= COLLAPSE_THRESHOLD;
                  return (
                    <div className="ds-bubble-toolbar">
                      {/* All icons on the right: push · copy · expand */}
                      <div className="ds-bubble-toolbar-right ds-bubble-toolbar-actions">
                        {showPush && (
                          <button
                            className="ds-bubble-tool-btn"
                            data-tip={hasCode ? 'Push code to new cell' : 'Push response to markdown cell'}
                            onClick={() => {
                              const nb = notebookTracker.currentWidget?.content;
                              const insertIdx = nb
                                ? (nb.activeCellIndex ?? nb.model!.cells.length - 1) + 1
                                : 0;
                              const cellType    = hasCode ? 'code' : 'markdown';
                              const cellContent = hasCode ? allCode : msg.content;
                              void cellEditor.insertCell(insertIdx, cellType, cellContent)
                                .then(() => {
                                  addMessage('system', `✓ ${hasCode ? 'Code' : 'Response'} pushed to new ${cellType} cell at #${insertIdx + 1}.`);
                                });
                            }}
                          >
                            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 2v8M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                        <button
                          className="ds-bubble-tool-btn"
                          data-tip="Copy response"
                          onClick={() => {
                            const text = (msg.displayContent ?? msg.content ?? '').trim();
                            void navigator.clipboard.writeText(text);
                          }}
                        >
                          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="5" y="5" width="8" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M3 11V3a1 1 0 0 1 1-1h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                        {isLong && (
                          <button
                            className="ds-bubble-tool-btn"
                            data-tip={collapsedMsgs.has(msg.id) ? 'Expand' : 'Collapse'}
                            onClick={() => toggleCollapse(msg.id)}
                          >
                            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {collapsedMsgs.has(msg.id)
                                ? <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                : <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              }
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {/* ── User bubble edit toolbar (hover-reveal, position:absolute) ── */}
                {msg.role === 'user' && msg.id !== editingMsgId && !isLoading && (
                  <div className="ds-bubble-toolbar ds-bubble-toolbar-user">
                    <div className="ds-bubble-toolbar-left" />
                    <div className="ds-bubble-toolbar-right">
                      <button
                        className="ds-bubble-tool-btn"
                        data-tip="Edit and resend"
                        onClick={() => {
                          setEditingMsgId(msg.id);
                          setEditingText((msg.content ?? '').trim());
                        }}
                      >
                        {/* Pencil icon */}
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                          <path d="M9.5 4.5l2 2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                {/* ── Bubble content ── */}
                {(() => {
                  const isStreaming = msg.id === activeStreamId;
                  const isLong = (msg.content?.length ?? 0) >= COLLAPSE_THRESHOLD;
                  const collapsed = !isStreaming && isLong && collapsedMsgs.has(msg.id);

                  // Inline editor for user messages
                  if (msg.role === 'user' && msg.id === editingMsgId) {
                    return (
                      <div className="ds-msg-edit-wrap">
                        <textarea
                          className="ds-msg-edit-textarea"
                          value={editingText}
                          autoFocus
                          onChange={e => setEditingText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') setEditingMsgId(null);
                          }}
                        />
                        <div className="ds-msg-edit-actions">
                          <button
                            className="ds-msg-edit-send"
                            disabled={!editingText.trim()}
                            onClick={() => {
                              const text = editingText.trim();
                              setEditingMsgId(null);
                              // Remove edited message and everything after it
                              setMessages(prev => {
                                const idx = prev.findIndex(m => m.id === msg.id);
                                return idx >= 0 ? prev.slice(0, idx) : prev;
                              });
                              void handleSend(text);
                            }}
                          >Send</button>
                          <button
                            className="ds-msg-edit-cancel"
                            onClick={() => setEditingMsgId(null)}
                          >Cancel</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className={`ds-msg-collapsible-wrap${collapsed ? ' ds-msg-collapsed' : ''}`}>
                      {msg.role === 'user' ? (
                        <div className="ds-assistant-message-content">
                          {(msg.displayContent ?? msg.content).trim()}
                        </div>
                      ) : (
                        <div
                          className="ds-assistant-message-content ds-markdown"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown((msg.displayContent ?? msg.content).replace(/[\r\n\s]+$/, '')) }}
                        />
                      )}
                      {msg.role === 'user' && msg.contextChip && (
                        <ContextChipBubble chip={msg.contextChip} />
                      )}
                      {isStreaming && (
                        <span className="ds-typing-cursor" aria-hidden="true"><span /></span>
                      )}
                      {collapsed && <div className="ds-msg-fade" aria-hidden="true" />}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        ))}

        {isLoading && progressText && !activeStreamId && (
          <div className="ds-assistant-message ds-assistant-message-system">
            <span className="ds-assistant-loading">
              {progressText}
              <span className="ds-thinking-dots" aria-hidden="true">
                <span /><span /><span />
              </span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending operations — visual diff view */}
      {pendingOps.length > 0 && (
        <div className="ds-assistant-pending-ops">
          {pendingOps.map(op => (
            <DiffView
              key={op.operationId}
              operationId={op.operationId}
              description={op.description}
              diffs={op.diffs}
              hasCodeCells={op.diffs.some(d => d.cellType === 'code' && d.opType !== 'delete')}
              onAccept={handleAccept}
              onAcceptAndRun={handleAcceptAndRun}
              onUndo={handleUndo}
              onApplySelection={handleApplySelection}
            />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="ds-assistant-input-area">
        {/* Drag handle — drag upward to expand the textarea */}
        <div
          className="ds-input-resize-handle"
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize input"
          aria-label="Resize input area"
        >
          <span className="ds-input-resize-grip" />
        </div>
        {/* Slash-command autocomplete popup */}
        {showCmdPopup && (
          <CommandAutocomplete
            commands={commands}
            query={input}
            onSelect={cmd => {
              if (cmd.type === 'builtin') {
                // Handle built-ins immediately without going to the backend
                handleBuiltinCommand(cmd.command);
                setInput('');
              } else {
                // Fill the input with the command prefix so the user can add args
                setInput(cmd.command + ' ');
                setActiveCommand(cmd);
              }
              setShowCmdPopup(false);
            }}
            onClose={() => setShowCmdPopup(false)}
          />
        )}
        {/* Active command badge */}
        {activeCommand && (
          <div className="ds-cmd-active-badge">
            <span className="ds-cmd-active-name">{activeCommand.command}</span>
            <span className="ds-cmd-active-desc">{activeCommand.description}</span>
            <span
              className="ds-cmd-active-clear"
              onClick={() => {
                setActiveCommand(null);
                setInput('');
              }}
              data-tip="Clear command"
            >✕</span>
          </div>
        )}
        {/* Context chip — shown when "Edit with AI" (or similar) attaches code context */}
        {contextChip && (
          <div className="ds-ctx-chip">
            <span className="ds-ctx-chip-icon">📎</span>
            <span className="ds-ctx-chip-label">{contextChip.label}</span>
            <button
              className="ds-ctx-chip-toggle"
              onClick={() => setChipExpanded(x => !x)}
              data-tip={chipExpanded ? 'Collapse' : 'Expand context'}
              aria-label={chipExpanded ? 'Collapse context' : 'Expand context'}
            >{chipExpanded ? '▲' : '▼'}</button>
            <button
              className="ds-ctx-chip-remove"
              onClick={() => { setContextChip(null); contextPrefixRef.current = ''; }}
              data-tip="Remove context"
              aria-label="Remove context"
            >✕</button>
            {chipExpanded && (
              <pre className="ds-ctx-chip-preview">{contextChip.preview}</pre>
            )}
          </div>
        )}
        {/* @notebook chip + textarea share a relative wrapper so the chip
            can be pinned to the top-left corner of the input box */}
        <div className="ds-input-body">
          <button
            className={`ds-nb-ctx-chip${notebookAware ? ' ds-nb-ctx-chip--on' : ' ds-nb-ctx-chip--off'}`}
            onClick={handleToggleNotebookAware}
            data-tip={notebookAware
              ? 'Notebook included as context — click to exclude'
              : 'Notebook excluded from context — click to include'}
            aria-label={notebookAware ? 'Notebook included' : 'Notebook excluded'}
          >
            @notebook
          </button>
          <textarea
            className="ds-assistant-input"
            value={input}
            style={{ height: inputHeight }}
            onChange={e => {
              const val = e.target.value;
              setInput(val);
              // Show autocomplete when line starts with "/"
              if (val.match(/^\/[\w-]*/)) {
                setShowCmdPopup(true);
              } else {
                setShowCmdPopup(false);
                setActiveCommand(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={contextChip ? `Describe your edit for ${contextChip.label}…` : "Ask Varys… (/command or Enter to send)"}
            disabled={isLoading}
          />
        </div>
        <div className="ds-assistant-input-bottom">
          <ModelSwitcher
            provider={chatProvider}
            model={chatModel}
            zoo={chatZoo}
            saving={modelSwitching}
            onSelect={m => void handleModelSelect(m)}
          />
          {(() => {
            const usage = threads.find(t => t.id === currentThreadId)?.tokenUsage;
            if (!usage || (usage.input === 0 && usage.output === 0)) return null;
            const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
            return (
              <span className="ds-token-counter" data-tip={`In: ${usage.input.toLocaleString()} · Out: ${usage.output.toLocaleString()} tokens`}>
                <span className="ds-token-in">↑{fmt(usage.input)}</span>
                <span className="ds-token-out">↓{fmt(usage.output)}</span>
              </span>
            );
          })()}
          <div className="ds-input-controls">
            <label className="ds-cell-mode-label" data-tip={notebookAware ? CELL_MODE_TITLE[cellMode] : 'Insert to cell: No — notebook context is off'}>
              ToCell:
              <select
                className={`ds-cell-mode-select ds-cell-mode-${notebookAware ? cellMode : 'chat'}`}
                value={notebookAware ? cellMode : 'chat'}
                disabled={!notebookAware}
                onChange={e => {
                  const next = e.target.value as CellMode;
                  setCellMode(next);
                  try { localStorage.setItem('ds-assistant-cell-mode', next); } catch { /* ignore */ }
                }}
              >
                <option value="chat">Never</option>
                <option value="auto">Auto</option>
                <option value="doc">Always</option>
              </select>
            </label>
          </div>
          {isLoading && (
            /* Stop button — circle with a filled square inside */
            <button
              className="ds-assistant-send-btn ds-send-stop"
              onClick={handleStop}
              title="Stop generation"
              aria-label="Stop generation"
            >
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none"
                   xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Lumino widget wrapper
// ---------------------------------------------------------------------------

export class DSAssistantSidebar extends ReactWidget {
  private _props: SidebarProps;

  constructor(props: SidebarProps) {
    super();
    this._props = props;
    this.addClass('jp-ReactWidget');
  }

  /**
   * Send a message into the chat panel.
   * If autoSend is true the message is submitted immediately (e.g. context-menu
   * actions); if false the text is pre-filled so the user can review/edit it.
   */
  sendMessage(
    text: string,
    autoSend = true,
    displayText?: string,
    contextPrefix?: string,
    contextChip?: { label: string; preview: string },
    selectedOutput?: ExternalMessage['selectedOutput'],
  ): void {
    _dispatchExternalMessage({ text, autoSend, displayText, contextPrefix, contextChip, selectedOutput });
  }

  /** Convenience: send a specific notebook output to the chat input. */
  sendOutputToChat(output: import('../outputs/outputOverlay').SelectedOutput): void {
    const chip = { label: output.label, preview: output.preview };
    _dispatchExternalMessage({
      text:           '',
      autoSend:       false,
      contextChip:    chip,
      selectedOutput: output,
    });
  }

  /** Open the Tags & Metadata panel inside the sidebar. */
  openTagsPanel(): void {
    _dispatchExternalMessage({ text: '', autoSend: false, openTags: true });
  }

  render(): JSX.Element {
    return <DSAssistantChat {...this._props} />;
  }
}
