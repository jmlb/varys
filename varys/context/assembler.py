"""Context assembler — composes the LLM context from summaries + full-fidelity cells.

Implements spec §3 (Context Assembly Rule) and the serialisation formats from §3.4.

Integration pattern
-------------------
task.py calls ``assemble_context()`` and stores the result in
``notebook_context['_cell_context_override']``.  ``build_notebook_context()``
in context_utils.py then uses that pre-built string in place of the old
truncation loop.  All other parts of the prompt (header, selection, @variables,
DataFrames, selectedOutput) remain unchanged.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from .summary_store import SummaryStore
from .scorer import score_cells

# ── Focal cell detection ───────────────────────────────────────────────────────

# Matches "cell 10", "cell[10]", "cell #10", "#10"
_CELL_REF_RE = re.compile(r"(?:cell\s*[\[#]?\s*|#\s*)(\d+)", re.IGNORECASE)


def detect_focal_cell(
    user_query: str,
    active_cell_id: Optional[str],
    cell_order: List[Dict[str, Any]],
    summary_store: SummaryStore,
) -> Optional[str]:
    """Resolve the focal cell UUID in priority order (spec §3.2).

    Priority:
    1. Explicit "cell N" / "#N" reference in query → cell at position N-1
    2. active_cell_id (JupyterLab focus)
    3. @variable reference → cell where var was most recently defined
    4. None  (no-focal-cell path)
    """
    ids_in_order = [c.get("cell_id", "") for c in cell_order]

    # P1: explicit "#N" or "cell N" in the query
    m = _CELL_REF_RE.search(user_query)
    if m:
        n   = int(m.group(1))
        idx = n - 1          # spec: #N = Nth cell from top → index N-1
        if 0 <= idx < len(cell_order):
            return cell_order[idx].get("cell_id")

    # P2: active cell reported by JupyterLab
    if active_cell_id and active_cell_id in ids_in_order:
        return active_cell_id

    # P3: @variable reference → find most-recently-defining cell
    at_refs = set(re.findall(r"@([A-Za-z_]\w*)", user_query))
    if at_refs:
        for cell in reversed(cell_order):
            cid     = cell.get("cell_id", "")
            summary = summary_store.get_summary(cid)
            if summary:
                if at_refs & set(summary.get("symbols_defined", [])):
                    return cid

    return None


# ── Public entry point ─────────────────────────────────────────────────────────


def assemble_context(
    user_query: str,
    cell_order: List[Dict[str, Any]],
    summary_store: SummaryStore,
    active_cell_id: Optional[str] = None,
    focal_cell_full_output: Optional[str] = None,
) -> str:
    """Build the cell-context string for injection into the LLM prompt.

    Args:
        user_query:              Raw user message text.
        cell_order:              Ordered list of cell dicts from notebookContext.cells.
                                 Expected keys: cellId (or cell_id), index, source,
                                 type, output, executionCount.
        summary_store:           SummaryStore instance for this notebook.
        active_cell_id:          UUID of the JupyterLab-focused cell, or None.
        focal_cell_full_output:  Untruncated output of the focal cell (from
                                 notebookContext.focalCellOutput).  Falls back to
                                 the cell dict's ``output`` field when absent.

    Returns:
        A multi-line string describing all cells, ready to be embedded as the
        cell-context block in the system prompt.
    """
    norm = _normalize_cells(cell_order)
    active = [c for c in norm if not _is_deleted(c["cell_id"], summary_store)]

    if not active:
        return "(no cells in notebook)"

    focal_id = detect_focal_cell(user_query, active_cell_id, active, summary_store)
    active_ids = {c["cell_id"] for c in active}

    # No-focal path: return all cells as summaries (ranked, but order preserved)
    if focal_id is None or focal_id not in active_ids:
        return _build_all_summaries(active, summary_store, user_query)

    focal_idx = next(i for i, c in enumerate(active) if c["cell_id"] == focal_id)
    parts: List[str] = []

    # Pre-focal → compact summary blocks
    for cell in active[:focal_idx]:
        parts.append(_format_summary_cell(cell, summary_store))

    # Focal cell → full source + full output
    parts.append(_format_focal_cell(active[focal_idx], focal_cell_full_output))

    # Post-focal cells are omitted, EXCEPT if the query explicitly references one
    if focal_idx + 1 < len(active):
        downstream_ref = _find_downstream_ref(user_query, active[focal_idx + 1:])
        if downstream_ref:
            parts.append(
                f"(downstream cell referenced in query)\n"
                + _format_summary_cell(downstream_ref, summary_store)
            )

    return "\n".join(parts)


# ── Serialisation helpers (spec §3.4) ─────────────────────────────────────────


def _format_summary_cell(cell: Dict[str, Any], store: SummaryStore) -> str:
    """Compact summary block for a pre-focal cell."""
    position = cell["index"] + 1   # 1-based for the LLM
    cell_id  = cell["cell_id"]
    summary  = store.get_summary(cell_id)

    if summary is None:
        # Never executed — show snippet with label
        source  = cell.get("source", "")
        snippet = source[:300] if source else "(empty)"
        return (
            f"--- Cell {position} [not yet executed] ---\n"
            f"{snippet}\n"
            f"---"
        )

    ctype = summary.get("cell_type", "code")
    lines = [
        f"--- Cell {position} [summary] ---",
        f"Type: {ctype}",
    ]

    if ctype == "code":
        defined   = summary.get("symbols_defined", [])
        consumed  = summary.get("symbols_consumed", [])
        sym_vals  = summary.get("symbol_values", {})
        sym_types = summary.get("symbol_types", {})
        output    = summary.get("output")
        ec        = summary.get("execution_count")

        if defined:
            lines.append(f"Defines: {', '.join(defined)}")
        if consumed:
            # Annotate consumed names with their known values
            c_parts = [
                f"{s}={repr(sym_vals[s])}" if s in sym_vals else s
                for s in consumed
            ]
            lines.append(f"Consumes: {', '.join(c_parts)}")
        if sym_types:
            lines.append(f"Types: {', '.join(f'{k}={v}' for k, v in sym_types.items())}")
        if output:
            snippet = output[:200] + (" […]" if len(output) > 200 else "")
            lines.append(f'Output: "{snippet}"')
        if summary.get("had_error"):
            lines.append(f"⚠️ Error: {summary.get('error_text', 'unknown')}")
        if summary.get("is_import_cell"):
            lines.append("(import cell)")
        if summary.get("is_mutation_only"):
            snip = summary.get("source_snippet", "")[:200]
            lines.append(f"Source: {snip}")
        if ec is not None:
            lines.append(f"Execution: [{ec}]")
    else:
        # Markdown / raw: show snippet
        snippet = summary.get("source_snippet", "")
        if snippet:
            lines.append(snippet)
        if summary.get("truncated"):
            lines.append("[markdown section truncated — summary only]")

    lines.append("---")
    return "\n".join(lines)


def _format_focal_cell(
    cell: Dict[str, Any],
    full_output: Optional[str],
) -> str:
    """Full-fidelity block for the focal cell (spec §3.4)."""
    position = cell["index"] + 1
    source   = cell.get("source", "(empty)")
    # Prefer untruncated output from the request payload; fall back to cell dict
    output   = full_output or cell.get("output") or ""

    lines = [
        f"--- Cell {position} [FULL SOURCE — user query target] ---",
        source,
    ]
    if output.strip():
        lines.append("\nOUTPUT:")
        lines.append(output)
    lines.append("---")
    return "\n".join(lines)


def _build_all_summaries(
    active_cells: List[Dict[str, Any]],
    store: SummaryStore,
    user_query: str,
) -> str:
    """No-focal path: all active cells as summary blocks.

    The scorer ranks cells, but we always render in notebook order.
    """
    summaries = store.get_all_current()
    # Score for potential future pruning (no budget cap applied yet)
    score_cells(active_cells, summaries, user_query)

    # Always render in notebook order regardless of scores
    parts = [
        _format_summary_cell(cell, store)
        for cell in sorted(active_cells, key=lambda c: c["index"])
    ]
    return "\n".join(parts)


# ── Utility helpers ────────────────────────────────────────────────────────────


def _normalize_cells(cell_order: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure every cell dict has a ``cell_id`` key (maps ``cellId`` if needed)."""
    result = []
    for c in cell_order:
        cid = c.get("cell_id") or c.get("cellId") or ""
        result.append({**c, "cell_id": cid})
    return result


def _is_deleted(cell_id: str, store: SummaryStore) -> bool:
    """Return True if this cell's latest entry is marked deleted in the store."""
    versions = store._load().get(cell_id, [])
    return bool(versions) and bool(versions[-1].get("deleted", False))


def _find_downstream_ref(
    user_query: str,
    downstream_cells: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """Return a downstream cell if the query explicitly references it by number."""
    m = _CELL_REF_RE.search(user_query)
    if not m:
        return None
    n   = int(m.group(1))
    idx = n - 1
    for cell in downstream_cells:
        if cell.get("index") == idx:
            return cell
    return None
