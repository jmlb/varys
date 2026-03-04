"""Server extension application for Varys — your DS assistant for Jupyter Notebook."""
import os
from pathlib import Path

from jupyter_server.extension.application import ExtensionApp
from jupyter_server.utils import url_path_join

from .handlers.health import HealthHandler
from .handlers.task import TaskHandler
from .handlers.complete import CompleteHandler
from .handlers.ollama import (
    OllamaHealthHandler,
    OllamaModelsHandler,
    OllamaCheckInstallHandler,
)
from .handlers.settings import SettingsHandler
from .handlers.skills import SkillsListHandler, SkillHandler, CommandsHandler
from .handlers.bundled_skills import BundledSkillsHandler
from .utils.config import init_config
from .handlers.report import ReportHandler
from .handlers.wiki import WikiHandler
from .handlers.magic_task import MagicTaskHandler
from .handlers.chat_history import ChatHistoryHandler
from .handlers.rag import RAGLearnHandler, RAGStatusHandler, RAGForgetHandler, RAGAskHandler
from .modules.reproducibility_guardian.handler import (
    ReproAnalyzeHandler,
    ReproDismissHandler,
    ReproIssuesHandler,
)


class DSAssistantExtension(ExtensionApp):
    """Varys JupyterLab server extension."""

    name = "varys"
    default_url = "/varys"
    load_other_extensions = True

    def _load_env_file(self, path: Path) -> None:
        """Load key=value pairs from an env file into os.environ."""
        import re
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                stripped = line.strip()
                if not stripped or stripped.startswith("#"):
                    continue
                m = re.match(r"^([A-Z0-9_]+)\s*=\s*(.*)", stripped)
                if m:
                    key, val = m.group(1), m.group(2).strip()
                    val = re.sub(r"\s+#.*$", "", val).strip('"\'')
                    os.environ[key] = val
            self.log.info(f"Varys: Loaded env from {path}")
        except Exception as exc:
            self.log.warning(f"Varys: could not read {path}: {exc}")

    def initialize_settings(self):
        """Initialize extension settings."""
        self.log.info("Varys: Initializing settings")

        # Load ~/.jupyter/varys.env (user-level, persists across projects)
        # then optionally overlay with a project-level .env in root_dir.
        env_paths = [
            Path.home() / ".jupyter" / "varys.env",
            Path(self.serverapp.root_dir) / ".env",
        ]
        for env_path in env_paths:
            if env_path.exists():
                self._load_env_file(env_path)

        # Initialise the centralised config loader so every module can call
        # get_config() without needing the root_dir passed explicitly.
        cfg = init_config(str(self.serverapp.root_dir))
        self.log.info("Varys: Config loaded from %s/.jupyter-assistant/config/", self.serverapp.root_dir)

        # ----------------------------------------------------------------
        # Task routing: DS_CHAT_PROVIDER / DS_COMPLETION_PROVIDER
        # Values are provider names matching the .env blocks (e.g. ANTHROPIC).
        # Stored lower-case internally.
        # ----------------------------------------------------------------
        chat_provider       = os.environ.get("DS_CHAT_PROVIDER", "").upper()
        completion_provider = os.environ.get("DS_COMPLETION_PROVIDER", "").upper()

        providers_in_use = {chat_provider, completion_provider}
        settings_patch: dict = {
            "ds_assistant_root_dir":            self.serverapp.root_dir,
            "ds_assistant_chat_provider":       chat_provider.lower(),
            "ds_assistant_completion_provider": completion_provider.lower(),
        }

        # ----------------------------------------------------------------
        # Provider credentials (always loaded regardless of which providers
        # are active — the factory uses only what it needs)
        # ----------------------------------------------------------------
        settings_patch.update({
            # Anthropic
            "ds_assistant_anthropic_api_key":       os.environ.get("ANTHROPIC_API_KEY", ""),
            # OpenAI
            "ds_assistant_openai_api_key":          os.environ.get("OPENAI_API_KEY", ""),
            # Google
            "ds_assistant_google_api_key":          os.environ.get("GOOGLE_API_KEY", ""),
            # AWS Bedrock
            "ds_assistant_aws_profile":             os.environ.get("AWS_PROFILE", ""),
            "ds_assistant_aws_auth_refresh":        os.environ.get("AWS_AUTH_REFRESH", ""),
            "ds_assistant_aws_access_key_id":       os.environ.get("AWS_ACCESS_KEY_ID", ""),
            "ds_assistant_aws_secret_access_key":   os.environ.get("AWS_SECRET_ACCESS_KEY", ""),
            "ds_assistant_aws_session_token":       os.environ.get("AWS_SESSION_TOKEN", ""),
            "ds_assistant_aws_region":              os.environ.get("AWS_REGION", "us-east-1"),
            # Azure OpenAI
            "ds_assistant_azure_openai_api_key":    os.environ.get("AZURE_OPENAI_API_KEY", ""),
            "ds_assistant_azure_openai_endpoint":   os.environ.get("AZURE_OPENAI_ENDPOINT", ""),
            "ds_assistant_azure_openai_api_version": os.environ.get("AZURE_OPENAI_API_VERSION", "2024-02-01"),
            # Ollama
            "ds_assistant_ollama_url":              os.environ.get("OLLAMA_URL", "http://localhost:11434"),
            # OpenRouter
            "ds_assistant_openrouter_api_key":      os.environ.get("OPENROUTER_API_KEY", ""),
            "ds_assistant_openrouter_site_url":     os.environ.get("OPENROUTER_SITE_URL", ""),
            "ds_assistant_openrouter_site_name":    os.environ.get("OPENROUTER_SITE_NAME", "Varys"),
        })

        # Embedding provider routing
        embed_provider = os.environ.get("DS_EMBED_PROVIDER", "").upper()
        settings_patch["ds_assistant_embed_provider"] = embed_provider.lower()

        # Collect {PROVIDER}_{TASK}_MODEL for every provider
        all_providers = {"ANTHROPIC", "OLLAMA", "OPENAI", "GOOGLE", "BEDROCK", "AZURE", "OPENROUTER"}
        for provider in all_providers:
            for task in ("chat", "completion", "embed"):
                env_key  = f"{provider}_{task.upper()}_MODEL"
                sett_key = f"ds_assistant_{provider.lower()}_{task}_model"
                settings_patch[sett_key] = os.environ.get(env_key, "")

        self.settings.update(settings_patch)

        self.log.info(
            f"Varys: "
            f"chat={chat_provider or '(not set)'}  "
            f"completion={completion_provider or '(not set)'}  "
            f"embed={embed_provider or '(not set)'}"
        )

        # ----------------------------------------------------------------
        # Pre-load all skills from .jupyter-assistant/skills/ at startup
        # so the first request has zero disk-read latency.
        # ----------------------------------------------------------------
        try:
            from .skills.loader import SkillLoader
            skill_loader = SkillLoader(root_dir=self.serverapp.root_dir)
            skill_loader.preload()
            self.settings["ds_assistant_skill_loader"] = skill_loader
        except Exception as exc:
            self.log.warning("Varys: could not pre-load skills — %s", exc)

    def initialize_handlers(self):
        """Register URL handlers."""
        self.log.info("Varys: Registering handlers")
        base = self.default_url

        self.handlers.extend([
            (url_path_join(base, "health"), HealthHandler),
            (url_path_join(base, "task"), TaskHandler),
            (url_path_join(base, "complete"), CompleteHandler),
            # Ollama utility endpoints
            (url_path_join(base, "ollama", "health"), OllamaHealthHandler),
            (url_path_join(base, "ollama", "models"), OllamaModelsHandler),
            (url_path_join(base, "ollama", "check-install"), OllamaCheckInstallHandler),
            # Settings (read/write .env)
            (url_path_join(base, "settings"), SettingsHandler),
            # Skills (list / read / write .md files)
            (url_path_join(base, "skills"), SkillsListHandler),
            (url_path_join(base, r"skills/([\w\-]+)"), SkillHandler),
            (url_path_join(base, "bundled-skills"), BundledSkillsHandler),
            # Slash commands (built-ins + skill commands)
            (url_path_join(base, "commands"), CommandsHandler),
            # Report generation
            (url_path_join(base, "report"), ReportHandler),
            # Local wiki
            (url_path_join(base, "wiki"), WikiHandler),
            # %%ai magic — synchronous (non-SSE) chat endpoint
            (url_path_join(base, "magic"), MagicTaskHandler),
            # Chat thread persistence (GET / POST / DELETE)
            (url_path_join(base, "chat-history"), ChatHistoryHandler),
            (url_path_join(base, "reproducibility", "analyze"), ReproAnalyzeHandler),
            (url_path_join(base, "reproducibility", "dismiss"), ReproDismissHandler),
            (url_path_join(base, "reproducibility"),            ReproIssuesHandler),
            # RAG knowledge base
            (url_path_join(base, "rag", "learn"),  RAGLearnHandler),
            (url_path_join(base, "rag", "status"), RAGStatusHandler),
            (url_path_join(base, "rag", "forget"), RAGForgetHandler),
            (url_path_join(base, "rag", "ask"),    RAGAskHandler),
        ])
