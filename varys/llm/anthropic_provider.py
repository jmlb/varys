"""Anthropic Claude provider — wraps ClaudeClient and CompletionEngine."""
from typing import Any, Callable, Awaitable, Dict, List, Optional

from .base import BaseLLMProvider
from .client import ClaudeClient
from ..completion.engine import CompletionEngine


class AnthropicProvider(BaseLLMProvider):
    """
    Delegates to the existing ClaudeClient (tool-use structured output)
    for task planning, and to CompletionEngine (Haiku/Sonnet) for inline
    completions.
    """

    def __init__(
        self,
        api_key: str,
        chat_model: str = "claude-sonnet-4-6",
        completion_model: str = "claude-haiku-4-5-20251001",
    ) -> None:
        super().__init__()
        self._chat_client = ClaudeClient(api_key=api_key, model=chat_model)
        self._completion_engine = CompletionEngine(
            api_key=api_key,
            completion_model=completion_model,
        )

    async def plan_task(
        self,
        user_message: str,
        notebook_context: Dict[str, Any],
        skills: List[Dict[str, str]],
        memory: str,
        operation_id: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        result = await self._chat_client.plan_task(
            user_message=user_message,
            notebook_context=notebook_context,
            skills=skills,
            memory=memory,
            operation_id=operation_id,
            chat_history=chat_history,
        )
        self.last_usage = self._chat_client.last_usage
        return result

    async def complete(
        self,
        prefix: str,
        suffix: str,
        language: str,
        previous_cells: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        return await self._completion_engine.complete(
            prefix=prefix,
            suffix=suffix,
            language=language,
            previous_cells=previous_cells,
        )

    async def chat(
        self,
        system: str,
        user: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        if not self._chat_client._aclient:
            return "No API key configured."
        messages = self._chat_client._prepend_history(chat_history, user)
        resp = await self._chat_client._aclient.messages.create(
            model=self._chat_client.model,
            max_tokens=8192,
            system=system,
            messages=messages,
        )
        if hasattr(resp, "usage") and resp.usage:
            self._set_usage(
                getattr(resp.usage, "input_tokens", 0),
                getattr(resp.usage, "output_tokens", 0),
            )
        return resp.content[0].text if resp.content else ""

    async def stream_chat(
        self,
        system: str,
        user: str,
        on_chunk: Callable[[str], Awaitable[None]],
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> None:
        await self._chat_client.stream_chat(
            system=system, user=user, on_chunk=on_chunk, chat_history=chat_history
        )
        self.last_usage = self._chat_client.last_usage

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
        result = await self._chat_client.stream_plan_task(
            user_message=user_message,
            notebook_context=notebook_context,
            skills=skills,
            memory=memory,
            operation_id=operation_id,
            on_text_chunk=on_text_chunk,
            on_json_delta=on_json_delta,
            chat_history=chat_history,
        )
        self.last_usage = self._chat_client.last_usage
        return result

    async def health_check(self) -> bool:
        try:
            if not self._chat_client._aclient:
                return False
            await self._chat_client._aclient.models.list()
            return True
        except Exception:
            return False

    def has_vision(self) -> bool:
        """All Claude 3+ models support vision."""
        return True
