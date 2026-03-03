"use strict";
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
exports.ReproPanel = void 0;
const react_1 = __importStar(require("react"));
const store_1 = require("./store");
const IssueCard = ({ issue, onFix, onDismiss }) => {
    const [fixing, setFixing] = (0, react_1.useState)(false);
    const [dismissing, setDismissing] = (0, react_1.useState)(false);
    const handleFix = async () => {
        setFixing(true);
        try {
            await onFix(issue);
        }
        finally {
            setFixing(false);
        }
    };
    const handleDismiss = async () => {
        setDismissing(true);
        try {
            await onDismiss(issue);
        }
        finally {
            setDismissing(false);
        }
    };
    return (react_1.default.createElement("div", { className: `ds-repro-card ds-repro-card--${issue.severity}` },
        react_1.default.createElement("div", { className: "ds-repro-card-header" },
            react_1.default.createElement("span", { className: "ds-repro-card-title" }, issue.title),
            react_1.default.createElement("span", { className: "ds-repro-card-loc" },
                "Cell ",
                issue.cell_index)),
        react_1.default.createElement("div", { className: "ds-repro-card-message" }, issue.message),
        react_1.default.createElement("details", { className: "ds-repro-card-details" },
            react_1.default.createElement("summary", null, "Why it matters"),
            react_1.default.createElement("div", { className: "ds-repro-card-explanation" }, issue.explanation)),
        react_1.default.createElement("div", { className: "ds-repro-card-suggestion" }, issue.suggestion),
        react_1.default.createElement("div", { className: "ds-repro-card-actions" },
            issue.fix_code && (react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--fix", disabled: fixing, onClick: handleFix }, fixing ? '…' : '⚡ Fix')),
            react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--dismiss", disabled: dismissing, onClick: handleDismiss }, dismissing ? '…' : 'Dismiss'))));
};
const Section = ({ severity, label, icon, issues, onFix, onDismiss }) => {
    if (issues.length === 0)
        return null;
    return (react_1.default.createElement("div", { className: `ds-repro-section ds-repro-section--${severity}` },
        react_1.default.createElement("div", { className: "ds-repro-section-title" },
            icon,
            " ",
            label,
            " ",
            react_1.default.createElement("span", { className: "ds-repro-section-count" },
                "(",
                issues.length,
                ")")),
        issues.map(issue => (react_1.default.createElement(IssueCard, { key: issue.id, issue: issue, onFix: onFix, onDismiss: onDismiss })))));
};
// ---------------------------------------------------------------------------
// ReproPanel
// ---------------------------------------------------------------------------
const ReproPanel = ({ apiClient, cellEditor, notebookReader }) => {
    const [issues, setIssues] = (0, react_1.useState)(store_1.reproStore.current);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [lastAnalyzed, setLastAnalyzed] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    // Subscribe to updates pushed from index.ts cell-execution listener
    (0, react_1.useEffect)(() => {
        const handler = (newIssues) => {
            setIssues(newIssues);
            setLastAnalyzed(new Date());
            setError(null);
        };
        store_1.reproStore.subscribe(handler);
        // Load persisted issues for the current notebook on mount
        const ctx = notebookReader.getFullContext();
        if (ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) {
            apiClient.getReproIssues(ctx.notebookPath).then(result => {
                if (result.issues.length > 0) {
                    setIssues(result.issues);
                }
            }).catch(() => { });
        }
        return () => store_1.reproStore.unsubscribe(handler);
    }, []);
    const handleAnalyze = (0, react_1.useCallback)(async () => {
        var _a, _b, _c;
        setLoading(true);
        setError(null);
        try {
            const ctx = notebookReader.getFullContext();
            const result = await apiClient.analyzeReproducibility({
                notebookPath: (_a = ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
                cells: (_b = ctx === null || ctx === void 0 ? void 0 : ctx.cells) !== null && _b !== void 0 ? _b : [],
            });
            setIssues(result.issues);
            setLastAnalyzed(new Date());
            store_1.reproStore.emit(result.issues);
        }
        catch (err) {
            setError((_c = err === null || err === void 0 ? void 0 : err.message) !== null && _c !== void 0 ? _c : 'Analysis failed');
        }
        finally {
            setLoading(false);
        }
    }, [apiClient, notebookReader]);
    const handleFix = (0, react_1.useCallback)(async (issue) => {
        var _a;
        if (!issue.fix_code)
            return;
        // Insert/update the cell at the issue's cell_index with the fix code
        try {
            await cellEditor.updateCell(issue.cell_index, issue.fix_code);
        }
        catch (_b) {
            // If updateCell fails (e.g., insert-type fix), insert a new cell
            cellEditor.insertCell(issue.cell_index + 1, 'code', issue.fix_code);
        }
        // Dismiss from DB so it disappears from the panel
        const ctx = notebookReader.getFullContext();
        await apiClient.dismissReproIssue({
            notebookPath: (_a = ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
            issueId: issue.id,
        });
        setIssues(prev => prev.filter(i => i.id !== issue.id));
    }, [apiClient, cellEditor, notebookReader]);
    const handleDismiss = (0, react_1.useCallback)(async (issue) => {
        var _a;
        const ctx = notebookReader.getFullContext();
        await apiClient.dismissReproIssue({
            notebookPath: (_a = ctx === null || ctx === void 0 ? void 0 : ctx.notebookPath) !== null && _a !== void 0 ? _a : '',
            issueId: issue.id,
        });
        setIssues(prev => prev.filter(i => i.id !== issue.id));
    }, [apiClient, notebookReader]);
    const handleFixAll = (0, react_1.useCallback)(async () => {
        const fixable = issues.filter(i => i.fix_code);
        for (const issue of fixable) {
            await handleFix(issue);
        }
    }, [issues, handleFix]);
    const critical = issues.filter(i => i.severity === 'critical');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');
    return (react_1.default.createElement("div", { className: "ds-repro-panel" },
        react_1.default.createElement("div", { className: "ds-repro-panel-header" },
            react_1.default.createElement("span", { className: "ds-repro-panel-title" }, "\uD83D\uDEE1\uFE0F Reproducibility"),
            issues.length > 0 && (react_1.default.createElement("span", { className: `ds-repro-badge ds-repro-badge--${critical.length > 0 ? 'critical' : 'warning'}` }, issues.length))),
        issues.length > 0 && (react_1.default.createElement("div", { className: "ds-repro-counts" },
            critical.length > 0 && react_1.default.createElement("span", { className: "ds-repro-count ds-repro-count--critical" },
                "\u274C ",
                critical.length,
                " critical"),
            warnings.length > 0 && react_1.default.createElement("span", { className: "ds-repro-count ds-repro-count--warning" },
                "\u26A0\uFE0F ",
                warnings.length,
                " warning",
                warnings.length !== 1 ? 's' : ''),
            info.length > 0 && react_1.default.createElement("span", { className: "ds-repro-count ds-repro-count--info" },
                "\u2139\uFE0F ",
                info.length))),
        react_1.default.createElement("div", { className: "ds-repro-issues" },
            issues.length === 0 && !loading && (react_1.default.createElement("div", { className: "ds-repro-all-ok" },
                "\u2705 No reproducibility issues found",
                lastAnalyzed && (react_1.default.createElement("div", { className: "ds-repro-timestamp" },
                    "Analyzed ",
                    lastAnalyzed.toLocaleTimeString())))),
            react_1.default.createElement(Section, { severity: "critical", label: "Critical", icon: "\u274C", issues: critical, onFix: handleFix, onDismiss: handleDismiss }),
            react_1.default.createElement(Section, { severity: "warning", label: "Warnings", icon: "\u26A0\uFE0F", issues: warnings, onFix: handleFix, onDismiss: handleDismiss }),
            react_1.default.createElement(Section, { severity: "info", label: "Info", icon: "\u2139\uFE0F", issues: info, onFix: handleFix, onDismiss: handleDismiss })),
        error && react_1.default.createElement("div", { className: "ds-repro-error" }, error),
        react_1.default.createElement("div", { className: "ds-repro-footer" },
            react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--analyze", onClick: handleAnalyze, disabled: loading }, loading ? '⏳ Analyzing…' : '🔍 Analyze'),
            issues.some(i => i.fix_code) && (react_1.default.createElement("button", { className: "ds-repro-btn ds-repro-btn--fixall", onClick: handleFixAll }, "\u26A1 Fix All")),
            lastAnalyzed && issues.length > 0 && (react_1.default.createElement("span", { className: "ds-repro-timestamp" }, lastAnalyzed.toLocaleTimeString())))));
};
exports.ReproPanel = ReproPanel;
//# sourceMappingURL=ReproPanel.js.map