"""Inline completion handler — /varys/complete"""
import json
import traceback

from jupyter_server.base.handlers import JupyterHandler
from tornado.web import authenticated

from ..llm.factory import create_provider
from ..utils.config import get_config as _get_cfg

_EMPTY = {"suggestion": "", "lines": []}


class CompleteHandler(JupyterHandler):
    """Handle inline completion requests from the frontend."""

    @authenticated
    async def post(self):
        self.set_header("Content-Type", "application/json")

        try:
            body = json.loads(self.request.body)
        except json.JSONDecodeError:
            self.set_status(400)
            self.finish(json.dumps({"error": "Invalid JSON body"}))
            return

        prefix = body.get("prefix", "")
        suffix = body.get("suffix", "")
        language = body.get("language", "python")
        previous_cells = body.get("previousCells", [])
        completion_type = body.get("completionType", "inline")

        min_prefix = _get_cfg().getint("context", "min_prefix_length", 2)
        if len(prefix.strip()) < min_prefix:
            self.finish(json.dumps({**_EMPTY, "type": completion_type}))
            return

        # Skip Anthropic key check when the completion task uses a different provider
        task = completion_type if completion_type in ("inline", "multiline") else "inline"
        active_provider = self.settings.get(f"ds_assistant_{task}_provider", "anthropic")
        if active_provider == "anthropic" and not self.settings.get("ds_assistant_anthropic_api_key"):
            self.finish(json.dumps({**_EMPTY, "type": completion_type}))
            return

        try:
            # Each completion type can use a different provider/model
            task = completion_type if completion_type in ("inline", "multiline") else "inline"
            provider = create_provider(self.settings, task=task)
            result = await provider.complete(
                prefix=prefix,
                suffix=suffix,
                language=language,
                previous_cells=previous_cells,
                completion_type=completion_type,
            )
            self.log.info(
                "Varys complete — prefix=%r  suggestion=%r  cached=%s",
                prefix[-40:], result.get("suggestion", ""), result.get("cached", False)
            )
            self.finish(json.dumps(result))

        except Exception:
            self.log.error(
                f"Varys completion error:\n{traceback.format_exc()}"
            )
            self.finish(json.dumps({**_EMPTY, "type": completion_type}))
