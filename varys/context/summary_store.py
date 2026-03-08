"""Persistent, versioned cell summary store.

Storage path:
  <nb_base>/.jupyter-assistant/context/summary_store.json

JSON schema:
  {
    "<cell_id>": [
      {
        "version":   1,
        "hash":      "<sha256[:16]>",
        "timestamp": "<ISO-8601>",
        "summary":   { ... },
        "deleted":   false
      },
      ...
    ]
  }

Key invariants (from spec §2.1):
  - Keyed by stable JupyterLab cell UUID — never by position.
  - Entries are never deleted; a `deleted` flag is set instead (supports undo).
  - The active entry is always the LAST element: cell_id[-1].
  - A new version is appended only when sha256(cell.source) changes.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ..utils.paths import nb_base

log = logging.getLogger(__name__)

# Module-level mtime cache: absolute_path_str → (mtime, data_dict)
_STORE_CACHE: Dict[str, Tuple[float, Dict]] = {}


class SummaryStore:
    """Manages .jupyter-assistant/context/summary_store.json for one notebook."""

    def __init__(self, root_dir: str, notebook_path: str = "") -> None:
        self.root_dir = root_dir
        self.notebook_path = notebook_path
        self._store_path: Path = self._resolve_path()

    # ── Path resolution ────────────────────────────────────────────────────

    def _resolve_path(self) -> Path:
        base = nb_base(self.root_dir, self.notebook_path)
        ctx_dir = base / "context"
        ctx_dir.mkdir(parents=True, exist_ok=True)
        return ctx_dir / "summary_store.json"

    # ── I/O with mtime cache ───────────────────────────────────────────────

    def _load(self) -> Dict[str, List[Dict]]:
        """Return the store dict, using a mtime-based in-process cache."""
        key = str(self._store_path)
        if self._store_path.exists():
            try:
                mtime = self._store_path.stat().st_mtime
                cached = _STORE_CACHE.get(key)
                if cached and cached[0] == mtime:
                    return cached[1]
                data: Dict = json.loads(
                    self._store_path.read_text(encoding="utf-8")
                )
                _STORE_CACHE[key] = (mtime, data)
                return data
            except Exception as exc:
                log.warning("SummaryStore: could not load %s — %s", self._store_path, exc)
        return {}

    def _save(self, data: Dict[str, List[Dict]]) -> None:
        try:
            self._store_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            # Invalidate cache so the next _load() re-reads the file.
            _STORE_CACHE.pop(str(self._store_path), None)
        except Exception as exc:
            log.warning("SummaryStore: could not save %s — %s", self._store_path, exc)

    # ── Helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def _hash(source: str) -> str:
        return hashlib.sha256(source.encode()).hexdigest()[:16]

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    # ── Public API (spec §2.6) ─────────────────────────────────────────────

    def get_summary(self, cell_id: str) -> Optional[Dict[str, Any]]:
        """Return the active summary for cell_id, or None if never seen."""
        versions = self._load().get(cell_id, [])
        if not versions:
            return None
        return versions[-1].get("summary")

    def get_all_current(self, include_deleted: bool = False) -> Dict[str, Dict]:
        """Return {cell_id: summary} for the latest version of all cells.

        Excludes deleted cells unless include_deleted=True.
        """
        result: Dict[str, Dict] = {}
        for cell_id, versions in self._load().items():
            if not versions:
                continue
            last = versions[-1]
            if not include_deleted and last.get("deleted", False):
                continue
            summary = last.get("summary")
            if summary is not None:
                result[cell_id] = summary
        return result

    def upsert(self, cell_id: str, source: str, summary: Dict[str, Any]) -> bool:
        """Append a new version entry if source hash differs from the latest.

        Returns True if a new version was written, False if it was a no-op.
        """
        new_hash = self._hash(source)
        data = self._load()
        versions: List[Dict] = data.get(cell_id, [])

        # No-op if source is unchanged
        if versions and versions[-1].get("hash") == new_hash:
            return False

        entry: Dict[str, Any] = {
            "version":   len(versions) + 1,
            "hash":      new_hash,
            "timestamp": self._now(),
            "summary":   summary,
            "deleted":   False,
        }
        versions.append(entry)
        data[cell_id] = versions
        self._save(data)
        return True

    def mark_deleted(self, cell_id: str) -> None:
        """Set deleted=True on the latest version entry."""
        data = self._load()
        versions = data.get(cell_id, [])
        if versions:
            versions[-1]["deleted"] = True
            self._save(data)

    def mark_restored(self, cell_id: str) -> None:
        """Clear deleted flag on the latest version entry."""
        data = self._load()
        versions = data.get(cell_id, [])
        if versions:
            versions[-1]["deleted"] = False
            self._save(data)

    def get_version_history(self, cell_id: str) -> List[Dict]:
        """Return all version snapshots for a cell.

        Used by the long-term memory system (future feature).
        """
        return self._load().get(cell_id, [])
