"""Central debug logging for Varys — single entry point for all feature instrumentation.

Usage
-----
    from varys.debug_logger import log

    log("scorer", "pruning_decision", {"query": "...", "kept": 3, "dismissed": 2})

All calls are no-ops when ``DEBUG_LOG=false`` (the default).  When enabled,
records are written as newline-delimited JSON to::

    DEBUG_LOG_DIR/<feature>/YYYY-MM-DD.jsonl

Configuration (via ~/.jupyter/varys.env)
-----------------------------------------
    DEBUG_LOG=true              # master switch
    DEBUG_LOG_DIR=~/.jupyter/varys_logs   # root directory for all logs

Design
------
- **Lazy initialisation**: config is read from ``os.environ`` on the *first*
  ``log()`` call, not at import time.  This avoids a cold-import race with
  ``app.py``'s startup parsing of ``varys.env``.
- **Thread-safe**: a module-level ``threading.Lock`` serialises all writes.
  Each record is a single ``json.dumps`` + newline, appended atomically.
- **Zero-overhead fast path**: after the first call, ``_enabled=False`` is
  checked without acquiring the lock, so disabled logging costs one boolean
  comparison per call.
"""
from __future__ import annotations

import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

_log = logging.getLogger(__name__)

# ── Module-level state (all protected by _lock) ───────────────────────────────

_lock:        threading.Lock = threading.Lock()
_initialized: bool           = False
_enabled:     bool           = False
_log_dir:     Path | None    = None


def _init() -> None:
    """Read ``DEBUG_LOG`` / ``DEBUG_LOG_DIR`` from ``os.environ`` and cache.

    Called exactly once — the caller must hold ``_lock``.
    """
    global _initialized, _enabled, _log_dir

    raw = os.environ.get("DEBUG_LOG", "false").strip().lower()
    _enabled = raw in ("1", "true", "yes", "on")

    if _enabled:
        raw_dir = os.environ.get("DEBUG_LOG_DIR", "~/.jupyter/varys_logs")
        _log_dir = Path(raw_dir).expanduser().resolve()
        _log.info("debug_logger: enabled — writing to %s", _log_dir)
    else:
        _log_dir = None
        _log.debug("debug_logger: disabled (DEBUG_LOG=%r)", raw)

    _initialized = True


# ── Public API ─────────────────────────────────────────────────────────────────


def log(feature: str, event: str, payload: Dict[str, Any]) -> None:
    """Write one structured debug log record.

    Args:
        feature: Logical subsystem name (e.g. ``"scorer"``, ``"assembler"``,
                 ``"inference"``).  Determines the output subdirectory:
                 ``DEBUG_LOG_DIR/<feature>/YYYY-MM-DD.jsonl``.
        event:   Short event identifier (e.g. ``"pruning_decision"``).
        payload: Arbitrary JSON-serialisable dict with event-specific data.
                 Non-serialisable values are coerced to strings via
                 ``json.dumps(default=str)``.

    Returns immediately without any I/O when ``DEBUG_LOG`` is false or unset.
    """
    # Fast path — skip lock acquisition once we know logging is disabled.
    if _initialized and not _enabled:
        return

    with _lock:
        if not _initialized:
            _init()
        if not _enabled:
            return

        now = datetime.now(timezone.utc)
        record: Dict[str, Any] = {
            "ts":      now.isoformat(),
            "feature": feature,
            "event":   event,
            **payload,
        }

        try:
            feat_dir = _log_dir / feature  # type: ignore[operator]
            feat_dir.mkdir(parents=True, exist_ok=True)
            day_file = feat_dir / f"{now.strftime('%Y-%m-%d')}.jsonl"
            with day_file.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(record, default=str) + "\n")
        except Exception as exc:
            _log.warning("debug_logger: could not write log record — %s", exc)
