"""Abstract base class for all LLM providers."""
from abc import ABC, abstractmethod
from typing import Any, Callable, Awaitable, Dict, List, Optional


class BaseLLMProvider(ABC):
    """
    Interface every LLM provider (Anthropic, Ollama, …) must implement.

    The two core methods map to the two request types the extension makes:
      - plan_task   — chat assistant: interpret user message, return cell ops
      - complete    — inline completion: suggest code at cursor position

    After each plan_task / stream_plan_task / chat / stream_chat call the
    provider should populate ``last_usage`` so callers can forward token
    counts to the frontend.  Providers that cannot report usage leave it as
    the zero dict.
    """

    def __init__(self) -> None:
        # { "input": int, "output": int } — updated after every LLM call
        self.last_usage: Dict[str, int] = {"input": 0, "output": 0}

    def _set_usage(self, input_tokens: int, output_tokens: int) -> None:
        """Helper: record token usage after an API call."""
        self.last_usage = {"input": int(input_tokens), "output": int(output_tokens)}

    @abstractmethod
    async def plan_task(
        self,
        user_message: str,
        notebook_context: Dict[str, Any],
        skills: List[Dict[str, str]],
        memory: str,
        operation_id: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        reasoning_mode: str = "off",
    ) -> Dict[str, Any]:
        """
        Analyse the user request and return an operation plan.

        Returns a dict matching the TaskResponse schema:
          {operationId, steps, requiresApproval, clarificationNeeded, summary}
        """

    @abstractmethod
    async def complete(
        self,
        prefix: str,
        suffix: str,
        language: str,
        previous_cells: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Return a code completion.

        Returns a dict matching the CompletionResult schema:
          {suggestion, type, lines, cached}
        """

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the provider is reachable and ready."""

    @abstractmethod
    async def chat(
        self,
        system: str,
        user: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """Free-form chat: send a system + user message and return raw text.

        Unlike plan_task (which enforces a JSON schema for cell operations),
        this method returns unstructured text — used for report generation
        and other open-ended tasks.
        """

    async def stream_chat(
        self,
        system: str,
        user: str,
        on_chunk: Callable[[str], Awaitable[None]],
        on_thought: Optional[Callable[[str], Awaitable[None]]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> None:
        """Stream a chat response, calling on_chunk for each text token.

        Default implementation buffers the full response via chat() and calls
        on_chunk once. Override in subclasses that support native streaming.
        """
        text = await self.chat(system=system, user=user, chat_history=chat_history)
        if text:
            await on_chunk(text)

    async def stream_plan_task(
        self,
        user_message: str,
        notebook_context: Dict[str, Any],
        skills: List[Dict[str, str]],
        memory: str,
        operation_id: Optional[str],
        on_text_chunk: Callable[[str], Awaitable[None]],
        on_json_delta: Optional[Callable[[str], Awaitable[None]]] = None,
        on_thought: Optional[Callable[[str], Awaitable[None]]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        reasoning_mode: str = "off",
    ) -> Dict[str, Any]:
        """Like plan_task but streams pre-tool text AND tool-call JSON deltas.

        - on_text_chunk: called with each text token Claude emits before the tool call.
        - on_json_delta: called with each raw partial-JSON string as Claude writes the
          tool-call arguments (the cell operation plan JSON).  Providers that do not
          support tool-call streaming can leave this as None.

        Default implementation: call plan_task normally (no streaming).
        Override in subclasses that support native streaming tool-use.
        """
        return await self.plan_task(
            user_message=user_message,
            notebook_context=notebook_context,
            skills=skills,
            memory=memory,
            operation_id=operation_id,
            chat_history=chat_history,
            reasoning_mode=reasoning_mode,
        )

    def has_vision(self) -> bool:
        """Return True if this provider/model can process image inputs.

        Override in subclasses that support vision.  Default is False so
        that new providers are conservative by default.
        """
        return False

    def has_sequential_thinking(self) -> bool:
        """Return True if the provider supports the MCP sequential thinking loop.

        Default is False.  Override in providers that implement the loop.
        """
        return False

    def build_system_prompt(
        self,
        skills: "List[Dict[str, str]]",
        memory: str,
        reasoning_mode: str = "off",
    ) -> str:
        """Return the system prompt used for cell-op planning.

        Default raises NotImplementedError so callers can detect absence.
        Override in providers that expose their internal prompt builder.
        """
        raise NotImplementedError(
            f"{type(self).__name__} does not implement build_system_prompt()"
        )

