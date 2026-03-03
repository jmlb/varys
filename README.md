# Varys — AI Data Science Assistant for JupyterLab

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)
[![JupyterLab 4+](https://img.shields.io/badge/JupyterLab-4%2B-orange.svg)](https://jupyter.org/)

**Varys** is an AI-powered data science assistant that lives inside JupyterLab.
Chat with it, ask it to write code, run EDA, generate plots, review your notebook, or complete your code inline — all without leaving the notebook interface.

No Node.js required on the user's machine. No cloud account lock-in. Works with Anthropic, OpenAI, Google, Ollama (local), AWS Bedrock, Azure OpenAI, and OpenRouter.

> [GitHub](https://github.com/jmlb/varys) · [Install guide](INSTALL.md) · MIT License

---

## Highlights

- **Chat assistant** — ask questions, get code, run multi-step notebook operations in natural language
- **Inline code completion** — ghost-text suggestions as you type, powered by any LLM provider
- **Skill system** — composable prompt skills triggered by `/commands` or keywords; ship your own
- **RAG knowledge base** — index PDFs, notebooks, and markdown; query with `/ask`
- **Multi-provider** — Anthropic, OpenAI, Google Gemini, Ollama (local), AWS Bedrock, Azure OpenAI, OpenRouter
- **Reproducibility guardian** — tracks cell execution and surfaces data-leakage and methodology issues
- **No Node.js needed** — pre-built bundle ships with the package; `pip install` is all it takes

---

## Install

Runtime: **Python ≥ 3.9**, **JupyterLab ≥ 4**.

```bash
# Create a virtual environment (recommended)
python3 -m venv .varys
source .varys/bin/activate

# Install with your LLM provider
pip install "varys[anthropic] @ git+https://github.com/jmlb/varys"   # Claude
pip install "varys[openai]    @ git+https://github.com/jmlb/varys"   # GPT
pip install "varys[all]       @ git+https://github.com/jmlb/varys"   # everything
```

Then launch JupyterLab:

```bash
jupyter lab
```

The Varys icon appears in the left sidebar. Open Settings (⚙) to enter your API key and select a model.

Full install guide (Ollama, RAG, upgrade, uninstall): [INSTALL.md](INSTALL.md)

---

## Quick start

```
1. Open a notebook in JupyterLab
2. Click the Varys icon in the left sidebar
3. Set your provider + API key in ⚙ Settings → Routing
4. Start chatting
```

### Example prompts

```
load the CSV and show me the first 5 rows
/eda
/plot scatter of price vs sqft colored by neighborhood
/review
what does cell [3] do?
/ask what preprocessing steps are recommended for this dataset?
```

---

## Slash commands

| Command | Description |
|---|---|
| `/eda` | Run EDA — distribution plots, correlation heatmap, summary statistics |
| `/plot <description>` | Generate a publication-quality visualization |
| `/review` | Static code-quality review: bugs, style, maintainability |
| `/ds-review` | Data-science methodology review: leakage, bias, statistical correctness |
| `/annotate` | Number and title every code cell with a markdown description |
| `/readme` | Generate or update the top-cell README for this notebook |
| `/report` | Generate a downloadable markdown report |
| `/load <file>` | Load a CSV / Excel / JSON as a pandas DataFrame |
| `/generate` | Full pipeline: load → EDA → annotate → README |
| `/unittest` | Generate pytest test cases for notebook cell functions |
| `/ask <query>` | Search the RAG knowledge base and answer using indexed documents |
| `/learn <pref>` | Save a preference or fact to long-term memory |
| `/index [path]` | Index files in `.jupyter-assistant/knowledge/` |
| `/rag` | Show knowledge-base status |
| `/chat <msg>` | Answer in chat only — no notebook cells written |
| `/clear` | Start a new chat thread |
| `/help` | List all available commands |
| `/skills` | List installed skills and their commands |

Skill commands are discovered dynamically — add a skill with a `command:` in its front matter and it appears here automatically.

---

## Providers

| Provider | Extra | API key needed |
|---|---|---|
| **Anthropic** (Claude) | `[anthropic]` | Yes |
| **OpenAI** (GPT / o-series) | `[openai]` | Yes |
| **Google Gemini** | `[openai]`* | Yes |
| **Ollama** (local models) | `[ollama]` | No |
| **AWS Bedrock** | `[all]` | IAM credentials |
| **Azure OpenAI** | `[all]` | Yes |
| **OpenRouter** | `[all]` | Yes |

\* Google uses an OpenAI-compatible endpoint.

Configure each provider in **Settings → Routing**. Keys are stored in `~/.jupyter/varys.env` and never committed to a repo.

---

## Skills

Skills are markdown files with YAML front matter that extend Varys's capabilities. They are injected into the LLM system prompt automatically based on context, keywords, or an explicit `/command`.

```
~/.jupyter-assistant/skills/
    my-skill/
        SKILL.md     ← prompt injected into the LLM
        README.md    ← optional user-facing docs
```

Example `SKILL.md` front matter:

```yaml
---
command: /myskill
description: Does something useful
keywords: [keyword1, keyword2]
---
# Skill instructions here…
```

Bundled skills (ship with Varys): `eda`, `plot`, `review`, `ds-review`, `annotate`, `readme`, `report`, `load`, `generate`, `unittest`, `dataframe-context`, `safe_operations`, `code_style`.

Browse and manage skills in **Settings → Skills**.

---

## Configuration

Settings are stored in `~/.jupyter/varys.env` and hot-reloaded on save — no server restart needed.

```ini
DS_CHAT_PROVIDER=ANTHROPIC
DS_COMPLETION_PROVIDER=OLLAMA
COMPLETION_MAX_TOKENS=128

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6
ANTHROPIC_COMPLETION_MODEL=claude-haiku-4-5

OLLAMA_URL=                          # blank = http://localhost:11434
OLLAMA_COMPLETION_MODEL=qwen2.5-coder:1.5b-instruct
```

All keys can also be set from the Settings panel (⚙) inside JupyterLab.

---

## Optional: Ollama (local models, no API key)

```bash
# Install Ollama (system-wide)
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull qwen2.5-coder:1.5b-instruct   # fast, good for completion
ollama pull qwen2.5-coder:7b-instruct      # higher quality

# Start the server (keep running before launching JupyterLab)
ollama serve
```

In Varys Settings → Routing, set the completion or chat provider to `ollama` and pick your model. Leave `OLLAMA_URL` blank — Varys defaults to `http://localhost:11434`.

---

## Optional: RAG knowledge base

```bash
pip install "varys[rag] @ git+https://github.com/jmlb/varys"
```

Drop PDFs, notebooks, or markdown files into `.jupyter-assistant/knowledge/`, then run `/index` in the chat. Query with `/ask <question>`.

---

## Verify installation

```bash
jupyter labextension list      # varys v0.1.0  enabled  OK
jupyter server extension list  # varys  enabled
```

---

## Upgrade

```bash
pip install --upgrade "varys[all] @ git+https://github.com/jmlb/varys"
```

---

## Uninstall

```bash
pip uninstall varys
```

---

## Development

```bash
git clone https://github.com/jmlb/varys.git
cd varys

python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[all]"

# Frontend (requires Node.js + jlpm)
jlpm install
jupyter labextension build .
jupyter lab
```

After editing Python files, restart the Jupyter server. After editing TypeScript, run `jupyter labextension build .` and hard-refresh the browser.

---

## Project structure

```
varys/
├── varys/                     Python package (server extension)
│   ├── handlers/              Jupyter Server request handlers
│   ├── llm/                   LLM provider adapters (Anthropic, OpenAI, Ollama…)
│   ├── completion/            Inline code completion engine
│   ├── skills/                Skill loader and registry
│   ├── bundled_skills/        Skills shipped with the package
│   └── labextension/          Pre-built frontend bundle
├── src/                       TypeScript / React frontend
│   ├── sidebar/               Main chat + settings UI
│   ├── completion/            Inline completion provider
│   └── api/                   Backend API client
└── style/                     CSS
```

---

## License

MIT — see [LICENSE](LICENSE).

**Author:** Jean-Marc Beaujour · [jmlbeaujour@gmail.com](mailto:jmlbeaujour@gmail.com) · [github.com/jmlb](https://github.com/jmlb)
