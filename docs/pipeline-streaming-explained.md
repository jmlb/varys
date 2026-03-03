# DS Assistant — Chat-to-Cell Pipeline & Streaming Explained

## Why is there a ~10-second gap between the streamed explanation and the cell update?

---

## The Pipeline, Step by Step

### Phase 1 — You hit Send (instant)
The frontend serializes your message + the entire notebook context (all cells) + chat history and POSTs to `/ds-assistant/task`.

### Phase 2 — Backend receives & prepares (~0.1 s)
`task.py` loads skills, reads memory, picks the provider, and opens an SSE (Server-Sent Events) stream back to your browser so text can trickle in.

### Phase 3 — LLM call begins
`stream_plan_task` calls `client.messages.stream(...)` with `tool_choice: "auto"`. Anthropic starts generating tokens.

### Phase 4 — Pre-tool text streams to you (what you see immediately)

```python
async for text in stream.text_stream:   # client.py line 364
    await on_text_chunk(text)           # → SSE "chunk" event → browser → chat bubble
    await asyncio.sleep(0)
```

Claude generates its explanation sentence ("I'll shorten the README cell...") **token by token**.
Each token is flushed immediately to your browser. This part is fast.

### Phase 5 — The ~10-second gap ← root cause

Right after the explanation sentence, Claude **stops emitting text** and starts generating
the `create_operation_plan` tool call. That tool call is a **JSON object containing the full
new content of the cell**.

> **Critical:** The Anthropic streaming SDK does **not** expose the tool-call JSON token by
> token. `stream.text_stream` only yields *text* blocks. The tool-call input JSON is
> accumulated internally until it is complete, then handed back via
> `await stream.get_final_message()`.

So the backend sits silently, waiting for Claude to finish writing potentially thousands of
characters of JSON (the full rewritten cell content). During this time:

- The `_progress_loop` concurrently sends "Analyzing structure…", "Generating plan…" messages
  every ~2 s to fill the silence.
- But no new cell-content tokens appear in the chat window.

### Phase 6 — Plan is complete, operations are applied
Once `get_final_message()` returns, the backend extracts the JSON, wraps it in an SSE `done`
event, and sends it to the frontend. The frontend applies the cell modification and prints
`✓ Done`.

---

## Diagram

```
You send message
       │
       ▼
Backend opens SSE stream to browser
       │
       ▼
Claude generates explanation text
  ← streamed token-by-token via text_stream →
       │
       You see it instantly in the chat window
       │
       ▼
Claude generates tool-call JSON
  (full new cell content, can be 1–3 KB)
  ← BUFFERED INTERNALLY by the SDK, not streamed →
       │
       │  ← this is the ~10s gap
       │  (backend waits at get_final_message())
       │  (progress_loop sends "Analyzing…" etc. every 2s)
       │
       ▼
get_final_message() returns complete JSON
       │
       ▼
Backend sends SSE "done" event with operation plan
       │
       ▼
Frontend modifies the cell + prints "✓ Done"
```

---

## Why can't the tool JSON be streamed too?

Operations must be applied **atomically**. If each JSON field were applied as it arrived
(e.g. `"cellType": "markdown"` before `"content"` was complete), we would have
half-created cells in the notebook. The SDK correctly buffers the entire tool call before
exposing it. This is a fundamental property of function-calling / tool-use APIs.

---

## What Could Reduce the Gap?

| Lever | Effect |
|---|---|
| **Shorter output** | Less JSON for Claude to generate → faster. For "make it shorter", the rewritten cell should be smaller than the original. A ~10s gap suggests the new text is still several hundred words. |
| **Stream `input_json_delta` events** | The raw Anthropic API exposes `input_json_delta` events at the event level. We could parse those and show a live preview of the JSON being written (e.g., "writing cell content: 47 chars…"). Complex but possible — would eliminate the silent gap entirely. |
| **Smaller notebook context** | The full notebook is sent every request. Truncating distant cells reduces prompt size and therefore generation time. |
| **Faster / smaller model** | A smaller model (e.g. `claude-haiku`) generates tokens faster at the cost of quality. |

---

## Relevant Code Locations

| File | What happens there |
|---|---|
| `jupyterlab_ds_assistant/llm/client.py` | `stream_plan_task` — opens the Anthropic stream, drains `text_stream`, calls `get_final_message()` |
| `jupyterlab_ds_assistant/handlers/task.py` | `_on_plan_chunk` flushes chunk SSE events; `_progress_loop` fills the silent gap; sends final `done` event |
| `src/sidebar/SidebarWidget.tsx` | `startStreamQueue` / `setInterval` drain — renders tokens progressively; `appendToStream` appends the final summary to the same message |
| `src/api/client.ts` | `executeTaskStreaming` — opens the `EventSource`, dispatches `chunk` / `progress` / `done` events |
