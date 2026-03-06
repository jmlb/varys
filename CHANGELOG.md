# Changelog

All notable changes to Varys are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.2.0] — New Release

### New Features

#### MCP (Model Context Protocol) support
- Connect any MCP-compatible server (e.g. filesystem, databases, custom APIs) through the Settings → MCP tab
- Python-native **Sequential Thinking** built-in tool — mirrors the official MCP sequential-thinking server schema without requiring Node.js; drives a multi-turn reasoning loop inside the Anthropic provider
- `MCPManager` singleton owns all server connections at startup; tools are injected into every agentic call automatically

#### Stable cell identity system
- Each notebook cell is tagged with a persistent UUID on first interaction
- Cell references survive cell insertion/deletion; no more off-by-one errors when the LLM refers to "cell #N"
- History is translated at send-time so all prior messages use the current cell numbering

#### Tags panel with built-in presets
- New **Tags** tab groups notebook cells by tag
- Ships with curated presets (EDA, modelling, data cleaning, …) that can be applied in one click

#### Skills — persona override
- A skill file can now include a `persona:` key that replaces the global system-prompt persona for that invocation
- Bundled `python_expert` skill included as a reference

#### Thread management
- Duplicate and delete threads from the thread list
- Rename guard: rejects names that collide with an existing thread

#### Per-thread notebook-aware toggle
- Each thread remembers whether the notebook context is included; toggling one thread does not affect others

#### AWS Bedrock improvements
- AWS Profile-based auth (`AWS_PROFILE`) — no hard-coded credentials needed
- Lazy credential refresh: catches `ExpiredTokenException` and retries transparently
- Token usage reported from the Converse API response

#### Inline completion
- Token-limit input in the Routing tab (default 128) lets you tune completion length
- Validation on empty provider / key / model fields prevents silent failures

#### Commands tab
- Settings → Commands lists all built-in and skill commands live, sorted alphabetically

---

### UI / UX Improvements

#### Chat bubbles
- **Cursor-style click-to-edit** on user messages — click any sent bubble to edit and re-send in place
- Chat history is correctly truncated at the edited message before re-submitting to the LLM
- User bubble width increased to **70 %** of the chat canvas; code blocks inside use `pre-wrap` instead of horizontal scroll
- Edit textarea auto-sizes to the original bubble height and is visually transparent (matches the bubble)
- Response bubble toolbar moved to the **top** of the bubble, Cursor-style, with a separator line below

#### Streaming
- Character-based adaptive drip replaces token-flush: 8 / 16 / 32 chars per tick depending on buffer depth, giving smooth, readable output at any network speed
- Chat window **auto-scrolls to bottom** on every streamed chunk (instant, not smooth-scroll)
- Reasoning / thinking panel also auto-scrolls as thinking tokens arrive

#### Notebook context chip
- `@notebook` chip redesigned as a Cursor-style `@-mention` pill in the input area
- Shows `context: ✓` / `context: ×` prefix; click toggles inclusion

#### Push-to-cell button
- Styled like a Run button; visibility is mode-gated (hidden in *Never* mode, always shown otherwise)
- `Response To Cell` dropdown replaces the old cycle button; options: Discuss / Auto / Write

#### Visual diff view
- Header, cell count, and hint text now use design tokens (`--ds-surface`, `--ds-text`, `--ds-text-dim`) so they are readable in both day and night modes
- "0 cells" badge and instructional hint are hidden when there are no pending diffs (e.g. advisory-only responses)

#### Cell output overlay
- Regular outputs labelled `[1]`, `[2]`, … and error tracebacks labelled separately
- Error cells show a red `[N] 🔴` badge in the overlay so failures are instantly visible

#### Model switcher
- Smaller font and reduced padding throughout the popup
- Custom tooltips added to all icon buttons in the interface

#### Night-mode design token system
- All component colours migrated from raw `--jp-*` JupyterLab variables to `--ds-*` design tokens
- Tokens are defined once in `.ds-chat-day` / `.ds-chat-night`; per-component night overrides removed
- Reduces night-mode text brightness by ~15 % for better readability at night

---

### Bug Fixes

- **Token spacing** (`"Greatnews"` style output): `_strip_null` in `task.py` was calling `.strip()` on every streamed token, removing the leading space that encodes word boundaries in LLM tokenisers. Fixed to `.rstrip()`.
- **Cell numbering ambiguity**: all prompts, skills, and parsers standardised to 1-based `#N` references; context sent to the LLM uses 0-based index `N-1` internally
- **Disambiguation card** shown even when `notebookAware` is off — fixed
- **Bedrock profile auth** blocking frontend validation — fixed
- **Null / blank artefacts** appearing in chat bubbles from `json_delta` events — fixed
- Night-mode code blocks: removed spurious line highlights
- Ollama `base_url` fallback when `OLLAMA_URL` is an empty string
- `OverloadedError` import guard for newer Anthropic SDK versions

---

### Developer / Ops

- `deploy.sh` targets both `pyrhenv` and `.varys` virtual environments
- Cursor rule added: deploy-and-commit checklist ensuring `varys/labextension/package.json` is always committed with the matching `remoteEntry` hash
- All LLM providers aligned to the same `SYSTEM_PROMPT_TEMPLATE`; Anthropic and Bedrock providers unified

---

## [0.1.0] — baseline

Initial public release as described in the [Medium article](https://jmlbeaujour.medium.com/varys-an-ai-assistant-that-understands-jupyter-notebooks-eb84a3705a77):

- Chat assistant with live DataFrame auto-detection
- Slash-command skill system (`/eda`, `/plot`, `/review`, `/ds-review`, `/annotate`, `/readme`, …)
- Visual diff view (accept / reject proposed notebook edits)
- Inline ghost-text code completion
- RAG knowledge base (`/ask`)
- Reproducibility guardian (`/ds-review`)
- Multi-provider: Anthropic, OpenAI, Google Gemini, Ollama, AWS Bedrock, Azure OpenAI, OpenRouter
- Pre-built webpack bundle — no Node.js required on the user machine
