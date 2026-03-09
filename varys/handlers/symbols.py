"""GET /varys/symbols — return all symbols defined in the current notebook.

Used by the frontend @-mention autocomplete to suggest variable names as the
user types.  Reads the SummaryStore and returns a flat, deduplicated list of
symbol names with their last-known type string and the 1-based cell position
where they were most recently defined.

Query parameters:
  notebook_path  — relative path to the notebook (required)
"""
import json
import logging

from jupyter_server.base.handlers import JupyterHandler
from tornado.web import authenticated

log = logging.getLogger(__name__)


class SymbolsHandler(JupyterHandler):
    """Return live symbol names for @-mention autocomplete."""

    @authenticated
    def get(self) -> None:
        self.set_header("Content-Type", "application/json")

        notebook_path = self.get_argument("notebook_path", "")
        if not notebook_path:
            self.finish(json.dumps({"symbols": []}))
            return

        root_dir = self.settings.get("ds_assistant_root_dir", ".")
        try:
            from ..context.summary_store import SummaryStore
            store    = SummaryStore(root_dir, notebook_path)
            current  = store.get_all_current()   # {cell_id: summary}

            # Build {name → (type_str, cell_id)} — last definition wins
            # We need notebook order, but get_all_current() gives us a dict
            # keyed by cell UUID.  We re-read the raw store to get insertion
            # order (JSON dicts preserve insertion order in Python 3.7+).
            raw_order = [k for k in store._load().keys() if k != "_meta"]

            name_to_info: dict[str, dict] = {}
            for cell_id in raw_order:
                summary = current.get(cell_id)
                if not summary:
                    continue
                sym_types = summary.get("symbol_types") or {}
                for name in summary.get("symbols_defined") or []:
                    name_to_info[name] = {
                        "name":  name,
                        "vtype": sym_types.get(name, ""),
                    }

            symbols = list(name_to_info.values())
            self.finish(json.dumps({"symbols": symbols}))

        except Exception as exc:
            log.debug("SymbolsHandler error: %s", exc)
            self.finish(json.dumps({"symbols": []}))
