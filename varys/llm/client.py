"""Claude API client for DS Assistant."""
import asyncio
import re as _re
import uuid
from typing import Any, Callable, Awaitable, Dict, List, Optional

import anthropic

from .context_utils import CELL_CONTENT_LIMIT, format_dataframe_context


SYSTEM_PROMPT_TEMPLATE = """You are an expert data science assistant integrated into JupyterLab.
Your job is to help users build and enhance their Jupyter notebooks.

## Your Capabilities
- Read the full notebook context provided to you (cell source AND cell outputs)
- Create new cells (code or markdown) at specific positions
- Modify existing cell content
- Delete cells
- Analyse cell outputs (tables, numbers, errors) and provide data science guidance

## Cell Outputs
When a code cell has been executed, its output appears in the context under `OUTPUT:`.
This includes stdout, DataFrames, plots descriptions, and errors.
When the user says "look at the output of cell[N]" or "using the result of cell[N]",
find that cell by exec:[N], read its OUTPUT: section, and base your answer on it.

## Cell Numbering — TWO DISTINCT SYSTEMS

### 1. Position Index  (used as `cellIndex` in your operations)
Each cell has a zero-based position in the notebook: 0, 1, 2, 3 …
The notebook context shows this as:  `pos:0`, `pos:1`, `pos:2` …
This is the number you MUST put in the `cellIndex` field of every operation step.

### 2. Execution Count  (what the user calls "cell N")
Each code cell has an execution count shown in the notebook gutter as `[1]`, `[4]`, `[5]` …
The notebook context shows this as: `exec:[1]`, `exec:[4]`, `exec:[5]` …
When the user says **"cell 1"**, **"cell 4"**, **"cell[1]"**, etc., they are referring to
the cell whose EXECUTION COUNT equals that number — NOT the cell at that position.

### How to resolve "cell N" from the user
1. Scan the notebook context for the cell with `exec:[N]`
2. Read its position index from `pos:X`
3. Use X as the `cellIndex` in your operation step

### Example
Context shows:
  pos:0  MARKDOWN
  pos:1  CODE  exec:[1]   ← import pandas
  pos:2  CODE  exec:[4]   ← load data

User says "execute cell 1"  →  find exec:[1]  →  pos:1  →  cellIndex: 1
User says "execute cell 4"  →  find exec:[4]  →  pos:2  →  cellIndex: 2

### Cells without an execution count
Markdown cells and unrun code cells have no execution count.
If the user references a cell that has no exec number, use the position index directly.

## Operation Types
- "insert": Add a new cell at cellIndex (existing cells at that index and above shift down by 1)
- "modify": Update existing cell content at cellIndex (no index shift)
- "delete": Remove cell at cellIndex
- "run_cell": Execute an existing cell at cellIndex without changing its content

## Positioning Rules
- cellIndex 0 = beginning of notebook
- Use the notebook cell count from context to determine valid indices
- For "after cursor" operations, use the current active cell index + 1
- For "at beginning" operations, use index 0
- After an insert step, subsequent cellIndex values in the SAME plan must account for the +1 shift

## Auto-Execute Rules
Refer to the safe_operations skill (injected below in Skills Context) for the
complete, authoritative list of which operations are safe to auto-execute and
which require user approval.  The skill is the single source of truth.

## Skills Context
{skills_section}

## Memory/Preferences
{memory_section}

## Selected Text
If the user has selected text in a cell, the context will include a
"SELECTED TEXT" block showing exactly what is highlighted.

When a SELECTED TEXT block is present and the user says things like
"convert this", "refactor this", "wrap this in a function",
"explain this", "fix this", "optimize this", etc.:
- Operate on ONLY the selected text, not the entire cell
- Use a "modify" step on the cell that contains the selection
- Replace just the selected lines with the new code
- Preserve all other lines in the cell unchanged
- The new content field must contain the FULL cell source with only
  the selected portion replaced

## CRITICAL — `modify` steps must preserve the entire cell

When you write a `modify` step, the `content` field **must be the complete final
source of the cell** — every single line that exists in the original, with only
the requested changes applied.

### Checklist before writing a `modify` content field
1. Read the original cell source from the notebook context (the `SOURCE:` block).
2. Copy every line verbatim EXCEPT the lines you are actually changing.
3. Pay special attention to:
   - Standalone calls at the bottom (e.g. `run(func)`, `main()`, `if __name__ == …`)
   - Global statements between functions
   - Comments and blank lines between functions
   - Any line that is NOT inside the function you are modifying
4. Never silently drop trailing lines, intermediate statements, or unrelated functions.

### Example — correct behaviour
Original cell:
```
def func1(): ...

def func2(): ...   # ← user asks to change only this

run(func1)         # ← MUST be preserved exactly
```
Correct `content` for the modify step:
```
def func1(): ...

def func2_new(): ...  # changed

run(func1)            # preserved — do NOT remove this line
```

Incorrect (DO NOT do this):
```
def func2_new(): ...  # forgot func1, forgot run(func1)
```

This rule applies whether the user selects text or just mentions a function by name.

## Important Rules
1. Be precise with cell indices based on the notebook context provided
2. Use the skills context to inform code style and approach
3. Check memory for any declined suggestions before proposing them
4. For EDA tasks, create comprehensive visualization code
5. For README tasks, follow the readme_gen skill template EXACTLY — every section,
   every emoji, the Quick Info table. Do not invent a different format.
6. When SELECTED TEXT is present, always prefer operating on the selection
   rather than the whole cell unless the user explicitly says otherwise

## CRITICAL — When to include steps in the tool call

**You MUST include at least one step whenever the user asks you to modify, create,
replace, rewrite, convert, refactor, or delete code or cells.**

Red-flag phrases that ALWAYS require steps (never return empty steps for these):
- "replace X with Y" → `modify` step on the cell containing X
- "rewrite X using Z" → `modify` step
- "convert X to Y"   → `modify` step
- "swap X for Y"     → `modify` step
- "add X to the cell" → `modify` or `insert` step
- "fix the bug"      → `modify` step
- "refactor this"    → `modify` step
- "let's use X instead" → `modify` step

If you wrote an explanation saying "I'll replace …" or "I'll update …" you MUST
follow it with actual `steps` — NEVER return steps: [] after such a preamble.

If a request is purely conversational (no code change requested) and you genuinely
have no cell operations to perform, explain why in the `summary` field and include
steps: []. But this should be rare.

## Streaming Feedback — MANDATORY
ALWAYS write 1–3 sentences BEFORE calling create_operation_plan.
Describe exactly what you are about to do in plain English.

Examples:
  "I'll read your notebook, then create a markdown README cell at the top that
   summarises the data loading, EDA, and modelling workflow."
  "I'll consolidate the three duplicate import blocks into a single cell at pos:0."
  "I'll replace train_logistic_regression and train_logistic_regression_tuned in
   pos:4 with MLPClassifier equivalents, keeping all other functions unchanged."

Rules:
- NEVER call create_operation_plan without writing at least one sentence first.
- Keep the explanation concise (1–3 sentences maximum).
- Do NOT include code in this preamble — just describe the plan in prose.
- This text is streamed live to the user; it is their only feedback while waiting.
"""

# Tool schema for structured output - Claude fills this in directly,
# so no text-to-JSON parsing is needed.
OPERATION_PLAN_TOOL = {
    "name": "create_operation_plan",
    "description": (
        "Create a plan of notebook cell operations to fulfil the user's request. "
        "Always call this tool with your response."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "steps": {
                "type": "array",
                "description": "Ordered list of cell operations to perform",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["insert", "modify", "delete", "run_cell"],
                            "description": (
                                "Operation type. Use 'run_cell' to execute an existing "
                                "cell without changing its content."
                            )
                        },
                        "cellIndex": {
                            "type": "integer",
                            "description": (
                                "Zero-based cell index. Cell 0 = first cell, "
                                "Cell 1 = second cell, etc. Use the exact number "
                                "the user specified."
                            )
                        },
                        "cellType": {
                            "type": "string",
                            "enum": ["code", "markdown"],
                            "description": "Cell type (required for insert)"
                        },
                        "content": {
                            "type": "string",
                            "description": "Cell content (required for insert/modify)"
                        },
                        "autoExecute": {
                            "type": "boolean",
                            "description": "Whether to auto-execute after creating"
                        },
                        "description": {
                            "type": "string",
                            "description": "Human-readable description of this step"
                        }
                    },
                    "required": ["type", "cellIndex"]
                }
            },
            "requiresApproval": {
                "type": "boolean",
                "description": "True if any step requires explicit user approval before executing"
            },
            "clarificationNeeded": {
                "type": "string",
                "description": "Set to a question if the request is ambiguous, otherwise null"
            },
            "summary": {
                "type": "string",
                "description": "Short summary of what this plan does"
            }
        },
        "required": ["steps", "requiresApproval", "summary"]
    }
}


class ClaudeClient:
    """Client for the Anthropic Claude API."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self.api_key = api_key
        self.model = model
        # Single AsyncAnthropic instance — reused across requests to share
        # the underlying connection pool and avoid per-call setup overhead.
        self._aclient: Optional[anthropic.AsyncAnthropic] = (
            anthropic.AsyncAnthropic(api_key=api_key) if api_key else None
        )
        # Token usage tracking — updated after each API call
        self.last_usage: dict = {"input": 0, "output": 0}

    def _set_usage(self, input_tokens: int, output_tokens: int) -> None:
        """Record token usage after an API call."""
        self.last_usage = {"input": int(input_tokens), "output": int(output_tokens)}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _prepend_history(
        chat_history: Optional[List[Dict[str, str]]],
        final_content: Any,
    ) -> List[Dict[str, Any]]:
        """Return a messages list with history turns prepended.

        Anthropic requires strictly alternating user/assistant turns.
        We ensure the first message in the history is 'user'; if not we
        trim until it is. The final message is always the current user turn.
        """
        history = list(chat_history or [])
        # Drop leading assistant turns (Anthropic rejects non-user first)
        while history and history[0].get("role") != "user":
            history = history[1:]
        messages: List[Dict[str, Any]] = [
            {"role": h["role"], "content": h["content"]} for h in history
        ]
        messages.append({"role": "user", "content": final_content})
        return messages

    # ------------------------------------------------------------------

    def _build_content_blocks(
        self,
        user_message: str,
        notebook_context: Dict[str, Any],
    ) -> List[Any]:
        """Build Anthropic content blocks: user text + optional visualization images.

        Handles two image sources:
          1. Per-cell imageOutput — first image in each cell (existing behaviour).
          2. selectedOutput — a specific output the user right-clicked and sent to
             chat (image/png only; table/text outputs are included in the text body).
        """
        user_msg = self._build_user_message(user_message, notebook_context)
        blocks: List[Any] = [{"type": "text", "text": user_msg}]

        # ── 1. Specific selected output (highest priority) ──────────────────
        sel = notebook_context.get("selectedOutput")
        if sel and isinstance(sel, dict):
            mime      = sel.get("mimeType", "")
            img_data  = sel.get("imageData")
            text_data = sel.get("textData")
            label     = sel.get("label", "selected output")

            if img_data and mime.startswith("image"):
                media = "image/jpeg" if "jpeg" in mime else "image/png"
                blocks.append({"type": "text", "text": f"[User selected this specific output: {label}]"})
                blocks.append({"type": "image", "source": {"type": "base64", "media_type": media, "data": img_data}})
            elif text_data:
                blocks.append({"type": "text", "text": f"[User selected this specific output — {label}:\n{text_data}]"})

        # ── 2. Per-cell images (existing behaviour) ─────────────────────────
        for cell in notebook_context.get("cells", []):
            img = cell.get("imageOutput")
            if img:
                exec_count = cell.get("executionCount")
                label_c = (
                    f"exec:[{exec_count}]" if exec_count is not None
                    else f"pos:{cell.get('index', '?')}"
                )
                blocks.append({"type": "text", "text": f"[Visualization output from cell {label_c}:]"})
                blocks.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img}})

        return blocks

    async def plan_task(
        self,
        user_message: str,
        notebook_context: Dict[str, Any],
        skills: List[Dict[str, str]],
        memory: str,
        operation_id: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """Plan a task using Claude API with tool-use for reliable JSON output.

        Retries up to 3 times with exponential backoff on transient errors
        (overloaded / rate-limited / server errors).
        """
        if not self.api_key or not self._aclient:
            return self._fallback_response(user_message, operation_id)

        system_prompt = self._build_system_prompt(skills, memory)
        content_blocks = self._build_content_blocks(user_message, notebook_context)
        messages = self._prepend_history(chat_history, content_blocks)

        max_retries = 3
        base_delay = 2.0  # seconds

        for attempt in range(max_retries):
            try:
                response = await self._aclient.messages.create(
                    model=self.model,
                    max_tokens=8192,
                    system=system_prompt,
                    tools=[OPERATION_PLAN_TOOL],
                    tool_choice={"type": "any"},
                    messages=messages,
                )

                # Record token usage for this call
                if hasattr(response, "usage") and response.usage:
                    self._set_usage(
                        getattr(response.usage, "input_tokens", 0),
                        getattr(response.usage, "output_tokens", 0),
                    )

                # Extract the tool_use block - guaranteed structured output
                for block in response.content:
                    if block.type == "tool_use" and block.name == "create_operation_plan":
                        data = dict(block.input)
                        data["operationId"] = operation_id or f"op_{uuid.uuid4().hex[:8]}"
                        # Normalise clarificationNeeded: the LLM sometimes sets it
                        # to the *string* "null" instead of JSON null.  Treat both
                        # as absent so the retry gate and frontend behave correctly.
                        clarif = data.get("clarificationNeeded")
                        if not clarif or (isinstance(clarif, str) and clarif.strip().lower() == "null"):
                            data["clarificationNeeded"] = None
                        return data

                # Claude responded with text instead of a tool call
                text = next(
                    (b.text for b in response.content if hasattr(b, "text")),
                    "No response from Claude."
                )
                return {
                    "operationId": operation_id or f"op_{uuid.uuid4().hex[:8]}",
                    "steps": [],
                    "requiresApproval": False,
                    "clarificationNeeded": text,
                    "summary": "No operation plan returned"
                }

            except anthropic.AuthenticationError as e:
                raise RuntimeError(
                    "⛔ Claude API authentication failed. "
                    "Check that ANTHROPIC_API_KEY in your .env file is correct."
                ) from e

            except anthropic.PermissionDeniedError as e:
                raise RuntimeError(
                    "⛔ Claude API access denied. This usually means your Anthropic "
                    "account has run out of credits or this API key lacks permission. "
                    "Visit console.anthropic.com to check your billing status."
                ) from e

            except anthropic.BadRequestError as e:
                raise RuntimeError(f"Bad request to Claude API: {e}") from e

            except (anthropic.OverloadedError, anthropic.RateLimitError,
                    anthropic.InternalServerError, anthropic.APIConnectionError) as e:
                # Transient errors — retry with exponential backoff
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)  # 2s, 4s, 8s
                    await asyncio.sleep(delay)
                    continue
                raise RuntimeError(
                    f"Claude API unavailable after {max_retries} attempts: {e}"
                ) from e

            except Exception as e:
                raise RuntimeError(f"Claude API error: {e}") from e

    async def stream_plan_task(
        self,
        user_message: str,
        notebook_context: Dict[str, Any],
        skills: List[Dict[str, str]],
        memory: str,
        operation_id: Optional[str],
        on_text_chunk: Callable[[str], Awaitable[None]],
        on_json_delta: Optional[Callable[[str], Awaitable[None]]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """Stream pre-tool explanation text AND tool-call JSON deltas.

        Uses raw event iteration so we capture both:
          - text_delta  → on_text_chunk (Claude's explanation before the tool call)
          - input_json_delta → on_json_delta (the operation plan JSON being written)
        This eliminates the silent gap while Claude writes the JSON payload.
        """
        if not self.api_key or not self._aclient:
            return self._fallback_response(user_message, operation_id)

        system_prompt = self._build_system_prompt(skills, memory)
        content_blocks = self._build_content_blocks(user_message, notebook_context)
        messages = self._prepend_history(chat_history, content_blocks)

        max_retries = 3
        base_delay = 2.0

        for attempt in range(max_retries):
            try:
                async with self._aclient.messages.stream(
                    model=self.model,
                    max_tokens=8192,
                    system=system_prompt,
                    tools=[OPERATION_PLAN_TOOL],
                    # "auto" lets Claude emit explanation text before the tool call.
                    # With "any" Claude skips the preamble — nothing to stream.
                    tool_choice={"type": "auto"},
                    messages=messages,
                ) as stream:
                    # Iterate raw events to capture both text and tool-JSON deltas
                    async for event in stream:
                        if event.type != "content_block_delta":
                            continue
                        delta = event.delta
                        if delta.type == "text_delta":
                            await on_text_chunk(delta.text)
                            await asyncio.sleep(0)
                        elif delta.type == "input_json_delta" and on_json_delta:
                            await on_json_delta(delta.partial_json)
                            await asyncio.sleep(0)

                    final_msg = await stream.get_final_message()

                # Record token usage from the streaming response
                if hasattr(final_msg, "usage") and final_msg.usage:
                    self._set_usage(
                        getattr(final_msg.usage, "input_tokens", 0),
                        getattr(final_msg.usage, "output_tokens", 0),
                    )

                for block in final_msg.content:
                    if block.type == "tool_use" and block.name == "create_operation_plan":
                        data = dict(block.input)
                        data["operationId"] = operation_id or f"op_{uuid.uuid4().hex[:8]}"
                        # Normalise clarificationNeeded: the LLM sometimes sets it
                        # to the *string* "null" instead of JSON null.
                        clarif = data.get("clarificationNeeded")
                        if not clarif or (isinstance(clarif, str) and clarif.strip().lower() == "null"):
                            data["clarificationNeeded"] = None
                        return data

                # Claude responded with text only — no tool call made.
                # This can happen when the request is conversational. Surface
                # the text as an advisory (chat) response so the frontend renders
                # it as a message rather than a silent no-op.
                text_only = next(
                    (b.text for b in final_msg.content if hasattr(b, "text")), ""
                )
                # Strip stray bare-"null" tokens that the LLM writes when it
                # intends the JSON keyword null (e.g. "clarificationNeeded: null").
                text_only = _re.sub(r'(\s*\bnull\b)+\s*$', '', text_only).strip()
                return {
                    "operationId": operation_id or f"op_{uuid.uuid4().hex[:8]}",
                    "steps": [],
                    "requiresApproval": False,
                    "clarificationNeeded": None,
                    "chatResponse": text_only or "I'm not sure what to do — could you clarify?",
                    "cellInsertionMode": "chat",
                    "summary": "Advisory response",
                }

            except anthropic.AuthenticationError as e:
                raise RuntimeError(
                    "⛔ Claude API authentication failed. "
                    "Check that ANTHROPIC_API_KEY in your .env file is correct."
                ) from e

            except anthropic.PermissionDeniedError as e:
                raise RuntimeError(
                    "⛔ Claude API access denied. This usually means your Anthropic "
                    "account has run out of credits or this API key lacks permission. "
                    "Visit console.anthropic.com to check your billing status."
                ) from e

            except anthropic.BadRequestError as e:
                raise RuntimeError(f"Bad request to Claude API: {e}") from e

            except (anthropic.OverloadedError, anthropic.RateLimitError,
                    anthropic.InternalServerError, anthropic.APIConnectionError) as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue
                raise RuntimeError(
                    f"Claude API unavailable after {max_retries} attempts: {e}"
                ) from e

            except Exception as e:
                raise RuntimeError(f"Claude API streaming error: {e}") from e

    def _build_system_prompt(
        self,
        skills: List[Dict[str, str]],
        memory: str
    ) -> str:
        """Build the system prompt with skills and memory."""
        skills_section = ""
        for skill in skills:
            skills_section += f"\n### {skill['name']}\n{skill['content']}\n"

        if not skills_section:
            skills_section = "No specific skills loaded."

        memory_section = memory if memory.strip() else "No memory/preferences recorded yet."

        return SYSTEM_PROMPT_TEMPLATE.format(
            skills_section=skills_section,
            memory_section=memory_section
        )

    def _build_user_message(
        self,
        user_message: str,
        notebook_context: Dict[str, Any]
    ) -> str:
        """Build the user message with notebook context."""
        cells = notebook_context.get("cells", [])
        notebook_path = notebook_context.get("notebookPath", "unknown")
        active_cell_index = notebook_context.get("activeCellIndex")
        selection = notebook_context.get("selection")  # may be None

        context_lines = [
            f"## Notebook: {notebook_path}",
            f"## Total cells: {len(cells)}",
        ]
        if active_cell_index is not None:
            context_lines.append(f"## Active cell: pos:{active_cell_index}")
        context_lines += ["", "## Cell Contents:"]

        for cell in cells:
            idx = cell.get("index", 0)
            cell_type = cell.get("type", "code")
            source = cell.get("source", "")
            exec_count = cell.get("executionCount")
            output = cell.get("output")

            # Format: "pos:2  CODE  exec:[4]"
            # pos = position index to use in cellIndex field
            # exec = execution count the user sees as "[4]" in the notebook gutter
            parts = [f"pos:{idx}", cell_type.upper()]
            if exec_count is not None:
                parts.append(f"exec:[{exec_count}]")
            else:
                parts.append("exec:[not run]" if cell_type == "code" else "exec:[n/a]")

            context_lines.append("  ".join(parts))
            context_lines.append(source[:CELL_CONTENT_LIMIT] if source.strip() else "(empty)")
            if output and output.strip():
                context_lines.append(f"OUTPUT:\n{output[:CELL_CONTENT_LIMIT]}")
            elif cell.get("imageOutput"):
                context_lines.append("OUTPUT: [Visualization — image attached above]")
            context_lines.append("")

        context_str = "\n".join(context_lines)

        # Build selection block — shown prominently so the LLM can't miss it
        if selection and selection.get("text", "").strip():
            sel_cell = selection["text"]
            sel_idx = selection.get("cellIndex", "?")
            start_line = selection.get("startLine", "?")
            end_line = selection.get("endLine", "?")
            selection_block = (
                f"\n## ⚡ SELECTED TEXT (lines {start_line}–{end_line} of pos:{sel_idx})\n"
                f"The user has highlighted the following code in the active cell.\n"
                f"When the request refers to 'this', 'the selected code', 'it', etc., "
                f"operate on THIS text — not the whole cell.\n"
                f"```\n{sel_cell}\n```\n"
            )
        else:
            selection_block = ""

        # Append live DataFrame schemas if the frontend provided them
        df_section = format_dataframe_context(
            notebook_context.get("dataframes") or []
        )
        df_block = f"\n{df_section}" if df_section else ""

        return (
            f"## User Request\n{user_message}\n"
            f"{selection_block}\n"
            f"## Notebook Context\n{context_str}\n"
            f"{df_block}"
            "Please call the create_operation_plan tool with your response."
        )

    async def stream_chat(
        self,
        system: str,
        user: str,
        on_chunk: Callable[[str], Awaitable[None]],
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> None:
        """Stream a free-form chat response, calling on_chunk for each token."""
        if not self._aclient:
            await on_chunk("No API key configured.")
            return
        messages = self._prepend_history(chat_history, user)
        async with self._aclient.messages.stream(
            model=self.model,
            max_tokens=8192,
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                await on_chunk(text)
            final_chat = await stream.get_final_message()
            if hasattr(final_chat, "usage") and final_chat.usage:
                self._set_usage(
                    getattr(final_chat.usage, "input_tokens", 0),
                    getattr(final_chat.usage, "output_tokens", 0),
                )

    def _fallback_response(
        self,
        user_message: str,
        operation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Return a fallback when no API key is set."""
        return {
            "operationId": operation_id or f"op_{uuid.uuid4().hex[:8]}",
            "steps": [],
            "requiresApproval": False,
            "clarificationNeeded": (
                "WARNING: ANTHROPIC_API_KEY is not set. "
                "Please add it to your .env file in the notebook directory."
            ),
            "summary": "API key not configured"
        }
