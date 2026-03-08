"""POST /varys/cell-lifecycle — cell delete / restore lifecycle events.

Receives lifecycle events from the frontend and updates the ``deleted`` flag
in the SummaryStore.  This endpoint is separate from /cell-executed because
the semantics differ: execution produces summaries, lifecycle events only
mutate a flag.

Expected request body:
  {
    "notebook_path": "relative/path/to/notebook.ipynb",
    "cell_id":       "<stable JupyterLab UUID>",
    "action":        "deleted" | "restored"
  }
"""
import json
import logging

from jupyter_server.base.handlers import JupyterHandler
from tornado.web import authenticated

log = logging.getLogger(__name__)


class CellLifecycleHandler(JupyterHandler):
    """Handle cell-removed and cell-added (restore) lifecycle events."""

    @authenticated
    async def post(self) -> None:
        self.set_header("Content-Type", "application/json")

        try:
            body: dict = json.loads(self.request.body.decode())
        except json.JSONDecodeError:
            self.set_status(400)
            self.finish(json.dumps({"error": "invalid JSON"}))
            return

        cell_id       = body.get("cell_id", "")
        notebook_path = body.get("notebook_path", "")
        action        = body.get("action", "")

        if not cell_id or not notebook_path or action not in ("deleted", "restored"):
            self.set_status(400)
            self.finish(json.dumps({
                "error": "cell_id, notebook_path, and action (deleted|restored) required"
            }))
            return

        try:
            from ..context.summary_store import SummaryStore
            root_dir = self.settings.get("ds_assistant_root_dir", ".")
            store    = SummaryStore(root_dir, notebook_path)

            if action == "deleted":
                store.mark_deleted(cell_id)
                log.debug("SummaryStore: marked deleted cell %s…", cell_id[:8])
            else:
                store.mark_restored(cell_id)
                log.debug("SummaryStore: marked restored cell %s…", cell_id[:8])

            self.finish(json.dumps({"ok": True}))

        except Exception as exc:
            log.warning("CellLifecycleHandler: %s", exc)
            self.set_status(500)
            self.finish(json.dumps({"error": str(exc)}))
