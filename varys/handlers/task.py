"""Task handler - processes user messages and returns cell operations."""
import asyncio
import json
import logging
import re as _re
import traceback
import uuid
from pathlib import Path
from typing import List, Tuple
from jupyter_server.base.handlers import JupyterHandler
from tornado.web import authenticated

from ..llm.factory import create_provider
from ..llm.context_utils import build_notebook_context
from ..skills.loader import SkillLoader
from ..memory.manager import MemoryManager
from ..utils.config import get_config as _get_cfg

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# RAG augmentation helper
# ---------------------------------------------------------------------------

async def _rag_augment(
    settings: dict, query: str, notebook_path: str = "", top_k: int = 0
) -> Tuple[str, List[dict]]:
    """Retrieve relevant chunks from the knowledge base for *query*.

    Returns (context_string, sources_list).  Both are empty if RAG is not
    available or the index is empty.
    """
    try:
        from ..rag.manager import RAGManager
        from ..utils.paths import nb_base
        root_dir = settings.get("ds_assistant_root_dir", ".")
        base     = nb_base(root_dir, notebook_path)
        key      = f"ds_assistant_rag_manager:{base}"
        mgr      = settings.get(key)
        if mgr is None:
            mgr = RAGManager(base)
        if not mgr.is_available():
            return "", []
        if top_k == 0:
            top_k = _get_cfg().getint("retrieval", "top_k", 5)
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: mgr.ask(query, top_k=top_k))
        return result.get("context", ""), result.get("chunks", [])
    except Exception as exc:
        log.debug("RAG augment skipped: %s", exc)
        return "", []

# ---------------------------------------------------------------------------
# Advisory-question detector
# ---------------------------------------------------------------------------
# Words/phrases that strongly suggest the user wants a text answer, not a
# cell operation.  When the default "preview" mode is in effect AND the
# message matches, we upgrade to "chat" mode so the response streams.


# ---------------------------------------------------------------------------
# Advisory (chat-mode) prompt — used when a skill declares
# cell_insertion_mode: chat.  The LLM responds with free-form markdown
# instead of a cell-operation JSON plan.
# ---------------------------------------------------------------------------

_ADVISORY_SYSTEM = """\
You are an expert data scientist and technical advisor embedded in JupyterLab.

Your role right now is **advisory**: provide analysis, explanations, recommendations, \
or a review. Do NOT produce cell operations — the user wants to read your response in \
the chat panel.

Guidelines:
- Use markdown formatting (headers, bullets, tables, code snippets where helpful).
- Reference notebook cells by their label #N (e.g. #3, #16).
- Base every claim on the actual cell outputs provided — do not invent results.
- Be concise but thorough. Aim for quality over length.

{skills_section}

{memory_section}
"""


def _build_advisory_system(skills, memory):
    skills_text = ""
    for s in skills:
        skills_text += f"\n### {s['name']}\n{s['content']}\n"
    if not skills_text:
        skills_text = "No specific skills loaded."

    memory_text = memory.strip() or "No memory/preferences recorded yet."
    return _ADVISORY_SYSTEM.format(
        skills_section=skills_text,
        memory_section=memory_text,
    )


def _build_advisory_user(user_message: str, notebook_context: dict) -> str:
    """Build the user-message block for advisory (chat) mode requests."""
    return build_notebook_context(user_message, notebook_context)


# ---------------------------------------------------------------------------
# Manual (code-review) mode helpers
# ---------------------------------------------------------------------------

_MANUAL_REVIEW_SYSTEM = """\
You are an expert Python code reviewer embedded in JupyterLab.

Your task: perform a static analysis of the notebook and return a structured
code-quality review in STRICT JSON format.

## ⚠️ CRITICAL — Response Format

Return ONLY a single valid JSON object — no prose, no markdown wrapper,
no text before or after the JSON.

{{
  "operationId":       "<operation_id from the user message>",
  "cellInsertionMode": "manual",
  "chatResponse":      "<complete markdown review — see format below>",
  "steps": [
    {{
      "type":        "modify",
      "cellIndex":   <int>,
      "cellType":    "code",
      "content":     "<COMPLETE replacement cell content>",
      "description": "<one-line description of this fix>",
      "autoExecute": false
    }}
  ],
  "requiresApproval": false,
  "summary": "Found N code issues (X critical, Y high, ...)"
}}

## chatResponse Format

Write a complete markdown code review with these exact sections:

```
💻 Code Quality Review
Notebook: <filename>
─────────────────────────────────────────

🔴 CRITICAL ISSUES
<findings or "None.">

🟡 HIGH PRIORITY
<findings or "None.">

🟠 MEDIUM PRIORITY
<findings or "None.">

🔵 LOW PRIORITY
<findings or "None.">

ℹ️ INFORMATIONAL
<findings or "None.">
```

Each finding must include:
- **Issue type** [Cell N]: one-line headline
- Description of what is wrong
- *Why it matters*: concrete consequence
- Suggestion: actionable fix

For any finding that has a corresponding entry in `steps`, end it with
exactly: `[Fix available — see panel below]`

If the notebook has no issues: write `✅ No significant code quality issues found.`

## steps Array Rules

- Include ONLY direct cell replacements (modify) or new import cells (insert).
- Each step must contain the FULL, COMPLETE cell content — not just a diff.
- `autoExecute` must always be `false`.
- Omit execution-order reordering (describe in chatResponse only).
- Omit pure rename suggestions.
- Maximum 10 steps. Return [] if no direct code fixes apply.

{skills_section}

{memory_section}
"""


def _build_manual_review_system(skills, memory):
    skills_text = ""
    for s in skills:
        skills_text += f"\n### {s['name']}\n{s['content']}\n"
    if not skills_text:
        skills_text = "No additional skill configuration."
    memory_text = memory.strip() or "No memory recorded yet."
    return _MANUAL_REVIEW_SYSTEM.format(
        skills_section=skills_text,
        memory_section=memory_text,
    )


def _build_manual_review_user(user_message, notebook_context, operation_id):
    cells    = notebook_context.get("cells", [])
    nb_path  = notebook_context.get("notebookPath", "unknown")
    nb_name  = Path(nb_path).name if nb_path != "unknown" else "notebook"

    lines = [
        f"Notebook: {nb_name}",
        f"Operation ID: {operation_id}",
        f"Total cells: {len(cells)}",
        "",
        "=== NOTEBOOK CELLS ===",
    ]

    for cell in cells:
        idx    = cell.get("index", 0)
        ctype  = cell.get("type", "code")
        source = cell.get("source", "")
        ec     = cell.get("executionCount")

        header = f"[Cell {idx} | {ctype.upper()}"
        if ctype == "code":
            header += f" | exec:{ec}" if ec is not None else " | not run"
        header += "]"

        lines.append(header)
        lines.append(source[:3000].strip() if source.strip() else "(empty)")
        lines.append("")

    lines.append(f"=== USER REQUEST ===")
    lines.append(user_message)
    lines.append("")
    lines.append("Return ONLY a single valid JSON object. No text outside the JSON.")

    return "\n".join(lines)


def _parse_json_from_text(text: str, fallback_op_id: str) -> dict:
    """Extract structured JSON from an LLM response that may have extra text."""
    text = text.strip()

    # 1. Direct JSON
    if text.startswith("{"):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    # 2. JSON inside a ```json … ``` or ``` … ``` block
    m = _re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    # 3. Grab largest { … } in the text
    start = text.find("{")
    end   = text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    # 4. Fallback: treat entire response as advisory chat text
    return {
        "operationId":       fallback_op_id,
        "cellInsertionMode": "chat",
        "chatResponse":      text,
        "steps":             [],
        "requiresApproval":  False,
        "summary":           "Advisory response",
    }


# ---------------------------------------------------------------------------
# Handler
# ---------------------------------------------------------------------------

class TaskHandler(JupyterHandler):
    """Handle AI task requests."""

    @authenticated
    async def post(self):
        """Process a user task request.

        Supports optional streaming for chat/advisory mode:
          - Request body may include ``"stream": true``
          - If the effective cell_insertion_mode is "chat" and streaming is
            requested, the response is sent as Server-Sent Events (SSE):
              data: {"type":"chunk","text":"..."}\n\n   (per token)
              data: {"type":"done","operationId":"...","steps":[],...}\n\n
          - All other modes always return a plain JSON response.
        """
        try:
            body = json.loads(self.request.body)
        except json.JSONDecodeError:
            self.set_status(400)
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps({"error": "Invalid JSON body"}))
            return

        stream_requested = bool(body.get("stream", False))
        if not stream_requested:
            self.set_header("Content-Type", "application/json")

        message          = body.get("message", "").strip()
        notebook_context = body.get("notebookContext", {})
        operation_id     = body.get("operationId")
        # Chat history: list of {"role": "user"|"assistant", "content": "..."}
        # sent by the frontend (last N turns of the visible conversation).
        chat_history     = body.get("chatHistory", [])
        # Composite pipeline step execution: forces auto mode regardless of skill settings
        force_auto_mode  = bool(body.get("forceAutoMode", False))
        # @variable_name references resolved by VariableResolver in the frontend
        variables        = body.get("variables", [])
        if variables:
            notebook_context = dict(notebook_context)
            notebook_context["variables"] = variables
        # Slash command typed by the user (e.g. "/eda").  The frontend strips the
        # command prefix from the message before sending, so ``message`` here
        # already contains only the free-text portion of the user input.
        slash_command    = body.get("command", "").strip().lower() or None
        # User-controlled cell-writing mode from the sidebar toggle.
        # 'chat' = never write cells (user wins over skill defaults)
        # 'auto' = skill/heuristic decides (default)
        # 'doc'  = always write cells regardless of skill defaults
        user_cell_mode   = body.get("cellMode", "auto")  # 'chat' | 'auto' | 'doc'

        if not message:
            self.set_status(400)
            self.finish(json.dumps({"error": "Message is required"}))
            return

        try:
            root_dir      = self.settings.get("ds_assistant_root_dir", ".")
            notebook_path = notebook_context.get("notebookPath", "")

            # Use the pre-loaded loader from startup; fall back to a fresh one.
            skill_loader = self.settings.get("ds_assistant_skill_loader")
            if skill_loader is None:
                skill_loader = SkillLoader(root_dir, notebook_path)

            # ── /chat built-in command: force advisory/chat mode for this ──────
            # message only, identical to the sidebar "💬 Chat Only" toggle but
            # per-request.  We set a flag so the get_insertion_mode() call below
            # cannot override it.
            force_chat_mode = slash_command == "/chat"
            if force_chat_mode:
                slash_command = None   # clear so skill routing is skipped below
                skills = skill_loader.load_relevant_skills(message, tier1_only=True)
            # Skill loading: slash command takes priority over keyword detection.
            elif slash_command:
                skills = skill_loader.load_by_command(slash_command)
                log.debug("task: slash command '%s' → %d skill(s)", slash_command,
                          len(skills))
            else:
                skills = skill_loader.load_relevant_skills(message)

            # ── Composite pipeline detection ──────────────────────────────
            # If a composite skill was triggered, return the pipeline plan
            # immediately.  The frontend then orchestrates step-by-step execution.
            composite_name = skill_loader.get_triggered_composite(skills)
            if composite_name:
                composite_steps = skill_loader.get_composite_steps(composite_name, message)
                if composite_steps:
                    op_id = operation_id or f"op_{uuid.uuid4().hex[:8]}"
                    plan = {
                        "type":              "done",
                        "operationId":       op_id,
                        "cellInsertionMode": "composite",
                        "compositeName":     composite_name,
                        "compositePlan":     composite_steps,
                        "steps":             [],
                        "requiresApproval":  False,
                        "clarificationNeeded": None,
                        "summary":           f"Starting pipeline: {composite_name} ({len(composite_steps)} steps)",
                    }
                    if stream_requested:
                        self.set_header("Content-Type", "text/event-stream")
                        self.set_header("Cache-Control", "no-cache")
                        self.set_header("X-Accel-Buffering", "no")
                        self.write(f"data: {json.dumps(plan)}\n\n")
                        self.finish()
                    else:
                        del plan["type"]
                        self.finish(json.dumps(plan))
                    return

            # Determine the effective cell_insertion_mode for this request.
            # /chat command has already locked the mode — do not override it.
            if force_chat_mode:
                cell_insertion_mode = "chat"
            else:
                cell_insertion_mode = skill_loader.get_insertion_mode(skills)

            # Composite step execution forces auto mode so each step's cells
            # are applied immediately (the frontend shows one composite diff at end).
            # /chat command takes priority even over composite pipeline steps.
            if force_auto_mode and not force_chat_mode:
                cell_insertion_mode = "auto"

            # Apply user-controlled cell-writing mode (sidebar toggle).
            # Priority: /chat command > user_cell_mode toggle > skill defaults.
            # force_chat_mode (/chat command) cannot be overridden by any toggle.
            if force_chat_mode:
                skill_wanted_cells = False   # explicit command, no conflict warning
            elif user_cell_mode == "chat":
                # User explicitly chose discussion mode — keep everything in chat.
                # We tag the response so the frontend can show a skill-conflict
                # warning if the skill normally wants cells.
                skill_wanted_cells = cell_insertion_mode not in ("chat",)
                cell_insertion_mode = "chat"
            elif user_cell_mode == "doc":
                # User wants documentation — promote any advisory/chat-only skill
                # to auto so cells are created freely.
                if cell_insertion_mode == "chat":
                    cell_insertion_mode = "auto"
                skill_wanted_cells = False
            else:
                # 'auto' — respect existing skill/heuristic logic
                skill_wanted_cells = False

            memory_manager = MemoryManager(root_dir, notebook_path)
            memory = memory_manager.load()

            provider = create_provider(self.settings, task="chat")

            # ── Vision warning ────────────────────────────────────────────
            warnings = []
            if not provider.has_vision():
                image_cells = [
                    c for c in notebook_context.get("cells", [])
                    if c.get("imageOutput")
                ]
                if image_cells:
                    labels = []
                    for c in image_cells:
                        idx = c.get("index")
                        labels.append(f"#{idx + 1}" if isinstance(idx, int) else "#?")
                    provider_name = self.settings.get(
                        "ds_assistant_chat_provider", "ollama"
                    ).upper()
                    model_name = self.settings.get(
                        "ds_assistant_ollama_chat_model",
                        self.settings.get("ds_assistant_chat_model", "unknown"),
                    )
                    warnings.append(
                        f"⚠️ {', '.join(labels)} contain plot/image outputs. "
                        f"Your current chat model ({provider_name} / {model_name}) "
                        f"does not support vision. The image content will be ignored. "
                        f"Switch to a vision-capable model to analyse plots."
                    )

            # ── Dispatch based on insertion mode ─────────────────────────
            op_id = operation_id or f"op_{uuid.uuid4().hex[:8]}"

            # Routing note: the frontend now surfaces a disambiguation card
            # for ambiguous plain messages.  By the time the request reaches
            # the backend the user has explicitly chosen /chat or cell mode.

            # /ask command: force chat mode + RAG augmentation.
            # Retrieve relevant chunks from the local knowledge base and
            # prepend them to the user message so the LLM has project-specific
            # context beyond the current notebook.
            rag_sources: list = []
            if slash_command == "/ask":
                cell_insertion_mode = "chat"
                rag_context, rag_sources = await _rag_augment(self.settings, message)
                if rag_context:
                    message = (
                        f"[Relevant knowledge-base context]\n{rag_context}\n\n"
                        f"---\n[User question]\n{message}"
                    )

            # For cell-creation tasks, send an immediate SSE progress event
            # so the UI reacts right away instead of appearing frozen.
            if stream_requested and cell_insertion_mode not in ("chat",):
                self.set_header("Content-Type", "text/event-stream")
                self.set_header("Cache-Control", "no-cache")
                self.set_header("X-Accel-Buffering", "no")
                self.write(f"data: {json.dumps({'type': 'progress', 'text': 'Analyzing notebook…'})}\n\n")
                await self.flush()

            if cell_insertion_mode == "chat":
                system = _build_advisory_system(skills, memory)
                user   = _build_advisory_user(message, notebook_context)

                if stream_requested:
                    # SSE streaming path — sends tokens as they arrive.
                    self.set_header("Content-Type", "text/event-stream")
                    self.set_header("Cache-Control", "no-cache")
                    self.set_header("X-Accel-Buffering", "no")

                    accumulated: list = []

                    async def _on_chunk(text: str) -> None:
                        cleaned = _re.sub(r'(\s*\bnull\b)+\s*$', '', text)
                        if not cleaned:
                            return
                        accumulated.append(cleaned)
                        self.write(f"data: {json.dumps({'type': 'chunk', 'text': cleaned})}\n\n")
                        await self.flush()
                        # Yield the event loop so Tornado actually sends this
                        # chunk over the TCP socket before the next token
                        # arrives — without this, all tokens are buffered and
                        # sent together when finish() is called.
                        await asyncio.sleep(0)

                    await provider.stream_chat(
                        system=system, user=user, on_chunk=_on_chunk,
                        chat_history=chat_history,
                    )

                    chat_response_text = _re.sub(
                        r'(\s*\bnull\b)+\s*$', '', "".join(accumulated)
                    ).strip()
                    done_event: dict = {
                        "type":              "done",
                        "operationId":       op_id,
                        "steps":             [],
                        "requiresApproval":  False,
                        "clarificationNeeded": None,
                        "summary":           "Advisory response",
                        "chatResponse":      chat_response_text,
                        "cellInsertionMode": "chat",
                    }
                    usage = getattr(provider, "last_usage", None)
                    if usage:
                        done_event["tokenUsage"] = usage
                    if warnings:
                        done_event["warnings"] = warnings
                    if rag_sources:
                        done_event["ragSources"] = rag_sources
                    self.write(f"data: {json.dumps(done_event)}\n\n")
                    self.finish()
                    return

                # Non-streaming chat path
                chat_text = await provider.chat(
                    system=system, user=user, chat_history=chat_history
                )
                response = {
                    "operationId":         op_id,
                    "steps":               [],
                    "requiresApproval":    False,
                    "clarificationNeeded": None,
                    "summary":             "Advisory response",
                    "chatResponse":        chat_text,
                    "cellInsertionMode":   "chat",
                }
                if rag_sources:
                    response["ragSources"] = rag_sources

            elif cell_insertion_mode == "manual":
                # Manual mode: LLM returns a single JSON blob containing BOTH
                # the formatted advisory text (chatResponse) and an array of
                # individually applicable code-fix steps.
                # We do NOT stream manual mode because the LLM response is raw
                # JSON — streaming it would show ugly tokens in the chat window.
                if stream_requested:
                    self.write(f"data: {json.dumps({'type': 'progress', 'text': 'Reviewing notebook…'})}\n\n")
                    await self.flush()
                system   = _build_manual_review_system(skills, memory)
                user     = _build_manual_review_user(message, notebook_context, op_id)
                raw_text = await provider.chat(system=system, user=user)
                response = _parse_json_from_text(raw_text, op_id)
                # Ensure required fields are always present
                response.setdefault("operationId",        op_id)
                response.setdefault("cellInsertionMode",  "manual")
                response.setdefault("steps",              [])
                response.setdefault("requiresApproval",   False)
                response.setdefault("clarificationNeeded", None)

            else:
                # Standard mode (auto / preview): cell-operation JSON plan.
                if stream_requested:
                    # ── Concurrent progress + plan ────────────────────────────
                    # plan_task and a progress-message loop run concurrently.
                    # The loop sends a new status message every ~2 s so the user
                    # always sees activity during the LLM round-trip.
                    # Any pre-tool explanation text Claude generates also streams
                    # as "chunk" events via _on_plan_chunk.
                    skill_names = [s["name"] for s in skills if s.get("tier") == 2]
                    first_step = (f"Skill: {skill_names[0]}" if skill_names
                                  else "Reading notebook…")

                    _PROGRESS_STEPS = [
                        first_step,
                        "Analyzing structure…",
                        "Generating plan…",
                        "Finalizing…",
                    ]

                    plan_done = asyncio.Event()

                    async def _progress_loop() -> None:
                        for step in _PROGRESS_STEPS:
                            if plan_done.is_set():
                                return
                            self.write(
                                f"data: {json.dumps({'type': 'progress', 'text': step})}\n\n"
                            )
                            await self.flush()
                            # Poll every 100 ms for up to 2 s; exit early if done
                            for _ in range(20):
                                await asyncio.sleep(0.1)
                                if plan_done.is_set():
                                    return

                    async def _on_plan_chunk(text: str) -> None:
                        # Strip bare trailing "null" tokens the LLM writes when
                        # it means the JSON keyword — e.g. "\n\nnull" at the end
                        # of a conversational response.
                        cleaned = _re.sub(r'(\s*\bnull\b)+\s*$', '', text)
                        if not cleaned:
                            return
                        self.write(
                            f"data: {json.dumps({'type': 'chunk', 'text': cleaned})}\n\n"
                        )
                        await self.flush()
                        await asyncio.sleep(0)

                    async def _on_json_delta(partial: str) -> None:
                        """Stream raw tool-call JSON deltas so the frontend can show
                        a live preview of the cell content being generated."""
                        self.write(
                            f"data: {json.dumps({'type': 'json_delta', 'text': partial})}\n\n"
                        )
                        await self.flush()
                        await asyncio.sleep(0)

                    progress_task = asyncio.create_task(_progress_loop())
                    try:
                        response = await provider.stream_plan_task(
                            user_message=message,
                            notebook_context=notebook_context,
                            skills=skills,
                            memory=memory,
                            operation_id=op_id,
                            on_text_chunk=_on_plan_chunk,
                            on_json_delta=_on_json_delta,
                            chat_history=chat_history,
                        )
                    finally:
                        plan_done.set()
                        progress_task.cancel()
                        try:
                            await progress_task
                        except asyncio.CancelledError:
                            pass

                    # ── Retry gate ────────────────────────────────────────────
                    # stream_plan_task uses tool_choice:"auto" so the LLM can
                    # stream a prose preamble before calling the tool.  The
                    # downside: it sometimes skips the tool call entirely and
                    # returns steps:[] — even for clear code-generation requests.
                    #
                    # Advisory/chat messages never reach this branch: they are
                    # dispatched to stream_chat() at the cell_insertion_mode=="chat"
                    # check above.  Every request that arrives here is expected to
                    # produce at least one cell-operation step, so we retry
                    # unconditionally when steps are empty and no clarification
                    # was requested.
                    steps_empty = not response.get("steps")
                    # Treat the string "null" the same as JSON null — the LLM
                    # sometimes writes the keyword literally instead of omitting it.
                    _clarif = response.get("clarificationNeeded")
                    clarification_needed = bool(_clarif) and _clarif != "null"

                    if steps_empty and not clarification_needed:
                        # Tell the frontend a retry is in progress
                        self.write(
                            f"data: {json.dumps({'type': 'progress', 'text': 'Generating cell operations…'})}\n\n"
                        )
                        await self.flush()

                        # Forced second pass — tool_choice:"any" guarantees a tool call
                        response = await provider.plan_task(
                            user_message=message,
                            notebook_context=notebook_context,
                            skills=skills,
                            memory=memory,
                            operation_id=op_id,
                            chat_history=chat_history,
                        )
                        # If still empty (truly nothing to do), leave as-is

                else:
                    response = await provider.plan_task(
                        user_message=message,
                        notebook_context=notebook_context,
                        skills=skills,
                        memory=memory,
                        operation_id=op_id,
                        chat_history=chat_history,
                    )
                response["cellInsertionMode"] = cell_insertion_mode
                # Signal to frontend that a skill wanted to create cells but
                # the user's "Chat Only" toggle prevented it.
                if skill_wanted_cells:
                    response["skillWantedCells"] = True

            # Attach token usage so the frontend can track costs per thread.
            usage = getattr(provider, "last_usage", None)
            if usage:
                response["tokenUsage"] = usage

            if warnings:
                response["warnings"] = warnings

            # If we already opened an SSE stream (for the progress event),
            # send the final payload as a "done" event rather than raw JSON.
            content_type = self._headers.get("Content-Type", "")
            if "text/event-stream" in content_type:
                response["type"] = "done"
                self.write(f"data: {json.dumps(response)}\n\n")
                self.finish()
            else:
                self.finish(json.dumps(response))

        except Exception as e:
            self.log.error(f"Varys task error: {traceback.format_exc()}")
            self.set_status(500)
            if stream_requested:
                # For SSE responses already started, send error as final event
                self.set_header("Content-Type", "text/event-stream")
                self.write(f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n")
                self.finish()
            else:
                self.set_header("Content-Type", "application/json")
                self.finish(json.dumps({"error": str(e)}))
