"""Persistent chat-thread storage for DS Assistant.

Storage layout
--------------
  <notebook_dir>/.jupyter-assistant/chats/
      {notebook_stem}_{md5_of_relative_path[:8]}.json

Using the full relative path for the MD5 guarantees that two notebooks with
the same filename in different subdirectories get distinct chat files while
keeping the filename human-readable.

JSON schema
-----------
  {
    "notebook_path": "relative/path/to/notebook.ipynb",
    "last_thread_id": "t_abc123",
    "threads": [
      {
        "id": "t_abc123",
        "name": "Main",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T01:00:00Z",
        "messages": [
          {"id": "m1", "role": "user",      "content": "...", "timestamp": "..."},
          {"id": "m2", "role": "assistant", "content": "...", "timestamp": "..."}
        ]
      }
    ]
  }

Endpoints
---------
  GET  /varys/chat-history?notebook=<rel_path>
       → returns the full chat file (threads + messages)

  POST /varys/chat-history
       body: { notebookPath, thread: {id, name, messages, ...} }
       → upserts the thread (creates or replaces by id) and updates last_thread_id

  DELETE /varys/chat-history?notebook=<rel_path>&threadId=<id>
       → removes the thread; if it was the last_thread_id, updates to the next one
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from jupyter_server.base.handlers import JupyterHandler

from ..utils.paths import nb_base

log = logging.getLogger(__name__)

# ── File helpers ──────────────────────────────────────────────────────────────

def _chat_path(root_dir: str, notebook_rel: str) -> Path:
    """Return the path of the JSON chat file for a notebook.

    The file lives in the notebook's own directory under .jupyter-assistant/chats/
    so each project folder keeps its history self-contained.

    Args:
        root_dir:     Absolute path of the JupyterLab notebook directory.
        notebook_rel: Notebook path relative to root_dir
                      (e.g. "sales/analysis.ipynb").
    """
    stem = Path(notebook_rel).stem
    # Keep a short hash so that renames don't silently merge threads.
    short_hash = hashlib.md5(notebook_rel.encode()).hexdigest()[:8]
    chat_dir = nb_base(root_dir, notebook_rel) / "chats"
    chat_dir.mkdir(parents=True, exist_ok=True)
    return chat_dir / f"{stem}_{short_hash}.json"


def _load(root_dir: str, notebook_rel: str) -> Dict[str, Any]:
    path = _chat_path(root_dir, notebook_rel)
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            log.warning("Varys chat: could not load %s — %s", path, exc)
    return {"notebook_path": notebook_rel, "last_thread_id": None, "threads": []}


def _save(root_dir: str, notebook_rel: str, data: Dict[str, Any]) -> None:
    path = _chat_path(root_dir, notebook_rel)
    try:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        log.warning("Varys chat: could not save %s — %s", path, exc)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_path(root_dir: str, notebook_path: str) -> str:
    """Convert an absolute or root-relative notebook path to a relative path."""
    if os.path.isabs(notebook_path):
        try:
            return os.path.relpath(notebook_path, root_dir)
        except ValueError:
            # On Windows, relpath can fail across drives
            return Path(notebook_path).name
    return notebook_path


# ── Handler ───────────────────────────────────────────────────────────────────

class ChatHistoryHandler(JupyterHandler):
    """GET / POST / DELETE chat thread storage."""

    def _root(self) -> str:
        return self.settings.get("ds_assistant_root_dir", ".")

    # ── GET ───────────────────────────────────────────────────────────────────

    def get(self) -> None:
        notebook = self.get_query_argument("notebook", "")
        if not notebook:
            self.set_status(400)
            self.finish(json.dumps({"error": "notebook query parameter required"}))
            return

        notebook_rel = _normalize_path(self._root(), notebook)
        data = _load(self._root(), notebook_rel)
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(data))

    # ── POST ──────────────────────────────────────────────────────────────────

    def post(self) -> None:
        try:
            body: Dict[str, Any] = json.loads(self.request.body.decode())
        except json.JSONDecodeError:
            self.set_status(400)
            self.finish(json.dumps({"error": "invalid JSON"}))
            return

        notebook_path: str = body.get("notebookPath", "")
        thread: Dict[str, Any] = body.get("thread", {})
        if not notebook_path or not thread.get("id"):
            self.set_status(400)
            self.finish(json.dumps({"error": "notebookPath and thread.id required"}))
            return

        root = self._root()
        notebook_rel = _normalize_path(root, notebook_path)
        data = _load(root, notebook_rel)

        threads: List[Dict] = data.get("threads", [])
        # Upsert: replace existing thread with matching id or append
        thread["updated_at"] = _now()
        if not thread.get("created_at"):
            thread["created_at"] = thread["updated_at"]
        idx = next((i for i, t in enumerate(threads) if t["id"] == thread["id"]), None)
        if idx is not None:
            threads[idx] = thread
        else:
            threads.append(thread)

        data["threads"] = threads
        data["last_thread_id"] = thread["id"]
        data["notebook_path"] = notebook_rel

        _save(root, notebook_rel, data)
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"ok": True, "filename": _chat_path(root, notebook_rel).name}))

    # ── DELETE ────────────────────────────────────────────────────────────────

    def delete(self) -> None:
        notebook = self.get_query_argument("notebook", "")
        thread_id = self.get_query_argument("threadId", "")
        if not notebook or not thread_id:
            self.set_status(400)
            self.finish(json.dumps({"error": "notebook and threadId query params required"}))
            return

        root = self._root()
        notebook_rel = _normalize_path(root, notebook)
        data = _load(root, notebook_rel)

        threads: List[Dict] = [t for t in data.get("threads", []) if t["id"] != thread_id]
        data["threads"] = threads

        if data.get("last_thread_id") == thread_id:
            data["last_thread_id"] = threads[-1]["id"] if threads else None

        _save(root, notebook_rel, data)
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"ok": True, "remaining": len(threads)}))
