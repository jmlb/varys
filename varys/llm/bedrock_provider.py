"""AWS Bedrock provider — Claude, Llama, Mistral models via Bedrock Converse API."""
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

_TOOL_CONFIG = {
    "tools": [
        {
            "toolSpec": {
                "name": "create_operation_plan",
                "description": "Create a plan of notebook cell operations.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "steps": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string"},
                                        "cellIndex": {"type": "integer"},
                                        "cellType": {"type": "string"},
                                        "content": {"type": "string"},
                                        "autoExecute": {"type": "boolean"},
                                        "description": {"type": "string"},
                                    },
                                    "required": ["type", "cellIndex"],
                                },
                            },
                            "requiresApproval": {"type": "boolean"},
                            "clarificationNeeded": {"type": "string"},
                            "summary": {"type": "string"},
                        },
                        "required": ["steps", "requiresApproval", "summary"],
                    }
                },
            }
        }
    ],
    "toolChoice": {"tool": {"name": "create_operation_plan"}},
}

_SYSTEM = """You are an expert data science assistant in JupyterLab.
pos:N = position index. exec:[N] = execution count (what user calls "cell N").
Operations: insert / modify / delete / run_cell.
Always call create_operation_plan with your response.
"""


class BedrockProvider(BaseLLMProvider):
    """Calls AWS Bedrock via the Converse API (boto3)."""

    def __init__(
        self,
        access_key_id: str,
        secret_access_key: str,
        region: str = "us-east-1",
        chat_model: str = "anthropic.claude-3-5-sonnet-20241022-v2:0",
        completion_model: str = "anthropic.claude-3-haiku-20240307-v1:0",
        session_token: str = "",
        aws_profile: str = "",
    ) -> None:
        super().__init__()
        self.access_key_id = access_key_id
        self.secret_access_key = secret_access_key
        self.session_token = session_token
        self.aws_profile = aws_profile
        self.region = region
        self.chat_model = chat_model
        self.completion_model = completion_model
        self._cache = CompletionCache()
        self._boto_client = self._make_client()

    def _make_client(self):
        try:
            import boto3
        except ImportError:
            raise RuntimeError("boto3 not installed. Run: pip install boto3")

        # Profile-based auth: use a named profile from ~/.aws/credentials.
        # Takes priority over explicit key/secret so the user only needs to
        # set AWS_PROFILE (or fill in the profile field in settings).
        if self.aws_profile:
            session = boto3.Session(
                profile_name=self.aws_profile,
                region_name=self.region,
            )
            return session.client("bedrock-runtime")

        # Explicit key auth (or fall through to boto3 default credential chain:
        # env vars → ~/.aws/credentials default profile → IAM role).
        kwargs: Dict[str, Any] = {
            "service_name": "bedrock-runtime",
            "region_name": self.region,
            "aws_access_key_id": self.access_key_id or None,
            "aws_secret_access_key": self.secret_access_key or None,
        }
        if self.session_token:
            kwargs["aws_session_token"] = self.session_token
        return boto3.client(**kwargs)

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

        content: List[Dict[str, Any]] = [{"text": user_msg}]
        if self.has_vision():
            for cell in notebook_context.get("cells", []):
                img = cell.get("imageOutput")
                if img:
                    ec = cell.get("executionCount")
                    label = f"exec:[{ec}]" if ec is not None else f"pos:{cell.get('index', '?')}"
                    content.append({"text": f"[Plot from cell {label}:]"})
                    content.append({
                        "image": {
                            "format": "png",
                            "source": {"bytes": base64.b64decode(img)},
                        }
                    })

        # Build messages list with history
        history = list(chat_history or [])
        while history and history[0].get("role") != "user":
            history = history[1:]
        messages = [{"role": h["role"], "content": [{"text": h["content"]}]} for h in history]
        messages.append({"role": "user", "content": content})

        def _call():
            resp = self._boto_client.converse(
                modelId=self.chat_model,
                system=[{"text": system}],
                messages=messages,
                toolConfig=_TOOL_CONFIG,
                inferenceConfig={"maxTokens": 4096, "temperature": 0.2},
            )
            for block in resp.get("output", {}).get("message", {}).get("content", []):
                if "toolUse" in block and block["toolUse"]["name"] == "create_operation_plan":
                    data = block["toolUse"]["input"]
                    data.setdefault("operationId", op_id)
                    data.setdefault("clarificationNeeded", None)
                    return data
            raise RuntimeError("No tool use block in Bedrock response")

        try:
            return await asyncio.get_running_loop().run_in_executor(None, _call)
        except Exception as e:
            log.error("Bedrock plan_task error: %s", e)
            raise RuntimeError(f"AWS Bedrock error: {e}") from e

    async def complete(
        self,
        prefix: str,
        suffix: str,
        language: str,
        previous_cells: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        imports = _extract_imports(previous_cells)
        cache_key = CompletionCache.make_key(prefix, language, "bedrock-completion", imports)
        cached = self._cache.get(cache_key)
        if cached:
            return {"suggestion": cached, "type": "completion", "lines": cached.splitlines(), "cached": True}

        context = _build_context_block(previous_cells)
        prompt = (f"{context}\n\n{prefix}" if context else prefix)

        def _call():
            resp = self._boto_client.converse(
                modelId=self.completion_model,
                system=[{"text": _INLINE_SYSTEM}],
                messages=[{"role": "user", "content": [{"text": f"Complete:\n{prompt}"}]}],
                inferenceConfig={"maxTokens": 256, "temperature": 0.1},
            )
            for block in resp.get("output", {}).get("message", {}).get("content", []):
                if "text" in block:
                    return block["text"]
            return ""

        try:
            raw = await asyncio.get_running_loop().run_in_executor(None, _call)
            suggestion = re.sub(r"^```[a-z]*\n?", "", raw.strip(), flags=re.MULTILINE)
            suggestion = re.sub(r"\n?```$", "", suggestion, flags=re.MULTILINE).strip()
            if suggestion:
                self._cache.set(cache_key, suggestion)
            return {"suggestion": suggestion, "type": "completion", "lines": suggestion.splitlines(), "cached": False}
        except Exception as e:
            log.warning("Bedrock complete error: %s", e)
            return {"suggestion": "", "type": "completion", "lines": [], "cached": False}

    async def health_check(self) -> bool:
        def _check():
            try:
                import boto3
                if self.aws_profile:
                    session = boto3.Session(profile_name=self.aws_profile, region_name=self.region)
                    client = session.client("bedrock")
                else:
                    client = boto3.client(
                        "bedrock",
                        region_name=self.region,
                        aws_access_key_id=self.access_key_id or None,
                        aws_secret_access_key=self.secret_access_key or None,
                    )
                client.list_foundation_models(byOutputModality="TEXT")
                return True
            except Exception:
                return False
        return await asyncio.get_running_loop().run_in_executor(None, _check)

    async def chat(
        self,
        system: str,
        user: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        history = list(chat_history or [])
        while history and history[0].get("role") != "user":
            history = history[1:]
        messages = [{"role": h["role"], "content": [{"text": h["content"]}]} for h in history]
        messages.append({"role": "user", "content": [{"text": user}]})

        def _call():
            resp = self._boto_client.converse(
                modelId=self.chat_model,
                system=[{"text": system}],
                messages=messages,
                inferenceConfig={"maxTokens": 8192, "temperature": 0.3},
            )
            for block in resp.get("output", {}).get("message", {}).get("content", []):
                if "text" in block:
                    return block["text"]
            return ""
        return await asyncio.get_running_loop().run_in_executor(None, _call)

    def has_vision(self) -> bool:
        name = self.chat_model.lower()
        return "claude-3" in name or "claude-sonnet" in name or "claude-haiku" in name
