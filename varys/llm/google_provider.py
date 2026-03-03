"""Google Gemini provider — gemini-2.0-flash, gemini-1.5-pro, etc."""
import asyncio
import base64
import json
import logging
import re
import uuid
from typing import Any, Callable, Awaitable, Dict, List, Optional

from .base import BaseLLMProvider
from .openai_provider import _build_context, _INLINE_SYSTEM
from ..completion.cache import CompletionCache
from ..completion.engine import _build_context_block, _extract_imports

log = logging.getLogger(__name__)

_PLAN_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "steps": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "type": {"type": "STRING"},
                    "cellIndex": {"type": "INTEGER"},
                    "cellType": {"type": "STRING"},
                    "content": {"type": "STRING"},
                    "autoExecute": {"type": "BOOLEAN"},
                    "description": {"type": "STRING"},
                },
                "required": ["type", "cellIndex"],
            },
        },
        "requiresApproval": {"type": "BOOLEAN"},
        "clarificationNeeded": {"type": "STRING"},
        "summary": {"type": "STRING"},
    },
    "required": ["steps", "requiresApproval", "summary"],
}

_SYSTEM = """You are an expert data science assistant in JupyterLab.
pos:N = position index (use in cellIndex). exec:[N] = execution count.
When user says "cell N", find exec:[N] and use its pos as cellIndex.
Operations: insert / modify / delete / run_cell.
Always return a valid JSON operation plan.
"""


class GoogleProvider(BaseLLMProvider):
    """Calls the Google Gemini API via google-generativeai."""

    def __init__(
        self,
        api_key: str,
        chat_model: str = "gemini-2.0-flash",
        completion_model: str = "gemini-2.0-flash",
    ) -> None:
        super().__init__()
        self.api_key = api_key
        self.chat_model = chat_model
        self.completion_model = completion_model
        self._cache = CompletionCache()

    def _genai(self):
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            return genai
        except ImportError:
            raise RuntimeError(
                "google-generativeai not installed. Run: pip install google-generativeai"
            )

    def _build_system(self, skills: List[Dict[str, str]], memory: str) -> str:
        skills_text = "\n".join(f"### {s['name']}\n{s['content']}" for s in skills)
        system = _SYSTEM
        if skills_text:
            system += f"\n## Skills\n{skills_text}"
        if memory.strip():
            system += f"\n## Memory\n{memory}"
        return system

    async def plan_task(
        self,
        user_message: str,
        notebook_context: Dict[str, Any],
        skills: List[Dict[str, str]],
        memory: str,
        operation_id: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        op_id = operation_id or f"op_{uuid.uuid4().hex[:8]}"
        system = self._build_system(skills, memory)
        user_msg = _build_context(user_message, notebook_context)

        import google.generativeai.types as gtypes

        parts: List[Any] = [user_msg]
        if self.has_vision():
            for cell in notebook_context.get("cells", []):
                img = cell.get("imageOutput")
                if img:
                    ec = cell.get("executionCount")
                    label = f"exec:[{ec}]" if ec is not None else f"pos:{cell.get('index', '?')}"
                    parts.append(f"[Plot from cell {label}:]")
                    parts.append(gtypes.Part.from_data(
                        mime_type="image/png",
                        data=base64.b64decode(img),
                    ))

        genai = self._genai()
        model = genai.GenerativeModel(
            model_name=self.chat_model,
            system_instruction=system,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=_PLAN_SCHEMA,
                temperature=0.2,
                max_output_tokens=4096,
            ),
        )
        try:
            resp = await model.generate_content_async(parts)
            data = json.loads(resp.text)
            data.setdefault("operationId", op_id)
            data.setdefault("clarificationNeeded", None)
            return data
        except Exception as e:
            log.error("Google plan_task error: %s", e)
            raise RuntimeError(f"Google Gemini error: {e}") from e

    async def complete(
        self,
        prefix: str,
        suffix: str,
        language: str,
        previous_cells: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        imports = _extract_imports(previous_cells)
        cache_key = CompletionCache.make_key(prefix, language, "google-completion", imports)
        cached = self._cache.get(cache_key)
        if cached:
            return {"suggestion": cached, "type": "completion", "lines": cached.splitlines(), "cached": True}

        context = _build_context_block(previous_cells)
        prompt = (f"{context}\n\n{prefix}" if context else prefix)

        genai = self._genai()
        model = genai.GenerativeModel(
            model_name=self.completion_model,
            system_instruction=_INLINE_SYSTEM,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=256,
            ),
        )
        try:
            resp = await model.generate_content_async(f"Complete:\n{prompt}")
            raw = resp.text or ""
            suggestion = re.sub(r"^```[a-z]*\n?", "", raw.strip(), flags=re.MULTILINE)
            suggestion = re.sub(r"\n?```$", "", suggestion, flags=re.MULTILINE).strip()
            if suggestion:
                self._cache.set(cache_key, suggestion)
            return {"suggestion": suggestion, "type": "completion", "lines": suggestion.splitlines(), "cached": False}
        except Exception as e:
            log.warning("Google complete error: %s", e)
            return {"suggestion": "", "type": "completion", "lines": [], "cached": False}

    async def health_check(self) -> bool:
        try:
            genai = self._genai()
            await genai.list_models_async()
            return True
        except Exception:
            return False

    async def chat(
        self,
        system: str,
        user: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        genai = self._genai()
        model = genai.GenerativeModel(
            model_name=self.chat_model,
            system_instruction=system,
            generation_config=genai.GenerationConfig(temperature=0.3, max_output_tokens=8192),
        )
        # Build chat history for multi-turn support
        if chat_history:
            history = list(chat_history or [])
            while history and history[0].get("role") != "user":
                history = history[1:]
            gemini_history = []
            for turn in history:
                role = "user" if turn["role"] == "user" else "model"
                gemini_history.append({"role": role, "parts": [turn["content"]]})
            chat_session = model.start_chat(history=gemini_history)
            resp = await chat_session.send_message_async(user)
        else:
            resp = await model.generate_content_async(user)
        return resp.text or ""

    def has_vision(self) -> bool:
        """All Gemini 1.5+ and 2.0 models support vision."""
        return "gemini" in self.chat_model.lower()
