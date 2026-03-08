"""Inference pipeline — detect coding patterns and generate long-term preferences.

Two phases:
  1. ``detect_patterns()``  — algorithmic scan of SummaryStore version history
                              (priority 1: symbol value consistency;
                               priority 2: import frequency)
  2. ``run_inference()``    — orchestrates detection + LLM preference generation
                              + PreferenceStore upsert

Triggered from ``SummaryStore.upsert()`` when ``_meta.versions_since_inference``
reaches the inference threshold (default: 10).
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Tuple

log = logging.getLogger(__name__)

_INFERENCE_TRIGGER_N = 10       # version writes between inference runs


# ---------------------------------------------------------------------------
# Pattern detection — priority 1: symbol value consistency
# ---------------------------------------------------------------------------

def _detect_symbol_value_patterns(
    summaries: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Flag symbol names whose values are identical across >= 3 distinct cells.

    Returns a list of pattern dicts with keys:
      type, symbol_name, symbol_value, symbol_type, cell_count
    """
    # symbol_name → list of (cell_id, value, value_type)
    symbol_obs: Dict[str, List[Tuple[str, Any, str]]] = defaultdict(list)

    for summary in summaries:
        cell_id = summary.get("cell_id", "")
        sv = summary.get("symbol_values") or {}
        st = summary.get("symbol_types")  or {}
        for name, value in sv.items():
            if not name or value is None:
                continue
            vtype = st.get(name, "unknown") if isinstance(st, dict) else "unknown"
            symbol_obs[name].append((cell_id, value, vtype))

    patterns = []
    for name, observations in symbol_obs.items():
        if len(observations) < 3:
            continue
        # Gather distinct cells (a symbol in the same cell multiple times counts once)
        distinct_cells: Dict[str, Any] = {}
        for cell_id, value, vtype in observations:
            distinct_cells[cell_id] = (value, vtype)

        if len(distinct_cells) < 3:
            continue

        # Check if the value is consistent (same value in all distinct cells)
        values = [v for v, _ in distinct_cells.values()]
        vtypes = [t for _, t in distinct_cells.values()]
        if len(set(str(v) for v in values)) == 1:
            patterns.append({
                "type":         "symbol_value_consistency",
                "symbol_name":  name,
                "symbol_value": values[0],
                "symbol_type":  vtypes[0],
                "cell_count":   len(distinct_cells),
            })

    return patterns


# ---------------------------------------------------------------------------
# Pattern detection — priority 2: import frequency
# ---------------------------------------------------------------------------

def _detect_import_patterns(
    summaries: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Flag import aliases that appear in >= 3 distinct import cells.

    Returns a list of pattern dicts with keys:
      type, alias, cell_count
    """
    alias_cells: Dict[str, set] = defaultdict(set)

    for summary in summaries:
        if not summary.get("is_import_cell"):
            continue
        cell_id = summary.get("cell_id", "")
        for sym in (summary.get("symbols_defined") or []):
            alias_cells[sym].add(cell_id)

    patterns = []
    for alias, cells in alias_cells.items():
        if len(cells) >= 3:
            patterns.append({
                "type":       "import_frequency",
                "alias":      alias,
                "cell_count": len(cells),
            })

    return patterns


# ---------------------------------------------------------------------------
# Public detection entry point
# ---------------------------------------------------------------------------

def detect_patterns(summaries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Run all enabled pattern detectors over *summaries*.

    Returns a combined list of raw pattern dicts from priorities 1 and 2.
    """
    p1 = _detect_symbol_value_patterns(summaries)
    p2 = _detect_import_patterns(summaries)
    return p1 + p2


# ---------------------------------------------------------------------------
# LLM preference generation
# ---------------------------------------------------------------------------

async def _generate_preference_entries(
    patterns: List[Dict[str, Any]],
    settings: dict,
) -> List[Dict[str, Any]]:
    """Call the Simple Tasks model to convert raw patterns into human-readable
    preference dicts.

    Returns a list of preference dicts (same schema as ``make_preference()``).
    Falls back to a deterministic template when the LLM is not configured or
    the call fails.
    """
    from .preference_store import make_preference

    if not patterns:
        return []

    # Deterministic fallback: build preference entries without LLM
    def _deterministic(pattern: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        ptype = pattern.get("type")
        if ptype == "symbol_value_consistency":
            name = pattern["symbol_name"]
            value = pattern["symbol_value"]
            sym_type = pattern.get("symbol_type", "value")
            content = f"Always sets {name}={value!r} ({sym_type})"
            return make_preference(
                pref_type="coding_style",
                content=content,
                source="inferred",
                keywords_include=[name, str(value)],
                evidence_count=pattern.get("cell_count", 3),
                consistent_count=pattern.get("cell_count", 3),
            )
        if ptype == "import_frequency":
            alias = pattern["alias"]
            content = f"Consistently imports using the alias '{alias}'"
            return make_preference(
                pref_type="library",
                content=content,
                source="inferred",
                keywords_include=[alias, "import"],
                evidence_count=pattern.get("cell_count", 3),
                consistent_count=pattern.get("cell_count", 3),
            )
        return None

    # Try LLM-enhanced generation
    try:
        from ..llm.factory import create_simple_task_provider
        provider = create_simple_task_provider(settings)
        if provider is None:
            raise ValueError("No Simple Tasks model configured")

        pattern_text = json.dumps(patterns, indent=2)
        system = (
            "You are a coding-assistant preference extractor. "
            "Given raw coding patterns detected from a user's notebook, generate "
            "human-readable preference descriptions. "
            "Reply with a JSON array where each element has exactly these keys: "
            "type (one of: coding_style, library, workflow, data_handling), "
            "content (a clear, actionable English statement ≤ 100 chars), "
            "keywords_include (list of relevant keyword strings). "
            "Do not include any other text."
        )
        user = f"Detected patterns:\n{pattern_text}\n\nGenerate one preference entry per pattern."

        raw = await provider.chat(system=system, user=user)
        if not raw:
            raise ValueError("Empty LLM response")

        m = re.search(r"\[.*\]", raw, re.DOTALL)
        if not m:
            raise ValueError("No JSON array in LLM response")

        llm_entries = json.loads(m.group())
        result = []
        for i, entry in enumerate(llm_entries):
            if not isinstance(entry, dict) or "content" not in entry:
                continue
            pattern = patterns[i] if i < len(patterns) else {}
            pref = make_preference(
                pref_type=entry.get("type", "workflow"),
                content=str(entry.get("content", ""))[:200],
                source="inferred",
                keywords_include=entry.get("keywords_include") or [],
                evidence_count=pattern.get("cell_count", 3),
                consistent_count=pattern.get("cell_count", 3),
            )
            result.append(pref)
        return result

    except Exception as exc:
        log.debug("LLM preference generation failed (%s) — using deterministic fallback", exc)
        return [p for p in (_deterministic(pat) for pat in patterns) if p is not None]


# ---------------------------------------------------------------------------
# Migration helper (LLM path) — called from task.py as background task
# ---------------------------------------------------------------------------

async def migrate_preferences_llm(
    pref_store: Any,   # PreferenceStore
    settings: dict,
) -> None:
    """Extract structured entries from legacy preferences.md using the Simple Tasks model.

    Sets a migration-in-progress sentinel, calls the LLM, upserts results into
    the notebook scope, then archives preferences.md.
    """
    pref_store.set_migration_in_progress()
    try:
        legacy_text = pref_store.get_legacy_text()
        if not legacy_text:
            pref_store.clear_migration_sentinel()
            return

        from ..llm.factory import create_simple_task_provider
        provider = create_simple_task_provider(settings)
        if provider is None:
            # Fall back to sync wrap
            pref_store.migrate_sync()
            pref_store.clear_migration_sentinel()
            return

        system = (
            "You are a preference extractor. "
            "Parse the following user preference notes and convert them into a JSON array. "
            "Each element should have: type (coding_style | library | workflow | data_handling), "
            "content (≤ 120 chars, clear English statement), keywords_include (list of strings). "
            "Reply with ONLY the JSON array."
        )
        user = f"Preference notes:\n\n{legacy_text[:3000]}"

        raw = await provider.chat(system=system, user=user)
        if raw:
            m = re.search(r"\[.*\]", raw, re.DOTALL)
            if m:
                from .preference_store import make_preference
                entries = json.loads(m.group())
                for entry in entries:
                    if not isinstance(entry, dict) or "content" not in entry:
                        continue
                    pref = make_preference(
                        pref_type=entry.get("type", "workflow"),
                        content=str(entry.get("content", ""))[:200],
                        source="explicit",
                        keywords_include=entry.get("keywords_include") or [],
                        evidence_count=1,
                        consistent_count=1,
                    )
                    scope = "notebook" if pref_store._paths.get("notebook") else "project"
                    pref_store.upsert(pref, scope=scope)

    except Exception as exc:
        log.warning("LLM migration failed (%s) — falling back to sync wrap", exc)
        pref_store.migrate_sync()
    finally:
        pref_store.clear_migration_sentinel()


# ---------------------------------------------------------------------------
# Main inference runner — called as background asyncio task
# ---------------------------------------------------------------------------

async def run_inference(root_dir: str, notebook_path: str, settings: dict) -> None:
    """Full inference pipeline: load summaries → detect patterns → generate preferences.

    Reads the SummaryStore for *notebook_path*, runs pattern detection, generates
    preference entries via LLM (or deterministic fallback), and upserts them into
    the PreferenceStore.

    Resets the inference counter in the SummaryStore on completion.
    """
    try:
        from ..context.summary_store import SummaryStore
        from .preference_store import PreferenceStore

        store = SummaryStore(root_dir, notebook_path)
        pref_store = PreferenceStore(root_dir, notebook_path)

        # Collect all current cell summaries (embed cell_id for pattern detectors)
        all_summaries_dict = store.get_all_current()
        all_summaries = [dict(v, cell_id=k) for k, v in all_summaries_dict.items()]
        if not all_summaries:
            store.reset_inference_counter()
            return

        # Pattern detection
        patterns = detect_patterns(all_summaries)
        if not patterns:
            store.reset_inference_counter()
            return

        # Generate preference entries
        new_entries = await _generate_preference_entries(patterns, settings)

        # Upsert into PreferenceStore (project scope for inferred preferences)
        for entry in new_entries:
            pref_store.upsert(entry, scope="project")

        log.info(
            "Varys inference: notebook=%s  patterns=%d  new_prefs=%d",
            notebook_path, len(patterns), len(new_entries),
        )

        store.reset_inference_counter()

    except Exception as exc:
        log.warning("Varys inference run failed: %s", exc)
