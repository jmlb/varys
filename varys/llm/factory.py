"""Provider factory.

Resolution logic for a given task (chat | inline | multiline):

  1. Read  ds_assistant_{task}_provider        → e.g. "anthropic" or "ollama"
  2. Read  ds_assistant_{provider}_{task}_model → the model for that provider+task
  3. Collect provider-specific credentials     → api_key or ollama_url
  4. Instantiate the matching provider class

This means adding a new provider (e.g. openai) only requires:
  - Adding its .env block  (OPENAI_API_KEY, OPENAI_CHAT_MODEL, …)
  - Setting DS_CHAT_PROVIDER=OPENAI
  - Adding an OpenAIProvider class and a branch in _build_provider()
"""
import logging
from typing import Any, Dict, Literal

from .base import BaseLLMProvider
from .anthropic_provider import AnthropicProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider
from .google_provider import GoogleProvider
from .bedrock_provider import BedrockProvider
from .azure_provider import AzureProvider
from .openrouter_provider import OpenRouterProvider

log = logging.getLogger(__name__)

TaskType = Literal["chat", "inline", "multiline"]

# Module-level provider cache.
# Key: "{task}:{provider}:{model}:{cred_prefix}" — avoids re-instantiating
# providers (and their HTTP clients) on every request.
_provider_cache: Dict[str, "BaseLLMProvider"] = {}


def _cache_key(provider_name: str, task: str, model: str, settings: Dict[str, Any]) -> str:
    """Build a stable cache key from provider identity."""
    # Use first 8 chars of credential to detect key rotation without logging secrets.
    cred = (
        settings.get(f"ds_assistant_{provider_name}_api_key", "")
        or settings.get("ds_assistant_ollama_url", "")
        or settings.get("ds_assistant_aws_access_key_id", "")
    )
    return f"{task}:{provider_name}:{model}:{cred[:8]}"

# Built-in defaults used when the .env key is missing
_DEFAULTS: Dict[str, Dict[str, str]] = {
    "anthropic": {
        "chat":      "claude-sonnet-4-6",
        "inline":    "claude-haiku-4-5-20251001",
        "multiline": "claude-sonnet-4-6",
    },
    "ollama": {
        "chat":      "qwen2.5-coder:7b-instruct",
        "inline":    "qwen2.5-coder:7b-instruct",
        "multiline": "qwen2.5-coder:7b-instruct",
    },
    "openai": {
        "chat":      "gpt-4o",
        "inline":    "gpt-4o-mini",
        "multiline": "gpt-4o",
    },
    "google": {
        "chat":      "gemini-2.0-flash",
        "inline":    "gemini-2.0-flash",
        "multiline": "gemini-2.0-flash",
    },
    "bedrock": {
        "chat":      "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "inline":    "anthropic.claude-3-haiku-20240307-v1:0",
        "multiline": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    },
    "azure": {
        "chat":      "gpt-4o",
        "inline":    "gpt-4o-mini",
        "multiline": "gpt-4o",
    },
    "openrouter": {
        "chat":      "anthropic/claude-sonnet-4-6",
        "inline":    "google/gemini-2.0-flash",
        "multiline": "anthropic/claude-sonnet-4-6",
    },
}


def create_provider(settings: Dict[str, Any], task: TaskType = "chat") -> BaseLLMProvider:
    """
    Return a provider instance configured for *task*.

    Settings key conventions (set by app.py):
      ds_assistant_{task}_provider          → provider name (lower-case)
      ds_assistant_{provider}_{task}_model  → model for that combination
    """
    provider_name = settings.get(f"ds_assistant_{task}_provider", "anthropic").lower()
    model = (
        settings.get(f"ds_assistant_{provider_name}_{task}_model")
        or _DEFAULTS.get(provider_name, {}).get(task, "")
    )
    key = _cache_key(provider_name, task, model, settings)
    if key in _provider_cache:
        return _provider_cache[key]
    provider = _build_provider(provider_name, task, model, settings)
    _provider_cache[key] = provider
    return provider


def get_provider_info(settings: Dict[str, Any]) -> Dict[str, Dict[str, str]]:
    """Return provider + model for each task — used by the health endpoint."""
    result: Dict[str, Dict[str, str]] = {}
    for task in ("chat", "inline", "multiline"):
        provider_name = settings.get(f"ds_assistant_{task}_provider", "anthropic").lower()
        model = (
            settings.get(f"ds_assistant_{provider_name}_{task}_model")
            or _DEFAULTS.get(provider_name, {}).get(task, "")
        )
        result[task] = {"provider": provider_name, "model": model}
    return result


# ---------------------------------------------------------------------------
# Internal
# ---------------------------------------------------------------------------

def _build_provider(
    provider_name: str,
    task: str,
    model: str,
    settings: Dict[str, Any],
) -> BaseLLMProvider:
    log.info("Varys factory: task=%s  provider=%s  model=%s", task, provider_name, model)

    if provider_name == "ollama":
        return OllamaProvider(
            base_url=settings.get("ds_assistant_ollama_url", "http://localhost:11434"),
            chat_model=model,
            inline_model=model,
            multiline_model=model,
        )

    if provider_name == "anthropic":
        return AnthropicProvider(
            api_key=settings.get("ds_assistant_anthropic_api_key", ""),
            chat_model=model,
            inline_model=model,
            multiline_model=model,
        )

    if provider_name == "openai":
        return OpenAIProvider(
            api_key=settings.get("ds_assistant_openai_api_key", ""),
            chat_model=model,
            inline_model=model,
            multiline_model=model,
        )

    if provider_name == "google":
        return GoogleProvider(
            api_key=settings.get("ds_assistant_google_api_key", ""),
            chat_model=model,
            inline_model=model,
            multiline_model=model,
        )

    if provider_name == "bedrock":
        return BedrockProvider(
            access_key_id=settings.get("ds_assistant_aws_access_key_id", ""),
            secret_access_key=settings.get("ds_assistant_aws_secret_access_key", ""),
            session_token=settings.get("ds_assistant_aws_session_token", ""),
            region=settings.get("ds_assistant_aws_region", "us-east-1"),
            chat_model=model,
            inline_model=model,
            multiline_model=model,
        )

    if provider_name == "azure":
        return AzureProvider(
            api_key=settings.get("ds_assistant_azure_openai_api_key", ""),
            endpoint=settings.get("ds_assistant_azure_openai_endpoint", ""),
            api_version=settings.get("ds_assistant_azure_openai_api_version", "2024-02-01"),
            chat_model=model,
            inline_model=model,
            multiline_model=model,
        )

    if provider_name == "openrouter":
        return OpenRouterProvider(
            api_key=settings.get("ds_assistant_openrouter_api_key", ""),
            chat_model=model,
            inline_model=model,
            multiline_model=model,
            site_url=settings.get("ds_assistant_openrouter_site_url", ""),
            site_name=settings.get("ds_assistant_openrouter_site_name", "JupyterLab DS Assistant"),
        )

    raise ValueError(
        f"Unknown provider '{provider_name}' for task '{task}'. "
        "Supported: anthropic, ollama, openai, google, bedrock, azure, openrouter."
    )
