# Using DS Assistant with Ollama (Local Models)

Run the DS Assistant entirely on your own machine — no API costs, no internet
required, your data never leaves your computer.

---

## Why Ollama?

| | Anthropic Claude | Ollama (local) |
|---|---|---|
| Cost | Per-token API fees | Free |
| Privacy | Data sent to Anthropic | Data stays local |
| Internet | Required | Not required |
| Speed | 2–5 s (network) | 1–5 s on GPU, 15–30 s on CPU |
| Quality | Excellent | Good (varies by model) |

You can also **mix providers** — e.g. Claude for the chat assistant (best
reasoning) and Ollama for inline completions (free, low latency).

---

## Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 4 GB | 8 GB+ |
| Disk | 3 GB free | 10 GB+ |
| GPU | Not required | NVIDIA CUDA or Apple Metal (5–10× faster) |
| OS | Linux / macOS / Windows | — |

---

## Step 1 — Install Ollama

### Linux / macOS
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download and run the installer from **https://ollama.ai/download**.

### Verify the install
```bash
ollama --version
```

---

## Step 2 — Start the Ollama server

```bash
ollama serve
```

Ollama listens on `http://localhost:11434` by default.

> **Already running?**
> If you see `Error: listen tcp 127.0.0.1:11434: bind: address already in use`,
> a previous instance is still running — that is fine, skip this step.

Verify the server is up:
```bash
curl http://localhost:11434/api/tags
# Expected: {"models":[...]}
```

---

## Step 3 — Pull a model

Choose based on your available RAM / VRAM:

```bash
# ~1 GB  — lightest, fastest inline completions
ollama pull qwen2.5-coder:1.5b

# ~3 GB  — good balance for CPU-only machines
ollama pull qwen2.5-coder:3b-instruct

# ~5 GB  — recommended for GPU users  ← default
ollama pull qwen2.5-coder:7b-instruct

# ~8 GB  — strong reasoning, good for chat
ollama pull codellama:13b-instruct

# ~12 GB — highest quality
ollama pull deepseek-coder-v2:16b
```

Check what is downloaded:
```bash
ollama list
```

> **Tip:** You only need to pull a model once. It is cached on disk.

---

## Step 4 — Pre-warm the model (important)

Ollama stores models on disk but only loads them into memory on the first
request. That first load takes **10–30 seconds** even on a GPU, which will
cause the extension to time out if you skip this step.

**Load the model into memory now:**
```bash
ollama run qwen2.5-coder:7b-instruct "hi"
```

Wait for the response, then verify it is loaded:
```bash
ollama ps
# Expected output:
# NAME                         ID       SIZE   PROCESSOR  UNTIL
# qwen2.5-coder:7b-instruct   dae161   5.2GB  100% GPU   4 minutes from now
```

> **GPU not showing?** See the [GPU troubleshooting](#gpu-not-being-used) section below.

### Keep the model permanently loaded

By default Ollama unloads the model after 5 minutes of inactivity. The
extension sets `keep_alive: 30m` on every request, which resets the timer
with each completion, so the model stays loaded as long as you are actively
using JupyterLab.

To never unload the model at all, set the environment variable before
starting the server:
```bash
export OLLAMA_KEEP_ALIVE=-1
ollama serve
```

---

## Step 5 — Configure `.env`

Open `test-workspace/.env` (or the `.env` in whatever directory you launch
JupyterLab from).

The file has two sections:

### Provider blocks
Define credentials and model names for each provider once.
Update the `OLLAMA_*` lines to match the model you pulled:

```ini
# PROVIDER: OLLAMA
OLLAMA_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5-coder:7b-instruct    # must match `ollama list`
OLLAMA_INLINE_MODEL=qwen2.5-coder:7b-instruct
OLLAMA_MULTILINE_MODEL=qwen2.5-coder:7b-instruct
```

### Task routing
Three lines that decide which provider handles each task.
**This is the only section you ever need to change when switching providers.**

#### All tasks on Ollama (fully local, no API key needed)
```ini
DS_CHAT_PROVIDER=OLLAMA
DS_INLINE_PROVIDER=OLLAMA
DS_MULTILINE_PROVIDER=OLLAMA
```

#### Hybrid — Claude for chat, Ollama for completions
Best of both worlds: Claude's reasoning for complex tasks, Ollama's speed
(and zero cost) for ghost-text completions.
```ini
DS_CHAT_PROVIDER=ANTHROPIC
DS_INLINE_PROVIDER=OLLAMA
DS_MULTILINE_PROVIDER=OLLAMA
```

#### All tasks on Anthropic (original behaviour)
```ini
DS_CHAT_PROVIDER=ANTHROPIC
DS_INLINE_PROVIDER=ANTHROPIC
DS_MULTILINE_PROVIDER=ANTHROPIC
```

> **Note:** `ANTHROPIC_API_KEY` is only required if at least one task is
> routed to `ANTHROPIC`. If everything uses `OLLAMA` you can leave it empty.

---

## Step 6 — Restart JupyterLab

```bash
cd test-workspace
jupyter lab --port=4000
```

After the browser loads, check the **DS Assistant sidebar header**:

- **🖥 Ollama** (green badge) — Ollama is active for the chat task
- **☁ Claude** (blue badge) — Anthropic is active
- **☁ chat · 🖥 ↹** — Hybrid mode (different providers per task)

Hovering over the badge shows the exact provider and model for each task.

---

## Step 7 — Test it

Open `test-notebook.ipynb` in JupyterLab, then type in the DS Assistant chat:

```
Create a markdown cell at the top summarising what this notebook does
```

A response from the local model should appear within 5–10 seconds on GPU,
or 20–60 seconds on CPU.

For inline completion, start typing in a code cell (e.g. `df.`) and wait
~2 seconds for the ghost-text suggestion to appear.

---

## Complete `.env` example

```ini
# =============================================================================
# DS Assistant — Configuration
# =============================================================================

# PROVIDER: ANTHROPIC
ANTHROPIC_API_KEY=sk-ant-...        # leave empty if not using Anthropic
ANTHROPIC_CHAT_MODEL=claude-sonnet-4-6
ANTHROPIC_INLINE_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_MULTILINE_MODEL=claude-sonnet-4-6

# PROVIDER: OLLAMA
OLLAMA_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5-coder:7b-instruct
OLLAMA_INLINE_MODEL=qwen2.5-coder:7b-instruct
OLLAMA_MULTILINE_MODEL=qwen2.5-coder:7b-instruct

# TASK ROUTING  ← change these 3 lines to switch providers
DS_CHAT_PROVIDER=OLLAMA
DS_INLINE_PROVIDER=OLLAMA
DS_MULTILINE_PROVIDER=OLLAMA
```

---

## Model selection guide

### Chat assistant (task planning, cell creation)

Accuracy matters more than speed here.

| Model | VRAM / RAM | Quality | Speed (GPU) |
|---|---|---|---|
| `deepseek-coder-v2:16b` | 12 GB | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| `codellama:13b-instruct` | 8 GB | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| `qwen2.5-coder:7b-instruct` | 5 GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `qwen2.5-coder:3b-instruct` | 3 GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### Inline / multiline completion (ghost-text as you type)

Speed matters most here. A lighter model gives faster suggestions.

| Model | VRAM / RAM | Quality | Speed (GPU) |
|---|---|---|---|
| `qwen2.5-coder:7b-instruct` | 5 GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `qwen2.5-coder:3b-instruct` | 3 GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `qwen2.5-coder:1.5b` | 1 GB | ⭐⭐ | ⭐⭐⭐⭐⭐ |

> **Tip for GPU users:** You can use `7b` for everything — it is fast enough
> on GPU for both chat and completions. Only drop to `1.5b` if you are on CPU
> and inline completions time out.

---

## Troubleshooting

### Completions time out

**Symptom:** Server logs show repeated `Ollama complete [inline] TIMEOUT`.

This means Ollama received the request but did not respond in time. The most
common cause is the model not being loaded into memory yet.

**Fix:**
```bash
# Pre-warm the model (loads it into GPU/RAM)
ollama run qwen2.5-coder:7b-instruct "hi"

# Verify it is loaded
ollama ps
```

If `ollama ps` shows the model is loaded but timeouts persist, your GPU may
not be in use — see [GPU not being used](#gpu-not-being-used) below.

---

### GPU not being used

**Symptom:** `ollama ps` shows `100% CPU` instead of `100% GPU`, or the
`PROCESSOR` column is missing.

**Check available VRAM:**
```bash
nvidia-smi --query-gpu=memory.total,memory.free --format=csv
```

If free VRAM is less than the model size (e.g. < 5 GB for a 7b model),
Ollama falls back to CPU automatically. Options:

- Use a smaller model that fits in VRAM (`1.5b` needs ~1 GB, `3b` needs ~3 GB)
- Free VRAM by closing other GPU applications
- Switch to CPU-friendly models and accept slower completions

**Ollama started before CUDA was ready:**
```bash
pkill ollama
ollama serve
# Then pre-warm again
ollama run qwen2.5-coder:7b-instruct "hi"
```

**Verify GPU is being used:**
```bash
# In one terminal, watch GPU memory
watch -n1 nvidia-smi

# In another, send a request
ollama run qwen2.5-coder:7b-instruct "write a python function"
# GPU memory usage should spike during the response
```

---

### "Cannot reach Ollama server"

The extension cannot connect to `http://localhost:11434`.

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

If Ollama is on a different machine or port, update `.env`:
```ini
OLLAMA_URL=http://192.168.1.10:11434
```

---

### "Model not found" / blank responses

The model name in `.env` does not exactly match what is installed.

```bash
# List installed models — use the exact NAME shown here
ollama list

# Pull if missing
ollama pull qwen2.5-coder:7b-instruct
```

Copy the name from `ollama list` exactly (including the tag) into
`OLLAMA_CHAT_MODEL`, `OLLAMA_INLINE_MODEL`, `OLLAMA_MULTILINE_MODEL` in
`.env`, then restart JupyterLab.

---

### Out of memory / Ollama crashes

```bash
# Check available RAM
free -h

# Check VRAM
nvidia-smi

# Switch to a smaller model
ollama pull qwen2.5-coder:1.5b
```

Update the model name in `.env` and restart JupyterLab.

---

### Sidebar badge still shows "☁ Claude" after switching to Ollama

`.env` is read only at JupyterLab startup. Stop and restart:

```bash
# Ctrl+C to stop, then:
jupyter lab --port=4000
```

Hard-refresh the browser (`Ctrl+Shift+R`) if the badge still does not update.

---

### Verify which provider is active

```bash
# Health endpoint — shows per-task provider routing
curl -s http://localhost:4000/ds-assistant/health | python3 -m json.tool
```

Expected output for a hybrid setup:
```json
{
  "status": "ok",
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "providers": {
    "chat":      { "provider": "anthropic", "model": "claude-sonnet-4-6" },
    "inline":    { "provider": "ollama",    "model": "qwen2.5-coder:7b-instruct" },
    "multiline": { "provider": "ollama",    "model": "qwen2.5-coder:7b-instruct" }
  }
}
```

Ollama-specific endpoints:
```bash
# Is the Ollama server reachable?
curl -s http://localhost:4000/ds-assistant/ollama/health

# Which models are downloaded?
curl -s http://localhost:4000/ds-assistant/ollama/models

# Is the ollama CLI installed?
curl -s http://localhost:4000/ds-assistant/ollama/check-install
```

---

### Read the server logs

All Ollama activity is logged to the terminal where JupyterLab is running.
Look for lines like:

```
DS Assistant factory: task=inline  provider=ollama  model=qwen2.5-coder:7b-instruct
Ollama complete [inline] → model=qwen2.5-coder:7b-instruct  prefix='df.'
Ollama complete [inline] ← model=qwen2.5-coder:7b-instruct  suggestion='head()'  eval_count=4  eval_duration_ms=312
```

If you see `TIMEOUT` instead of a `←` response line, the model is not loaded
or the GPU is not being used — follow the steps above.
