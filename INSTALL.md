# Varys — Installation

## Requirements

- Python 3.9+
- No Node.js required

---

## Install

### Step 1 — Create a virtual environment

```bash
python3 -m venv .py3env
source .py3env/bin/activate
```

### Step 2 — Install Varys with your LLM provider

Pick **one** of the following:

```bash
# Anthropic (Claude)
pip install "varys[anthropic] @ git+https://github.com/jmlb/varys"

# OpenAI (GPT)
pip install "varys[openai] @ git+https://github.com/jmlb/varys"

# Ollama (local models)
pip install "varys[ollama] @ git+https://github.com/jmlb/varys"

# Everything at once
pip install "varys[all] @ git+https://github.com/jmlb/varys"
```

### Step 3 — Configure

On first launch, open the Varys settings panel (gear icon in the sidebar) and set:

| Key | Example |
|---|---|
| `DS_CHAT_PROVIDER` | `anthropic` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

Settings are saved to `~/.jupyter/varys.env` and persist across projects.

### Step 4 — Launch

```bash
jupyter lab
```

The Varys icon appears in the left sidebar.

---

## Verify installation

```bash
jupyter labextension list   # should show: varys v0.1.0 enabled OK
jupyter server extension list  # should show: varys enabled OK
```

---

## Optional: RAG (knowledge indexing)

```bash
pip install "varys[rag] @ git+https://github.com/jmlb/varys"
# requires: chromadb
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
