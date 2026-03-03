---
command: /annotate
description: Number and title every code cell with a short markdown description
cell_insertion_mode: preview
keywords: [add title, add a title, add titles, add description, add a description, add descriptions, number section, number the section, number sections, numbered section, annotate, annotate the notebook, annotate cells, add header, add headers, add cell header, describe each cell, document each cell, describe the cells, section number, add numbered, add a title before, title each, title before each, label each cell, add short description, add a short description]
---
# Notebook Annotation Skill

You are annotating a notebook by inserting numbered title + description cells before
code cells. Follow the **two-phase protocol** below without skipping either phase.
Violating the ordering rules will produce an incorrect notebook.

---

## PHASE 1 — Pre-scan (do this mentally before generating any steps)

Before writing a single operation step, scan the notebook context and build a complete
picture:

### 1a. Find existing titled sections
Walk through every cell in order. A cell is already "titled" if it is:
- A MARKDOWN cell that starts with `#`, `##`, or `###` AND contains a number
  (e.g. `## 1.`, `## 2. Data Loading`, `### 1.2 Feature Engineering`).

Record each titled cell as: `{ pos: X, number: "N" or "N.M", heading: "..." }`

### 1b. Find code cells that need a title
Walk through every CODE cell. A code cell DOES NOT need a new title if the
immediately preceding cell (pos - 1) is already a titled markdown cell.
A code cell DOES need a new title if:
- It has no preceding cell at all, OR
- Its preceding cell is another code cell, OR
- Its preceding cell is a markdown cell that is NOT a numbered title.

Record each cell-needing-title as: `{ pos: X, needs_title: true }`

### 1c. Build the sequential numbering plan
Take every cell-needing-title from step 1b, in ascending position order.
Assign section numbers sequentially, starting after the highest existing section
number found in step 1a (or starting at 1 if no existing numbers were found).

**WRITE OUT THE PLAN in your reasoning** (not in the output):
```
Existing numbered cells: [list them]
Cells needing titles (ascending pos): [list them]
Number assignment: pos X → "## N. <Short Title>", pos Y → "## N+1. <Short Title>", ...
```

Verify the numbers are strictly sequential (1, 2, 3 … or continuation) before
proceeding to Phase 2. If they are not sequential, fix them before continuing.

---

## PHASE 2 — Generate insert steps

Now generate the `steps` array. **Critical rules:**

### 2a. Process cells in ASCENDING position order
Always iterate from pos:0 to pos:MAX. Never jump backwards.

### 2b. Track cumulative index shift
Start with `shift = 0`.
Each time you emit an `insert` step, increment `shift` by 1.
The `cellIndex` for any insert at original position X is: **X + shift** (at the
moment you insert it — shift is the count of all inserts already emitted above it).

Example with 3 code cells at original pos 1, 3, 5:
```
Insert title before pos 1:  cellIndex = 1 + 0 = 1,  shift becomes 1
Insert title before pos 3:  cellIndex = 3 + 1 = 4,  shift becomes 2
Insert title before pos 5:  cellIndex = 5 + 2 = 7,  shift becomes 3
```

### 2c. Title cell format
```markdown
## N. Short Descriptive Title
```
- Use `##` for top-level sections (not `#` which is reserved for the notebook title,
  not `###` which is for subsections).
- Title: 3–6 words, action-oriented (e.g. "Load and Inspect Data", "Train Model",
  "Evaluate Results").
- No trailing period after the title.

### 2d. Description cell format (when user asks for a description before each code cell)
If the user asked for a short description cell in addition to the title:
Insert ONE additional markdown cell immediately after the title cell (before the code cell):
```markdown
> Brief 1–2 sentence description of what the following code does and why.
```
Use a blockquote (`>`) for descriptions so they are visually distinct from titles.
Each description insert also increments shift by 1.

### 2e. Skip already-titled cells
If a code cell already has a preceding numbered title (identified in Phase 1a), do
NOT insert another title before it. You may still insert a description cell if one
is missing and the user asked for descriptions.

### 2f. autoExecute
All inserted cells are markdown. Set `autoExecute: false` for every step.

---

## FORMAT EXAMPLE

Notebook before annotation:
```
pos:0  MARKDOWN  "# My Analysis Notebook"
pos:1  CODE       import pandas as pd
pos:2  CODE       df = pd.read_csv('data.csv')
pos:3  MARKDOWN  "## 1. Data Inspection"
pos:4  CODE       df.head()
pos:5  CODE       df.describe()
```

Phase 1 scan:
- Existing numbered cells: pos:3 → "1."
- Code cells needing titles: pos:1 (no preceding title), pos:2 (preceding is code),
  pos:5 (preceding is code at pos:4 which has title at pos:3 — BUT pos:5's direct
  preceding is pos:4 which is CODE, not a titled markdown → needs title)
- Wait: pos:4 is preceded by pos:3 which IS a numbered title → pos:4 does NOT need title
- pos:5 is preceded by pos:4 which is CODE → pos:5 DOES need title
- Number assignment: pos:1 → "## 2.", pos:2 → "## 3.", pos:5 → "## 4."

Wait — existing number is "1.", new ones should start at 2.

Steps (shift starts at 0):
1. Insert `## 2. Import Libraries`  at cellIndex 1+0=1,  shift→1
2. Insert `## 3. Load Data`         at cellIndex 2+1=3,  shift→2
3. Insert `## 4. Summary Statistics` at cellIndex 5+2=7, shift→3

Final notebook order: pos:0 (title), pos:1 (##2 header), pos:2 (import), pos:3 (##3 header), pos:4 (load), pos:5 (##1 — existing), pos:6 (head), pos:7 (##4 header), pos:8 (describe) ✓
