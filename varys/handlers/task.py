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
from ..memory.preference_store import PreferenceStore
from ..memory.injection import (
    select_preferences as _select_preferences,
    format_preferences_for_prompt as _fmt_prefs,
    detect_explicit_preference as _detect_explicit_pref,
)
from ..utils.config import get_config as _get_cfg

log = logging.getLogger(__name__)


def _strip_null(text: str) -> str:
    """Remove trailing ' null' artefacts that some models emit.

    Only trailing whitespace is stripped after the null removal so that
    leading spaces — which LLM tokenisers encode as part of the *next* token
    (e.g. " news", " function") — are preserved.  Stripping both sides was
    the cause of missing inter-word spaces ("Greatnews", "thisfunction").
    """
    return _re.sub(r'(\s*\bnull\b)+\s*$', '', text).rstrip()


# ---------------------------------------------------------------------------
# MCP agentic loop helper
# ---------------------------------------------------------------------------

async def _run_mcp_tool_loop(
    aclient,
    system: str,
    messages: list,
    builtin_tools: list,
    mcp_manager,
    on_text_chunk,
    on_thought=None,
    max_rounds: int = 8,
) -> dict:
    """Multi-turn agentic loop: LLM → tool call → result → LLM → …

    Drives the Anthropic messages API directly (not via stream_plan_task) so
    we can handle arbitrary tool calls alongside create_operation_plan.

    Returns the final create_operation_plan response dict (same shape as
    stream_plan_task) once the LLM calls it, or a chatResponse advisory dict
    if the LLM never calls it.
    """
    import anthropic as _anthropic

    external_tools = mcp_manager.get_all_tools() if mcp_manager else []
    all_tools = builtin_tools + external_tools
    msgs = list(messages)

    for _round in range(max_rounds):
        use_thinking = getattr(aclient, "_extended_thinking_enabled", False) and \
                       getattr(aclient, "_supports_extended_thinking", lambda: False)()

        api_kwargs = dict(
            model=aclient.model,
            max_tokens=16_000 if use_thinking else 8_192,
            system=system,
            tools=all_tools,
            tool_choice={"type": "auto"},
            messages=msgs,
        )
        if use_thinking:
            api_kwargs["thinking"] = {"type": "enabled", "budget_tokens": 8_000}

        async with aclient._aclient.messages.stream(**api_kwargs) as stream:
            async for event in stream:
                if event.type != "content_block_delta":
                    continue
                delta = event.delta
                if delta.type == "text_delta":
                    await on_text_chunk(delta.text)
                    await asyncio.sleep(0)
                elif delta.type == "thinking_delta" and on_thought:
                    await on_thought(delta.thinking)
                    await asyncio.sleep(0)
            final_msg = await stream.get_final_message()

        if hasattr(final_msg, "usage") and final_msg.usage:
            aclient._set_usage(
                getattr(final_msg.usage, "input_tokens", 0),
                getattr(final_msg.usage, "output_tokens", 0),
            )

        msgs.append({"role": "assistant", "content": final_msg.content})

        # Check for tool_use blocks
        tool_use_blocks = [b for b in final_msg.content if b.type == "tool_use"]

        if not tool_use_blocks:
            # Pure text response — surface as advisory
            text = next(
                (b.text for b in final_msg.content if hasattr(b, "text")), ""
            )
            text = _strip_null(text)
            return {
                "steps": [], "requiresApproval": False,
                "clarificationNeeded": None,
                "chatResponse": text or "Done.",
                "cellInsertionMode": "chat",
                "summary": "Advisory response",
            }

        # Process tool calls — external MCP tools first, then check for plan.
        # The LLM may call external tools and create_operation_plan in the same
        # response.  We must execute all external tools before returning the
        # plan so their results are available in the conversation history.
        tool_results = []
        final_plan = None

        for block in tool_use_blocks:
            if block.name == "create_operation_plan":
                data = dict(block.input)
                clarif = data.get("clarificationNeeded")
                if not clarif or (isinstance(clarif, str) and clarif.strip().lower() == "null"):
                    data["clarificationNeeded"] = None
                final_plan = data
                # Don't break — continue so any preceding external tools are executed
            else:
                # External MCP tool — execute and collect result
                try:
                    result_text = await mcp_manager.call_tool(block.name, dict(block.input))
                except Exception as exc:
                    result_text = f"[Tool error: {exc}]"

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_text,
                })

        if final_plan is not None:
            return final_plan

        if tool_results:
            msgs.append({"role": "user", "content": tool_results})

    # Exhausted max rounds without a plan
    return {
        "steps": [], "requiresApproval": False, "clarificationNeeded": None,
        "chatResponse": "I reached the maximum number of tool-call rounds without completing a plan.",
        "cellInsertionMode": "chat", "summary": "Max rounds exceeded",
    }


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
        loop   = asyncio.get_running_loop()
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
# Chain-of-Thought reasoning suffix — appended to any system prompt when the
# user has selected CoT mode from the reasoning chip (single API call, steps
# appear inline in the response).
# ---------------------------------------------------------------------------

_COT_SYSTEM_SUFFIX = """

## Reasoning Mode: Chain-of-Thought (active)

For every non-trivial request, work through the problem step by step **before**
giving your final answer.  Use this format for each step:

**Step N — [short action title]**
> *Reasoning:* ...
> *Confidence:* high / medium / low
> *Needs revision:* yes / no

If a step needs revision, add a `> *Revision:*` line before continuing.

Separate your final answer with a `---` divider.
Skip the step structure only for simple, one-line factual questions.
"""

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
  NEVER use "cell[N]", "pos:N", "position N", "cell index N", "idx N", or any
  other variant — #N is the ONLY permitted format for cell references.
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
        reasoning_mode   = body.get("reasoningMode", "off")   # 'off' | 'cot' | 'sequential'
        cot_enabled      = reasoning_mode == "cot"
        sequential_enabled = reasoning_mode == "sequential"

        if not message:
            self.set_status(400)
            self.finish(json.dumps({"error": "Message is required"}))
            return

        try:
            root_dir      = self.settings.get("ds_assistant_root_dir", ".")
            notebook_path = notebook_context.get("notebookPath", "")

            # ── Smart Cell Context pre-assembly ────────────────────────────────
            # Use the SummaryStore + assembler to build a rich, structured cell
            # context block.  The result is stored as _cell_context_override so
            # build_notebook_context() (called later by every provider) can inject
            # it directly — the old per-cell truncation loop is then bypassed.
            # Non-fatal: any failure falls back to the legacy truncation path.
            try:
                from ..context.summary_store import SummaryStore
                from ..context.assembler    import assemble_context as _assemble
                _store = SummaryStore(root_dir, notebook_path)
                _ctx_override = _assemble(
                    user_query             = message,
                    cell_order             = notebook_context.get("cells", []),
                    summary_store          = _store,
                    active_cell_id         = notebook_context.get("activeCellId") or None,
                    focal_cell_full_output = notebook_context.get("focalCellOutput") or None,
                )
                # Ensure notebook_context is a mutable copy before patching
                notebook_context = dict(notebook_context)
                notebook_context["_cell_context_override"] = _ctx_override
            except Exception as _ctx_exc:
                log.debug("Smart context assembly skipped: %s", _ctx_exc)

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

            # ── Long-term memory: load preferences from structured store ───
            pref_store = PreferenceStore(root_dir, notebook_path)

            # Capture explicit preference in user message (fire-and-forget)
            _explicit = _detect_explicit_pref(message)
            if _explicit:
                _scope = "notebook" if notebook_path else "project"
                pref_store.upsert(_explicit, scope=_scope)

            # Trigger background migration from legacy preferences.md if needed
            if pref_store.needs_migration():
                simple_model = self.settings.get("ds_assistant_simple_tasks_provider", "")
                if simple_model:
                    from ..memory.inference import migrate_preferences_llm as _migrate_llm
                    asyncio.create_task(_migrate_llm(pref_store, dict(self.settings)))
                else:
                    pref_store.migrate_sync()

            # Select relevant preferences for this query
            selected_prefs = await _select_preferences(message, pref_store, self.settings)
            memory = _fmt_prefs(selected_prefs)

            # Fallback: if no structured preferences yet, use legacy preferences.md
            if not memory.strip():
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
                if cot_enabled:
                    system += _COT_SYSTEM_SUFFIX
                user   = _build_advisory_user(message, notebook_context)

                if stream_requested:
                    # SSE streaming path — sends tokens as they arrive.
                    self.set_header("Content-Type", "text/event-stream")
                    self.set_header("Cache-Control", "no-cache")
                    self.set_header("X-Accel-Buffering", "no")

                    accumulated: list = []
                    accumulated_thoughts: list = []

                    async def _on_chunk(text: str) -> None:
                        cleaned = _strip_null(text)
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

                    async def _on_chat_thought(text: str) -> None:
                        accumulated_thoughts.append(text)
                        self.write(f"data: {json.dumps({'type': 'thought', 'text': text})}\n\n")
                        await self.flush()
                        await asyncio.sleep(0)

                    # ── MCP Sequential Thinking loop (chip ON) ────────────────
                    final_user = user
                    if sequential_enabled and getattr(provider, "has_sequential_thinking", lambda: False)():
                        mcp_thoughts = await provider.run_sequential_thinking_loop(
                            user=user,
                            system=system,
                            on_thought=_on_chat_thought,
                            chat_history=chat_history,
                        )
                        if mcp_thoughts:
                            thought_lines = [
                                f"Step {t.get('thoughtNumber', i + 1)}: {t.get('thought', '')}"
                                for i, t in enumerate(mcp_thoughts)
                            ]
                            thought_summary = "\n".join(thought_lines)
                            final_user = (
                                f"{user}\n\n"
                                f"[Sequential reasoning you completed:\n{thought_summary}\n]\n"
                                "Based on this reasoning, provide your final response."
                            )

                    # ── External MCP tool loop (when servers are connected) ────
                    mcp_manager = self.settings.get("ds_mcp_manager")
                    aclient = getattr(provider, "_chat_client", None)

                    if mcp_manager and mcp_manager.has_tools() and aclient is not None:
                        # Use the full agentic loop so the LLM can call external tools
                        from ..llm.client import ClaudeClient as _CC
                        if isinstance(aclient, _CC):
                            # Build a tool-aware system prompt so the LLM knows it can
                            # call external services rather than refusing with "I can't
                            # access the internet."
                            external_tools = mcp_manager.get_all_tools()
                            tool_lines = "\n".join(
                                f"  - {t['name'].split('__', 1)[-1]} "
                                f"(server: {t['name'].split('__', 1)[0]}): "
                                f"{t.get('description', '')[:120]}"
                                for t in external_tools
                            )
                            mcp_addon = (
                                "\n\n## External MCP Tools — Available Now\n"
                                "You have access to the following external tools via MCP servers.\n"
                                "When the user asks for data or actions that require external access, "
                                "call the appropriate tool — do NOT say you cannot access the internet.\n\n"
                                f"{tool_lines}\n\n"
                                "Always prefer calling a tool over apologising for lack of access."
                            )
                            msgs = aclient._prepend_history(chat_history, final_user)
                            chat_result = await _run_mcp_tool_loop(
                                aclient=aclient,
                                system=system + mcp_addon,
                                messages=msgs,
                                builtin_tools=[],  # chat mode: no create_operation_plan
                                mcp_manager=mcp_manager,
                                on_text_chunk=_on_chunk,
                                on_thought=_on_chat_thought,
                            )
                            chat_response_text = chat_result.get("chatResponse", "")
                        else:
                            await provider.stream_chat(
                                system=system, user=final_user,
                                on_chunk=_on_chunk, on_thought=_on_chat_thought,
                                chat_history=chat_history,
                            )
                            chat_response_text = _re.sub(
                                r'(\s*\bnull\b)+\s*$', '', "".join(accumulated)
                            ).strip()
                    else:
                        await provider.stream_chat(
                            system=system,
                            user=final_user,
                            on_chunk=_on_chunk,
                            on_thought=_on_chat_thought,
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
                    thoughts_text = "".join(accumulated_thoughts).strip()
                    if thoughts_text:
                        done_event["thoughts"] = thoughts_text
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
                        cleaned = _strip_null(text)
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

                    plan_thoughts: list = []

                    async def _on_plan_thought(text: str) -> None:
                        """Stream API-level thinking blocks to the 🧠 panel."""
                        plan_thoughts.append(text)
                        self.write(
                            f"data: {json.dumps({'type': 'thought', 'text': text})}\n\n"
                        )
                        await self.flush()
                        await asyncio.sleep(0)

                    # ── MCP Sequential Thinking loop for cell-ops (chip ON) ───
                    # Build a text-only context for the thought loop (no images)
                    # so the LLM reasons about what operations are needed before
                    # the heavier full-context final call.
                    final_message = message
                    if sequential_enabled and getattr(provider, "has_sequential_thinking", lambda: False)():
                        thought_user = (
                            build_notebook_context(message, notebook_context)
                            + "\n\nThink through step by step what notebook cell operations are needed to fulfil this request."
                        )
                        plan_system = (
                            provider.build_system_prompt(skills, memory)
                            if hasattr(provider, "build_system_prompt")
                            else ""
                        )
                        mcp_plan_thoughts = await provider.run_sequential_thinking_loop(
                            user=thought_user,
                            system=plan_system,
                            on_thought=_on_plan_thought,
                            chat_history=chat_history,
                        )
                        if mcp_plan_thoughts:
                            thought_lines = [
                                f"Step {t.get('thoughtNumber', i + 1)}: {t.get('thought', '')}"
                                for i, t in enumerate(mcp_plan_thoughts)
                            ]
                            thought_summary = "\n".join(thought_lines)
                            final_message = (
                                f"{message}\n\n"
                                f"[Pre-analysis you completed:\n{thought_summary}\n]"
                            )

                    # ── External MCP tool loop for cell-ops ─────────────────
                    mcp_manager = self.settings.get("ds_mcp_manager")
                    aclient_for_loop = getattr(provider, "_chat_client", None)

                    progress_task = asyncio.create_task(_progress_loop())
                    try:
                        from ..llm.client import ClaudeClient as _CC2, OPERATION_PLAN_TOOL as _OPT
                        if (mcp_manager and mcp_manager.has_tools()
                                and isinstance(aclient_for_loop, _CC2)):
                            # Agentic loop: external tools + create_operation_plan
                            from ..llm.client import _build_system_prompt_shared as _bsp
                            plan_system_prompt = _bsp(skills, memory)
                            if cot_enabled:
                                plan_system_prompt += _COT_SYSTEM_SUFFIX
                            # Inject MCP tool awareness so the LLM uses tools
                            # instead of refusing to access external resources.
                            ext_tools_plan = mcp_manager.get_all_tools()
                            if ext_tools_plan:
                                tool_lines_plan = "\n".join(
                                    f"  - {t['name'].split('__', 1)[-1]} "
                                    f"(server: {t['name'].split('__', 1)[0]}): "
                                    f"{t.get('description', '')[:120]}"
                                    for t in ext_tools_plan
                                )
                                plan_system_prompt += (
                                    "\n\n## External MCP Tools — Available Now\n"
                                    "You have access to the following external tools.\n"
                                    "Call them when you need external data before generating the cell plan.\n\n"
                                    f"{tool_lines_plan}\n\n"
                                    "Always prefer calling a tool over apologising for lack of access."
                                )
                            content_blocks = aclient_for_loop._build_content_blocks(
                                final_message, notebook_context
                            )
                            msgs_for_loop = aclient_for_loop._prepend_history(
                                chat_history, content_blocks
                            )
                            response = await _run_mcp_tool_loop(
                                aclient=aclient_for_loop,
                                system=plan_system_prompt,
                                messages=msgs_for_loop,
                                builtin_tools=[_OPT],
                                mcp_manager=mcp_manager,
                                on_text_chunk=_on_plan_chunk,
                                on_thought=_on_plan_thought,
                            )
                            response.setdefault("operationId", op_id)
                        else:
                            response = await provider.stream_plan_task(
                                user_message=final_message,
                                notebook_context=notebook_context,
                                skills=skills,
                                memory=memory,
                                operation_id=op_id,
                                on_text_chunk=_on_plan_chunk,
                                on_json_delta=_on_json_delta,
                                on_thought=_on_plan_thought,
                                chat_history=chat_history,
                            )
                    finally:
                        plan_done.set()
                        progress_task.cancel()
                        try:
                            await progress_task
                        except asyncio.CancelledError:
                            pass

                    # Attach collected thinking to the response so the frontend
                    # renders the 🧠 panel for cell operations too.
                    if plan_thoughts:
                        response["thoughts"] = "".join(plan_thoughts).strip()

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
