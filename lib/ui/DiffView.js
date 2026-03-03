"use strict";
/**
 * DiffView - Visual diff panel for pending AI edits.
 *
 * For 'modify' operations: shows per-hunk Accept / Reject toggles so the user
 * can keep only some of the AI's changes.  An "Apply" button reconstructs the
 * final cell content and calls onApplySelection.
 *
 * For 'insert' / 'delete' operations: a whole-cell Accept / Reject toggle.
 *
 * The existing "Accept All" / "Accept & Run" / "Undo All" buttons are still
 * available at the top of the card.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffView = void 0;
const react_1 = __importStar(require("react"));
const diffUtils_1 = require("../utils/diffUtils");
/** A single diff line rendered with gutter prefix + coloured background */
const DiffLineRow = ({ line }) => {
    if (line.text === '…') {
        return react_1.default.createElement("div", { className: "ds-diff-line ds-diff-line--ellipsis" }, "\u2026");
    }
    const prefix = line.type === 'insert' ? '+' : line.type === 'delete' ? '−' : ' ';
    const cls = line.type === 'insert' ? 'ds-diff-line ds-diff-line--insert'
        : line.type === 'delete' ? 'ds-diff-line ds-diff-line--delete'
            : 'ds-diff-line ds-diff-line--equal';
    return (react_1.default.createElement("div", { className: cls },
        react_1.default.createElement("span", { className: "ds-diff-gutter" }, prefix),
        react_1.default.createElement("span", { className: "ds-diff-content" }, line.text || '\u00a0')));
};
// ────────────────────────────────────────────────────────────────
// Per-hunk section inside a modify cell
// ────────────────────────────────────────────────────────────────
const HunkSection = ({ hunk, decision, onDecide }) => {
    const hasChanges = hunk.deletedLines.length > 0 || hunk.insertedLines.length > 0;
    const banner = decision === 'accepted' ? 'ds-hunk-banner--accepted'
        : decision === 'rejected' ? 'ds-hunk-banner--rejected'
            : '';
    return (react_1.default.createElement("div", { className: `ds-hunk-section ${banner}` },
        react_1.default.createElement("div", { className: "ds-hunk-bar" },
            react_1.default.createElement("span", { className: "ds-hunk-label" },
                hunk.deletedLines.length > 0 && (react_1.default.createElement("span", { className: "ds-hunk-del" },
                    "\u2212",
                    hunk.deletedLines.length)),
                hunk.insertedLines.length > 0 && (react_1.default.createElement("span", { className: "ds-hunk-ins" },
                    "+",
                    hunk.insertedLines.length)),
                "\u00A0lines"),
            hasChanges && (react_1.default.createElement("span", { className: "ds-hunk-btns" },
                react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--accept ${decision === 'accepted' ? 'ds-hunk-btn--active' : ''}`, onClick: () => onDecide(hunk.id, decision === 'accepted' ? 'pending' : 'accepted'), title: "Accept this change" }, "\u2713 Accept"),
                react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--reject ${decision === 'rejected' ? 'ds-hunk-btn--active' : ''}`, onClick: () => onDecide(hunk.id, decision === 'rejected' ? 'pending' : 'rejected'), title: "Reject this change" }, "\u2715 Reject")))),
        react_1.default.createElement("div", { className: "ds-diff-lines ds-diff-lines--hunk" }, hunk.displayLines.map((line, i) => (react_1.default.createElement(DiffLineRow, { key: i, line: line }))))));
};
// ────────────────────────────────────────────────────────────────
// Per-cell expandable section
// ────────────────────────────────────────────────────────────────
const CellDiffSection = ({ info, defaultOpen, onCellDecisions }) => {
    const [open, setOpen] = (0, react_1.useState)(defaultOpen);
    const diffLines = (0, react_1.useMemo)(() => (0, diffUtils_1.computeLineDiff)(info.original, info.modified), [info.original, info.modified]);
    const stats = (0, react_1.useMemo)(() => (0, diffUtils_1.getDiffStats)(diffLines), [diffLines]);
    const hunks = (0, react_1.useMemo)(() => (0, diffUtils_1.splitIntoHunks)(diffLines, 2), [diffLines]);
    // For 'modify' ops: per-hunk decisions
    const [hunkDecisions, setHunkDecisions] = (0, react_1.useState)({});
    // For 'insert'/'delete' ops: whole-cell decision
    const [wholeDecision, setWholeDecision] = (0, react_1.useState)('pending');
    const opLabel = info.opType === 'insert' ? 'new' : info.opType === 'delete' ? 'deleted' : 'modified';
    const statsLabel = info.opType === 'insert' ? `+${stats.insertions}`
        : info.opType === 'delete' ? `−${stats.deletions}`
            : `+${stats.insertions} / −${stats.deletions}`;
    const hasChanges = stats.insertions > 0 || stats.deletions > 0;
    // Determine if any decision has been made in this cell
    const decidedHunks = Object.values(hunkDecisions).filter(d => d !== 'pending').length;
    const totalHunks = hunks.length;
    const hasWholeChoice = info.opType !== 'modify' && wholeDecision !== 'pending';
    // Notify parent whenever decisions change for this cell
    const handleHunkDecide = (id, d) => {
        const next = Object.assign(Object.assign({}, hunkDecisions), { [id]: d });
        setHunkDecisions(next);
        // Reconstruct and bubble up
        const finalContent = (0, diffUtils_1.reconstructFromHunks)(diffLines, hunks, Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v === 'pending' ? 'accepted' : v])));
        onCellDecisions(info.cellIndex, finalContent, true);
    };
    const handleWholeDecide = (d) => {
        setWholeDecision(d);
        onCellDecisions(info.cellIndex, undefined, d !== 'rejected');
    };
    return (react_1.default.createElement("div", { className: "ds-diff-cell-section" },
        react_1.default.createElement("button", { className: "ds-diff-cell-header", onClick: () => setOpen(o => !o), title: info.description },
            react_1.default.createElement("span", { className: "ds-diff-cell-toggle" }, open ? '▾' : '▸'),
            react_1.default.createElement("span", { className: `ds-diff-op-badge ds-diff-op-badge--${info.opType}` }, opLabel),
            react_1.default.createElement("span", { className: "ds-diff-cell-type" }, info.cellType),
            react_1.default.createElement("span", { className: "ds-diff-cell-pos" },
                "pos:",
                info.cellIndex),
            info.description && react_1.default.createElement("span", { className: "ds-diff-cell-desc" }, info.description),
            hasChanges && react_1.default.createElement("span", { className: `ds-diff-stats ds-diff-stats--${info.opType}` }, statsLabel),
            info.opType === 'modify' && totalHunks > 0 && (react_1.default.createElement("span", { className: "ds-hunk-progress" },
                decidedHunks,
                "/",
                totalHunks,
                " decided"))),
        open && (react_1.default.createElement("div", { className: "ds-diff-cell-body" },
            info.opType !== 'modify' && (react_1.default.createElement("div", { className: "ds-hunk-bar ds-hunk-bar--whole" },
                react_1.default.createElement("span", { className: "ds-hunk-label" }, info.opType === 'insert' ? 'New cell' : 'Deleted cell'),
                react_1.default.createElement("span", { className: "ds-hunk-btns" },
                    react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--accept ${wholeDecision === 'accepted' ? 'ds-hunk-btn--active' : ''}`, onClick: () => handleWholeDecide(wholeDecision === 'accepted' ? 'pending' : 'accepted'), title: "Accept this cell" }, "\u2713 Accept"),
                    react_1.default.createElement("button", { className: `ds-hunk-btn ds-hunk-btn--reject ${wholeDecision === 'rejected' ? 'ds-hunk-btn--active' : ''}`, onClick: () => handleWholeDecide(wholeDecision === 'rejected' ? 'pending' : 'rejected'), title: "Reject this cell" }, "\u2715 Reject")),
                (hasWholeChoice) && (react_1.default.createElement("span", { className: `ds-hunk-status ${wholeDecision === 'accepted' ? 'ds-hunk-status--accepted' : 'ds-hunk-status--rejected'}` }, wholeDecision === 'accepted' ? '✓ Will keep' : '✕ Will discard')))),
            info.opType === 'modify' && hunks.length === 0 && (react_1.default.createElement("div", { className: "ds-diff-line ds-diff-line--equal" },
                react_1.default.createElement("span", { className: "ds-diff-gutter" }, " "),
                react_1.default.createElement("span", { className: "ds-diff-content ds-diff-empty" }, "(no changes)"))),
            info.opType === 'modify' && hunks.map(hunk => {
                var _a;
                return (react_1.default.createElement(HunkSection, { key: hunk.id, hunk: hunk, decision: (_a = hunkDecisions[hunk.id]) !== null && _a !== void 0 ? _a : 'pending', onDecide: handleHunkDecide }));
            }),
            info.opType !== 'modify' && (react_1.default.createElement("div", { className: "ds-diff-lines" }, (0, diffUtils_1.collapseContext)(diffLines, 3).map((line, i) => (react_1.default.createElement(DiffLineRow, { key: i, line: line })))))))));
};
// ────────────────────────────────────────────────────────────────
// Main DiffView component
// ────────────────────────────────────────────────────────────────
const DiffView = ({ operationId, description, diffs, onAccept, onAcceptAndRun, onUndo, onApplySelection, hasCodeCells, }) => {
    // Parent-level aggregation of per-cell decisions from child sections.
    // Key: cellIndex, Value: {finalContent, accept}
    const [cellDecisions, setCellDecisions] = (0, react_1.useState)(new Map());
    const handleCellDecision = (cellIndex, finalContent, accept) => {
        setCellDecisions(prev => {
            const next = new Map(prev);
            next.set(cellIndex, { finalContent, accept });
            return next;
        });
    };
    const decidedCount = cellDecisions.size;
    const hasAnyDecision = decidedCount > 0;
    const handleApply = () => {
        const decisions = diffs.map(d => {
            var _a;
            const cd = cellDecisions.get(d.cellIndex);
            return {
                cellIndex: d.cellIndex,
                opType: d.opType,
                finalContent: cd === null || cd === void 0 ? void 0 : cd.finalContent,
                accept: (_a = cd === null || cd === void 0 ? void 0 : cd.accept) !== null && _a !== void 0 ? _a : true, // default: accept
            };
        });
        onApplySelection(operationId, decisions);
    };
    const totalCells = diffs.length;
    const cellLabel = `${totalCells} cell${totalCells !== 1 ? 's' : ''}`;
    const defaultOpen = diffs.length === 1;
    const totalInsertions = diffs.reduce((s, d) => s + (0, diffUtils_1.getDiffStats)((0, diffUtils_1.computeLineDiff)(d.original, d.modified)).insertions, 0);
    const totalDeletions = diffs.reduce((s, d) => s + (0, diffUtils_1.getDiffStats)((0, diffUtils_1.computeLineDiff)(d.original, d.modified)).deletions, 0);
    const statsLabel = totalInsertions > 0 && totalDeletions > 0 ? `+${totalInsertions} / −${totalDeletions}`
        : totalInsertions > 0 ? `+${totalInsertions}`
            : totalDeletions > 0 ? `−${totalDeletions}`
                : '';
    return (react_1.default.createElement("div", { className: "ds-diff-view" },
        react_1.default.createElement("div", { className: "ds-diff-header" },
            react_1.default.createElement("div", { className: "ds-diff-header-info" },
                react_1.default.createElement("span", { className: "ds-diff-header-cells" }, cellLabel),
                description && (react_1.default.createElement("span", { className: "ds-diff-header-desc", title: description }, description)),
                statsLabel && react_1.default.createElement("span", { className: "ds-diff-header-stats" }, statsLabel)),
            react_1.default.createElement("div", { className: "ds-diff-header-actions" },
                react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-accept", onClick: () => onAccept(operationId), title: "Accept all changes in all cells" }, "\u2713 All"),
                hasCodeCells && (react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-accept-run", onClick: () => onAcceptAndRun(operationId), title: "Accept all changes and run code cells" }, "\u25B6 All & Run")),
                react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-apply", onClick: handleApply, disabled: !hasAnyDecision, title: hasAnyDecision
                        ? `Apply your ${decidedCount} cell decision(s)`
                        : 'Make at least one Accept/Reject choice below' }, "\u2726 Apply"),
                react_1.default.createElement("button", { className: "ds-assistant-btn ds-assistant-btn-undo", onClick: () => onUndo(operationId), title: "Undo all changes" }, "\u2715 Undo"))),
        !hasAnyDecision && (react_1.default.createElement("div", { className: "ds-diff-hint" },
            "Use \u2713 / \u2715 buttons on each change block to pick what to keep, then click ",
            react_1.default.createElement("strong", null, "\u2726 Apply"),
            ". Or use ",
            react_1.default.createElement("strong", null, "\u2713 All"),
            " to accept everything at once.")),
        react_1.default.createElement("div", { className: "ds-diff-cells" }, diffs.map((d, i) => (react_1.default.createElement(CellDiffSection, { key: i, info: d, defaultOpen: defaultOpen, onCellDecisions: handleCellDecision }))))));
};
exports.DiffView = DiffView;
//# sourceMappingURL=DiffView.js.map