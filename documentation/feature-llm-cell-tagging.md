# Feature Brainstorm: LLM-Assisted Cell Tagging

**Status:** Proposal — open for brainstorm  
**Author:** Varys team  
**Date:** 2026-03-08

---

## 1. Problem Statement

Varys users can already attach coloured tag pills to notebook cells (e.g. `data-loading`, `todo`, `reviewed`, `training`).  
Currently, **tags are always applied manually** — the user must open the `[+]` overlay or the Tags panel to add them.

When the LLM creates or modifies a cell, it already understands the cell's purpose (it wrote the code). This is a missed opportunity: the LLM is in the best position to propose semantically appropriate tags at the moment the cell is born.

---

## 2. Proposed Behaviour

### 2a. Newly Created Cells (`insert` step)

When the LLM generates a brand-new cell:

- The LLM **automatically selects** one or more tags from the Tag Library.
- Tags are **written directly into the cell's metadata** (`cell.metadata.tags`) as part of the operation plan, without requiring user confirmation.
- Rationale: the cell is new — there are no prior user-defined tags to conflict with.

**Example:**
> User: *"Add a cell that loads the CSV file into a DataFrame."*  
> LLM creates cell → auto-applies `data-loading` tag.

---

### 2b. Modified Cells (`modify` step)

When the LLM rewrites or updates an existing cell:

- The LLM **proposes** one or more tags but does **not** apply them automatically.
- The suggestions appear as a **non-intrusive UI nudge** — e.g. a small inline prompt in the chat panel or a highlight on the cell's `[+]` button.
- The user can click to accept each suggested tag individually, or dismiss all.
- Rationale: the cell may already carry user-assigned tags that the LLM cannot fully evaluate (e.g. `reviewed`, `sensitive`, `report`). Auto-overwriting would be destructive.

**Example:**
> User: *"Refactor the training loop in #7."*  
> LLM modifies cell → suggests `training`, `needs-refactor` → shown as: *"Suggested tags for #7: [training] [needs-refactor] — Add?"*

---

## 3. Tag Selection Strategy

### Which tags can the LLM choose from?

The LLM has access to the **full Tag Library** (built-in + custom tags from `localStorage`), including each tag's `value`, `topic`, `description`, and `color`.  

The tag library should be injected into the system prompt (or the tool schema) so the LLM can make informed, grounded selections — not hallucinate tag names.

### How many tags per cell?

A cell should receive **0–3 tags** at most. Over-tagging is worse than under-tagging.

Suggested priority order:
1. **Topic tag** (what pipeline stage): `data-loading`, `training`, `evaluation`, …
2. **Status tag** (if clearly applicable): `todo`, `broken`, `draft`, …
3. **Report tag** (if the cell produces a key output): `figure`, `key-finding`, …

The LLM should **not** guess `reviewed` or `sensitive` — those are human-only judgements.

### Confidence threshold

The LLM should only propose a tag if it is confident the tag is relevant.  
An empty tag list (`[]`) is a valid and preferred output when the cell is generic or ambiguous.

---

## 4. Data Flow — Where Tags Live in the Operation Plan

Currently, a `create_operation_plan` step looks like:

```json
{
  "type": "insert",
  "cellIndex": 6,
  "cellType": "code",
  "content": "df = pd.read_csv('data.csv')",
  "autoExecute": true,
  "description": "Load CSV into DataFrame"
}
```

**Proposed extension** — add an optional `tags` field:

```json
{
  "type": "insert",
  "cellIndex": 6,
  "cellType": "code",
  "content": "df = pd.read_csv('data.csv')",
  "autoExecute": true,
  "description": "Load CSV into DataFrame",
  "tags": ["data-loading"],
  "tagMode": "auto"
}
```

For a modify step:

```json
{
  "type": "modify",
  "cellIndex": 12,
  "cellType": "code",
  "content": "...",
  "description": "Refactor training loop",
  "tags": ["training", "needs-refactor"],
  "tagMode": "suggest"
}
```

| `tagMode` | Behaviour |
|---|---|
| `"auto"` | Tags written to `cell.metadata.tags` immediately (insert only) |
| `"suggest"` | Tags surfaced as a UI nudge; user accepts/dismisses |
| omitted / `null` | No tag action |

---

## 5. Frontend Interaction — Suggested Tags UI

For `"suggest"` mode, a lightweight UI component appears in the chat panel after the operation completes:

```
┌─────────────────────────────────────────────────┐
│  💡 Suggested tags for cell #12                 │
│  [training]  [needs-refactor]   + Add all  ✕   │
└─────────────────────────────────────────────────┘
```

- Each tag pill is clickable → adds just that tag to the cell.
- `+ Add all` adds all suggestions at once.
- `✕` dismisses without adding anything.
- The nudge disappears after 30 seconds of inactivity or once the user takes an action.

---

## 6. System Prompt Changes

The Tag Library needs to be included in the system prompt so the LLM can make grounded choices.  
A new `{tags_section}` placeholder would be added to `SYSTEM_PROMPT_TEMPLATE`:

```
## Available Tags
Use these tags when populating the `tags` field of a step.
Only use tag `value` strings from this list — do NOT invent tags.

data-loading     (topic: ML Pipeline) — Cells that load data from files, databases, or APIs.
preprocessing    (topic: ML Pipeline) — Data cleaning, normalization, and transformation steps.
training         (topic: ML Pipeline) — Model training and fitting.
...
todo             (topic: Quality)     — Cell needs attention or further work.
reviewed         (topic: Quality)     — *** HUMAN ONLY — do not suggest ***
sensitive        (topic: Status)      — *** HUMAN ONLY — do not suggest ***
```

Some tags should be explicitly marked as **human-only** and excluded from LLM suggestions (e.g. `reviewed`, `sensitive`, `stable`).

---

## 7. Open Questions for Brainstorm

These are the key design decisions that need discussion:

### Q1 — Tag injection into `create_operation_plan` tool schema
Should the `tags` field be added to the **tool input schema** (forcing the LLM to always consider it), or kept as an **optional free-form field**?  
Pros/cons of strict schema vs. soft guidance.

### Q2 — Human-only tag list
Which tags should be **permanently excluded** from LLM suggestions?  
Candidates: `reviewed`, `sensitive`, `stable`, `deprecated`.  
How should this be communicated — in the prompt, or enforced at the backend?

### Q3 — Tag conflict resolution for modify steps
If a `modify` step suggests `training` but the cell already has `training`, should the suggestion be silently dropped or shown anyway as a confirmation?

### Q4 — Custom tags
The user can create custom tags with arbitrary descriptions. Should the LLM be allowed to suggest custom tags?  
Risk: LLM may suggest custom tags with poor fit if descriptions are vague.  
Option: only suggest custom tags if their description explicitly says "LLM-eligible" or similar.

### Q5 — Multi-step plans with multiple cells
If a plan creates 5 cells at once, should each cell get its own tag suggestion, or only the "main" cell?  
How should the suggestions UI handle N simultaneous nudges?

### Q6 — Tag suggestion persistence
If the user dismisses a tag suggestion, should it be remembered (not re-suggested on the next edit of the same cell)?

### Q7 — Tagging run_cell steps
A `run_cell` step doesn't change content. Should the LLM still suggest tags based on the cell's current content? Or only on insert/modify?

### Q8 — Feedback loop
Should accepted/rejected tag suggestions be fed back into Varys's **long-term memory** as a preference signal? E.g. *"User consistently rejects `todo` tag on training cells → stop suggesting it."*

### Q9 — Tag suggestion latency
Tag suggestion adds reasoning overhead to the LLM response. Is it acceptable to run tag selection **after** the main operation plan (as a second streaming pass), or must it be part of the same tool call?

### Q10 — No-notebook context (chat-only mode)
In pure chat mode (no cell operations), should the LLM be able to suggest tags retroactively for the active cell?

---

## 8. Out of Scope (for now)

- Bulk re-tagging of an entire existing notebook (separate feature: "Tag Audit").
- Tag-based cell filtering / hiding in the notebook view.
- Tag-driven report export (`report` / `report-exclude` tags controlling output).
- Tag search / jump-to within the Tags panel (already partially implemented).

---

## 9. Relevant Existing Code

| File | Relevance |
|---|---|
| `varys/llm/client.py` | `SYSTEM_PROMPT_TEMPLATE` — where `{tags_section}` would be added |
| `varys/handlers/task.py` | `_run_mcp_tool_loop`, `TaskHandler` — where `tags` from step dicts would be applied |
| `varys/builtin_tools/` | `create_operation_plan` tool schema — `tags` field to be added here |
| `src/tags/cellTagOverlay.ts` | Frontend: writes tags to `cell.model.metadata.tags` |
| `src/tags/TagsPanel.tsx` | `BUILT_IN_TAG_DEFS`, `CustomTagDef` — the tag library to inject into prompt |
| `src/sidebar/SidebarWidget.tsx` | Chat panel — where the suggestion nudge UI would live |

---

## 10. Success Criteria

A successful implementation should satisfy:

1. **Accuracy** — at least 80% of auto-applied tags on new cells are judged as "correct" by the user (no manual removal needed).
2. **Non-intrusiveness** — tag suggestions on modified cells never block or delay the user workflow.
3. **No false positives on human-only tags** — `reviewed`, `sensitive`, `stable` are never auto-applied or suggested.
4. **Graceful degradation** — if the LLM returns no `tags` field, the feature silently does nothing.
5. **Custom tag support** — user-defined tags from localStorage are included in the LLM's candidate set.
