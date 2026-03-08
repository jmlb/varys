"""Kernel-native relevance scorer for the no-focal-cell path.

Used to rank cells by importance when there is no explicit focal cell.

STATUS: Complete but DORMANT — cells are ranked but no hard budget cap is
applied yet.  When the budget-policy spec arrives, pruning is a one-liner:
  ranked = score_cells(...)
  keep   = ranked[:budget]          # prune to budget

Signal weights (spec §4):
  HIGH   (10) — symbol referenced in user query via @var
  HIGH   ( 8) — cell executed most recently (highest execution_count)
  HIGH   ( 8) — cell produced an error on last run
  MEDIUM ( 4) — symbol defined here consumed by N downstream cells (×N)
  LOW    ( 1) — import cell (low information content for query relevance)
  PENALTY(-2) — symbol no longer alive in kernel (×dead_count)
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

# ── Weight constants ───────────────────────────────────────────────────────────

W_AT_REF      = 10
W_RECENT_EXEC =  8
W_HAS_ERROR   =  8
W_FAN_OUT     =  4  # per downstream consumer cell
W_IMPORT      =  1
W_DEAD_SYMBOL = -2  # per dead symbol


# ── Public API ─────────────────────────────────────────────────────────────────


def score_cells(
    cell_order: List[Dict[str, Any]],
    summaries: Dict[str, Dict[str, Any]],
    user_query: str,
    kernel_live_names: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Score and rank active cells by relevance to user_query.

    Args:
        cell_order:        Ordered list of cell dicts (keys: cell_id, index, source).
        summaries:         {cell_id: summary} from SummaryStore.get_all_current().
        user_query:        Raw user message text.
        kernel_live_names: Variable names currently alive in the kernel.
                           Pass None to skip the dead-symbol penalty.

    Returns:
        The same cell_order list, each element augmented with a ``_score`` key,
        sorted descending by score.  Cells without a summary entry score 0.

    Note:
        Cells always appear in notebook order in the rendered prompt.
        This ranking drives pruning decisions only (budget cap TBD).
    """
    at_refs = _parse_at_refs(user_query)
    fan_out = _compute_fan_out(cell_order, summaries)

    # Max execution count for proportional recency scoring
    max_ec = max(
        (s.get("execution_count") or 0 for s in summaries.values()),
        default=1,
    ) or 1  # avoid division-by-zero

    live_set = set(kernel_live_names) if kernel_live_names is not None else None
    scored: List[Dict[str, Any]] = []

    for cell in cell_order:
        cell_id = cell.get("cell_id", "")
        summary = summaries.get(cell_id)
        score   = 0

        if summary:
            defined = set(summary.get("symbols_defined", []))
            ec      = summary.get("execution_count") or 0

            # @variable reference in user query
            if at_refs & defined:
                score += W_AT_REF

            # Recency: proportional 0 → W_RECENT_EXEC
            score += int(W_RECENT_EXEC * ec / max_ec)

            # Error bonus
            if summary.get("had_error"):
                score += W_HAS_ERROR

            # Fan-out bonus (how many downstream cells consume this cell's symbols)
            score += W_FAN_OUT * fan_out.get(cell_id, 0)

            # Import cell: low signal
            if summary.get("is_import_cell"):
                score += W_IMPORT

            # Dead symbol penalty
            if live_set is not None:
                dead_count = sum(1 for n in defined if n not in live_set)
                score += W_DEAD_SYMBOL * dead_count

        scored.append({**cell, "_score": score})

    # Stable sort descending (notebook order preserved for equal scores)
    scored.sort(key=lambda c: c["_score"], reverse=True)
    return scored


# ── Helpers ────────────────────────────────────────────────────────────────────


def _parse_at_refs(query: str) -> set:
    """Return the set of variable names referenced as @name in the query."""
    return set(re.findall(r"@([A-Za-z_]\w*)", query))


def _compute_fan_out(
    cell_order: List[Dict[str, Any]],
    summaries: Dict[str, Dict[str, Any]],
) -> Dict[str, int]:
    """Count how many downstream cells consume each cell's defined symbols.

    Returns {cell_id: downstream_consumer_count}.
    """
    # Most recent definition wins for each symbol
    last_definition: Dict[str, str] = {}
    fan_out: Dict[str, int] = {}

    for cell in cell_order:
        cell_id  = cell.get("cell_id", "")
        summary  = summaries.get(cell_id, {})
        consumed = set(summary.get("symbols_consumed", []))
        defined  = set(summary.get("symbols_defined", []))

        # Credit the cell that last defined each consumed symbol
        for sym in consumed:
            defining = last_definition.get(sym)
            if defining:
                fan_out[defining] = fan_out.get(defining, 0) + 1

        # Update last_definition for symbols defined here
        for sym in defined:
            last_definition[sym] = cell_id

    return fan_out
