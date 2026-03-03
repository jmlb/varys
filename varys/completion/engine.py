"""Inline completion engine — calls Claude to generate code suggestions."""
import re
from typing import Any, Dict, List, Optional

import anthropic

from .cache import CompletionCache
from ..utils.config import get_config as _get_cfg

# ---------------------------------------------------------------------------
# Default models (overridden by .env / CompletionEngine constructor)
# ---------------------------------------------------------------------------

DEFAULT_INLINE_MODEL = "claude-haiku-4-5-20251001"   # fast/cheap, <1 s
DEFAULT_MULTILINE_MODEL = "claude-sonnet-4-6"         # better reasoning, 2-3 s

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

INLINE_SYSTEM = (
    "You are a Python code completion assistant embedded in JupyterLab. "
    "Respond with ONLY the code to insert at the cursor — no explanation, "
    "no markdown fences, no trailing newline. "
    "The suggestion must be syntactically valid Python that completes the current expression or statement. "
    "Keep it to a single line or short expression."
)

MULTILINE_SYSTEM = (
    "You are a Python code completion assistant embedded in JupyterLab. "
    "Respond with ONLY valid Python code — no explanation, no markdown fences. "
    "Provide 3-5 lines that logically follow the cursor position. "
    "Use proper indentation. Match the coding style already present."
)


def _build_context_block(previous_cells: List[Dict[str, Any]]) -> str:
    """Format the last N executed cells as context."""
    if not previous_cells:
        return ""
    cfg = _get_cfg()
    n_cells = cfg.getint("context", "prev_cells", 5)
    cell_limit = cfg.getint("context", "cell_source_limit", 800)
    lines = ["# --- Notebook context (previous cells) ---"]
    for cell in previous_cells[-n_cells:]:
        src = cell.get("source", "").strip()
        if src:
            lines.append(src[:cell_limit])
            lines.append("")
    return "\n".join(lines)


def _extract_imports(cells: List[Dict[str, Any]]) -> str:
    """Pull all import lines from previous cells (cheap context)."""
    imports: List[str] = []
    for cell in cells:
        for line in cell.get("source", "").splitlines():
            if re.match(r"^\s*(import |from \w)", line):
                imports.append(line.strip())
    return "\n".join(dict.fromkeys(imports))  # deduplicate, preserve order


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class CompletionEngine:
    """Generate inline completions using the Anthropic API.

    Models are injected at construction time so the handler can pass
    values read from the .env file without touching module-level globals.
    """

    def __init__(
        self,
        api_key: str,
        inline_model: str = DEFAULT_INLINE_MODEL,
        multiline_model: str = DEFAULT_MULTILINE_MODEL,
    ) -> None:
        self._api_key = api_key
        self._inline_model = inline_model
        self._multiline_model = multiline_model
        self._cache = CompletionCache()
        # Async client reused across requests — avoids per-call setup overhead
        # and prevents blocking the Tornado event loop.
        self._aclient: Optional[anthropic.AsyncAnthropic] = (
            anthropic.AsyncAnthropic(api_key=api_key) if api_key else None
        )

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    async def complete(
        self,
        prefix: str,
        suffix: str,
        language: str,
        previous_cells: List[Dict[str, Any]],
        completion_type: str = "inline",
    ) -> Dict[str, Any]:
        """Return a completion dict: {suggestion, type, lines, cached}."""
        imports_snapshot = _extract_imports(previous_cells)
        cache_key = CompletionCache.make_key(
            prefix, language, completion_type, imports_snapshot
        )

        cached = self._cache.get(cache_key)
        if cached is not None:
            lines = cached.splitlines()
            return {
                "suggestion": cached,
                "type": completion_type,
                "lines": lines,
                "cached": True,
            }

        suggestion = await self._call_claude(prefix, suffix, previous_cells, completion_type)

        if suggestion:
            self._cache.set(cache_key, suggestion)

        lines = suggestion.splitlines() if suggestion else []
        return {
            "suggestion": suggestion,
            "type": completion_type,
            "lines": lines,
            "cached": False,
        }

    def cache_stats(self) -> Dict[str, Any]:
        return self._cache.stats()

    # ------------------------------------------------------------------
    # Private
    # ------------------------------------------------------------------

    async def _call_claude(
        self,
        prefix: str,
        suffix: str,
        previous_cells: List[Dict[str, Any]],
        completion_type: str,
    ) -> str:
        if not self._aclient:
            return ""
        is_multiline = completion_type == "multiline"
        context_block = _build_context_block(previous_cells)
        instruction = (
            "Provide 3-5 lines of code to insert at <CURSOR>. Output only the code."
            if is_multiline
            else "Complete the code at <CURSOR>. Output only the inserted text."
        )
        user_msg = (
            f"{context_block}\n\n"
            f"# --- Current cell ---\n"
            f"{prefix}<CURSOR>{suffix}\n\n"
            f"{instruction}"
        ).strip()

        cfg = _get_cfg()
        max_tok = (
            cfg.getint("tokens", "multiline_max_tokens", 512)
            if is_multiline
            else cfg.getint("tokens", "inline_max_tokens", 128)
        )
        response = await self._aclient.messages.create(
            model=self._multiline_model if is_multiline else self._inline_model,
            max_tokens=max_tok,
            system=MULTILINE_SYSTEM if is_multiline else INLINE_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        if not response.content or not hasattr(response.content[0], "text"):
            return ""
        raw = response.content[0].text.strip()
        return self._clean(raw)

    @staticmethod
    def _clean(text: str) -> str:
        """Strip markdown fences and leading/trailing blank lines."""
        # Remove ```python ... ``` or ``` ... ```
        text = re.sub(r"^```[a-z]*\n?", "", text, flags=re.MULTILINE)
        text = re.sub(r"\n?```$", "", text, flags=re.MULTILINE)
        return text.strip()
