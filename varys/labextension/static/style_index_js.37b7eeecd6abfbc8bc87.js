"use strict";
(self["webpackChunkvarys"] = self["webpackChunkvarys"] || []).push([["style_index_js"],{

/***/ "./node_modules/css-loader/dist/cjs.js!./style/base.css"
/*!**************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./style/base.css ***!
  \**************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/* ============================================================
   DS Assistant Sidebar - Base Styles
   ============================================================ */

/* ----------------------------------------------------------
   Layout
   ---------------------------------------------------------- */

.ds-assistant-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--jp-layout-color1);
  color: var(--jp-ui-font-color1);
  font-family: var(--jp-ui-font-family);
  font-size: var(--jp-ui-font-size1);
}

/* ----------------------------------------------------------
   Header bar
   ---------------------------------------------------------- */

.ds-assistant-header {
  padding: 8px 12px;
  background: var(--jp-layout-color2);
  border-bottom: 1px solid var(--jp-border-color2);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ds-assistant-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  flex: 1;
}

/* Provider badge (Anthropic / Ollama) */
.ds-provider-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
  user-select: none;
}

.ds-provider-badge-anthropic {
  background: rgba(100, 100, 255, 0.15);
  color: var(--jp-brand-color1, #4285f4);
  border: 1px solid rgba(100, 100, 255, 0.3);
}

.ds-provider-badge-ollama {
  background: rgba(60, 180, 100, 0.15);
  color: #2e9b5e;
  border: 1px solid rgba(60, 180, 100, 0.3);
}

.ds-provider-model {
  opacity: 0.75;
  font-size: 9px;
}

/* Hybrid badge — different providers per task */
.ds-provider-badge-hybrid {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 8px;
  background: var(--jp-layout-color3, rgba(128, 128, 128, 0.1));
  border: 1px solid var(--jp-border-color2);
}

.ds-provider-segment {
  display: inline-flex;
  align-items: center;
}

.ds-provider-segment-anthropic {
  color: var(--jp-brand-color1, #4285f4);
}

.ds-provider-segment-ollama {
  color: #2e9b5e;
}

.ds-provider-separator {
  opacity: 0.4;
  font-size: 9px;
}

/* ----------------------------------------------------------
   Message list
   ---------------------------------------------------------- */

.ds-assistant-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ds-assistant-message {
  padding: 6px 10px;
  border-radius: 6px;
  max-width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.45;
}

.ds-assistant-message-user {
  background: var(--jp-brand-color3, #c8e6c9);
  align-self: flex-end;
  border-bottom-right-radius: 2px;
}

.ds-assistant-message-assistant {
  background: var(--jp-layout-color2);
  align-self: flex-start;
  border-bottom-left-radius: 2px;
}

.ds-assistant-message-system {
  background: var(--jp-warn-color3, #fff3cd);
  color: var(--jp-warn-color1, #856404);
  font-size: 11px;
  text-align: center;
  border-radius: 4px;
}

.ds-assistant-message-warning {
  background: #fff3cd;
  color: #7d4e00;
  border-left: 3px solid #f0ad00;
  border-radius: 4px;
  font-size: 12px;
  padding: 6px 10px;
  white-space: pre-wrap;
}

.ds-assistant-message-content {
  display: block;
}

/* =============================================================
   Markdown rendering inside chat bubbles (.ds-markdown)
   ============================================================= */

.ds-markdown { line-height: 1.55; overflow-wrap: break-word; }

/* Compact spacing for headings */
.ds-markdown h1, .ds-markdown h2, .ds-markdown h3,
.ds-markdown h4, .ds-markdown h5, .ds-markdown h6 {
  margin: 0.7em 0 0.3em;
  font-weight: 600;
  line-height: 1.25;
}
.ds-markdown h1 { font-size: 1.15em; }
.ds-markdown h2 { font-size: 1.05em; }
.ds-markdown h3 { font-size: 0.97em; }

.ds-markdown p  { margin: 0.35em 0; }
.ds-markdown p:first-child { margin-top: 0; }
.ds-markdown p:last-child  { margin-bottom: 0; }

.ds-markdown ul, .ds-markdown ol {
  margin: 0.3em 0;
  padding-left: 1.4em;
}
.ds-markdown li { margin: 0.1em 0; }

.ds-markdown hr {
  border: none;
  border-top: 1px solid var(--jp-border-color2, #ddd);
  margin: 0.6em 0;
}

/* Inline code */
.ds-markdown code {
  font-family: var(--jp-code-font-family, monospace);
  font-size: 0.87em;
  background: rgba(0,0,0,0.07);
  border-radius: 3px;
  padding: 0.1em 0.35em;
}

/* Code block wrapper: positions the copy button relative to the block */
.ds-markdown .ds-code-block-wrapper {
  position: relative;
  margin: 0.4em 0;
}

/* Copy button — sits in the bottom-right corner of the code block */
.ds-markdown .ds-copy-code-btn {
  position: absolute;
  bottom: 5px;
  right: 6px;
  padding: 1px 7px;
  font-size: 9px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--jp-ui-font-color2, #888);
  background: rgba(255,255,255,0.75);
  border: 1px solid var(--jp-border-color2, #ccc);
  border-radius: 3px;
  cursor: pointer;
  opacity: 0;                   /* hidden until hover */
  transition: opacity 0.15s, background 0.15s;
  z-index: 2;
  user-select: none;
}

.ds-markdown .ds-code-block-wrapper:hover .ds-copy-code-btn {
  opacity: 1;
}

.ds-markdown .ds-copy-code-btn:hover {
  background: rgba(255,255,255,0.95);
  color: var(--jp-ui-font-color1, #333);
  border-color: var(--jp-border-color1, #aaa);
}

/* Code blocks */
.ds-markdown pre {
  background: rgba(0,0,0,0.07);
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 0;                    /* wrapper provides the margin */
}
.ds-markdown pre code {
  background: none;
  padding: 0;
  font-size: 0.84em;
}

/* Night mode: lighter copy button on dark background */
.ds-chat-night .ds-markdown .ds-copy-code-btn {
  background: rgba(40,40,40,0.85);
  border-color: #555;
  color: #aaa;
}
.ds-chat-night .ds-markdown .ds-copy-code-btn:hover {
  background: rgba(60,60,60,0.95);
  color: #e0e0e0;
  border-color: #888;
}

/* Blockquote */
.ds-markdown blockquote {
  border-left: 3px solid var(--jp-brand-color1, #1976d2);
  margin: 0.4em 0 0.4em 0;
  padding: 0.2em 0.7em;
  color: var(--jp-ui-font-color2, #666);
}

/* Tables */
.ds-markdown table {
  border-collapse: collapse;
  font-size: 0.86em;
  margin: 0.5em 0;
  width: 100%;
  overflow-x: auto;
  display: block;
}
.ds-markdown th, .ds-markdown td {
  border: 1px solid var(--jp-border-color1, #ccc);
  padding: 4px 8px;
  text-align: left;
}
.ds-markdown th {
  background: var(--jp-layout-color2, #f0f0f0);
  font-weight: 600;
}
.ds-markdown tr:nth-child(even) td {
  background: var(--jp-layout-color2, #f7f7f7);
}

/* Links */
.ds-markdown a {
  color: var(--jp-brand-color1, #1976d2);
  text-decoration: none;
}
.ds-markdown a:hover { text-decoration: underline; }

/* Night-mode adjustments */
.ds-chat-night .ds-markdown code,
.ds-chat-night .ds-markdown pre {
  background: rgba(255,255,255,0.08);
}
.ds-chat-night .ds-markdown th {
  background: rgba(255,255,255,0.07);
}
.ds-chat-night .ds-markdown tr:nth-child(even) td {
  background: rgba(255,255,255,0.04);
}
.ds-chat-night .ds-markdown th,
.ds-chat-night .ds-markdown td {
  border-color: var(--ds-border, rgba(255,255,255,0.15));
}
.ds-chat-night .ds-markdown blockquote {
  color: var(--ds-text-dim, #999);
}
.ds-chat-night .ds-markdown hr {
  border-color: var(--ds-border, rgba(255,255,255,0.1));
}

/* Loading / progress indicator */
.ds-assistant-loading {
  color: var(--jp-info-color1, #0c5460);
  font-style: italic;
  font-size: 12px;
}

/* ── Collapsible long messages ─────────────────────────────────────────── */
.ds-msg-collapsible-wrap {
  position: relative;
}
.ds-msg-collapsed {
  max-height: 60px;
  overflow: hidden;
}
/* Bottom fade-out gradient so text doesn't hard-clip */
.ds-msg-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--jp-layout-color1, #fff) 100%
  );
}
/* Expand / collapse icon button */
.ds-msg-toggle-btn {
  display: block;
  margin: 2px 0 0 auto;
  padding: 0;
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--jp-ui-font-color2, #888);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s, color 0.15s;
}
.ds-msg-toggle-btn:hover {
  opacity: 1;
  color: var(--jp-brand-color1, #2196f3);
}

/* ── Equalizer-bar cursor shown at end of a streaming message ── */
.ds-typing-cursor {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 0.85em;
  margin-left: 5px;
  vertical-align: middle;
}
.ds-typing-cursor::before,
.ds-typing-cursor::after,
.ds-typing-cursor span {
  content: '';
  display: block;
  width: 3px;
  border-radius: 2px;
  background-color: var(--jp-brand-color1, #2196f3);
  animation: ds-eq-bar 0.9s ease-in-out infinite;
}
.ds-typing-cursor::before { height: 40%; animation-delay: 0s;    }
.ds-typing-cursor span    { height: 90%; animation-delay: 0.15s; }
.ds-typing-cursor::after  { height: 55%; animation-delay: 0.3s;  }

@keyframes ds-eq-bar {
  0%, 100% { transform: scaleY(0.25); opacity: 0.5; }
  50%       { transform: scaleY(1);   opacity: 1;   }
}

/* ── Three-dot wave shown in the "waiting for response" status bubble ── */
.ds-thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 4px;
  vertical-align: middle;
}
.ds-thinking-dots span {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--jp-brand-color1, #2196f3);
  animation: ds-dot-wave 1.2s ease-in-out infinite;
}
.ds-thinking-dots span:nth-child(1) { animation-delay: 0s;    }
.ds-thinking-dots span:nth-child(2) { animation-delay: 0.2s;  }
.ds-thinking-dots span:nth-child(3) { animation-delay: 0.4s;  }

@keyframes ds-dot-wave {
  0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
  40%           { transform: translateY(-6px); opacity: 1;   }
}

/* ----------------------------------------------------------
   Pending operations (Accept / Undo bars)
   ---------------------------------------------------------- */

.ds-assistant-pending-ops {
  border-top: 1px solid var(--jp-border-color2);
  padding: 4px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* ----------------------------------------------------------
   Diff View — visual AI-edit review panel
   ---------------------------------------------------------- */

.ds-diff-view {
  border-radius: 6px;
  border: 1px solid var(--jp-border-color2);
  overflow: hidden;
  font-size: 11px;
  background: var(--jp-layout-color1, #fff);
}

/* Header row: summary + accept/undo */
.ds-diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: var(--jp-layout-color3, #f0f0f0);
  border-bottom: 1px solid var(--jp-border-color2);
  gap: 6px;
}

.ds-diff-header-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.ds-diff-header-cells {
  font-weight: 600;
  color: var(--jp-ui-font-color1);
  white-space: nowrap;
}

.ds-diff-header-desc {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--jp-ui-font-color2);
}

.ds-diff-header-stats {
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-ui-font-color2);
  white-space: nowrap;
}

.ds-diff-header-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Per-cell sections */
.ds-diff-cells {
  display: flex;
  flex-direction: column;
}

.ds-diff-cell-section {
  border-top: 1px solid var(--jp-border-color3, #e0e0e0);
}

.ds-diff-cell-section:first-child {
  border-top: none;
}

/* Cell accordion header button */
.ds-diff-cell-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: none;
  background: var(--jp-layout-color2, #f8f8f8);
  cursor: pointer;
  font-size: 11px;
  text-align: left;
  color: var(--jp-ui-font-color1);
  transition: background 0.1s ease;
}

.ds-diff-cell-header:hover {
  background: var(--jp-layout-color3, #f0f0f0);
}

.ds-diff-cell-toggle {
  color: var(--jp-ui-font-color2);
  width: 10px;
  flex-shrink: 0;
}

/* op-type badge */
.ds-diff-op-badge {
  display: inline-block;
  padding: 0px 5px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.ds-diff-op-badge--insert  { background: #d4edda; color: #155724; }
.ds-diff-op-badge--modify  { background: #d1ecf1; color: #0c5460; }
.ds-diff-op-badge--delete  { background: #f8d7da; color: #721c24; }

.ds-diff-cell-type {
  color: var(--jp-ui-font-color3, #888);
  font-style: italic;
}

.ds-diff-cell-pos {
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-ui-font-color2);
}

.ds-diff-cell-desc {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--jp-ui-font-color2);
}

.ds-diff-stats {
  font-family: var(--jp-code-font-family, monospace);
  font-size: 11px;
  margin-left: auto;
  flex-shrink: 0;
}

.ds-diff-stats--insert { color: #28a745; }
.ds-diff-stats--modify { color: #0066cc; }
.ds-diff-stats--delete { color: #dc3545; }

/* Diff lines area */
.ds-diff-lines {
  font-family: var(--jp-code-font-family, 'SFMono-Regular', Consolas, monospace);
  font-size: 11px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 320px;
  overflow-y: auto;
}

.ds-diff-line {
  display: flex;
  align-items: flex-start;
  min-height: 18px;
}

.ds-diff-gutter {
  width: 14px;
  min-width: 14px;
  text-align: center;
  user-select: none;
  flex-shrink: 0;
  padding: 0 2px;
}

.ds-diff-content {
  flex: 1;
  padding: 0 6px 0 2px;
  white-space: pre;
  word-break: break-all;
}

/* Colours matching Cursor AI's diff palette */
.ds-diff-line--insert {
  background: rgba(40, 167, 69, 0.15);
  color: var(--jp-ui-font-color0, #1a1a1a);
}

.ds-diff-line--insert .ds-diff-gutter {
  color: #28a745;
  background: rgba(40, 167, 69, 0.25);
}

.ds-diff-line--delete {
  background: rgba(220, 53, 69, 0.13);
  color: var(--jp-ui-font-color0, #1a1a1a);
}

.ds-diff-line--delete .ds-diff-gutter {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.22);
}

.ds-diff-line--equal {
  color: var(--jp-ui-font-color2, #555);
  opacity: 0.75;
}

.ds-diff-line--ellipsis {
  color: var(--jp-ui-font-color3, #999);
  padding: 0 14px;
  font-style: italic;
  user-select: none;
}

.ds-diff-empty {
  font-style: italic;
  color: var(--jp-ui-font-color3, #999);
}

/* Night-mode adjustments */
.ds-chat-night .ds-diff-view {
  background: #1e2433;
  border-color: #2d3550;
}

.ds-chat-night .ds-diff-header {
  background: #252d42;
  border-color: #2d3550;
}

.ds-chat-night .ds-diff-cell-header {
  background: #1e2433;
  color: #c8d0e7;
}

.ds-chat-night .ds-diff-cell-header:hover {
  background: #252d42;
}

.ds-chat-night .ds-diff-cell-section {
  border-color: #2d3550;
}

.ds-chat-night .ds-diff-op-badge--insert { background: #1a3a27; color: #74c997; }
.ds-chat-night .ds-diff-op-badge--modify { background: #1a2e3a; color: #6bbfdb; }
.ds-chat-night .ds-diff-op-badge--delete { background: #3a1a1e; color: #e07a83; }

.ds-chat-night .ds-diff-line--insert  { background: rgba(74, 201, 120, 0.12); color: #c8d0e7; }
.ds-chat-night .ds-diff-line--insert .ds-diff-gutter { color: #4dc97a; background: rgba(74, 201, 120, 0.2); }
.ds-chat-night .ds-diff-line--delete  { background: rgba(224, 82, 99, 0.14); color: #c8d0e7; }
.ds-chat-night .ds-diff-line--delete .ds-diff-gutter { color: #e05263; background: rgba(224, 82, 99, 0.24); }
.ds-chat-night .ds-diff-line--equal   { color: #7a849e; }

/* Legacy action-bar kept for backward compat (no longer used in main UI) */
.ds-assistant-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--jp-layout-color3, #f0f0f0);
  border-radius: 4px;
  border-left: 3px solid #28a745;
  font-size: 11px;
}

.ds-assistant-action-description {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
  color: var(--jp-ui-font-color1);
}

.ds-assistant-action-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* ----------------------------------------------------------
   Buttons
   ---------------------------------------------------------- */

.ds-assistant-btn {
  padding: 2px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: opacity 0.15s ease;
  line-height: 1.6;
}

.ds-assistant-btn:hover {
  opacity: 0.82;
}

.ds-assistant-btn:active {
  opacity: 0.7;
}

.ds-assistant-btn-accept {
  background: #28a745;
  color: #ffffff;
}

.ds-assistant-btn-accept-run {
  background: #0066cc;
  color: #ffffff;
}

.ds-assistant-btn-undo {
  background: #fd7e14;
  color: #ffffff;
}

/* Apply selection (partial hunk accept) */
/* "Push code to cell" fallback button shown below assistant messages
   that contain code blocks but produced no cell operations. */
/* ── Context chip (input area + sent bubble) ─────────────────────────────── */

/* Shared base */
.ds-ctx-chip {
  border: 1px solid var(--jp-border-color2, #ddd);
  border-radius: 6px;
  background: var(--jp-layout-color2, #f4f4f4);
  font-size: 11px;
  overflow: hidden;
}

/* Input-area variant: sits above the textarea */
.ds-ctx-chip:not(.ds-ctx-chip--bubble) {
  margin-bottom: 4px;
}

/* Bubble variant: sits below the user's typed text */
.ds-ctx-chip--bubble {
  margin-top: 6px;
  opacity: 0.9;
}

/* Header row */
.ds-ctx-chip-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
}

/* When the chip is NOT .ds-ctx-chip--bubble, the header IS the chip (no wrapper) */
.ds-ctx-chip:not(.ds-ctx-chip--bubble) {
  display: flex;
  flex-direction: column;
}

.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-icon,
.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-label,
.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-toggle,
.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-remove {
  /* inline items in input-area chip (no .ds-ctx-chip-header wrapper) */
}

.ds-ctx-chip:not(.ds-ctx-chip--bubble) {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  padding: 4px 7px;
  gap: 5px;
}

.ds-ctx-chip-icon   { flex-shrink: 0; }

.ds-ctx-chip-label  {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--jp-ui-font-color1, #333);
  font-weight: 500;
}

.ds-ctx-chip-toggle,
.ds-ctx-chip-remove {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0 3px;
  cursor: pointer;
  color: var(--jp-ui-font-color2, #888);
  font-size: 10px;
  line-height: 1;
}
.ds-ctx-chip-toggle:hover { color: var(--jp-brand-color1, #1976d2); }
.ds-ctx-chip-remove:hover { color: #d32f2f; }

/* Expanded code preview */
.ds-ctx-chip-preview {
  margin: 0;
  padding: 6px 8px;
  font-family: var(--jp-code-font-family, monospace);
  font-size: 10px;
  line-height: 1.45;
  white-space: pre;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid var(--jp-border-color2, #ddd);
  background: var(--jp-layout-color1, #fff);
  color: var(--jp-ui-font-color1, #333);
}

/* Night mode */
.ds-chat-night .ds-ctx-chip {
  background: #23233a;
  border-color: #3a3a5c;
}
.ds-chat-night .ds-ctx-chip-label { color: #c8c8e0; }
.ds-chat-night .ds-ctx-chip-preview {
  background: #1a1a2e;
  color: #c8c8e0;
  border-color: #3a3a5c;
}

/* ─────────────────────────────────────────────────────────────────────────── */

.ds-push-to-cell-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  padding: 0;
  width: 36px;
  height: 36px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: #6f42c1;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.65;
  transition: opacity 0.15s, color 0.15s;
}

.ds-push-to-cell-btn:hover {
  opacity: 1;
  color: #5a2ea6;
}

.ds-chat-night .ds-push-to-cell-btn {
  color: #c9a7f5;
}
.ds-chat-night .ds-push-to-cell-btn:hover {
  color: #e0c4ff;
}

.ds-assistant-btn-apply {
  background: #6f42c1;
  color: #ffffff;
}

.ds-assistant-btn-apply:disabled {
  background: #b0a0d0;
  cursor: not-allowed;
  opacity: 0.55;
}

/* ----------------------------------------------------------
   Diff hint text
   ---------------------------------------------------------- */

.ds-diff-hint {
  font-size: 10px;
  color: var(--jp-ui-font-color2, #888);
  padding: 4px 10px 6px;
  border-bottom: 1px solid var(--jp-border-color3, #eee);
  line-height: 1.4;
}

.ds-diff-cell-body {
  display: flex;
  flex-direction: column;
}

/* ----------------------------------------------------------
   Hunk-level Accept / Reject controls
   ---------------------------------------------------------- */

/* One hunk block (context + change lines + toolbar) */
.ds-hunk-section {
  border-bottom: 1px dashed var(--jp-border-color3, #ddd);
  transition: background 0.15s;
}

.ds-hunk-section:last-child {
  border-bottom: none;
}

/* Accepted hunk → green tint */
.ds-hunk-banner--accepted {
  background: rgba(40, 167, 69, 0.07);
  border-left: 3px solid #28a745;
}

/* Rejected hunk → red tint */
.ds-hunk-banner--rejected {
  background: rgba(220, 53, 69, 0.06);
  border-left: 3px solid #dc3545;
  opacity: 0.7;
}

/* Toolbar row shown above each hunk's diff lines */
.ds-hunk-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  background: var(--jp-layout-color2, #f5f5f5);
  border-bottom: 1px solid var(--jp-border-color3, #e8e8e8);
}

.ds-hunk-bar--whole {
  border-top: 1px solid var(--jp-border-color3, #e8e8e8);
  background: var(--jp-layout-color2, #f5f5f5);
}

.ds-hunk-label {
  font-size: 10px;
  color: var(--jp-ui-font-color2, #888);
  flex: 1;
}

.ds-hunk-del {
  color: #dc3545;
  font-weight: 600;
  margin-right: 2px;
}

.ds-hunk-ins {
  color: #28a745;
  font-weight: 600;
}

.ds-hunk-btns {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* Individual hunk accept / reject buttons */
.ds-hunk-btn {
  padding: 1px 8px;
  font-size: 10px;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.12s, background 0.12s;
}

.ds-hunk-btn--accept {
  color: #28a745;
  border-color: #28a745;
  background: transparent;
}

.ds-hunk-btn--reject {
  color: #dc3545;
  border-color: #dc3545;
  background: transparent;
}

/* Active (pressed) state */
.ds-hunk-btn--active.ds-hunk-btn--accept {
  background: #28a745;
  color: #fff;
  opacity: 1;
}

.ds-hunk-btn--active.ds-hunk-btn--reject {
  background: #dc3545;
  color: #fff;
  opacity: 1;
}

.ds-hunk-btn:hover {
  opacity: 1;
}

/* Status text after deciding a whole cell */
.ds-hunk-status {
  font-size: 10px;
  font-weight: 600;
  margin-left: 4px;
}

.ds-hunk-status--accepted { color: #28a745; }
.ds-hunk-status--rejected { color: #dc3545; }

/* "X/Y decided" progress badge in cell header */
.ds-hunk-progress {
  margin-left: auto;
  font-size: 9px;
  color: #6f42c1;
  font-weight: 600;
  background: rgba(111, 66, 193, 0.1);
  padding: 1px 5px;
  border-radius: 8px;
}

/* Hunk diff lines have a slightly lighter background to distinguish from
   the full-cell collapsed view */
.ds-diff-lines--hunk {
  background: var(--jp-layout-color1, #fff);
  border-top: none;
}

/* Night mode overrides for hunk UI */
.ds-chat-night .ds-hunk-bar,
.ds-chat-night .ds-hunk-bar--whole {
  background: #1a1a2e;
  border-color: #333;
}

.ds-chat-night .ds-hunk-btn--active.ds-hunk-btn--accept { background: #1a6b2a; }
.ds-chat-night .ds-hunk-btn--active.ds-hunk-btn--reject { background: #6b1a1a; }

.ds-chat-night .ds-diff-hint {
  color: #666;
}

/* ----------------------------------------------------------
   Input area
   ---------------------------------------------------------- */

.ds-assistant-input-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 8px 8px;   /* top padding removed — handled by resize handle */
  border-top: 1px solid var(--jp-border-color2);
  flex-shrink: 0;
}

/* ── Drag-to-resize handle at the top of the input area ─────────────── */
.ds-input-resize-handle {
  width: 100%;
  height: 10px;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  flex-shrink: 0;
}

.ds-input-resize-handle:hover .ds-input-resize-grip,
.ds-input-resize-handle:active .ds-input-resize-grip {
  background: var(--jp-brand-color1, #1976d2);
  width: 36px;
}

.ds-input-resize-grip {
  display: block;
  width: 28px;
  height: 3px;
  border-radius: 2px;
  background: var(--jp-border-color2, #ccc);
  transition: width 0.15s, background 0.15s;
}

/* Bottom row: model switcher (left) + send button (right) */
.ds-assistant-input-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Token usage counter (input/output) in the bottom bar ── */
.ds-token-counter {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-family: var(--jp-code-font-family, monospace);
  opacity: 0.55;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: default;
}
.ds-token-counter:hover {
  opacity: 0.85;
}
.ds-token-in {
  color: var(--jp-info-color1, #0288d1);
}
.ds-token-out {
  color: var(--jp-warn-color1, #f9a825);
}
.ds-chat-night .ds-token-counter {
  opacity: 0.45;
}
.ds-chat-night .ds-token-counter:hover {
  opacity: 0.85;
}
.ds-chat-night .ds-token-in {
  color: #58b3e8;
}
.ds-chat-night .ds-token-out {
  color: #f9c84a;
}

.ds-assistant-input {
  width: 100%;
  resize: none;          /* height controlled by drag handle */
  min-height: 56px;
  padding: 6px 8px;
  border: 1px solid var(--jp-border-color2);
  border-radius: 4px;
  background: var(--jp-layout-color1);
  color: var(--jp-ui-font-color1);
  font-family: var(--jp-ui-font-family);
  font-size: var(--jp-ui-font-size1);
  box-sizing: border-box;
  line-height: 1.45;
  overflow-y: auto;
}

.ds-assistant-input:focus {
  outline: none;
  border-color: var(--jp-brand-color1, #1976d2);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}

.ds-assistant-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ds-assistant-send-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  background: var(--jp-layout-color3, #e0e0e0);
  color: var(--jp-ui-font-color1, #333);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.ds-assistant-send-btn:hover:not(:disabled) {
  background: var(--jp-layout-color4, #bdbdbd);
}

.ds-assistant-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Stop button variant — subtle red tint to signal "danger / cancel" */
.ds-assistant-send-btn.ds-send-stop {
  background: var(--jp-layout-color3, #e0e0e0);
  color: #c0392b;
}

.ds-assistant-send-btn.ds-send-stop:hover {
  background: #fdecea;
  color: #c0392b;
}

/* Night-mode adjustments */
.ds-chat-night .ds-assistant-send-btn {
  background: #2d2d2d;
  color: #e0e0e0;
}

.ds-chat-night .ds-assistant-send-btn:hover:not(:disabled) {
  background: #3a3a3a;
}

.ds-chat-night .ds-assistant-send-btn.ds-send-stop {
  background: #2d2d2d;
  color: #e57373;
}

.ds-chat-night .ds-assistant-send-btn.ds-send-stop:hover {
  background: #3b1f1f;
  color: #ef9a9a;
}

/* ----------------------------------------------------------
   New session button (pencil icon, between model switcher and Send)
   ---------------------------------------------------------- */

.ds-new-session-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  border-radius: 4px;
  line-height: 1;
  color: var(--jp-ui-font-color2, #888);
  transition: color 0.15s, background 0.15s;
  opacity: 0.7;
}

.ds-new-session-btn:hover:not(:disabled) {
  color: var(--jp-ui-font-color0, #333);
  background: var(--jp-layout-color3, rgba(0,0,0,0.08));
  opacity: 1;
}

.ds-new-session-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Keep the button legible in both chat themes */
.ds-chat-day .ds-new-session-btn,
.ds-chat-night .ds-new-session-btn {
  color: var(--ds-text-dim) !important;
}
.ds-chat-day .ds-new-session-btn:hover:not(:disabled),
.ds-chat-night .ds-new-session-btn:hover:not(:disabled) {
  color:      var(--ds-text) !important;
  background: var(--ds-border) !important;
}

/* =============================================================
   Cell-mode toggle button (💬 / ⚡ / 📝)
   ============================================================= */

.ds-cell-mode-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  font-size: 10px;
  line-height: 1;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  opacity: 0.7;
}

.ds-cell-mode-btn:hover {
  opacity: 1;
  background: var(--jp-layout-color2, #f0f0f0);
}

/* Per-mode accent borders so the active state is immediately readable */
.ds-cell-mode-chat  { border-color: #9c9c9c; }
.ds-cell-mode-auto  { border-color: #f5a623; }
.ds-cell-mode-doc   { border-color: #4caf50; }

.ds-cell-mode-chat  { opacity: 0.9; }
.ds-cell-mode-auto  { opacity: 0.9; }
.ds-cell-mode-doc   { opacity: 0.9; }

/* Night-mode */
.ds-chat-night .ds-cell-mode-btn:hover {
  background: var(--ds-border, #333);
}

/* =============================================================
   Thread bar & popup
   ============================================================= */

/* Thin strip below the header */
.ds-thread-bar {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 8px;
  min-height: 26px;
  border-bottom: 1px solid var(--jp-border-color2, #e0e0e0);
  flex-shrink: 0;
}

/* Toggle button (opens the popup) */
.ds-thread-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--jp-ui-font-color1, #333);
  max-width: 100%;
  overflow: hidden;
}
.ds-thread-toggle:hover {
  background: var(--jp-layout-color3, rgba(0,0,0,0.07));
}
.ds-thread-icon {
  font-size: 13px;
  opacity: 0.6;
  flex-shrink: 0;
}
.ds-thread-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.ds-thread-count {
  opacity: 0.5;
  font-size: 10px;
  flex-shrink: 0;
}
.ds-thread-chevron {
  opacity: 0.5;
  font-size: 12px;
  transition: transform 0.15s;
  flex-shrink: 0;
}
.ds-thread-chevron-up {
  transform: rotate(90deg);
}

/* Popup panel */
.ds-thread-popup {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  z-index: 1000;
  min-width: 200px;
  max-width: 280px;
  background: var(--jp-layout-color1, #fff);
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 4px 0;
  overflow: hidden;
}

/* Notebook name header inside the thread popup */
.ds-thread-popup-notebook {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px 4px;
  border-bottom: 1px solid var(--jp-border-color2, #eee);
  background: var(--jp-layout-color2, #f7f7f7);
  margin-bottom: 2px;
}
.ds-thread-popup-nb-icon { font-size: 11px; flex-shrink: 0; }
.ds-thread-popup-nb-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--jp-ui-font-color2, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

/* Single thread row */
.ds-thread-item {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--jp-ui-font-color1, #333);
}
.ds-thread-item:hover {
  background: var(--jp-layout-color2, #f5f5f5);
}
.ds-thread-item-active {
  font-weight: 600;
}
.ds-thread-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ds-thread-check {
  color: var(--jp-brand-color1, #2196f3);
  margin-right: 4px;
  font-size: 11px;
}

/* Rename/delete icon buttons */
.ds-thread-action-btn {
  flex-shrink: 0;
  opacity: 0;
  cursor: pointer;
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--jp-ui-font-color2, #666);
  transition: opacity 0.1s, background 0.1s;
}
.ds-thread-item:hover .ds-thread-action-btn {
  opacity: 0.6;
}
.ds-thread-action-btn:hover {
  opacity: 1 !important;
  background: var(--jp-layout-color3, rgba(0,0,0,0.1));
}
.ds-thread-delete-btn:hover {
  color: #e53935;
}

/* Inline rename input */
.ds-thread-rename-input {
  flex: 1;
  font-size: 12px;
  padding: 2px 5px;
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 3px;
  outline: none;
  background: var(--jp-layout-color0, #fff);
  color: var(--jp-ui-font-color0, #000);
}

/* "New thread" row at the bottom */
.ds-thread-new-item {
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  color: var(--jp-brand-color1, #2196f3);
  border-top: 1px solid var(--jp-border-color2, #e0e0e0);
  margin-top: 2px;
}
.ds-thread-new-item:hover {
  background: var(--jp-layout-color2, #f5f5f5);
}

/* Night-mode overrides */
.ds-chat-night .ds-thread-bar {
  border-color: var(--ds-border, rgba(255,255,255,0.1));
}
.ds-chat-night .ds-thread-toggle {
  color: var(--ds-text-dim, #aaa);
}
.ds-chat-night .ds-thread-toggle:hover {
  background: var(--ds-surface2, rgba(255,255,255,0.06));
}
.ds-chat-night .ds-thread-popup {
  background: var(--ds-surface, #1e1e1e);
  border-color: var(--ds-border, rgba(255,255,255,0.1));
}
.ds-chat-night .ds-thread-popup-notebook {
  background: rgba(255,255,255,0.04);
  border-bottom-color: rgba(255,255,255,0.08);
}
.ds-chat-night .ds-thread-popup-nb-name {
  color: rgba(255,255,255,0.45);
}
.ds-chat-night .ds-thread-item {
  color: var(--ds-text, #e0e0e0);
}
.ds-chat-night .ds-thread-item:hover {
  background: var(--ds-surface2, rgba(255,255,255,0.06));
}
.ds-chat-night .ds-thread-new-item {
  border-color: var(--ds-border, rgba(255,255,255,0.1));
  color: #7ec8e3;
}
.ds-chat-night .ds-thread-new-item:hover {
  background: var(--ds-surface2, rgba(255,255,255,0.06));
}
.ds-chat-night .ds-thread-rename-input {
  background: var(--ds-surface2, #2a2a2a);
  border-color: var(--ds-border, rgba(255,255,255,0.2));
  color: var(--ds-text, #e0e0e0);
}

/* =============================================================
   Slash-command autocomplete popup + active badge
   ============================================================= */

/* Popup anchored to the bottom of the input area (above the textarea) */
.ds-cmd-popup {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1100;
  background: var(--jp-layout-color1, #fff);
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 6px;
  box-shadow: 0 -4px 14px rgba(0,0,0,0.12);
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}

.ds-cmd-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--jp-ui-font-color1, #333);
}
.ds-cmd-item:hover,
.ds-cmd-item-active {
  background: var(--jp-layout-color2, #f0f0f0);
}

.ds-cmd-name {
  font-weight: 600;
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-brand-color1, #1976d2);
  min-width: 90px;
  flex-shrink: 0;
}

.ds-cmd-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.ds-cmd-badge-builtin {
  background: #e8f5e9;
  color: #2e7d32;
}
.ds-cmd-badge-skill {
  background: #e3f2fd;
  color: #1565c0;
}

.ds-cmd-desc {
  color: var(--jp-ui-font-color2, #666);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Active command badge shown above the textarea */
.ds-cmd-active-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--jp-layout-color2, #f5f5f5);
  border-bottom: 1px solid var(--jp-border-color2, #e0e0e0);
  font-size: 12px;
}
.ds-cmd-active-name {
  font-weight: 600;
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-brand-color1, #1976d2);
}
.ds-cmd-active-desc {
  flex: 1;
  color: var(--jp-ui-font-color2, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}
.ds-cmd-active-clear {
  cursor: pointer;
  opacity: 0.5;
  font-size: 11px;
  flex-shrink: 0;
}
.ds-cmd-active-clear:hover {
  opacity: 1;
}

/* Night mode overrides */
.ds-chat-night .ds-cmd-popup {
  background: var(--ds-surface, #1e1e1e);
  border-color: var(--ds-border, rgba(255,255,255,0.1));
}
.ds-chat-night .ds-cmd-item {
  color: var(--ds-text, #e0e0e0);
}
.ds-chat-night .ds-cmd-item:hover,
.ds-chat-night .ds-cmd-item-active {
  background: var(--ds-surface2, rgba(255,255,255,0.07));
}
.ds-chat-night .ds-cmd-name {
  color: #7ec8e3;
}
.ds-chat-night .ds-cmd-desc {
  color: var(--ds-text-dim, #999);
}
.ds-chat-night .ds-cmd-badge-builtin {
  background: rgba(46,125,50,0.25);
  color: #81c784;
}
.ds-chat-night .ds-cmd-badge-skill {
  background: rgba(21,101,192,0.25);
  color: #64b5f6;
}
.ds-chat-night .ds-cmd-active-badge {
  background: var(--ds-surface, #1e1e1e);
  border-color: var(--ds-border, rgba(255,255,255,0.1));
}
.ds-chat-night .ds-cmd-active-name {
  color: #7ec8e3;
}
.ds-chat-night .ds-cmd-active-desc {
  color: var(--ds-text-dim, #999);
}

/* Make the input-area position:relative so the popup can anchor to it */
.ds-assistant-input-area {
  position: relative;
}

/* ----------------------------------------------------------
   Model switcher
   ---------------------------------------------------------- */

.ds-model-switcher {
  position: relative;
  flex: 1;
  min-width: 0;
}

/* ── Trigger button — minimal, no border, text + caret only ── */
.ds-model-switcher-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--jp-ui-font-family);
  color: var(--jp-ui-font-color2, #777);
  transition: color 0.12s, background 0.12s;
  max-width: 100%;
  overflow: hidden;
}
.ds-model-switcher-btn:hover:not(:disabled) {
  color: var(--jp-ui-font-color0, #222);
  background: var(--jp-layout-color2, #ebebeb);
}
.ds-model-switcher-btn--open {
  color: var(--jp-ui-font-color0, #222);
}
.ds-model-switcher-btn--unconfigured {
  color: #c0392b;
  font-style: italic;
}
.ds-model-switcher-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.ds-model-switcher-model-name {
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* Small ˅ caret — pure CSS, no rotation needed */
.ds-model-switcher-chevron {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  flex-shrink: 0;
  margin-top: -3px;
  transition: transform 0.15s ease, margin-top 0.15s;
  opacity: 0.7;
}
.ds-model-switcher-btn--open .ds-model-switcher-chevron {
  transform: rotate(-135deg);
  margin-top: 3px;
}

/* ── Popup panel ── */
.ds-model-switcher-popup {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 1000;
  min-width: 240px;
  max-width: min(340px, calc(100vw - 24px));
  background: var(--jp-layout-color1, #fff);
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: ds-popup-in 0.12s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes ds-popup-in {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

.ds-model-switcher-popup-header {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 8px 14px 7px;
  border-bottom: 1px solid var(--jp-border-color2, #eee);
  border-left: 3px solid;          /* color set via inline style */
}

.ds-model-switcher-popup-provider {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  /* color set via inline style */
}

.ds-model-switcher-popup-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--jp-ui-font-color3, #aaa);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ds-model-switcher-list {
  max-height: 260px;
  overflow-y: auto;
  padding: 5px 0;
}

.ds-model-switcher-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 14px;
  background: none;
  border: none;
  border-left: 3px solid transparent;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-ui-font-color0, #222);
  text-align: left;
  gap: 10px;
  transition: background 0.1s;
}
.ds-model-switcher-option:hover {
  background: var(--jp-layout-color2, #f5f5f5);
}
.ds-model-switcher-option--active {
  border-left-color: currentColor;    /* color set via inline style */
  font-weight: 600;
  background: color-mix(in srgb, var(--jp-layout-color1) 60%, transparent);
}
.ds-model-switcher-option--active:hover {
  background: var(--jp-layout-color2, #f0f0f0);
}

.ds-model-switcher-option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.ds-model-switcher-check {
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  /* color set via inline style */
}

.ds-model-switcher-empty {
  padding: 12px 14px;
  font-size: 11px;
  color: var(--jp-ui-font-color2, #888);
  white-space: pre-line;
  text-align: center;
  font-style: italic;
  line-height: 1.5;
}

/* ----------------------------------------------------------
   Header icon buttons (gear, shield, theme toggle)
   ---------------------------------------------------------- */

/* Shared base for all small header icon buttons */
.ds-settings-gear-btn,
.ds-repro-shield-btn,
.ds-theme-toggle-btn,
.ds-wiki-help-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  color: var(--jp-ui-font-color2, #888);
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}
.ds-settings-gear-btn:hover,
.ds-repro-shield-btn:hover,
.ds-theme-toggle-btn:hover,
.ds-wiki-help-btn:hover {
  color: var(--jp-ui-font-color0, #333);
  background: var(--jp-layout-color3, rgba(0,0,0,0.08));
}

/* Wiki help button: circular badge */
.ds-wiki-help-btn {
  width: 20px;
  height: 20px;
  border-radius: 50% !important;
  border: 1.5px solid currentColor !important;
  font-size: 12px !important;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
  opacity: 0.7;
}
.ds-wiki-help-btn:hover {
  opacity: 1;
}

/* Gear sits at far right — push it with auto margin */
.ds-settings-gear-btn {
  margin-left: auto;
}

/* ----------------------------------------------------------
   Chat window day / night themes
   Scoped under .ds-chat-day / .ds-chat-night so they only
   affect the sidebar panel and not the rest of JupyterLab.
   ---------------------------------------------------------- */

/* ── Day theme (crisp white / light) ── */
.ds-chat-day {
  --ds-bg:          #ffffff;
  --ds-header-bg:   #f4f4f4;
  --ds-border:      #e0e0e0;
  --ds-msg-user:    #dceeff;
  --ds-msg-asst:    #f2f2f2;
  --ds-msg-system:  #fff8e1;
  --ds-msg-warning: #fff3cd;
  --ds-input-bg:    #fafafa;
  --ds-text:        #1a1a1a;
  --ds-text-dim:    #666666;
}

/* ── Night theme (deep dark) ── */
.ds-chat-night {
  --ds-bg:          #1e1e2e;
  --ds-header-bg:   #16213e;
  --ds-border:      #2e3050;
  --ds-msg-user:    #1a3a5c;
  --ds-msg-asst:    #252540;
  --ds-msg-system:  #2a2a1e;
  --ds-msg-warning: #3a2a10;
  --ds-input-bg:    #1a1a2e;
  --ds-text:        #e8e8f0;
  --ds-text-dim:    #9090a8;
}

/* Apply theme vars to the concrete elements */
.ds-chat-day,
.ds-chat-night {
  background: var(--ds-bg) !important;
  color:      var(--ds-text) !important;
}

.ds-chat-day .ds-assistant-header,
.ds-chat-night .ds-assistant-header {
  background:    var(--ds-header-bg) !important;
  border-bottom: 1px solid var(--ds-border) !important;
  color:         var(--ds-text) !important;
}

.ds-chat-day .ds-assistant-messages,
.ds-chat-night .ds-assistant-messages {
  background: var(--ds-bg) !important;
}

/* Message bubbles */
.ds-chat-day .ds-assistant-message-user,
.ds-chat-night .ds-assistant-message-user {
  background: var(--ds-msg-user) !important;
  color:      var(--ds-text) !important;
}

.ds-chat-day .ds-assistant-message-assistant,
.ds-chat-night .ds-assistant-message-assistant {
  background: var(--ds-msg-asst) !important;
  color:      var(--ds-text) !important;
}

.ds-chat-day .ds-assistant-message-system,
.ds-chat-night .ds-assistant-message-system {
  background: var(--ds-msg-system) !important;
  color:      var(--ds-text-dim) !important;
}

.ds-chat-day .ds-assistant-message-warning,
.ds-chat-night .ds-assistant-message-warning {
  background: var(--ds-msg-warning) !important;
  color:      var(--ds-text) !important;
}

/* Input area */
.ds-chat-day .ds-assistant-input-area,
.ds-chat-night .ds-assistant-input-area {
  background:    var(--ds-input-bg) !important;
  border-top:    1px solid var(--ds-border) !important;
}

.ds-chat-day .ds-assistant-input,
.ds-chat-night .ds-assistant-input {
  background: var(--ds-input-bg) !important;
  color:      var(--ds-text) !important;
  border:     1px solid var(--ds-border) !important;
}

.ds-chat-day .ds-assistant-input::placeholder,
.ds-chat-night .ds-assistant-input::placeholder {
  color: var(--ds-text-dim) !important;
}

/* Header icon buttons inside themed panel */
.ds-chat-day .ds-settings-gear-btn,
.ds-chat-day .ds-repro-shield-btn,
.ds-chat-day .ds-theme-toggle-btn,
.ds-chat-day .ds-wiki-help-btn,
.ds-chat-night .ds-settings-gear-btn,
.ds-chat-night .ds-repro-shield-btn,
.ds-chat-night .ds-theme-toggle-btn,
.ds-chat-night .ds-wiki-help-btn {
  color: var(--ds-text-dim) !important;
}
.ds-chat-day .ds-settings-gear-btn:hover,
.ds-chat-day .ds-repro-shield-btn:hover,
.ds-chat-day .ds-theme-toggle-btn:hover,
.ds-chat-day .ds-wiki-help-btn:hover,
.ds-chat-night .ds-settings-gear-btn:hover,
.ds-chat-night .ds-repro-shield-btn:hover,
.ds-chat-night .ds-theme-toggle-btn:hover,
.ds-chat-night .ds-wiki-help-btn:hover {
  color:      var(--ds-text) !important;
  background: var(--ds-border) !important;
}

/* Model switcher trigger button */
.ds-chat-day .ds-model-switcher-btn,
.ds-chat-night .ds-model-switcher-btn {
  color: var(--ds-text-dim) !important;
}
.ds-chat-day .ds-model-switcher-btn:hover,
.ds-chat-night .ds-model-switcher-btn:hover {
  color:      var(--ds-text) !important;
  background: var(--ds-border) !important;
}

/* ── Night mode: model switcher dropdown popup ── */

/* Popup container */
.ds-chat-night .ds-model-switcher-popup {
  background:   #1e2035 !important;
  border-color: #2e3050 !important;
  box-shadow:   0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35) !important;
}

/* Header bar inside popup (provider name row) */
.ds-chat-night .ds-model-switcher-popup-header {
  border-bottom-color: #2e3050 !important;
  background: #181828 !important;
}

/* "Provider" label (ANTHROPIC / OLLAMA / …) */
.ds-chat-night .ds-model-switcher-popup-provider {
  /* colour is set via inline style per provider — leave as-is */
}

/* "Chat model" sub-label */
.ds-chat-night .ds-model-switcher-popup-label {
  color: #7070a0 !important;
}

/* Individual model rows */
.ds-chat-night .ds-model-switcher-option {
  color: #c8c8e0 !important;
  background: none !important;
}

/* Hover state */
.ds-chat-night .ds-model-switcher-option:hover {
  background: #2a2d4a !important;
  color:      #e8e8f8 !important;
}

/* Currently selected model */
.ds-chat-night .ds-model-switcher-option--active {
  background: #1f2240 !important;
  color:      #e8e8f8 !important;
}
.ds-chat-night .ds-model-switcher-option--active:hover {
  background: #2a2d4a !important;
}

/* "No models" empty state */
.ds-chat-night .ds-model-switcher-empty {
  color: #7070a0 !important;
}

/* ── Day mode: ensure popup matches day theme too ── */
.ds-chat-day .ds-model-switcher-popup {
  background:   #ffffff !important;
  border-color: #ddd !important;
}
.ds-chat-day .ds-model-switcher-popup-header {
  background:   #f6f6f6 !important;
  border-bottom-color: #e0e0e0 !important;
}
.ds-chat-day .ds-model-switcher-option {
  color: #1a1a1a !important;
}
.ds-chat-day .ds-model-switcher-option:hover {
  background: #eef4ff !important;
}
.ds-chat-day .ds-model-switcher-option--active {
  background: #e8f0fe !important;
}
.ds-chat-day .ds-model-switcher-option--active:hover {
  background: #dce8fd !important;
}

/* Provider badge */
.ds-chat-day .ds-assistant-title,
.ds-chat-night .ds-assistant-title {
  color: var(--ds-text) !important;
}

/* Loading / progress text */
.ds-chat-day .ds-assistant-loading,
.ds-chat-night .ds-assistant-loading {
  color: var(--ds-text-dim) !important;
}

/* Typing cursor colour in night mode */
.ds-chat-night .ds-typing-cursor::before,
.ds-chat-night .ds-typing-cursor span,
.ds-chat-night .ds-typing-cursor::after {
  background-color: #7eb8f7;
}

/* Collapse fade gradient — must match the bubble background in each theme */
.ds-chat-day .ds-assistant-message-user .ds-msg-fade {
  background: linear-gradient(to bottom, transparent 0%, #e3f0ff 100%);
}
.ds-chat-day .ds-assistant-message-assistant .ds-msg-fade {
  background: linear-gradient(to bottom, transparent 0%, #f5f5f5 100%);
}
.ds-chat-night .ds-assistant-message-user .ds-msg-fade {
  background: linear-gradient(to bottom, transparent 0%, #1a2a3a 100%);
}
.ds-chat-night .ds-assistant-message-assistant .ds-msg-fade {
  background: linear-gradient(to bottom, transparent 0%, #1e1e2e 100%);
}
.ds-chat-night .ds-msg-toggle-btn {
  color: #7eb8f7;
  border-color: #7eb8f7;
}

.ds-settings-close-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--jp-ui-font-color2, #888);
  padding: 2px 6px;
  border-radius: 4px;
}
.ds-settings-close-btn:hover {
  background: var(--jp-layout-color2, #e8e8e8);
}

/* ----------------------------------------------------------
   Settings panel — tabbed layout
   ---------------------------------------------------------- */

.ds-settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Tab bar */
.ds-settings-tabbar {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid var(--jp-border-color1, #ccc);
  flex-shrink: 0;
  scrollbar-width: none;
  background: var(--jp-layout-color1);
}
.ds-settings-tabbar::-webkit-scrollbar {
  display: none;
}

.ds-settings-tab {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 6px 9px;
  font-size: 11px;
  font-family: var(--jp-ui-font-family);
  white-space: nowrap;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--jp-ui-font-color2, #666);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.ds-settings-tab:hover {
  color: var(--jp-ui-font-color0, #222);
  background: var(--jp-layout-color2, #f5f5f5);
}
.ds-settings-tab--active {
  color: var(--jp-brand-color1, #1976d2);
  border-bottom-color: var(--jp-brand-color1, #1976d2);
  font-weight: 600;
}

/* Green dot on tabs that are active for at least one task */
.ds-settings-tab-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #28a745;
  flex-shrink: 0;
}

/* Scrollable content area */
.ds-settings-tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 10px 6px;
}

/* Routing tab: two-column grid (label | select) */
.ds-settings-routing-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px 10px;
}
.ds-settings-routing-grid .ds-settings-label {
  white-space: nowrap;
}

/* Shared field rows for provider tabs */
.ds-settings-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}
.ds-settings-row:last-child {
  margin-bottom: 0;
}

.ds-settings-label {
  font-size: 11px;
  color: var(--jp-ui-font-color2, #555);
  margin-bottom: 3px;
}

.ds-settings-input,
.ds-settings-select {
  font-size: 12px;
  padding: 5px 7px;
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 4px;
  background: var(--jp-layout-color1, #fff);
  color: var(--jp-ui-font-color0, #222);
  width: 100%;
  box-sizing: border-box;
  font-family: var(--jp-code-font-family, monospace);
}
.ds-settings-input:focus,
.ds-settings-select:focus {
  outline: none;
  border-color: var(--jp-brand-color1, #1976d2);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}

/* Sticky footer */
.ds-settings-footer {
  flex-shrink: 0;
  padding: 8px 10px;
  border-top: 1px solid var(--jp-border-color2, #ddd);
  background: var(--jp-layout-color1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ds-settings-path {
  font-size: 10px;
  color: var(--jp-ui-font-color3, #aaa);
  word-break: break-all;
}

.ds-settings-status {
  padding: 5px 9px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.4;
}
.ds-settings-status-success {
  background: #d4edda;
  color: #155724;
  border-left: 3px solid #28a745;
}
.ds-settings-status-error {
  background: #f8d7da;
  color: #721c24;
  border-left: 3px solid #dc3545;
}

/* ── RAG Knowledge tab — embed routing summary ───────────────────────────── */

.ds-rag-routing-summary {
  margin-bottom: 10px;
  padding: 10px 12px;
  background: var(--jp-layout-color2, #f5f5f5);
  border-radius: 6px;
  border: 1px solid var(--jp-border-color2, #ddd);
  font-size: 11px;
}

.ds-rag-routing-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.ds-rag-routing-label {
  color: var(--jp-ui-font-color2, #666);
  flex-shrink: 0;
}

.ds-rag-routing-value {
  font-weight: 600;
  color: var(--jp-ui-font-color1, #222);
  font-family: var(--jp-code-font-family, monospace);
  font-size: 10px;
  text-align: right;
}

.ds-rag-routing-hint {
  margin: 8px 0 0;
  color: var(--jp-ui-font-color3, #aaa);
  font-size: 10px;
  line-height: 1.4;
}

.ds-rag-storage-hint {
  margin-bottom: 10px;
  padding: 8px 12px;
  background: var(--jp-info-color0, #e8f4fd);
  border-radius: 6px;
  border-left: 3px solid var(--jp-info-color1, #0077cc);
  font-size: 10px;
  line-height: 1.5;
}

.ds-rag-storage-hint strong {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--jp-ui-font-color1, #333);
}

.ds-rag-storage-hint p {
  margin: 0 0 4px;
  color: var(--jp-ui-font-color2, #555);
}

.ds-rag-storage-hint code {
  background: rgba(0,0,0,0.07);
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 9px;
  font-family: var(--jp-code-font-family, monospace);
}

/* ── RAG Knowledge tab — index status widget ─────────────────────────────── */

.ds-rag-status {
  margin-top: 14px;
  padding: 10px 12px;
  background: var(--jp-layout-color2, #f5f5f5);
  border-radius: 6px;
  border: 1px solid var(--jp-border-color2, #ddd);
  font-size: 11px;
}

.ds-rag-status--unavailable {
  background: #fff8e1;
  border-color: #ffe082;
  color: #7a5c00;
}

.ds-rag-status--unavailable code {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  word-break: break-all;
  color: inherit;
}

.ds-rag-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.ds-rag-status-title {
  font-weight: 600;
  color: var(--jp-ui-font-color1, #333);
}

.ds-rag-status-refresh {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  color: var(--jp-ui-font-color2, #888);
  padding: 0 2px;
}
.ds-rag-status-refresh:hover { color: var(--jp-brand-color1, #1976d2); }

.ds-rag-status-stats {
  display: flex;
  gap: 16px;
  color: var(--jp-ui-font-color2, #555);
  margin-bottom: 8px;
}

.ds-rag-status-stats strong {
  color: var(--jp-ui-font-color1, #222);
}

.ds-rag-status-files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ds-rag-status-file {
  background: var(--jp-layout-color1, #fff);
  border: 1px solid var(--jp-border-color2, #ddd);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 10px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--jp-ui-font-color1, #333);
}

.ds-rag-status-file--more {
  color: var(--jp-ui-font-color3, #aaa);
  border-style: dashed;
}

.ds-rag-status-empty {
  color: var(--jp-ui-font-color3, #aaa);
  font-style: italic;
}
.ds-rag-status-empty code {
  font-style: normal;
  background: var(--jp-layout-color1, #fff);
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid var(--jp-border-color2, #ddd);
}

.ds-rag-status-loading {
  color: var(--jp-ui-font-color3, #aaa);
  font-style: italic;
}

/* ── END RAG Knowledge tab ─────────────────────────────────────────────────── */

.ds-settings-actions {
  display: flex;
  gap: 8px;
}

.ds-settings-save-btn {
  flex: 1;
  padding: 7px;
  background: var(--jp-brand-color1, #1976d2);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.ds-settings-save-btn:hover:not(:disabled) {
  background: var(--jp-brand-color0, #1565c0);
}
.ds-settings-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ds-settings-cancel-btn {
  padding: 7px 12px;
  background: var(--jp-layout-color2, #eee);
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
}
.ds-settings-cancel-btn:hover {
  background: var(--jp-layout-color3, #ddd);
}

.ds-settings-loading {
  padding: 20px;
  text-align: center;
  color: var(--jp-ui-font-color2, #888);
  font-size: 13px;
}

/* ----------------------------------------------------------
   Settings outer wrapper + top-level [Models | Skills] tabs
   ---------------------------------------------------------- */

.ds-settings-outer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.ds-settings-top-tabs {
  display: flex;
  flex-shrink: 0;
  border-bottom: 2px solid var(--jp-border-color1, #ccc);
  background: var(--jp-layout-color2, #f5f5f5);
}

.ds-settings-top-tab {
  flex: 1;
  padding: 8px 4px;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--jp-ui-font-family);
  color: var(--jp-ui-font-color2, #777);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}
.ds-settings-top-tab:hover {
  color: var(--jp-ui-font-color0, #222);
}
.ds-settings-top-tab--active {
  color: var(--jp-brand-color1, #1976d2);
  border-bottom-color: var(--jp-brand-color1, #1976d2);
  font-weight: 700;
}

/* ----------------------------------------------------------
   Skills panel — flex row: list left, editor right
   ---------------------------------------------------------- */

.ds-skills-panel {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── Left: skill list ── */
.ds-skills-list {
  width: 52%;
  min-width: 120px;
  max-width: 220px;
  border-right: 1px solid var(--jp-border-color2, #ddd);
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* Header bar with title + refresh button */
.ds-skills-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 6px 4px;
  border-bottom: 1px solid var(--jp-border-color2, #ddd);
  flex-shrink: 0;
  background: var(--jp-layout-color1, #fff);
  position: sticky;
  top: 0;
  z-index: 1;
}

.ds-skills-list-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--jp-ui-font-color2, #666);
}

.ds-skills-refresh-btn {
  background: none;
  border: 1px solid var(--jp-border-color2, #ccc);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  color: var(--jp-ui-font-color2, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.ds-skills-refresh-btn:hover:not(:disabled) {
  color: var(--jp-brand-color1, #1976d2);
  border-color: var(--jp-brand-color1, #1976d2);
  background: rgba(25, 118, 210, 0.08);
}
.ds-skills-refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

@keyframes ds-spin {
  to { transform: rotate(360deg); }
}
.ds-skills-refresh-btn--spinning {
  animation: ds-spin 0.7s linear infinite;
}

.ds-skills-empty {
  padding: 10px 8px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--jp-ui-font-color3, #aaa);
  white-space: pre-line;
  font-style: italic;
  line-height: 1.4;
}

.ds-skill-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--jp-border-color2, #e8e8e8);
}
.ds-skill-row:hover {
  background: var(--jp-layout-color2, #f0f0f0);
}
.ds-skill-row--active {
  background: var(--jp-brand-color3, #e3f0fc);
}

/* iOS-style toggle */
.ds-skill-toggle {
  position: relative;
  width: 26px;
  height: 14px;
  border-radius: 7px;
  background: var(--jp-border-color1, #bbb);
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: background 0.2s;
}
.ds-skill-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: left 0.2s;
}
.ds-skill-toggle--on {
  background: #28a745;
}
.ds-skill-toggle--on::after {
  left: 14px;
}

.ds-skill-name {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--jp-ui-font-color0, #222);
}
.ds-skill-row--active .ds-skill-name {
  font-weight: 600;
}


/* New skill input row */
.ds-skill-add-btn {
  margin: 4px 6px 6px;
  padding: 4px 6px;
  font-size: 11px;
  background: none;
  border: 1px dashed var(--jp-border-color1, #ccc);
  border-radius: 4px;
  cursor: pointer;
  color: var(--jp-ui-font-color2, #888);
  text-align: left;
  transition: border-color 0.1s, color 0.1s;
}
.ds-skill-add-btn:hover {
  border-color: var(--jp-brand-color1, #1976d2);
  color: var(--jp-brand-color1, #1976d2);
}

/* ── Bundled skill library ─────────────────────────────────────────── */
.ds-skill-library {
  margin-top: 8px;
  border-top: 1px solid var(--jp-border-color2, #e0e0e0);
}

.ds-skill-library-header {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 6px 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: var(--jp-ui-font-color1, #333);
  text-align: left;
}
.ds-skill-library-header:hover {
  background: var(--jp-layout-color2, #f0f0f0);
}

.ds-skill-library-chevron {
  font-size: 10px;
  color: var(--jp-ui-font-color2, #888);
}

.ds-skill-library-body {
  padding: 2px 0 6px;
}

.ds-skill-library-msg {
  padding: 4px 12px;
  font-size: 11px;
  color: var(--jp-ui-font-color2, #888);
  font-style: italic;
}

.ds-skill-library-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-bottom: 1px solid var(--jp-border-color2, #eee);
  gap: 6px;
}
.ds-skill-library-row--imported {
  opacity: 0.5;
}

.ds-skill-library-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.ds-skill-library-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--jp-ui-font-color1, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ds-skill-library-cmd {
  font-size: 10px;
  color: var(--jp-brand-color1, #1976d2);
  font-family: var(--jp-code-font-family, monospace);
}

.ds-skill-library-desc {
  font-size: 10px;
  color: var(--jp-ui-font-color2, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ds-skill-library-check {
  font-size: 13px;
  color: #4caf50;
  flex-shrink: 0;
}

.ds-skill-library-import-btn {
  flex-shrink: 0;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 600;
  background: var(--jp-brand-color1, #1976d2);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.ds-skill-library-import-btn:hover:not(:disabled) {
  background: var(--jp-brand-color0, #1565c0);
}
.ds-skill-library-import-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* night-mode overrides */
.ds-assistant--night .ds-skill-library-header {
  color: #ccc;
}
.ds-assistant--night .ds-skill-library-header:hover {
  background: rgba(255,255,255,0.07);
}
.ds-assistant--night .ds-skill-library {
  border-top-color: rgba(255,255,255,0.1);
}
.ds-assistant--night .ds-skill-library-row {
  border-bottom-color: rgba(255,255,255,0.07);
}
.ds-assistant--night .ds-skill-library-name {
  color: #ddd;
}
.ds-assistant--night .ds-skill-library-desc {
  color: #999;
}

/* ── end skill library ─────────────────────────────────────────────── */

.ds-skill-new-row {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
}
.ds-skill-new-input {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-family: var(--jp-code-font-family, monospace);
  padding: 3px 5px;
  border: 1px solid var(--jp-brand-color1, #1976d2);
  border-radius: 3px;
  background: var(--jp-layout-color1);
  color: var(--jp-ui-font-color0);
  outline: none;
}
.ds-skill-new-ok,
.ds-skill-new-cancel {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
  flex-shrink: 0;
}
.ds-skill-new-ok    { color: #28a745; }
.ds-skill-new-cancel { color: #dc3545; }
.ds-skill-new-ok:hover    { background: rgba(40,167,69,.12); }
.ds-skill-new-cancel:hover { background: rgba(220,53,69,.12); }

/* ── Right: editor ── */
.ds-skill-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.ds-skill-editor-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--jp-ui-font-color3, #bbb);
  font-style: italic;
  padding: 16px;
  text-align: center;
}

/* ── Editor tab bar ── */
.ds-skill-editor-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px 0;
  border-bottom: 1px solid var(--jp-border-color2, #ddd);
  flex-shrink: 0;
  background: var(--jp-layout-color2, #f5f5f5);
}

.ds-skill-editor-tab {
  background: none;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  padding: 3px 8px;
  font-size: 10px;
  font-family: var(--jp-code-font-family, monospace);
  font-weight: 500;
  color: var(--jp-ui-font-color2, #666);
  cursor: pointer;
  transition: color 0.1s, background 0.1s;
  white-space: nowrap;
  margin-bottom: -1px;
}
.ds-skill-editor-tab:hover {
  color: var(--jp-ui-font-color0, #222);
  background: var(--jp-layout-color1, #fff);
}
.ds-skill-editor-tab--active {
  color: var(--jp-brand-color1, #1976d2);
  background: var(--jp-layout-color1, #fff);
  border-color: var(--jp-border-color2, #ddd);
  font-weight: 700;
}

.ds-skill-editor-tabs-spacer {
  flex: 1;
}

/* Filepath hint below tab bar */
.ds-skill-editor-filepath {
  font-size: 9px;
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-ui-font-color3, #aaa);
  padding: 2px 8px;
  border-bottom: 1px solid var(--jp-border-color2, #eee);
  flex-shrink: 0;
  background: var(--jp-layout-color1, #fff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds-skill-editor-dirty {
  font-size: 8px;
  color: #f0ad00;
  flex-shrink: 0;
}

.ds-skill-editor-saved {
  font-size: 10px;
  color: #28a745;
  font-weight: 600;
  flex-shrink: 0;
}

.ds-skill-editor-error {
  font-size: 10px;
  color: #dc3545;
  font-weight: 600;
  flex-shrink: 0;
}

.ds-skill-editor-save-btn {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  background: var(--jp-brand-color1, #1976d2);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}
.ds-skill-editor-save-btn:hover:not(:disabled) {
  background: var(--jp-brand-color0, #1565c0);
}
.ds-skill-editor-save-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.ds-skill-editor-textarea {
  flex: 1;
  resize: none;
  padding: 8px;
  border: none;
  outline: none;
  background: var(--jp-layout-color1, #fff);
  color: var(--jp-ui-font-color0, #111);
  font-family: var(--jp-code-font-family, monospace);
  font-size: 11px;
  line-height: 1.55;
  min-height: 0;
}

/* ----------------------------------------------------------
   Model Zoo
   ---------------------------------------------------------- */

.ds-settings-zoo {
  margin-top: 14px;
  border-top: 1px dashed var(--jp-border-color2, #ddd);
  padding-top: 10px;
}

.ds-settings-zoo-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.ds-settings-zoo-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--jp-ui-font-color2, #666);
}

.ds-settings-zoo-count {
  font-size: 10px;
  font-weight: 600;
  background: var(--jp-brand-color1, #1976d2);
  color: #fff;
  border-radius: 9px;
  padding: 1px 6px;
  line-height: 1.5;
}

.ds-settings-zoo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
  min-height: 22px;
}

.ds-settings-zoo-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: var(--jp-layout-color2, #f0f0f0);
  border: 1px solid var(--jp-border-color2, #ddd);
  border-radius: 12px;
  padding: 2px 6px 2px 8px;
  font-size: 11px;
  font-family: var(--jp-code-font-family, monospace);
  max-width: 100%;
  overflow: hidden;
}

.ds-settings-zoo-chip-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--jp-ui-font-color0, #222);
}

.ds-settings-zoo-chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0 1px;
  color: var(--jp-ui-font-color3, #aaa);
  flex-shrink: 0;
  border-radius: 50%;
}
.ds-settings-zoo-chip-remove:hover {
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
}

.ds-settings-zoo-empty {
  font-size: 11px;
  color: var(--jp-ui-font-color3, #aaa);
  font-style: italic;
}

.ds-settings-zoo-add {
  display: flex;
  gap: 6px;
}

.ds-settings-zoo-add-input {
  flex: 1;
  font-size: 12px;
  font-family: var(--jp-code-font-family, monospace);
  padding: 4px 7px;
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 4px;
  background: var(--jp-layout-color1, #fff);
  color: var(--jp-ui-font-color0, #222);
  min-width: 0;
}
.ds-settings-zoo-add-input:focus {
  outline: none;
  border-color: var(--jp-brand-color1, #1976d2);
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}

.ds-settings-zoo-add-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  background: var(--jp-layout-color2, #eee);
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  color: var(--jp-ui-font-color0, #333);
}
.ds-settings-zoo-add-btn:hover:not(:disabled) {
  background: var(--jp-brand-color1, #1976d2);
  border-color: var(--jp-brand-color1, #1976d2);
  color: #fff;
}
.ds-settings-zoo-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ----------------------------------------------------------
   Pending cell highlighting (applied to notebook cell nodes)
   ---------------------------------------------------------- */

.ds-assistant-pending {
  border-left: 4px solid #28a745 !important;
  box-shadow: inset 0 0 0 1px rgba(40, 167, 69, 0.25);
  transition: border-left-color 0.2s ease, box-shadow 0.2s ease;
}

/* ── Report card ── */
.ds-report-card {
  background: var(--jp-layout-color2, #f5f5f5);
  border: 1px solid var(--jp-border-color2, #ddd);
  border-left: 4px solid #28a745;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ds-report-card-header {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ds-report-card-icon {
  font-size: 16px;
  line-height: 1;
}

.ds-report-card-title {
  font-weight: 700;
  font-size: 12px;
  color: #28a745;
}

.ds-report-card-filename {
  font-family: var(--jp-code-font-family, monospace);
  font-size: 10px;
  color: var(--jp-ui-font-color1, #333);
  word-break: break-all;
}

.ds-report-card-stats {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: var(--jp-ui-font-color2, #666);
  flex-wrap: wrap;
}

.ds-report-card-download {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  background: #28a745;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  width: fit-content;
  transition: background 0.15s;
}
.ds-report-card-download:hover {
  background: #218838;
  color: #fff;
  text-decoration: none;
}

/* ── Code-review message & fix cards ────────────────────────────────────── */

.ds-code-review-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.ds-fix-panel {
  border: 1px solid var(--jp-border-color1);
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
}

.ds-fix-panel-header {
  background: var(--jp-layout-color2);
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--jp-ui-font-color1);
  border-bottom: 1px solid var(--jp-border-color1);
}

.ds-fix-card {
  padding: 7px 10px;
  border-bottom: 1px solid var(--jp-border-color2);
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: background 0.12s;
}

.ds-fix-card:last-child {
  border-bottom: none;
}

.ds-fix-card--applied {
  opacity: 0.55;
}

.ds-fix-card-desc {
  font-size: 11px;
  font-weight: 500;
  color: var(--jp-ui-font-color1);
  line-height: 1.4;
}

.ds-fix-card-toggle {
  margin: 0;
}

.ds-fix-card-toggle > summary {
  font-size: 10px;
  color: var(--jp-brand-color1);
  cursor: pointer;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 3px;
}

.ds-fix-card-toggle > summary::before {
  content: '▶';
  font-size: 8px;
  transition: transform 0.15s;
}

.ds-fix-card-toggle[open] > summary::before {
  transform: rotate(90deg);
}

.ds-fix-card-code {
  margin: 4px 0 0 0;
  padding: 6px 8px;
  background: var(--jp-layout-color3);
  border-radius: 4px;
  font-size: 10px;
  font-family: var(--jp-code-font-family, monospace);
  overflow-x: auto;
  white-space: pre;
  max-height: 160px;
  line-height: 1.45;
}

.ds-fix-card-btn {
  align-self: flex-end;
  padding: 3px 11px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid var(--jp-brand-color1);
  background: transparent;
  color: var(--jp-brand-color1);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.ds-fix-card-btn:hover:not(:disabled) {
  background: var(--jp-brand-color1);
  color: #fff;
}

.ds-fix-card-btn:disabled {
  border-color: #4caf50;
  color: #4caf50;
  cursor: default;
}

/* ── Reproducibility Guardian ────────────────────────────────────────────── */


/* Panel container */
.ds-repro-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-size: 12px;
  color: var(--jp-ui-font-color1);
}

/* Panel header */
.ds-repro-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 6px;
  border-bottom: 1px solid var(--jp-border-color1);
  flex-shrink: 0;
}
.ds-repro-panel-title {
  font-size: 13px;
  font-weight: 600;
}
.ds-repro-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
  color: #fff;
}
.ds-repro-badge--critical { background: #d32f2f; }
.ds-repro-badge--warning  { background: #f57c00; }

/* Summary counts row */
.ds-repro-counts {
  display: flex;
  gap: 8px;
  padding: 5px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--jp-border-color2);
}
.ds-repro-count {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.ds-repro-count--critical { color: #d32f2f; background: rgba(211,47,47,0.1); }
.ds-repro-count--warning  { color: #f57c00; background: rgba(245,124,0,0.1); }
.ds-repro-count--info     { color: #1976d2; background: rgba(25,118,210,0.1); }

/* Scrollable issue list */
.ds-repro-issues {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

/* All-OK state */
.ds-repro-all-ok {
  padding: 20px 12px;
  text-align: center;
  color: var(--jp-ui-font-color2);
  font-size: 12px;
}
.ds-repro-timestamp {
  font-size: 10px;
  color: var(--jp-ui-font-color3);
  margin-top: 4px;
}

/* Section */
.ds-repro-section { margin-bottom: 4px; }
.ds-repro-section-title {
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--jp-layout-color2);
  border-top: 1px solid var(--jp-border-color2);
}
.ds-repro-section--critical .ds-repro-section-title { color: #d32f2f; }
.ds-repro-section--warning  .ds-repro-section-title { color: #f57c00; }
.ds-repro-section--info     .ds-repro-section-title { color: #1976d2; }
.ds-repro-section-count { opacity: 0.7; font-weight: 400; }

/* Issue card */
.ds-repro-card {
  padding: 7px 10px;
  border-bottom: 1px solid var(--jp-border-color2);
  border-left: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ds-repro-card--critical { border-left-color: #d32f2f; }
.ds-repro-card--warning  { border-left-color: #f57c00; }
.ds-repro-card--info     { border-left-color: #1976d2; }

.ds-repro-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
}
.ds-repro-card-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--jp-ui-font-color0);
  line-height: 1.3;
  flex: 1;
}
.ds-repro-card-loc {
  font-size: 10px;
  color: var(--jp-ui-font-color3);
  white-space: nowrap;
}
.ds-repro-card-message {
  font-size: 11px;
  color: var(--jp-ui-font-color1);
  line-height: 1.4;
}
.ds-repro-card-details > summary {
  font-size: 10px;
  color: var(--jp-brand-color1);
  cursor: pointer;
  user-select: none;
  list-style: none;
}
.ds-repro-card-details > summary::before {
  content: '▶ ';
  font-size: 8px;
}
.ds-repro-card-details[open] > summary::before { content: '▼ '; }
.ds-repro-card-explanation {
  font-size: 10px;
  color: var(--jp-ui-font-color2);
  line-height: 1.45;
  margin-top: 3px;
  padding-left: 4px;
  border-left: 2px solid var(--jp-border-color2);
}
.ds-repro-card-suggestion {
  font-size: 10px;
  color: var(--jp-ui-font-color2);
  font-style: italic;
}
.ds-repro-card-actions {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
  margin-top: 2px;
}

/* Buttons */
.ds-repro-btn {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 10px;
  border: 1px solid;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.ds-repro-btn:disabled { opacity: 0.5; cursor: default; }

.ds-repro-btn--fix {
  border-color: var(--jp-brand-color1);
  color: var(--jp-brand-color1);
}
.ds-repro-btn--fix:hover:not(:disabled) {
  background: var(--jp-brand-color1);
  color: #fff;
}
.ds-repro-btn--dismiss {
  border-color: var(--jp-border-color1);
  color: var(--jp-ui-font-color2);
}
.ds-repro-btn--dismiss:hover:not(:disabled) {
  background: var(--jp-layout-color3);
}

/* Footer */
.ds-repro-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-top: 1px solid var(--jp-border-color1);
  flex-shrink: 0;
}
.ds-repro-btn--analyze {
  border-color: var(--jp-brand-color1);
  color: var(--jp-brand-color1);
  flex-shrink: 0;
}
.ds-repro-btn--analyze:hover:not(:disabled) {
  background: var(--jp-brand-color1);
  color: #fff;
}
.ds-repro-btn--fixall {
  border-color: #4caf50;
  color: #4caf50;
  flex-shrink: 0;
}
.ds-repro-btn--fixall:hover:not(:disabled) {
  background: #4caf50;
  color: #fff;
}
.ds-repro-footer .ds-repro-timestamp {
  font-size: 9px;
  color: var(--jp-ui-font-color3);
  margin-left: auto;
}

/* Error */
.ds-repro-error {
  padding: 6px 10px;
  font-size: 10px;
  color: #d32f2f;
  background: rgba(211,47,47,0.08);
  border-top: 1px solid rgba(211,47,47,0.2);
}

/* ── Cell Tags & Metadata Panel ──────────────────────────────────────────── */

/* Header button */
.ds-tags-panel-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.15s, background 0.15s;
}
.ds-tags-panel-btn:hover { opacity: 1; background: var(--jp-layout-color3, #ddd); }

/* Panel wrapper */
.ds-tags-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  gap: 6px;
}

/* Section switcher bar */
.ds-tags-section-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.ds-tags-section-btn {
  flex: 1;
  padding: 5px 8px;
  background: var(--jp-layout-color2, #f5f5f5);
  border: 1px solid var(--jp-border-color2, #ddd);
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: var(--jp-ui-font-color2, #555);
  transition: background 0.15s, color 0.15s;
}
.ds-tags-section-btn.active {
  background: var(--jp-brand-color1, #1976d2);
  color: #fff;
  border-color: transparent;
}
.ds-tags-refresh-btn {
  padding: 4px 8px;
  background: none;
  border: 1px solid var(--jp-border-color2, #ddd);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--jp-ui-font-color2, #555);
}
.ds-tags-refresh-btn:hover { background: var(--jp-layout-color2, #f5f5f5); }

/* Tag chip (shared between panel and overlay) */
.ds-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  background: color-mix(in srgb, var(--tag-color, #3b82f6) 15%, transparent);
  color: var(--tag-color, #3b82f6);
  border: 1px solid color-mix(in srgb, var(--tag-color, #3b82f6) 40%, transparent);
  cursor: default;
  user-select: none;
  white-space: nowrap;
}
.ds-tag-chip[title*="Jump"] { cursor: pointer; }
.ds-tag-chip[title*="Jump"]:hover {
  background: color-mix(in srgb, var(--tag-color, #3b82f6) 25%, transparent);
}
.ds-tag-chip-count {
  background: var(--tag-color, #3b82f6);
  color: #fff;
  border-radius: 10px;
  padding: 0 5px;
  font-size: 9px;
  min-width: 16px;
  text-align: center;
}
.ds-tag-chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--tag-color, #3b82f6);
  padding: 0;
  line-height: 1;
  opacity: 0.6;
}
.ds-tag-chip-remove:hover { opacity: 1; }

/* Active cell section */
.ds-tags-cell-section { display: flex; flex-direction: column; gap: 8px; }
.ds-tags-cell-ref {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-ui-font-color2, #555);
  display: flex;
  align-items: center;
  gap: 6px;
}
.ds-tags-cell-ref-hint {
  font-size: 10px;
  font-weight: 400;
  color: var(--jp-ui-font-color3, #aaa);
  font-family: var(--jp-ui-font-family);
}

.ds-tags-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Add tag row */
.ds-tags-add-row { display: flex; gap: 6px; }
.ds-tags-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 6px;
  font-size: 11px;
  background: var(--jp-layout-color0, #fff);
  color: var(--jp-ui-font-color1, #111);
}
.ds-tags-input:focus { outline: none; border-color: var(--jp-brand-color1, #1976d2); }
.ds-tags-add-btn {
  padding: 4px 10px;
  background: var(--jp-brand-color1, #1976d2);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.ds-tags-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ds-tags-add-btn:not(:disabled):hover { background: var(--jp-brand-color0, #1565c0); }

/* Quick-pick */
.ds-tags-quickpick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}
.ds-tags-quickpick-label { color: var(--jp-ui-font-color3, #aaa); flex-shrink: 0; }
.ds-tags-quickpick-btn {
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 10px;
  border: 1px dashed color-mix(in srgb, var(--tag-color, #3b82f6) 50%, transparent);
  background: none;
  color: var(--tag-color, #3b82f6);
  cursor: pointer;
}
.ds-tags-quickpick-btn:hover {
  background: color-mix(in srgb, var(--tag-color, #3b82f6) 12%, transparent);
}

/* Metadata editor */
.ds-tags-meta-section { display: flex; flex-direction: column; gap: 4px; }
.ds-tags-meta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--jp-ui-font-color1, #222);
}
.ds-tags-meta-save-btn {
  padding: 3px 10px;
  background: var(--jp-layout-color2, #f5f5f5);
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 6px;
  font-size: 10px;
  cursor: pointer;
}
.ds-tags-meta-save-btn:hover { background: var(--jp-layout-color3, #e8e8e8); }
.ds-tags-meta-editor {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  font-family: var(--jp-code-font-family, monospace);
  font-size: 10px;
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 6px;
  background: var(--jp-layout-color0, #fff);
  color: var(--jp-ui-font-color1, #111);
  resize: vertical;
}
.ds-tags-meta-editor:focus { outline: none; border-color: var(--jp-brand-color1, #1976d2); }
.ds-tags-meta-editor.ds-tags-meta-error { border-color: #ef4444; }
.ds-tags-meta-hint {
  font-size: 10px;
  color: var(--jp-ui-font-color3, #aaa);
  margin: 0;
  line-height: 1.4;
}
.ds-tags-meta-hint code {
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9px;
}

/* Error text */
.ds-tags-error {
  font-size: 10px;
  color: #ef4444;
  margin: 0;
}

/* Notebook overview */
.ds-tags-notebook-section { display: flex; flex-direction: column; gap: 8px; }
.ds-tags-filter-row { display: flex; gap: 6px; }
.ds-tags-filter-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--jp-border-color1, #ccc);
  border-radius: 6px;
  font-size: 11px;
  background: var(--jp-layout-color0, #fff);
  color: var(--jp-ui-font-color1, #111);
}
.ds-tags-filter-input:focus { outline: none; border-color: var(--jp-brand-color1, #1976d2); }
.ds-tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ds-tags-divider {
  border: none;
  border-top: 1px solid var(--jp-border-color2, #ddd);
}
.ds-tags-cells-list { display: flex; flex-direction: column; gap: 6px; }
.ds-tags-cell-row {
  padding: 7px 10px;
  border: 1px solid var(--jp-border-color2, #ddd);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ds-tags-cell-row:hover { background: var(--jp-layout-color2, #f5f5f5); }
.ds-tags-cell-row-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.ds-tags-cell-row-ref {
  font-size: 10px;
  font-weight: 600;
  font-family: var(--jp-code-font-family, monospace);
  color: var(--jp-ui-font-color2, #666);
}
.ds-tags-cell-row-type {
  font-size: 9px;
  color: var(--jp-ui-font-color3, #aaa);
  text-transform: uppercase;
}
.ds-tags-cell-row-preview {
  font-size: 10px;
  color: var(--jp-ui-font-color2, #555);
  font-family: var(--jp-code-font-family, monospace);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ds-tags-cell-row-tags { display: flex; flex-wrap: wrap; gap: 3px; }

.ds-tags-empty {
  font-size: 11px;
  color: var(--jp-ui-font-color3, #aaa);
  text-align: center;
  padding: 20px 0;
  margin: 0;
}

/* ── Cell tag overlay (pills injected into cell DOM) ─────────────────────── */

/* Thin bar inserted above every cell — holds tags (left) + position (right) */
.ds-cell-tag-overlay {
  display: flex;
  align-items: center;
  justify-content: space-between;  /* tags left, position right */
  gap: 3px;
  padding: 2px 6px;
  background: color-mix(in srgb, var(--jp-layout-color2, #f5f5f5) 70%, transparent);
  border-bottom: 1px solid var(--jp-border-color3, #eee);
  pointer-events: none;       /* don't interfere with cell selection */
  min-height: 18px;
}

/* Wrapper that keeps tag pills together on the left */
.ds-overlay-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  flex: 1;
}

/* Coloured tag pills */
.ds-cell-tag-pill {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  background: color-mix(in srgb, var(--pill-color, #3b82f6) 15%, transparent);
  color: var(--pill-color, #3b82f6);
  border: 1px solid color-mix(in srgb, var(--pill-color, #3b82f6) 35%, transparent);
  white-space: nowrap;
}

/* "#N" position badge — right-aligned, always visible */
.ds-cell-position-badge {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 9px;
  font-family: var(--jp-code-font-family, monospace);
  font-weight: 600;
  color: var(--jp-ui-font-color3, #aaa);
  letter-spacing: 0.02em;
  opacity: 0.75;
  user-select: none;
}

/* Slightly darker in JupyterLab dark themes */
.jp-mod-dark .ds-cell-position-badge,
body[data-jp-theme-light="false"] .ds-cell-position-badge {
  color: #666;
  opacity: 0.85;
}

/* Night mode overrides */
.ds-chat-night .ds-tags-input,
.ds-chat-night .ds-tags-filter-input,
.ds-chat-night .ds-tags-meta-editor {
  background: #1e1e2e;
  color: #cdd6f4;
  border-color: #45475a;
}
.ds-chat-night .ds-tags-add-btn { background: #7c3aed; }
.ds-chat-night .ds-tags-add-btn:hover { background: #6d28d9; }
.ds-chat-night .ds-tags-cell-row { border-color: #45475a; }
.ds-chat-night .ds-tags-cell-row:hover { background: #1e1e2e; }

/* ─── Output Overlay: badges (E), hover (D), context menu (D) ─────────────── */

/* Numbered badge injected at the top of each output element */
.ds-output-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  top: 3px;
  right: 6px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 4px;
  font-size: 10px;
  padding: 1px 5px;
  pointer-events: all;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.15s ease;
  user-select: none;
  white-space: nowrap;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Show badge on output hover */
.jp-OutputArea-child:hover .ds-output-badge,
.ds-output-child--hover .ds-output-badge {
  opacity: 1;
}

.ds-output-badge-num {
  font-weight: 700;
  font-size: 9px;
  opacity: 0.75;
  letter-spacing: 0.02em;
}

.ds-output-badge-icon {
  font-size: 11px;
}

.ds-output-badge-label {
  font-size: 9.5px;
  font-weight: 500;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Light blue ring highlight on the output being hovered */
.jp-OutputArea-child.ds-output-child--hover {
  outline: 2px solid rgba(99, 179, 237, 0.55);
  outline-offset: -2px;
  border-radius: 3px;
}

/* ─── D: Right-click context menu ─────────────────────────────────────────── */
.ds-output-ctx-menu {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  padding: 4px 0;
  min-width: 220px;
  max-width: 320px;
  font-family: var(--jp-ui-font-family, system-ui, sans-serif);
  font-size: 12px;
  overflow: hidden;
}

.ds-output-ctx-menu-title {
  padding: 6px 12px 4px;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-bottom: 1px solid #f0f0f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds-output-ctx-menu-item {
  padding: 7px 12px;
  cursor: pointer;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.1s;
}

.ds-output-ctx-menu-item:hover {
  background: #eff6ff;
  color: #2563eb;
}

/* ─── Disambiguation card ──────────────────────────────────────────────────── */
.ds-assistant-message-disambiguation {
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
}

.ds-disambig-card {
  background: var(--jp-layout-color1, #fff);
  border: 1px solid var(--jp-border-color1, #d0d0d0);
  border-left: 3px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 14px;
  margin: 6px 0;
  max-width: 420px;
  font-family: var(--jp-ui-font-family, system-ui, sans-serif);
}

.ds-disambig-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.ds-disambig-icon { font-size: 14px; }

.ds-disambig-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--jp-ui-font-color1, #1f2937);
  letter-spacing: 0.01em;
}

.ds-disambig-hint {
  font-size: 11px;
  color: var(--jp-ui-font-color2, #6b7280);
  margin-bottom: 10px;
  padding-left: 20px;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds-disambig-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ds-disambig-btn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
  background: var(--jp-layout-color2, #f7f7f7);
}

.ds-disambig-btn--chat {
  border-color: #bfdbfe;
}
.ds-disambig-btn--chat:hover {
  background: #eff6ff;
  border-color: #60a5fa;
}

.ds-disambig-btn--cell {
  border-color: #bbf7d0;
}
.ds-disambig-btn--cell:hover {
  background: #f0fdf4;
  border-color: #4ade80;
}

.ds-disambig-btn-icon { font-size: 16px; flex-shrink: 0; padding-top: 1px; }

.ds-disambig-btn-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ds-disambig-btn-body strong {
  font-size: 12px;
  color: var(--jp-ui-font-color1, #1f2937);
  font-weight: 600;
}

.ds-disambig-btn-body code {
  font-size: 10.5px;
  color: var(--jp-ui-font-color2, #6b7280);
  background: transparent;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
  display: block;
}

/* Night mode */
.ds-chat-night .ds-disambig-card {
  background: #1e2030;
  border-color: #414560;
  border-left-color: #f59e0b;
}
.ds-chat-night .ds-disambig-title { color: #cdd6f4; }
.ds-chat-night .ds-disambig-hint  { color: #7f849c; }
.ds-chat-night .ds-disambig-btn {
  background: #24273a;
}
.ds-chat-night .ds-disambig-btn--chat { border-color: #1e3a5f; }
.ds-chat-night .ds-disambig-btn--chat:hover {
  background: #172554;
  border-color: #3b82f6;
}
.ds-chat-night .ds-disambig-btn--cell { border-color: #14532d; }
.ds-chat-night .ds-disambig-btn--cell:hover {
  background: #052e16;
  border-color: #22c55e;
}
.ds-chat-night .ds-disambig-btn-body strong { color: #cdd6f4; }
.ds-chat-night .ds-disambig-btn-body code   { color: #7f849c; }
`, "",{"version":3,"sources":["webpack://./style/base.css"],"names":[],"mappings":"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,yDAAyD;EACzD,eAAe;AACjB;AACA;EACE,gBAAgB;EAChB,kDAAkD;EAClD,sCAAsC;AACxC;AACA;EACE,OAAO;EACP,qCAAqC;EACrC,gBAAgB;EAChB,uBAAuB;EACvB,mBAAmB;EACnB,eAAe;AACjB;AACA;EACE,eAAe;EACf,YAAY;EACZ,eAAe;EACf,cAAc;AAChB;AACA;EACE,UAAU;AACZ;;AAEA,yBAAyB;AACzB;EACE,sCAAsC;EACtC,qDAAqD;AACvD;AACA;EACE,8BAA8B;AAChC;AACA;;EAEE,sDAAsD;AACxD;AACA;EACE,cAAc;AAChB;AACA;EACE,+BAA+B;AACjC;AACA;EACE,gCAAgC;EAChC,cAAc;AAChB;AACA;EACE,iCAAiC;EACjC,cAAc;AAChB;AACA;EACE,sCAAsC;EACtC,qDAAqD;AACvD;AACA;EACE,cAAc;AAChB;AACA;EACE,+BAA+B;AACjC;;AAEA,wEAAwE;AACxE;EACE,kBAAkB;AACpB;;AAEA;;+DAE+D;;AAE/D;EACE,kBAAkB;EAClB,OAAO;EACP,YAAY;AACd;;AAEA,iEAAiE;AACjE;EACE,oBAAoB;EACpB,mBAAmB;EACnB,QAAQ;EACR,gBAAgB;EAChB,gBAAgB;EAChB,YAAY;EACZ,kBAAkB;EAClB,eAAe;EACf,qCAAqC;EACrC,qCAAqC;EACrC,yCAAyC;EACzC,eAAe;EACf,gBAAgB;AAClB;AACA;EACE,qCAAqC;EACrC,4CAA4C;AAC9C;AACA;EACE,qCAAqC;AACvC;AACA;EACE,cAAc;EACd,kBAAkB;AACpB;AACA;EACE,YAAY;EACZ,eAAe;AACjB;;AAEA;EACE,eAAe;EACf,gBAAgB;EAChB,gBAAgB;EAChB,uBAAuB;EACvB,mBAAmB;EACnB,OAAO;EACP,YAAY;AACd;;AAEA,iDAAiD;AACjD;EACE,qBAAqB;EACrB,UAAU;EACV,WAAW;EACX,sCAAsC;EACtC,uCAAuC;EACvC,wBAAwB;EACxB,cAAc;EACd,gBAAgB;EAChB,kDAAkD;EAClD,YAAY;AACd;AACA;EACE,0BAA0B;EAC1B,eAAe;AACjB;;AAEA,sBAAsB;A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","sourcesContent":["/* ============================================================\n   DS Assistant Sidebar - Base Styles\n   ============================================================ */\n\n/* ----------------------------------------------------------\n   Layout\n   ---------------------------------------------------------- */\n\n.ds-assistant-sidebar {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  background: var(--jp-layout-color1);\n  color: var(--jp-ui-font-color1);\n  font-family: var(--jp-ui-font-family);\n  font-size: var(--jp-ui-font-size1);\n}\n\n/* ----------------------------------------------------------\n   Header bar\n   ---------------------------------------------------------- */\n\n.ds-assistant-header {\n  padding: 8px 12px;\n  background: var(--jp-layout-color2);\n  border-bottom: 1px solid var(--jp-border-color2);\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.ds-assistant-title {\n  font-size: 13px;\n  font-weight: 600;\n  letter-spacing: 0.02em;\n  flex: 1;\n}\n\n/* Provider badge (Anthropic / Ollama) */\n.ds-provider-badge {\n  display: inline-flex;\n  align-items: center;\n  font-size: 10px;\n  font-weight: 500;\n  padding: 2px 6px;\n  border-radius: 8px;\n  white-space: nowrap;\n  user-select: none;\n}\n\n.ds-provider-badge-anthropic {\n  background: rgba(100, 100, 255, 0.15);\n  color: var(--jp-brand-color1, #4285f4);\n  border: 1px solid rgba(100, 100, 255, 0.3);\n}\n\n.ds-provider-badge-ollama {\n  background: rgba(60, 180, 100, 0.15);\n  color: #2e9b5e;\n  border: 1px solid rgba(60, 180, 100, 0.3);\n}\n\n.ds-provider-model {\n  opacity: 0.75;\n  font-size: 9px;\n}\n\n/* Hybrid badge — different providers per task */\n.ds-provider-badge-hybrid {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  font-size: 10px;\n  font-weight: 500;\n  padding: 2px 6px;\n  border-radius: 8px;\n  background: var(--jp-layout-color3, rgba(128, 128, 128, 0.1));\n  border: 1px solid var(--jp-border-color2);\n}\n\n.ds-provider-segment {\n  display: inline-flex;\n  align-items: center;\n}\n\n.ds-provider-segment-anthropic {\n  color: var(--jp-brand-color1, #4285f4);\n}\n\n.ds-provider-segment-ollama {\n  color: #2e9b5e;\n}\n\n.ds-provider-separator {\n  opacity: 0.4;\n  font-size: 9px;\n}\n\n/* ----------------------------------------------------------\n   Message list\n   ---------------------------------------------------------- */\n\n.ds-assistant-messages {\n  flex: 1;\n  overflow-y: auto;\n  padding: 8px;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.ds-assistant-message {\n  padding: 6px 10px;\n  border-radius: 6px;\n  max-width: 100%;\n  word-wrap: break-word;\n  white-space: pre-wrap;\n  line-height: 1.45;\n}\n\n.ds-assistant-message-user {\n  background: var(--jp-brand-color3, #c8e6c9);\n  align-self: flex-end;\n  border-bottom-right-radius: 2px;\n}\n\n.ds-assistant-message-assistant {\n  background: var(--jp-layout-color2);\n  align-self: flex-start;\n  border-bottom-left-radius: 2px;\n}\n\n.ds-assistant-message-system {\n  background: var(--jp-warn-color3, #fff3cd);\n  color: var(--jp-warn-color1, #856404);\n  font-size: 11px;\n  text-align: center;\n  border-radius: 4px;\n}\n\n.ds-assistant-message-warning {\n  background: #fff3cd;\n  color: #7d4e00;\n  border-left: 3px solid #f0ad00;\n  border-radius: 4px;\n  font-size: 12px;\n  padding: 6px 10px;\n  white-space: pre-wrap;\n}\n\n.ds-assistant-message-content {\n  display: block;\n}\n\n/* =============================================================\n   Markdown rendering inside chat bubbles (.ds-markdown)\n   ============================================================= */\n\n.ds-markdown { line-height: 1.55; overflow-wrap: break-word; }\n\n/* Compact spacing for headings */\n.ds-markdown h1, .ds-markdown h2, .ds-markdown h3,\n.ds-markdown h4, .ds-markdown h5, .ds-markdown h6 {\n  margin: 0.7em 0 0.3em;\n  font-weight: 600;\n  line-height: 1.25;\n}\n.ds-markdown h1 { font-size: 1.15em; }\n.ds-markdown h2 { font-size: 1.05em; }\n.ds-markdown h3 { font-size: 0.97em; }\n\n.ds-markdown p  { margin: 0.35em 0; }\n.ds-markdown p:first-child { margin-top: 0; }\n.ds-markdown p:last-child  { margin-bottom: 0; }\n\n.ds-markdown ul, .ds-markdown ol {\n  margin: 0.3em 0;\n  padding-left: 1.4em;\n}\n.ds-markdown li { margin: 0.1em 0; }\n\n.ds-markdown hr {\n  border: none;\n  border-top: 1px solid var(--jp-border-color2, #ddd);\n  margin: 0.6em 0;\n}\n\n/* Inline code */\n.ds-markdown code {\n  font-family: var(--jp-code-font-family, monospace);\n  font-size: 0.87em;\n  background: rgba(0,0,0,0.07);\n  border-radius: 3px;\n  padding: 0.1em 0.35em;\n}\n\n/* Code block wrapper: positions the copy button relative to the block */\n.ds-markdown .ds-code-block-wrapper {\n  position: relative;\n  margin: 0.4em 0;\n}\n\n/* Copy button — sits in the bottom-right corner of the code block */\n.ds-markdown .ds-copy-code-btn {\n  position: absolute;\n  bottom: 5px;\n  right: 6px;\n  padding: 1px 7px;\n  font-size: 9px;\n  font-weight: 600;\n  line-height: 1.6;\n  color: var(--jp-ui-font-color2, #888);\n  background: rgba(255,255,255,0.75);\n  border: 1px solid var(--jp-border-color2, #ccc);\n  border-radius: 3px;\n  cursor: pointer;\n  opacity: 0;                   /* hidden until hover */\n  transition: opacity 0.15s, background 0.15s;\n  z-index: 2;\n  user-select: none;\n}\n\n.ds-markdown .ds-code-block-wrapper:hover .ds-copy-code-btn {\n  opacity: 1;\n}\n\n.ds-markdown .ds-copy-code-btn:hover {\n  background: rgba(255,255,255,0.95);\n  color: var(--jp-ui-font-color1, #333);\n  border-color: var(--jp-border-color1, #aaa);\n}\n\n/* Code blocks */\n.ds-markdown pre {\n  background: rgba(0,0,0,0.07);\n  border-radius: 4px;\n  padding: 8px 10px;\n  overflow-x: auto;\n  margin: 0;                    /* wrapper provides the margin */\n}\n.ds-markdown pre code {\n  background: none;\n  padding: 0;\n  font-size: 0.84em;\n}\n\n/* Night mode: lighter copy button on dark background */\n.ds-chat-night .ds-markdown .ds-copy-code-btn {\n  background: rgba(40,40,40,0.85);\n  border-color: #555;\n  color: #aaa;\n}\n.ds-chat-night .ds-markdown .ds-copy-code-btn:hover {\n  background: rgba(60,60,60,0.95);\n  color: #e0e0e0;\n  border-color: #888;\n}\n\n/* Blockquote */\n.ds-markdown blockquote {\n  border-left: 3px solid var(--jp-brand-color1, #1976d2);\n  margin: 0.4em 0 0.4em 0;\n  padding: 0.2em 0.7em;\n  color: var(--jp-ui-font-color2, #666);\n}\n\n/* Tables */\n.ds-markdown table {\n  border-collapse: collapse;\n  font-size: 0.86em;\n  margin: 0.5em 0;\n  width: 100%;\n  overflow-x: auto;\n  display: block;\n}\n.ds-markdown th, .ds-markdown td {\n  border: 1px solid var(--jp-border-color1, #ccc);\n  padding: 4px 8px;\n  text-align: left;\n}\n.ds-markdown th {\n  background: var(--jp-layout-color2, #f0f0f0);\n  font-weight: 600;\n}\n.ds-markdown tr:nth-child(even) td {\n  background: var(--jp-layout-color2, #f7f7f7);\n}\n\n/* Links */\n.ds-markdown a {\n  color: var(--jp-brand-color1, #1976d2);\n  text-decoration: none;\n}\n.ds-markdown a:hover { text-decoration: underline; }\n\n/* Night-mode adjustments */\n.ds-chat-night .ds-markdown code,\n.ds-chat-night .ds-markdown pre {\n  background: rgba(255,255,255,0.08);\n}\n.ds-chat-night .ds-markdown th {\n  background: rgba(255,255,255,0.07);\n}\n.ds-chat-night .ds-markdown tr:nth-child(even) td {\n  background: rgba(255,255,255,0.04);\n}\n.ds-chat-night .ds-markdown th,\n.ds-chat-night .ds-markdown td {\n  border-color: var(--ds-border, rgba(255,255,255,0.15));\n}\n.ds-chat-night .ds-markdown blockquote {\n  color: var(--ds-text-dim, #999);\n}\n.ds-chat-night .ds-markdown hr {\n  border-color: var(--ds-border, rgba(255,255,255,0.1));\n}\n\n/* Loading / progress indicator */\n.ds-assistant-loading {\n  color: var(--jp-info-color1, #0c5460);\n  font-style: italic;\n  font-size: 12px;\n}\n\n/* ── Collapsible long messages ─────────────────────────────────────────── */\n.ds-msg-collapsible-wrap {\n  position: relative;\n}\n.ds-msg-collapsed {\n  max-height: 60px;\n  overflow: hidden;\n}\n/* Bottom fade-out gradient so text doesn't hard-clip */\n.ds-msg-fade {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  height: 36px;\n  pointer-events: none;\n  background: linear-gradient(\n    to bottom,\n    transparent 0%,\n    var(--jp-layout-color1, #fff) 100%\n  );\n}\n/* Expand / collapse icon button */\n.ds-msg-toggle-btn {\n  display: block;\n  margin: 2px 0 0 auto;\n  padding: 0;\n  width: 36px;\n  height: 36px;\n  line-height: 36px;\n  text-align: center;\n  font-size: 20px;\n  font-weight: 700;\n  color: var(--jp-ui-font-color2, #888);\n  background: transparent;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  opacity: 0.6;\n  transition: opacity 0.15s, color 0.15s;\n}\n.ds-msg-toggle-btn:hover {\n  opacity: 1;\n  color: var(--jp-brand-color1, #2196f3);\n}\n\n/* ── Equalizer-bar cursor shown at end of a streaming message ── */\n.ds-typing-cursor {\n  display: inline-flex;\n  align-items: flex-end;\n  gap: 2px;\n  height: 0.85em;\n  margin-left: 5px;\n  vertical-align: middle;\n}\n.ds-typing-cursor::before,\n.ds-typing-cursor::after,\n.ds-typing-cursor span {\n  content: '';\n  display: block;\n  width: 3px;\n  border-radius: 2px;\n  background-color: var(--jp-brand-color1, #2196f3);\n  animation: ds-eq-bar 0.9s ease-in-out infinite;\n}\n.ds-typing-cursor::before { height: 40%; animation-delay: 0s;    }\n.ds-typing-cursor span    { height: 90%; animation-delay: 0.15s; }\n.ds-typing-cursor::after  { height: 55%; animation-delay: 0.3s;  }\n\n@keyframes ds-eq-bar {\n  0%, 100% { transform: scaleY(0.25); opacity: 0.5; }\n  50%       { transform: scaleY(1);   opacity: 1;   }\n}\n\n/* ── Three-dot wave shown in the \"waiting for response\" status bubble ── */\n.ds-thinking-dots {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  margin-left: 4px;\n  vertical-align: middle;\n}\n.ds-thinking-dots span {\n  display: inline-block;\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background-color: var(--jp-brand-color1, #2196f3);\n  animation: ds-dot-wave 1.2s ease-in-out infinite;\n}\n.ds-thinking-dots span:nth-child(1) { animation-delay: 0s;    }\n.ds-thinking-dots span:nth-child(2) { animation-delay: 0.2s;  }\n.ds-thinking-dots span:nth-child(3) { animation-delay: 0.4s;  }\n\n@keyframes ds-dot-wave {\n  0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }\n  40%           { transform: translateY(-6px); opacity: 1;   }\n}\n\n/* ----------------------------------------------------------\n   Pending operations (Accept / Undo bars)\n   ---------------------------------------------------------- */\n\n.ds-assistant-pending-ops {\n  border-top: 1px solid var(--jp-border-color2);\n  padding: 4px;\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n}\n\n/* ----------------------------------------------------------\n   Diff View — visual AI-edit review panel\n   ---------------------------------------------------------- */\n\n.ds-diff-view {\n  border-radius: 6px;\n  border: 1px solid var(--jp-border-color2);\n  overflow: hidden;\n  font-size: 11px;\n  background: var(--jp-layout-color1, #fff);\n}\n\n/* Header row: summary + accept/undo */\n.ds-diff-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 5px 8px;\n  background: var(--jp-layout-color3, #f0f0f0);\n  border-bottom: 1px solid var(--jp-border-color2);\n  gap: 6px;\n}\n\n.ds-diff-header-info {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex: 1;\n  min-width: 0;\n}\n\n.ds-diff-header-cells {\n  font-weight: 600;\n  color: var(--jp-ui-font-color1);\n  white-space: nowrap;\n}\n\n.ds-diff-header-desc {\n  flex: 1;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--jp-ui-font-color2);\n}\n\n.ds-diff-header-stats {\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-ui-font-color2);\n  white-space: nowrap;\n}\n\n.ds-diff-header-actions {\n  display: flex;\n  gap: 4px;\n  flex-shrink: 0;\n}\n\n/* Per-cell sections */\n.ds-diff-cells {\n  display: flex;\n  flex-direction: column;\n}\n\n.ds-diff-cell-section {\n  border-top: 1px solid var(--jp-border-color3, #e0e0e0);\n}\n\n.ds-diff-cell-section:first-child {\n  border-top: none;\n}\n\n/* Cell accordion header button */\n.ds-diff-cell-header {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 3px 8px;\n  border: none;\n  background: var(--jp-layout-color2, #f8f8f8);\n  cursor: pointer;\n  font-size: 11px;\n  text-align: left;\n  color: var(--jp-ui-font-color1);\n  transition: background 0.1s ease;\n}\n\n.ds-diff-cell-header:hover {\n  background: var(--jp-layout-color3, #f0f0f0);\n}\n\n.ds-diff-cell-toggle {\n  color: var(--jp-ui-font-color2);\n  width: 10px;\n  flex-shrink: 0;\n}\n\n/* op-type badge */\n.ds-diff-op-badge {\n  display: inline-block;\n  padding: 0px 5px;\n  border-radius: 3px;\n  font-size: 10px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.02em;\n}\n\n.ds-diff-op-badge--insert  { background: #d4edda; color: #155724; }\n.ds-diff-op-badge--modify  { background: #d1ecf1; color: #0c5460; }\n.ds-diff-op-badge--delete  { background: #f8d7da; color: #721c24; }\n\n.ds-diff-cell-type {\n  color: var(--jp-ui-font-color3, #888);\n  font-style: italic;\n}\n\n.ds-diff-cell-pos {\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-ui-font-color2);\n}\n\n.ds-diff-cell-desc {\n  flex: 1;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--jp-ui-font-color2);\n}\n\n.ds-diff-stats {\n  font-family: var(--jp-code-font-family, monospace);\n  font-size: 11px;\n  margin-left: auto;\n  flex-shrink: 0;\n}\n\n.ds-diff-stats--insert { color: #28a745; }\n.ds-diff-stats--modify { color: #0066cc; }\n.ds-diff-stats--delete { color: #dc3545; }\n\n/* Diff lines area */\n.ds-diff-lines {\n  font-family: var(--jp-code-font-family, 'SFMono-Regular', Consolas, monospace);\n  font-size: 11px;\n  line-height: 1.5;\n  overflow-x: auto;\n  max-height: 320px;\n  overflow-y: auto;\n}\n\n.ds-diff-line {\n  display: flex;\n  align-items: flex-start;\n  min-height: 18px;\n}\n\n.ds-diff-gutter {\n  width: 14px;\n  min-width: 14px;\n  text-align: center;\n  user-select: none;\n  flex-shrink: 0;\n  padding: 0 2px;\n}\n\n.ds-diff-content {\n  flex: 1;\n  padding: 0 6px 0 2px;\n  white-space: pre;\n  word-break: break-all;\n}\n\n/* Colours matching Cursor AI's diff palette */\n.ds-diff-line--insert {\n  background: rgba(40, 167, 69, 0.15);\n  color: var(--jp-ui-font-color0, #1a1a1a);\n}\n\n.ds-diff-line--insert .ds-diff-gutter {\n  color: #28a745;\n  background: rgba(40, 167, 69, 0.25);\n}\n\n.ds-diff-line--delete {\n  background: rgba(220, 53, 69, 0.13);\n  color: var(--jp-ui-font-color0, #1a1a1a);\n}\n\n.ds-diff-line--delete .ds-diff-gutter {\n  color: #dc3545;\n  background: rgba(220, 53, 69, 0.22);\n}\n\n.ds-diff-line--equal {\n  color: var(--jp-ui-font-color2, #555);\n  opacity: 0.75;\n}\n\n.ds-diff-line--ellipsis {\n  color: var(--jp-ui-font-color3, #999);\n  padding: 0 14px;\n  font-style: italic;\n  user-select: none;\n}\n\n.ds-diff-empty {\n  font-style: italic;\n  color: var(--jp-ui-font-color3, #999);\n}\n\n/* Night-mode adjustments */\n.ds-chat-night .ds-diff-view {\n  background: #1e2433;\n  border-color: #2d3550;\n}\n\n.ds-chat-night .ds-diff-header {\n  background: #252d42;\n  border-color: #2d3550;\n}\n\n.ds-chat-night .ds-diff-cell-header {\n  background: #1e2433;\n  color: #c8d0e7;\n}\n\n.ds-chat-night .ds-diff-cell-header:hover {\n  background: #252d42;\n}\n\n.ds-chat-night .ds-diff-cell-section {\n  border-color: #2d3550;\n}\n\n.ds-chat-night .ds-diff-op-badge--insert { background: #1a3a27; color: #74c997; }\n.ds-chat-night .ds-diff-op-badge--modify { background: #1a2e3a; color: #6bbfdb; }\n.ds-chat-night .ds-diff-op-badge--delete { background: #3a1a1e; color: #e07a83; }\n\n.ds-chat-night .ds-diff-line--insert  { background: rgba(74, 201, 120, 0.12); color: #c8d0e7; }\n.ds-chat-night .ds-diff-line--insert .ds-diff-gutter { color: #4dc97a; background: rgba(74, 201, 120, 0.2); }\n.ds-chat-night .ds-diff-line--delete  { background: rgba(224, 82, 99, 0.14); color: #c8d0e7; }\n.ds-chat-night .ds-diff-line--delete .ds-diff-gutter { color: #e05263; background: rgba(224, 82, 99, 0.24); }\n.ds-chat-night .ds-diff-line--equal   { color: #7a849e; }\n\n/* Legacy action-bar kept for backward compat (no longer used in main UI) */\n.ds-assistant-action-bar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 4px 8px;\n  background: var(--jp-layout-color3, #f0f0f0);\n  border-radius: 4px;\n  border-left: 3px solid #28a745;\n  font-size: 11px;\n}\n\n.ds-assistant-action-description {\n  flex: 1;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  margin-right: 8px;\n  color: var(--jp-ui-font-color1);\n}\n\n.ds-assistant-action-buttons {\n  display: flex;\n  gap: 4px;\n  flex-shrink: 0;\n}\n\n/* ----------------------------------------------------------\n   Buttons\n   ---------------------------------------------------------- */\n\n.ds-assistant-btn {\n  padding: 2px 10px;\n  border: none;\n  border-radius: 3px;\n  cursor: pointer;\n  font-size: 11px;\n  font-weight: 500;\n  transition: opacity 0.15s ease;\n  line-height: 1.6;\n}\n\n.ds-assistant-btn:hover {\n  opacity: 0.82;\n}\n\n.ds-assistant-btn:active {\n  opacity: 0.7;\n}\n\n.ds-assistant-btn-accept {\n  background: #28a745;\n  color: #ffffff;\n}\n\n.ds-assistant-btn-accept-run {\n  background: #0066cc;\n  color: #ffffff;\n}\n\n.ds-assistant-btn-undo {\n  background: #fd7e14;\n  color: #ffffff;\n}\n\n/* Apply selection (partial hunk accept) */\n/* \"Push code to cell\" fallback button shown below assistant messages\n   that contain code blocks but produced no cell operations. */\n/* ── Context chip (input area + sent bubble) ─────────────────────────────── */\n\n/* Shared base */\n.ds-ctx-chip {\n  border: 1px solid var(--jp-border-color2, #ddd);\n  border-radius: 6px;\n  background: var(--jp-layout-color2, #f4f4f4);\n  font-size: 11px;\n  overflow: hidden;\n}\n\n/* Input-area variant: sits above the textarea */\n.ds-ctx-chip:not(.ds-ctx-chip--bubble) {\n  margin-bottom: 4px;\n}\n\n/* Bubble variant: sits below the user's typed text */\n.ds-ctx-chip--bubble {\n  margin-top: 6px;\n  opacity: 0.9;\n}\n\n/* Header row */\n.ds-ctx-chip-header {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 4px 7px;\n}\n\n/* When the chip is NOT .ds-ctx-chip--bubble, the header IS the chip (no wrapper) */\n.ds-ctx-chip:not(.ds-ctx-chip--bubble) {\n  display: flex;\n  flex-direction: column;\n}\n\n.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-icon,\n.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-label,\n.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-toggle,\n.ds-ctx-chip:not(.ds-ctx-chip--bubble) > .ds-ctx-chip-remove {\n  /* inline items in input-area chip (no .ds-ctx-chip-header wrapper) */\n}\n\n.ds-ctx-chip:not(.ds-ctx-chip--bubble) {\n  flex-direction: row;\n  align-items: center;\n  flex-wrap: wrap;\n  padding: 4px 7px;\n  gap: 5px;\n}\n\n.ds-ctx-chip-icon   { flex-shrink: 0; }\n\n.ds-ctx-chip-label  {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--jp-ui-font-color1, #333);\n  font-weight: 500;\n}\n\n.ds-ctx-chip-toggle,\n.ds-ctx-chip-remove {\n  flex-shrink: 0;\n  background: none;\n  border: none;\n  padding: 0 3px;\n  cursor: pointer;\n  color: var(--jp-ui-font-color2, #888);\n  font-size: 10px;\n  line-height: 1;\n}\n.ds-ctx-chip-toggle:hover { color: var(--jp-brand-color1, #1976d2); }\n.ds-ctx-chip-remove:hover { color: #d32f2f; }\n\n/* Expanded code preview */\n.ds-ctx-chip-preview {\n  margin: 0;\n  padding: 6px 8px;\n  font-family: var(--jp-code-font-family, monospace);\n  font-size: 10px;\n  line-height: 1.45;\n  white-space: pre;\n  overflow-x: auto;\n  max-height: 200px;\n  overflow-y: auto;\n  border-top: 1px solid var(--jp-border-color2, #ddd);\n  background: var(--jp-layout-color1, #fff);\n  color: var(--jp-ui-font-color1, #333);\n}\n\n/* Night mode */\n.ds-chat-night .ds-ctx-chip {\n  background: #23233a;\n  border-color: #3a3a5c;\n}\n.ds-chat-night .ds-ctx-chip-label { color: #c8c8e0; }\n.ds-chat-night .ds-ctx-chip-preview {\n  background: #1a1a2e;\n  color: #c8c8e0;\n  border-color: #3a3a5c;\n}\n\n/* ─────────────────────────────────────────────────────────────────────────── */\n\n.ds-push-to-cell-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  margin-top: 4px;\n  padding: 0;\n  width: 36px;\n  height: 36px;\n  font-size: 20px;\n  font-weight: 700;\n  line-height: 1;\n  color: #6f42c1;\n  background: transparent;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  opacity: 0.65;\n  transition: opacity 0.15s, color 0.15s;\n}\n\n.ds-push-to-cell-btn:hover {\n  opacity: 1;\n  color: #5a2ea6;\n}\n\n.ds-chat-night .ds-push-to-cell-btn {\n  color: #c9a7f5;\n}\n.ds-chat-night .ds-push-to-cell-btn:hover {\n  color: #e0c4ff;\n}\n\n.ds-assistant-btn-apply {\n  background: #6f42c1;\n  color: #ffffff;\n}\n\n.ds-assistant-btn-apply:disabled {\n  background: #b0a0d0;\n  cursor: not-allowed;\n  opacity: 0.55;\n}\n\n/* ----------------------------------------------------------\n   Diff hint text\n   ---------------------------------------------------------- */\n\n.ds-diff-hint {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2, #888);\n  padding: 4px 10px 6px;\n  border-bottom: 1px solid var(--jp-border-color3, #eee);\n  line-height: 1.4;\n}\n\n.ds-diff-cell-body {\n  display: flex;\n  flex-direction: column;\n}\n\n/* ----------------------------------------------------------\n   Hunk-level Accept / Reject controls\n   ---------------------------------------------------------- */\n\n/* One hunk block (context + change lines + toolbar) */\n.ds-hunk-section {\n  border-bottom: 1px dashed var(--jp-border-color3, #ddd);\n  transition: background 0.15s;\n}\n\n.ds-hunk-section:last-child {\n  border-bottom: none;\n}\n\n/* Accepted hunk → green tint */\n.ds-hunk-banner--accepted {\n  background: rgba(40, 167, 69, 0.07);\n  border-left: 3px solid #28a745;\n}\n\n/* Rejected hunk → red tint */\n.ds-hunk-banner--rejected {\n  background: rgba(220, 53, 69, 0.06);\n  border-left: 3px solid #dc3545;\n  opacity: 0.7;\n}\n\n/* Toolbar row shown above each hunk's diff lines */\n.ds-hunk-bar {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 3px 8px;\n  background: var(--jp-layout-color2, #f5f5f5);\n  border-bottom: 1px solid var(--jp-border-color3, #e8e8e8);\n}\n\n.ds-hunk-bar--whole {\n  border-top: 1px solid var(--jp-border-color3, #e8e8e8);\n  background: var(--jp-layout-color2, #f5f5f5);\n}\n\n.ds-hunk-label {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2, #888);\n  flex: 1;\n}\n\n.ds-hunk-del {\n  color: #dc3545;\n  font-weight: 600;\n  margin-right: 2px;\n}\n\n.ds-hunk-ins {\n  color: #28a745;\n  font-weight: 600;\n}\n\n.ds-hunk-btns {\n  display: flex;\n  gap: 4px;\n  flex-shrink: 0;\n}\n\n/* Individual hunk accept / reject buttons */\n.ds-hunk-btn {\n  padding: 1px 8px;\n  font-size: 10px;\n  font-weight: 600;\n  border: 1px solid transparent;\n  border-radius: 3px;\n  cursor: pointer;\n  opacity: 0.75;\n  transition: opacity 0.12s, background 0.12s;\n}\n\n.ds-hunk-btn--accept {\n  color: #28a745;\n  border-color: #28a745;\n  background: transparent;\n}\n\n.ds-hunk-btn--reject {\n  color: #dc3545;\n  border-color: #dc3545;\n  background: transparent;\n}\n\n/* Active (pressed) state */\n.ds-hunk-btn--active.ds-hunk-btn--accept {\n  background: #28a745;\n  color: #fff;\n  opacity: 1;\n}\n\n.ds-hunk-btn--active.ds-hunk-btn--reject {\n  background: #dc3545;\n  color: #fff;\n  opacity: 1;\n}\n\n.ds-hunk-btn:hover {\n  opacity: 1;\n}\n\n/* Status text after deciding a whole cell */\n.ds-hunk-status {\n  font-size: 10px;\n  font-weight: 600;\n  margin-left: 4px;\n}\n\n.ds-hunk-status--accepted { color: #28a745; }\n.ds-hunk-status--rejected { color: #dc3545; }\n\n/* \"X/Y decided\" progress badge in cell header */\n.ds-hunk-progress {\n  margin-left: auto;\n  font-size: 9px;\n  color: #6f42c1;\n  font-weight: 600;\n  background: rgba(111, 66, 193, 0.1);\n  padding: 1px 5px;\n  border-radius: 8px;\n}\n\n/* Hunk diff lines have a slightly lighter background to distinguish from\n   the full-cell collapsed view */\n.ds-diff-lines--hunk {\n  background: var(--jp-layout-color1, #fff);\n  border-top: none;\n}\n\n/* Night mode overrides for hunk UI */\n.ds-chat-night .ds-hunk-bar,\n.ds-chat-night .ds-hunk-bar--whole {\n  background: #1a1a2e;\n  border-color: #333;\n}\n\n.ds-chat-night .ds-hunk-btn--active.ds-hunk-btn--accept { background: #1a6b2a; }\n.ds-chat-night .ds-hunk-btn--active.ds-hunk-btn--reject { background: #6b1a1a; }\n\n.ds-chat-night .ds-diff-hint {\n  color: #666;\n}\n\n/* ----------------------------------------------------------\n   Input area\n   ---------------------------------------------------------- */\n\n.ds-assistant-input-area {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 0 8px 8px;   /* top padding removed — handled by resize handle */\n  border-top: 1px solid var(--jp-border-color2);\n  flex-shrink: 0;\n}\n\n/* ── Drag-to-resize handle at the top of the input area ─────────────── */\n.ds-input-resize-handle {\n  width: 100%;\n  height: 10px;\n  cursor: ns-resize;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  user-select: none;\n  flex-shrink: 0;\n}\n\n.ds-input-resize-handle:hover .ds-input-resize-grip,\n.ds-input-resize-handle:active .ds-input-resize-grip {\n  background: var(--jp-brand-color1, #1976d2);\n  width: 36px;\n}\n\n.ds-input-resize-grip {\n  display: block;\n  width: 28px;\n  height: 3px;\n  border-radius: 2px;\n  background: var(--jp-border-color2, #ccc);\n  transition: width 0.15s, background 0.15s;\n}\n\n/* Bottom row: model switcher (left) + send button (right) */\n.ds-assistant-input-bottom {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n/* ── Token usage counter (input/output) in the bottom bar ── */\n.ds-token-counter {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 10px;\n  font-family: var(--jp-code-font-family, monospace);\n  opacity: 0.55;\n  user-select: none;\n  white-space: nowrap;\n  flex-shrink: 0;\n  cursor: default;\n}\n.ds-token-counter:hover {\n  opacity: 0.85;\n}\n.ds-token-in {\n  color: var(--jp-info-color1, #0288d1);\n}\n.ds-token-out {\n  color: var(--jp-warn-color1, #f9a825);\n}\n.ds-chat-night .ds-token-counter {\n  opacity: 0.45;\n}\n.ds-chat-night .ds-token-counter:hover {\n  opacity: 0.85;\n}\n.ds-chat-night .ds-token-in {\n  color: #58b3e8;\n}\n.ds-chat-night .ds-token-out {\n  color: #f9c84a;\n}\n\n.ds-assistant-input {\n  width: 100%;\n  resize: none;          /* height controlled by drag handle */\n  min-height: 56px;\n  padding: 6px 8px;\n  border: 1px solid var(--jp-border-color2);\n  border-radius: 4px;\n  background: var(--jp-layout-color1);\n  color: var(--jp-ui-font-color1);\n  font-family: var(--jp-ui-font-family);\n  font-size: var(--jp-ui-font-size1);\n  box-sizing: border-box;\n  line-height: 1.45;\n  overflow-y: auto;\n}\n\n.ds-assistant-input:focus {\n  outline: none;\n  border-color: var(--jp-brand-color1, #1976d2);\n  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);\n}\n\n.ds-assistant-input:disabled {\n  opacity: 0.55;\n  cursor: not-allowed;\n}\n\n.ds-assistant-send-btn {\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  padding: 0;\n  background: var(--jp-layout-color3, #e0e0e0);\n  color: var(--jp-ui-font-color1, #333);\n  border: none;\n  border-radius: 50%;\n  cursor: pointer;\n  transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;\n}\n\n.ds-assistant-send-btn:hover:not(:disabled) {\n  background: var(--jp-layout-color4, #bdbdbd);\n}\n\n.ds-assistant-send-btn:disabled {\n  opacity: 0.35;\n  cursor: not-allowed;\n}\n\n/* Stop button variant — subtle red tint to signal \"danger / cancel\" */\n.ds-assistant-send-btn.ds-send-stop {\n  background: var(--jp-layout-color3, #e0e0e0);\n  color: #c0392b;\n}\n\n.ds-assistant-send-btn.ds-send-stop:hover {\n  background: #fdecea;\n  color: #c0392b;\n}\n\n/* Night-mode adjustments */\n.ds-chat-night .ds-assistant-send-btn {\n  background: #2d2d2d;\n  color: #e0e0e0;\n}\n\n.ds-chat-night .ds-assistant-send-btn:hover:not(:disabled) {\n  background: #3a3a3a;\n}\n\n.ds-chat-night .ds-assistant-send-btn.ds-send-stop {\n  background: #2d2d2d;\n  color: #e57373;\n}\n\n.ds-chat-night .ds-assistant-send-btn.ds-send-stop:hover {\n  background: #3b1f1f;\n  color: #ef9a9a;\n}\n\n/* ----------------------------------------------------------\n   New session button (pencil icon, between model switcher and Send)\n   ---------------------------------------------------------- */\n\n.ds-new-session-btn {\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 11px;\n  padding: 0;\n  border-radius: 4px;\n  line-height: 1;\n  color: var(--jp-ui-font-color2, #888);\n  transition: color 0.15s, background 0.15s;\n  opacity: 0.7;\n}\n\n.ds-new-session-btn:hover:not(:disabled) {\n  color: var(--jp-ui-font-color0, #333);\n  background: var(--jp-layout-color3, rgba(0,0,0,0.08));\n  opacity: 1;\n}\n\n.ds-new-session-btn:disabled {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n\n/* Keep the button legible in both chat themes */\n.ds-chat-day .ds-new-session-btn,\n.ds-chat-night .ds-new-session-btn {\n  color: var(--ds-text-dim) !important;\n}\n.ds-chat-day .ds-new-session-btn:hover:not(:disabled),\n.ds-chat-night .ds-new-session-btn:hover:not(:disabled) {\n  color:      var(--ds-text) !important;\n  background: var(--ds-border) !important;\n}\n\n/* =============================================================\n   Cell-mode toggle button (💬 / ⚡ / 📝)\n   ============================================================= */\n\n.ds-cell-mode-btn {\n  flex-shrink: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  padding: 0;\n  font-size: 10px;\n  line-height: 1;\n  background: transparent;\n  border: 1px solid transparent;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background 0.15s ease, border-color 0.15s ease;\n  opacity: 0.7;\n}\n\n.ds-cell-mode-btn:hover {\n  opacity: 1;\n  background: var(--jp-layout-color2, #f0f0f0);\n}\n\n/* Per-mode accent borders so the active state is immediately readable */\n.ds-cell-mode-chat  { border-color: #9c9c9c; }\n.ds-cell-mode-auto  { border-color: #f5a623; }\n.ds-cell-mode-doc   { border-color: #4caf50; }\n\n.ds-cell-mode-chat  { opacity: 0.9; }\n.ds-cell-mode-auto  { opacity: 0.9; }\n.ds-cell-mode-doc   { opacity: 0.9; }\n\n/* Night-mode */\n.ds-chat-night .ds-cell-mode-btn:hover {\n  background: var(--ds-border, #333);\n}\n\n/* =============================================================\n   Thread bar & popup\n   ============================================================= */\n\n/* Thin strip below the header */\n.ds-thread-bar {\n  position: relative;\n  display: flex;\n  align-items: center;\n  padding: 0 8px;\n  min-height: 26px;\n  border-bottom: 1px solid var(--jp-border-color2, #e0e0e0);\n  flex-shrink: 0;\n}\n\n/* Toggle button (opens the popup) */\n.ds-thread-toggle {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  padding: 3px 6px;\n  border-radius: 4px;\n  font-size: 11px;\n  color: var(--jp-ui-font-color1, #333);\n  max-width: 100%;\n  overflow: hidden;\n}\n.ds-thread-toggle:hover {\n  background: var(--jp-layout-color3, rgba(0,0,0,0.07));\n}\n.ds-thread-icon {\n  font-size: 13px;\n  opacity: 0.6;\n  flex-shrink: 0;\n}\n.ds-thread-name {\n  font-weight: 500;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 140px;\n}\n.ds-thread-count {\n  opacity: 0.5;\n  font-size: 10px;\n  flex-shrink: 0;\n}\n.ds-thread-chevron {\n  opacity: 0.5;\n  font-size: 12px;\n  transition: transform 0.15s;\n  flex-shrink: 0;\n}\n.ds-thread-chevron-up {\n  transform: rotate(90deg);\n}\n\n/* Popup panel */\n.ds-thread-popup {\n  position: absolute;\n  top: calc(100% + 2px);\n  left: 0;\n  z-index: 1000;\n  min-width: 200px;\n  max-width: 280px;\n  background: var(--jp-layout-color1, #fff);\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 6px;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n  padding: 4px 0;\n  overflow: hidden;\n}\n\n/* Notebook name header inside the thread popup */\n.ds-thread-popup-notebook {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  padding: 5px 10px 4px;\n  border-bottom: 1px solid var(--jp-border-color2, #eee);\n  background: var(--jp-layout-color2, #f7f7f7);\n  margin-bottom: 2px;\n}\n.ds-thread-popup-nb-icon { font-size: 11px; flex-shrink: 0; }\n.ds-thread-popup-nb-name {\n  font-size: 10px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color2, #666);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  letter-spacing: 0.01em;\n}\n\n/* Single thread row */\n.ds-thread-item {\n  display: flex;\n  align-items: center;\n  padding: 5px 10px;\n  gap: 4px;\n  cursor: pointer;\n  font-size: 12px;\n  color: var(--jp-ui-font-color1, #333);\n}\n.ds-thread-item:hover {\n  background: var(--jp-layout-color2, #f5f5f5);\n}\n.ds-thread-item-active {\n  font-weight: 600;\n}\n.ds-thread-item-name {\n  flex: 1;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.ds-thread-check {\n  color: var(--jp-brand-color1, #2196f3);\n  margin-right: 4px;\n  font-size: 11px;\n}\n\n/* Rename/delete icon buttons */\n.ds-thread-action-btn {\n  flex-shrink: 0;\n  opacity: 0;\n  cursor: pointer;\n  font-size: 11px;\n  padding: 1px 4px;\n  border-radius: 3px;\n  color: var(--jp-ui-font-color2, #666);\n  transition: opacity 0.1s, background 0.1s;\n}\n.ds-thread-item:hover .ds-thread-action-btn {\n  opacity: 0.6;\n}\n.ds-thread-action-btn:hover {\n  opacity: 1 !important;\n  background: var(--jp-layout-color3, rgba(0,0,0,0.1));\n}\n.ds-thread-delete-btn:hover {\n  color: #e53935;\n}\n\n/* Inline rename input */\n.ds-thread-rename-input {\n  flex: 1;\n  font-size: 12px;\n  padding: 2px 5px;\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 3px;\n  outline: none;\n  background: var(--jp-layout-color0, #fff);\n  color: var(--jp-ui-font-color0, #000);\n}\n\n/* \"New thread\" row at the bottom */\n.ds-thread-new-item {\n  padding: 5px 10px;\n  font-size: 12px;\n  cursor: pointer;\n  color: var(--jp-brand-color1, #2196f3);\n  border-top: 1px solid var(--jp-border-color2, #e0e0e0);\n  margin-top: 2px;\n}\n.ds-thread-new-item:hover {\n  background: var(--jp-layout-color2, #f5f5f5);\n}\n\n/* Night-mode overrides */\n.ds-chat-night .ds-thread-bar {\n  border-color: var(--ds-border, rgba(255,255,255,0.1));\n}\n.ds-chat-night .ds-thread-toggle {\n  color: var(--ds-text-dim, #aaa);\n}\n.ds-chat-night .ds-thread-toggle:hover {\n  background: var(--ds-surface2, rgba(255,255,255,0.06));\n}\n.ds-chat-night .ds-thread-popup {\n  background: var(--ds-surface, #1e1e1e);\n  border-color: var(--ds-border, rgba(255,255,255,0.1));\n}\n.ds-chat-night .ds-thread-popup-notebook {\n  background: rgba(255,255,255,0.04);\n  border-bottom-color: rgba(255,255,255,0.08);\n}\n.ds-chat-night .ds-thread-popup-nb-name {\n  color: rgba(255,255,255,0.45);\n}\n.ds-chat-night .ds-thread-item {\n  color: var(--ds-text, #e0e0e0);\n}\n.ds-chat-night .ds-thread-item:hover {\n  background: var(--ds-surface2, rgba(255,255,255,0.06));\n}\n.ds-chat-night .ds-thread-new-item {\n  border-color: var(--ds-border, rgba(255,255,255,0.1));\n  color: #7ec8e3;\n}\n.ds-chat-night .ds-thread-new-item:hover {\n  background: var(--ds-surface2, rgba(255,255,255,0.06));\n}\n.ds-chat-night .ds-thread-rename-input {\n  background: var(--ds-surface2, #2a2a2a);\n  border-color: var(--ds-border, rgba(255,255,255,0.2));\n  color: var(--ds-text, #e0e0e0);\n}\n\n/* =============================================================\n   Slash-command autocomplete popup + active badge\n   ============================================================= */\n\n/* Popup anchored to the bottom of the input area (above the textarea) */\n.ds-cmd-popup {\n  position: absolute;\n  bottom: calc(100% + 4px);\n  left: 0;\n  right: 0;\n  z-index: 1100;\n  background: var(--jp-layout-color1, #fff);\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 6px;\n  box-shadow: 0 -4px 14px rgba(0,0,0,0.12);\n  max-height: 220px;\n  overflow-y: auto;\n  padding: 4px 0;\n}\n\n.ds-cmd-item {\n  display: flex;\n  align-items: baseline;\n  gap: 6px;\n  padding: 5px 12px;\n  cursor: pointer;\n  font-size: 12px;\n  color: var(--jp-ui-font-color1, #333);\n}\n.ds-cmd-item:hover,\n.ds-cmd-item-active {\n  background: var(--jp-layout-color2, #f0f0f0);\n}\n\n.ds-cmd-name {\n  font-weight: 600;\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-brand-color1, #1976d2);\n  min-width: 90px;\n  flex-shrink: 0;\n}\n\n.ds-cmd-badge {\n  font-size: 9px;\n  padding: 1px 5px;\n  border-radius: 8px;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  flex-shrink: 0;\n}\n.ds-cmd-badge-builtin {\n  background: #e8f5e9;\n  color: #2e7d32;\n}\n.ds-cmd-badge-skill {\n  background: #e3f2fd;\n  color: #1565c0;\n}\n\n.ds-cmd-desc {\n  color: var(--jp-ui-font-color2, #666);\n  font-size: 11px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* Active command badge shown above the textarea */\n.ds-cmd-active-badge {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 4px 10px;\n  background: var(--jp-layout-color2, #f5f5f5);\n  border-bottom: 1px solid var(--jp-border-color2, #e0e0e0);\n  font-size: 12px;\n}\n.ds-cmd-active-name {\n  font-weight: 600;\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-brand-color1, #1976d2);\n}\n.ds-cmd-active-desc {\n  flex: 1;\n  color: var(--jp-ui-font-color2, #666);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 11px;\n}\n.ds-cmd-active-clear {\n  cursor: pointer;\n  opacity: 0.5;\n  font-size: 11px;\n  flex-shrink: 0;\n}\n.ds-cmd-active-clear:hover {\n  opacity: 1;\n}\n\n/* Night mode overrides */\n.ds-chat-night .ds-cmd-popup {\n  background: var(--ds-surface, #1e1e1e);\n  border-color: var(--ds-border, rgba(255,255,255,0.1));\n}\n.ds-chat-night .ds-cmd-item {\n  color: var(--ds-text, #e0e0e0);\n}\n.ds-chat-night .ds-cmd-item:hover,\n.ds-chat-night .ds-cmd-item-active {\n  background: var(--ds-surface2, rgba(255,255,255,0.07));\n}\n.ds-chat-night .ds-cmd-name {\n  color: #7ec8e3;\n}\n.ds-chat-night .ds-cmd-desc {\n  color: var(--ds-text-dim, #999);\n}\n.ds-chat-night .ds-cmd-badge-builtin {\n  background: rgba(46,125,50,0.25);\n  color: #81c784;\n}\n.ds-chat-night .ds-cmd-badge-skill {\n  background: rgba(21,101,192,0.25);\n  color: #64b5f6;\n}\n.ds-chat-night .ds-cmd-active-badge {\n  background: var(--ds-surface, #1e1e1e);\n  border-color: var(--ds-border, rgba(255,255,255,0.1));\n}\n.ds-chat-night .ds-cmd-active-name {\n  color: #7ec8e3;\n}\n.ds-chat-night .ds-cmd-active-desc {\n  color: var(--ds-text-dim, #999);\n}\n\n/* Make the input-area position:relative so the popup can anchor to it */\n.ds-assistant-input-area {\n  position: relative;\n}\n\n/* ----------------------------------------------------------\n   Model switcher\n   ---------------------------------------------------------- */\n\n.ds-model-switcher {\n  position: relative;\n  flex: 1;\n  min-width: 0;\n}\n\n/* ── Trigger button — minimal, no border, text + caret only ── */\n.ds-model-switcher-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 2px 4px;\n  background: none;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  font-family: var(--jp-ui-font-family);\n  color: var(--jp-ui-font-color2, #777);\n  transition: color 0.12s, background 0.12s;\n  max-width: 100%;\n  overflow: hidden;\n}\n.ds-model-switcher-btn:hover:not(:disabled) {\n  color: var(--jp-ui-font-color0, #222);\n  background: var(--jp-layout-color2, #ebebeb);\n}\n.ds-model-switcher-btn--open {\n  color: var(--jp-ui-font-color0, #222);\n}\n.ds-model-switcher-btn--unconfigured {\n  color: #c0392b;\n  font-style: italic;\n}\n.ds-model-switcher-btn:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n\n.ds-model-switcher-model-name {\n  font-size: 12px;\n  font-weight: 500;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n  min-width: 0;\n}\n\n/* Small ˅ caret — pure CSS, no rotation needed */\n.ds-model-switcher-chevron {\n  display: inline-block;\n  width: 5px;\n  height: 5px;\n  border-right: 1.5px solid currentColor;\n  border-bottom: 1.5px solid currentColor;\n  transform: rotate(45deg);\n  flex-shrink: 0;\n  margin-top: -3px;\n  transition: transform 0.15s ease, margin-top 0.15s;\n  opacity: 0.7;\n}\n.ds-model-switcher-btn--open .ds-model-switcher-chevron {\n  transform: rotate(-135deg);\n  margin-top: 3px;\n}\n\n/* ── Popup panel ── */\n.ds-model-switcher-popup {\n  position: absolute;\n  bottom: calc(100% + 8px);\n  left: 0;\n  z-index: 1000;\n  min-width: 240px;\n  max-width: min(340px, calc(100vw - 24px));\n  background: var(--jp-layout-color1, #fff);\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 10px;\n  box-shadow: 0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);\n  overflow: hidden;\n  animation: ds-popup-in 0.12s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n@keyframes ds-popup-in {\n  from { opacity: 0; transform: translateY(6px) scale(0.98); }\n  to   { opacity: 1; transform: translateY(0)   scale(1); }\n}\n\n.ds-model-switcher-popup-header {\n  display: flex;\n  align-items: baseline;\n  gap: 7px;\n  padding: 8px 14px 7px;\n  border-bottom: 1px solid var(--jp-border-color2, #eee);\n  border-left: 3px solid;          /* color set via inline style */\n}\n\n.ds-model-switcher-popup-provider {\n  font-size: 11px;\n  font-weight: 800;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n  /* color set via inline style */\n}\n\n.ds-model-switcher-popup-label {\n  font-size: 10px;\n  font-weight: 500;\n  color: var(--jp-ui-font-color3, #aaa);\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n\n.ds-model-switcher-list {\n  max-height: 260px;\n  overflow-y: auto;\n  padding: 5px 0;\n}\n\n.ds-model-switcher-option {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  padding: 8px 14px;\n  background: none;\n  border: none;\n  border-left: 3px solid transparent;\n  cursor: pointer;\n  font-size: 12px;\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-ui-font-color0, #222);\n  text-align: left;\n  gap: 10px;\n  transition: background 0.1s;\n}\n.ds-model-switcher-option:hover {\n  background: var(--jp-layout-color2, #f5f5f5);\n}\n.ds-model-switcher-option--active {\n  border-left-color: currentColor;    /* color set via inline style */\n  font-weight: 600;\n  background: color-mix(in srgb, var(--jp-layout-color1) 60%, transparent);\n}\n.ds-model-switcher-option--active:hover {\n  background: var(--jp-layout-color2, #f0f0f0);\n}\n\n.ds-model-switcher-option-name {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n  min-width: 0;\n}\n\n.ds-model-switcher-check {\n  font-size: 13px;\n  font-weight: 700;\n  flex-shrink: 0;\n  /* color set via inline style */\n}\n\n.ds-model-switcher-empty {\n  padding: 12px 14px;\n  font-size: 11px;\n  color: var(--jp-ui-font-color2, #888);\n  white-space: pre-line;\n  text-align: center;\n  font-style: italic;\n  line-height: 1.5;\n}\n\n/* ----------------------------------------------------------\n   Header icon buttons (gear, shield, theme toggle)\n   ---------------------------------------------------------- */\n\n/* Shared base for all small header icon buttons */\n.ds-settings-gear-btn,\n.ds-repro-shield-btn,\n.ds-theme-toggle-btn,\n.ds-wiki-help-btn {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 15px;\n  color: var(--jp-ui-font-color2, #888);\n  padding: 2px 4px;\n  border-radius: 4px;\n  line-height: 1;\n  flex-shrink: 0;\n  transition: color 0.15s, background 0.15s;\n}\n.ds-settings-gear-btn:hover,\n.ds-repro-shield-btn:hover,\n.ds-theme-toggle-btn:hover,\n.ds-wiki-help-btn:hover {\n  color: var(--jp-ui-font-color0, #333);\n  background: var(--jp-layout-color3, rgba(0,0,0,0.08));\n}\n\n/* Wiki help button: circular badge */\n.ds-wiki-help-btn {\n  width: 20px;\n  height: 20px;\n  border-radius: 50% !important;\n  border: 1.5px solid currentColor !important;\n  font-size: 12px !important;\n  font-weight: 700;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0 !important;\n  opacity: 0.7;\n}\n.ds-wiki-help-btn:hover {\n  opacity: 1;\n}\n\n/* Gear sits at far right — push it with auto margin */\n.ds-settings-gear-btn {\n  margin-left: auto;\n}\n\n/* ----------------------------------------------------------\n   Chat window day / night themes\n   Scoped under .ds-chat-day / .ds-chat-night so they only\n   affect the sidebar panel and not the rest of JupyterLab.\n   ---------------------------------------------------------- */\n\n/* ── Day theme (crisp white / light) ── */\n.ds-chat-day {\n  --ds-bg:          #ffffff;\n  --ds-header-bg:   #f4f4f4;\n  --ds-border:      #e0e0e0;\n  --ds-msg-user:    #dceeff;\n  --ds-msg-asst:    #f2f2f2;\n  --ds-msg-system:  #fff8e1;\n  --ds-msg-warning: #fff3cd;\n  --ds-input-bg:    #fafafa;\n  --ds-text:        #1a1a1a;\n  --ds-text-dim:    #666666;\n}\n\n/* ── Night theme (deep dark) ── */\n.ds-chat-night {\n  --ds-bg:          #1e1e2e;\n  --ds-header-bg:   #16213e;\n  --ds-border:      #2e3050;\n  --ds-msg-user:    #1a3a5c;\n  --ds-msg-asst:    #252540;\n  --ds-msg-system:  #2a2a1e;\n  --ds-msg-warning: #3a2a10;\n  --ds-input-bg:    #1a1a2e;\n  --ds-text:        #e8e8f0;\n  --ds-text-dim:    #9090a8;\n}\n\n/* Apply theme vars to the concrete elements */\n.ds-chat-day,\n.ds-chat-night {\n  background: var(--ds-bg) !important;\n  color:      var(--ds-text) !important;\n}\n\n.ds-chat-day .ds-assistant-header,\n.ds-chat-night .ds-assistant-header {\n  background:    var(--ds-header-bg) !important;\n  border-bottom: 1px solid var(--ds-border) !important;\n  color:         var(--ds-text) !important;\n}\n\n.ds-chat-day .ds-assistant-messages,\n.ds-chat-night .ds-assistant-messages {\n  background: var(--ds-bg) !important;\n}\n\n/* Message bubbles */\n.ds-chat-day .ds-assistant-message-user,\n.ds-chat-night .ds-assistant-message-user {\n  background: var(--ds-msg-user) !important;\n  color:      var(--ds-text) !important;\n}\n\n.ds-chat-day .ds-assistant-message-assistant,\n.ds-chat-night .ds-assistant-message-assistant {\n  background: var(--ds-msg-asst) !important;\n  color:      var(--ds-text) !important;\n}\n\n.ds-chat-day .ds-assistant-message-system,\n.ds-chat-night .ds-assistant-message-system {\n  background: var(--ds-msg-system) !important;\n  color:      var(--ds-text-dim) !important;\n}\n\n.ds-chat-day .ds-assistant-message-warning,\n.ds-chat-night .ds-assistant-message-warning {\n  background: var(--ds-msg-warning) !important;\n  color:      var(--ds-text) !important;\n}\n\n/* Input area */\n.ds-chat-day .ds-assistant-input-area,\n.ds-chat-night .ds-assistant-input-area {\n  background:    var(--ds-input-bg) !important;\n  border-top:    1px solid var(--ds-border) !important;\n}\n\n.ds-chat-day .ds-assistant-input,\n.ds-chat-night .ds-assistant-input {\n  background: var(--ds-input-bg) !important;\n  color:      var(--ds-text) !important;\n  border:     1px solid var(--ds-border) !important;\n}\n\n.ds-chat-day .ds-assistant-input::placeholder,\n.ds-chat-night .ds-assistant-input::placeholder {\n  color: var(--ds-text-dim) !important;\n}\n\n/* Header icon buttons inside themed panel */\n.ds-chat-day .ds-settings-gear-btn,\n.ds-chat-day .ds-repro-shield-btn,\n.ds-chat-day .ds-theme-toggle-btn,\n.ds-chat-day .ds-wiki-help-btn,\n.ds-chat-night .ds-settings-gear-btn,\n.ds-chat-night .ds-repro-shield-btn,\n.ds-chat-night .ds-theme-toggle-btn,\n.ds-chat-night .ds-wiki-help-btn {\n  color: var(--ds-text-dim) !important;\n}\n.ds-chat-day .ds-settings-gear-btn:hover,\n.ds-chat-day .ds-repro-shield-btn:hover,\n.ds-chat-day .ds-theme-toggle-btn:hover,\n.ds-chat-day .ds-wiki-help-btn:hover,\n.ds-chat-night .ds-settings-gear-btn:hover,\n.ds-chat-night .ds-repro-shield-btn:hover,\n.ds-chat-night .ds-theme-toggle-btn:hover,\n.ds-chat-night .ds-wiki-help-btn:hover {\n  color:      var(--ds-text) !important;\n  background: var(--ds-border) !important;\n}\n\n/* Model switcher trigger button */\n.ds-chat-day .ds-model-switcher-btn,\n.ds-chat-night .ds-model-switcher-btn {\n  color: var(--ds-text-dim) !important;\n}\n.ds-chat-day .ds-model-switcher-btn:hover,\n.ds-chat-night .ds-model-switcher-btn:hover {\n  color:      var(--ds-text) !important;\n  background: var(--ds-border) !important;\n}\n\n/* ── Night mode: model switcher dropdown popup ── */\n\n/* Popup container */\n.ds-chat-night .ds-model-switcher-popup {\n  background:   #1e2035 !important;\n  border-color: #2e3050 !important;\n  box-shadow:   0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35) !important;\n}\n\n/* Header bar inside popup (provider name row) */\n.ds-chat-night .ds-model-switcher-popup-header {\n  border-bottom-color: #2e3050 !important;\n  background: #181828 !important;\n}\n\n/* \"Provider\" label (ANTHROPIC / OLLAMA / …) */\n.ds-chat-night .ds-model-switcher-popup-provider {\n  /* colour is set via inline style per provider — leave as-is */\n}\n\n/* \"Chat model\" sub-label */\n.ds-chat-night .ds-model-switcher-popup-label {\n  color: #7070a0 !important;\n}\n\n/* Individual model rows */\n.ds-chat-night .ds-model-switcher-option {\n  color: #c8c8e0 !important;\n  background: none !important;\n}\n\n/* Hover state */\n.ds-chat-night .ds-model-switcher-option:hover {\n  background: #2a2d4a !important;\n  color:      #e8e8f8 !important;\n}\n\n/* Currently selected model */\n.ds-chat-night .ds-model-switcher-option--active {\n  background: #1f2240 !important;\n  color:      #e8e8f8 !important;\n}\n.ds-chat-night .ds-model-switcher-option--active:hover {\n  background: #2a2d4a !important;\n}\n\n/* \"No models\" empty state */\n.ds-chat-night .ds-model-switcher-empty {\n  color: #7070a0 !important;\n}\n\n/* ── Day mode: ensure popup matches day theme too ── */\n.ds-chat-day .ds-model-switcher-popup {\n  background:   #ffffff !important;\n  border-color: #ddd !important;\n}\n.ds-chat-day .ds-model-switcher-popup-header {\n  background:   #f6f6f6 !important;\n  border-bottom-color: #e0e0e0 !important;\n}\n.ds-chat-day .ds-model-switcher-option {\n  color: #1a1a1a !important;\n}\n.ds-chat-day .ds-model-switcher-option:hover {\n  background: #eef4ff !important;\n}\n.ds-chat-day .ds-model-switcher-option--active {\n  background: #e8f0fe !important;\n}\n.ds-chat-day .ds-model-switcher-option--active:hover {\n  background: #dce8fd !important;\n}\n\n/* Provider badge */\n.ds-chat-day .ds-assistant-title,\n.ds-chat-night .ds-assistant-title {\n  color: var(--ds-text) !important;\n}\n\n/* Loading / progress text */\n.ds-chat-day .ds-assistant-loading,\n.ds-chat-night .ds-assistant-loading {\n  color: var(--ds-text-dim) !important;\n}\n\n/* Typing cursor colour in night mode */\n.ds-chat-night .ds-typing-cursor::before,\n.ds-chat-night .ds-typing-cursor span,\n.ds-chat-night .ds-typing-cursor::after {\n  background-color: #7eb8f7;\n}\n\n/* Collapse fade gradient — must match the bubble background in each theme */\n.ds-chat-day .ds-assistant-message-user .ds-msg-fade {\n  background: linear-gradient(to bottom, transparent 0%, #e3f0ff 100%);\n}\n.ds-chat-day .ds-assistant-message-assistant .ds-msg-fade {\n  background: linear-gradient(to bottom, transparent 0%, #f5f5f5 100%);\n}\n.ds-chat-night .ds-assistant-message-user .ds-msg-fade {\n  background: linear-gradient(to bottom, transparent 0%, #1a2a3a 100%);\n}\n.ds-chat-night .ds-assistant-message-assistant .ds-msg-fade {\n  background: linear-gradient(to bottom, transparent 0%, #1e1e2e 100%);\n}\n.ds-chat-night .ds-msg-toggle-btn {\n  color: #7eb8f7;\n  border-color: #7eb8f7;\n}\n\n.ds-settings-close-btn {\n  margin-left: auto;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 13px;\n  color: var(--jp-ui-font-color2, #888);\n  padding: 2px 6px;\n  border-radius: 4px;\n}\n.ds-settings-close-btn:hover {\n  background: var(--jp-layout-color2, #e8e8e8);\n}\n\n/* ----------------------------------------------------------\n   Settings panel — tabbed layout\n   ---------------------------------------------------------- */\n\n.ds-settings-panel {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n}\n\n/* Tab bar */\n.ds-settings-tabbar {\n  display: flex;\n  overflow-x: auto;\n  border-bottom: 1px solid var(--jp-border-color1, #ccc);\n  flex-shrink: 0;\n  scrollbar-width: none;\n  background: var(--jp-layout-color1);\n}\n.ds-settings-tabbar::-webkit-scrollbar {\n  display: none;\n}\n\n.ds-settings-tab {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  padding: 6px 9px;\n  font-size: 11px;\n  font-family: var(--jp-ui-font-family);\n  white-space: nowrap;\n  border: none;\n  border-bottom: 2px solid transparent;\n  background: none;\n  color: var(--jp-ui-font-color2, #666);\n  cursor: pointer;\n  transition: color 0.15s, border-color 0.15s;\n  flex-shrink: 0;\n}\n.ds-settings-tab:hover {\n  color: var(--jp-ui-font-color0, #222);\n  background: var(--jp-layout-color2, #f5f5f5);\n}\n.ds-settings-tab--active {\n  color: var(--jp-brand-color1, #1976d2);\n  border-bottom-color: var(--jp-brand-color1, #1976d2);\n  font-weight: 600;\n}\n\n/* Green dot on tabs that are active for at least one task */\n.ds-settings-tab-dot {\n  display: inline-block;\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  background: #28a745;\n  flex-shrink: 0;\n}\n\n/* Scrollable content area */\n.ds-settings-tab-content {\n  flex: 1;\n  overflow-y: auto;\n  padding: 10px 10px 6px;\n}\n\n/* Routing tab: two-column grid (label | select) */\n.ds-settings-routing-grid {\n  display: grid;\n  grid-template-columns: auto 1fr;\n  align-items: center;\n  gap: 8px 10px;\n}\n.ds-settings-routing-grid .ds-settings-label {\n  white-space: nowrap;\n}\n\n/* Shared field rows for provider tabs */\n.ds-settings-row {\n  display: flex;\n  flex-direction: column;\n  margin-bottom: 8px;\n}\n.ds-settings-row:last-child {\n  margin-bottom: 0;\n}\n\n.ds-settings-label {\n  font-size: 11px;\n  color: var(--jp-ui-font-color2, #555);\n  margin-bottom: 3px;\n}\n\n.ds-settings-input,\n.ds-settings-select {\n  font-size: 12px;\n  padding: 5px 7px;\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 4px;\n  background: var(--jp-layout-color1, #fff);\n  color: var(--jp-ui-font-color0, #222);\n  width: 100%;\n  box-sizing: border-box;\n  font-family: var(--jp-code-font-family, monospace);\n}\n.ds-settings-input:focus,\n.ds-settings-select:focus {\n  outline: none;\n  border-color: var(--jp-brand-color1, #1976d2);\n  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);\n}\n\n/* Sticky footer */\n.ds-settings-footer {\n  flex-shrink: 0;\n  padding: 8px 10px;\n  border-top: 1px solid var(--jp-border-color2, #ddd);\n  background: var(--jp-layout-color1);\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.ds-settings-path {\n  font-size: 10px;\n  color: var(--jp-ui-font-color3, #aaa);\n  word-break: break-all;\n}\n\n.ds-settings-status {\n  padding: 5px 9px;\n  border-radius: 4px;\n  font-size: 11px;\n  line-height: 1.4;\n}\n.ds-settings-status-success {\n  background: #d4edda;\n  color: #155724;\n  border-left: 3px solid #28a745;\n}\n.ds-settings-status-error {\n  background: #f8d7da;\n  color: #721c24;\n  border-left: 3px solid #dc3545;\n}\n\n/* ── RAG Knowledge tab — embed routing summary ───────────────────────────── */\n\n.ds-rag-routing-summary {\n  margin-bottom: 10px;\n  padding: 10px 12px;\n  background: var(--jp-layout-color2, #f5f5f5);\n  border-radius: 6px;\n  border: 1px solid var(--jp-border-color2, #ddd);\n  font-size: 11px;\n}\n\n.ds-rag-routing-row {\n  display: flex;\n  justify-content: space-between;\n  align-items: baseline;\n  gap: 8px;\n  margin-bottom: 4px;\n}\n\n.ds-rag-routing-label {\n  color: var(--jp-ui-font-color2, #666);\n  flex-shrink: 0;\n}\n\n.ds-rag-routing-value {\n  font-weight: 600;\n  color: var(--jp-ui-font-color1, #222);\n  font-family: var(--jp-code-font-family, monospace);\n  font-size: 10px;\n  text-align: right;\n}\n\n.ds-rag-routing-hint {\n  margin: 8px 0 0;\n  color: var(--jp-ui-font-color3, #aaa);\n  font-size: 10px;\n  line-height: 1.4;\n}\n\n.ds-rag-storage-hint {\n  margin-bottom: 10px;\n  padding: 8px 12px;\n  background: var(--jp-info-color0, #e8f4fd);\n  border-radius: 6px;\n  border-left: 3px solid var(--jp-info-color1, #0077cc);\n  font-size: 10px;\n  line-height: 1.5;\n}\n\n.ds-rag-storage-hint strong {\n  display: block;\n  margin-bottom: 4px;\n  font-size: 11px;\n  color: var(--jp-ui-font-color1, #333);\n}\n\n.ds-rag-storage-hint p {\n  margin: 0 0 4px;\n  color: var(--jp-ui-font-color2, #555);\n}\n\n.ds-rag-storage-hint code {\n  background: rgba(0,0,0,0.07);\n  border-radius: 3px;\n  padding: 1px 4px;\n  font-size: 9px;\n  font-family: var(--jp-code-font-family, monospace);\n}\n\n/* ── RAG Knowledge tab — index status widget ─────────────────────────────── */\n\n.ds-rag-status {\n  margin-top: 14px;\n  padding: 10px 12px;\n  background: var(--jp-layout-color2, #f5f5f5);\n  border-radius: 6px;\n  border: 1px solid var(--jp-border-color2, #ddd);\n  font-size: 11px;\n}\n\n.ds-rag-status--unavailable {\n  background: #fff8e1;\n  border-color: #ffe082;\n  color: #7a5c00;\n}\n\n.ds-rag-status--unavailable code {\n  display: block;\n  margin-top: 4px;\n  font-size: 10px;\n  word-break: break-all;\n  color: inherit;\n}\n\n.ds-rag-status-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 6px;\n}\n\n.ds-rag-status-title {\n  font-weight: 600;\n  color: var(--jp-ui-font-color1, #333);\n}\n\n.ds-rag-status-refresh {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 15px;\n  line-height: 1;\n  color: var(--jp-ui-font-color2, #888);\n  padding: 0 2px;\n}\n.ds-rag-status-refresh:hover { color: var(--jp-brand-color1, #1976d2); }\n\n.ds-rag-status-stats {\n  display: flex;\n  gap: 16px;\n  color: var(--jp-ui-font-color2, #555);\n  margin-bottom: 8px;\n}\n\n.ds-rag-status-stats strong {\n  color: var(--jp-ui-font-color1, #222);\n}\n\n.ds-rag-status-files {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n}\n\n.ds-rag-status-file {\n  background: var(--jp-layout-color1, #fff);\n  border: 1px solid var(--jp-border-color2, #ddd);\n  border-radius: 3px;\n  padding: 1px 6px;\n  font-size: 10px;\n  max-width: 140px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--jp-ui-font-color1, #333);\n}\n\n.ds-rag-status-file--more {\n  color: var(--jp-ui-font-color3, #aaa);\n  border-style: dashed;\n}\n\n.ds-rag-status-empty {\n  color: var(--jp-ui-font-color3, #aaa);\n  font-style: italic;\n}\n.ds-rag-status-empty code {\n  font-style: normal;\n  background: var(--jp-layout-color1, #fff);\n  padding: 1px 4px;\n  border-radius: 3px;\n  border: 1px solid var(--jp-border-color2, #ddd);\n}\n\n.ds-rag-status-loading {\n  color: var(--jp-ui-font-color3, #aaa);\n  font-style: italic;\n}\n\n/* ── END RAG Knowledge tab ─────────────────────────────────────────────────── */\n\n.ds-settings-actions {\n  display: flex;\n  gap: 8px;\n}\n\n.ds-settings-save-btn {\n  flex: 1;\n  padding: 7px;\n  background: var(--jp-brand-color1, #1976d2);\n  color: #fff;\n  border: none;\n  border-radius: 5px;\n  cursor: pointer;\n  font-size: 12px;\n  font-weight: 600;\n}\n.ds-settings-save-btn:hover:not(:disabled) {\n  background: var(--jp-brand-color0, #1565c0);\n}\n.ds-settings-save-btn:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n.ds-settings-cancel-btn {\n  padding: 7px 12px;\n  background: var(--jp-layout-color2, #eee);\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 5px;\n  cursor: pointer;\n  font-size: 12px;\n}\n.ds-settings-cancel-btn:hover {\n  background: var(--jp-layout-color3, #ddd);\n}\n\n.ds-settings-loading {\n  padding: 20px;\n  text-align: center;\n  color: var(--jp-ui-font-color2, #888);\n  font-size: 13px;\n}\n\n/* ----------------------------------------------------------\n   Settings outer wrapper + top-level [Models | Skills] tabs\n   ---------------------------------------------------------- */\n\n.ds-settings-outer {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n}\n\n.ds-settings-top-tabs {\n  display: flex;\n  flex-shrink: 0;\n  border-bottom: 2px solid var(--jp-border-color1, #ccc);\n  background: var(--jp-layout-color2, #f5f5f5);\n}\n\n.ds-settings-top-tab {\n  flex: 1;\n  padding: 8px 4px;\n  border: none;\n  background: none;\n  font-size: 12px;\n  font-weight: 500;\n  font-family: var(--jp-ui-font-family);\n  color: var(--jp-ui-font-color2, #777);\n  cursor: pointer;\n  border-bottom: 2px solid transparent;\n  margin-bottom: -2px;\n  transition: color 0.15s, border-color 0.15s;\n}\n.ds-settings-top-tab:hover {\n  color: var(--jp-ui-font-color0, #222);\n}\n.ds-settings-top-tab--active {\n  color: var(--jp-brand-color1, #1976d2);\n  border-bottom-color: var(--jp-brand-color1, #1976d2);\n  font-weight: 700;\n}\n\n/* ----------------------------------------------------------\n   Skills panel — flex row: list left, editor right\n   ---------------------------------------------------------- */\n\n.ds-skills-panel {\n  display: flex;\n  flex: 1;\n  overflow: hidden;\n  min-height: 0;\n}\n\n/* ── Left: skill list ── */\n.ds-skills-list {\n  width: 52%;\n  min-width: 120px;\n  max-width: 220px;\n  border-right: 1px solid var(--jp-border-color2, #ddd);\n  overflow-y: auto;\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  padding: 0;\n}\n\n/* Header bar with title + refresh button */\n.ds-skills-list-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 5px 6px 4px;\n  border-bottom: 1px solid var(--jp-border-color2, #ddd);\n  flex-shrink: 0;\n  background: var(--jp-layout-color1, #fff);\n  position: sticky;\n  top: 0;\n  z-index: 1;\n}\n\n.ds-skills-list-title {\n  font-size: 10px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  color: var(--jp-ui-font-color2, #666);\n}\n\n.ds-skills-refresh-btn {\n  background: none;\n  border: 1px solid var(--jp-border-color2, #ccc);\n  border-radius: 50%;\n  width: 20px;\n  height: 20px;\n  cursor: pointer;\n  font-size: 13px;\n  line-height: 1;\n  color: var(--jp-ui-font-color2, #666);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  transition: color 0.15s, background 0.15s, border-color 0.15s;\n}\n.ds-skills-refresh-btn:hover:not(:disabled) {\n  color: var(--jp-brand-color1, #1976d2);\n  border-color: var(--jp-brand-color1, #1976d2);\n  background: rgba(25, 118, 210, 0.08);\n}\n.ds-skills-refresh-btn:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n\n@keyframes ds-spin {\n  to { transform: rotate(360deg); }\n}\n.ds-skills-refresh-btn--spinning {\n  animation: ds-spin 0.7s linear infinite;\n}\n\n.ds-skills-empty {\n  padding: 10px 8px;\n  margin-top: 4px;\n  font-size: 11px;\n  color: var(--jp-ui-font-color3, #aaa);\n  white-space: pre-line;\n  font-style: italic;\n  line-height: 1.4;\n}\n\n.ds-skill-row {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 5px 6px;\n  cursor: pointer;\n  transition: background 0.1s;\n  border-bottom: 1px solid var(--jp-border-color2, #e8e8e8);\n}\n.ds-skill-row:hover {\n  background: var(--jp-layout-color2, #f0f0f0);\n}\n.ds-skill-row--active {\n  background: var(--jp-brand-color3, #e3f0fc);\n}\n\n/* iOS-style toggle */\n.ds-skill-toggle {\n  position: relative;\n  width: 26px;\n  height: 14px;\n  border-radius: 7px;\n  background: var(--jp-border-color1, #bbb);\n  border: none;\n  cursor: pointer;\n  flex-shrink: 0;\n  padding: 0;\n  transition: background 0.2s;\n}\n.ds-skill-toggle::after {\n  content: '';\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  background: #fff;\n  box-shadow: 0 1px 3px rgba(0,0,0,0.3);\n  transition: left 0.2s;\n}\n.ds-skill-toggle--on {\n  background: #28a745;\n}\n.ds-skill-toggle--on::after {\n  left: 14px;\n}\n\n.ds-skill-name {\n  flex: 1;\n  min-width: 0;\n  font-size: 11px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--jp-ui-font-color0, #222);\n}\n.ds-skill-row--active .ds-skill-name {\n  font-weight: 600;\n}\n\n\n/* New skill input row */\n.ds-skill-add-btn {\n  margin: 4px 6px 6px;\n  padding: 4px 6px;\n  font-size: 11px;\n  background: none;\n  border: 1px dashed var(--jp-border-color1, #ccc);\n  border-radius: 4px;\n  cursor: pointer;\n  color: var(--jp-ui-font-color2, #888);\n  text-align: left;\n  transition: border-color 0.1s, color 0.1s;\n}\n.ds-skill-add-btn:hover {\n  border-color: var(--jp-brand-color1, #1976d2);\n  color: var(--jp-brand-color1, #1976d2);\n}\n\n/* ── Bundled skill library ─────────────────────────────────────────── */\n.ds-skill-library {\n  margin-top: 8px;\n  border-top: 1px solid var(--jp-border-color2, #e0e0e0);\n}\n\n.ds-skill-library-header {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  width: 100%;\n  padding: 6px 8px;\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color1, #333);\n  text-align: left;\n}\n.ds-skill-library-header:hover {\n  background: var(--jp-layout-color2, #f0f0f0);\n}\n\n.ds-skill-library-chevron {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2, #888);\n}\n\n.ds-skill-library-body {\n  padding: 2px 0 6px;\n}\n\n.ds-skill-library-msg {\n  padding: 4px 12px;\n  font-size: 11px;\n  color: var(--jp-ui-font-color2, #888);\n  font-style: italic;\n}\n\n.ds-skill-library-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 5px 8px;\n  border-bottom: 1px solid var(--jp-border-color2, #eee);\n  gap: 6px;\n}\n.ds-skill-library-row--imported {\n  opacity: 0.5;\n}\n\n.ds-skill-library-info {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  min-width: 0;\n  flex: 1;\n}\n\n.ds-skill-library-name {\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color1, #333);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.ds-skill-library-cmd {\n  font-size: 10px;\n  color: var(--jp-brand-color1, #1976d2);\n  font-family: var(--jp-code-font-family, monospace);\n}\n\n.ds-skill-library-desc {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2, #888);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.ds-skill-library-check {\n  font-size: 13px;\n  color: #4caf50;\n  flex-shrink: 0;\n}\n\n.ds-skill-library-import-btn {\n  flex-shrink: 0;\n  padding: 3px 7px;\n  font-size: 10px;\n  font-weight: 600;\n  background: var(--jp-brand-color1, #1976d2);\n  color: #fff;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.ds-skill-library-import-btn:hover:not(:disabled) {\n  background: var(--jp-brand-color0, #1565c0);\n}\n.ds-skill-library-import-btn:disabled {\n  opacity: 0.6;\n  cursor: default;\n}\n\n/* night-mode overrides */\n.ds-assistant--night .ds-skill-library-header {\n  color: #ccc;\n}\n.ds-assistant--night .ds-skill-library-header:hover {\n  background: rgba(255,255,255,0.07);\n}\n.ds-assistant--night .ds-skill-library {\n  border-top-color: rgba(255,255,255,0.1);\n}\n.ds-assistant--night .ds-skill-library-row {\n  border-bottom-color: rgba(255,255,255,0.07);\n}\n.ds-assistant--night .ds-skill-library-name {\n  color: #ddd;\n}\n.ds-assistant--night .ds-skill-library-desc {\n  color: #999;\n}\n\n/* ── end skill library ─────────────────────────────────────────────── */\n\n.ds-skill-new-row {\n  display: flex;\n  align-items: center;\n  gap: 3px;\n  padding: 4px 6px;\n}\n.ds-skill-new-input {\n  flex: 1;\n  min-width: 0;\n  font-size: 11px;\n  font-family: var(--jp-code-font-family, monospace);\n  padding: 3px 5px;\n  border: 1px solid var(--jp-brand-color1, #1976d2);\n  border-radius: 3px;\n  background: var(--jp-layout-color1);\n  color: var(--jp-ui-font-color0);\n  outline: none;\n}\n.ds-skill-new-ok,\n.ds-skill-new-cancel {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 12px;\n  padding: 2px 4px;\n  border-radius: 3px;\n  flex-shrink: 0;\n}\n.ds-skill-new-ok    { color: #28a745; }\n.ds-skill-new-cancel { color: #dc3545; }\n.ds-skill-new-ok:hover    { background: rgba(40,167,69,.12); }\n.ds-skill-new-cancel:hover { background: rgba(220,53,69,.12); }\n\n/* ── Right: editor ── */\n.ds-skill-editor {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  overflow: hidden;\n}\n\n.ds-skill-editor-placeholder {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 11px;\n  color: var(--jp-ui-font-color3, #bbb);\n  font-style: italic;\n  padding: 16px;\n  text-align: center;\n}\n\n/* ── Editor tab bar ── */\n.ds-skill-editor-tabs {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  padding: 4px 6px 0;\n  border-bottom: 1px solid var(--jp-border-color2, #ddd);\n  flex-shrink: 0;\n  background: var(--jp-layout-color2, #f5f5f5);\n}\n\n.ds-skill-editor-tab {\n  background: none;\n  border: 1px solid transparent;\n  border-bottom: none;\n  border-radius: 4px 4px 0 0;\n  padding: 3px 8px;\n  font-size: 10px;\n  font-family: var(--jp-code-font-family, monospace);\n  font-weight: 500;\n  color: var(--jp-ui-font-color2, #666);\n  cursor: pointer;\n  transition: color 0.1s, background 0.1s;\n  white-space: nowrap;\n  margin-bottom: -1px;\n}\n.ds-skill-editor-tab:hover {\n  color: var(--jp-ui-font-color0, #222);\n  background: var(--jp-layout-color1, #fff);\n}\n.ds-skill-editor-tab--active {\n  color: var(--jp-brand-color1, #1976d2);\n  background: var(--jp-layout-color1, #fff);\n  border-color: var(--jp-border-color2, #ddd);\n  font-weight: 700;\n}\n\n.ds-skill-editor-tabs-spacer {\n  flex: 1;\n}\n\n/* Filepath hint below tab bar */\n.ds-skill-editor-filepath {\n  font-size: 9px;\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-ui-font-color3, #aaa);\n  padding: 2px 8px;\n  border-bottom: 1px solid var(--jp-border-color2, #eee);\n  flex-shrink: 0;\n  background: var(--jp-layout-color1, #fff);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.ds-skill-editor-dirty {\n  font-size: 8px;\n  color: #f0ad00;\n  flex-shrink: 0;\n}\n\n.ds-skill-editor-saved {\n  font-size: 10px;\n  color: #28a745;\n  font-weight: 600;\n  flex-shrink: 0;\n}\n\n.ds-skill-editor-error {\n  font-size: 10px;\n  color: #dc3545;\n  font-weight: 600;\n  flex-shrink: 0;\n}\n\n.ds-skill-editor-save-btn {\n  padding: 2px 8px;\n  font-size: 11px;\n  font-weight: 600;\n  background: var(--jp-brand-color1, #1976d2);\n  color: #fff;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  flex-shrink: 0;\n}\n.ds-skill-editor-save-btn:hover:not(:disabled) {\n  background: var(--jp-brand-color0, #1565c0);\n}\n.ds-skill-editor-save-btn:disabled {\n  opacity: 0.4;\n  cursor: default;\n}\n\n.ds-skill-editor-textarea {\n  flex: 1;\n  resize: none;\n  padding: 8px;\n  border: none;\n  outline: none;\n  background: var(--jp-layout-color1, #fff);\n  color: var(--jp-ui-font-color0, #111);\n  font-family: var(--jp-code-font-family, monospace);\n  font-size: 11px;\n  line-height: 1.55;\n  min-height: 0;\n}\n\n/* ----------------------------------------------------------\n   Model Zoo\n   ---------------------------------------------------------- */\n\n.ds-settings-zoo {\n  margin-top: 14px;\n  border-top: 1px dashed var(--jp-border-color2, #ddd);\n  padding-top: 10px;\n}\n\n.ds-settings-zoo-header {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-bottom: 8px;\n}\n\n.ds-settings-zoo-title {\n  font-size: 11px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  color: var(--jp-ui-font-color2, #666);\n}\n\n.ds-settings-zoo-count {\n  font-size: 10px;\n  font-weight: 600;\n  background: var(--jp-brand-color1, #1976d2);\n  color: #fff;\n  border-radius: 9px;\n  padding: 1px 6px;\n  line-height: 1.5;\n}\n\n.ds-settings-zoo-chips {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 5px;\n  margin-bottom: 8px;\n  min-height: 22px;\n}\n\n.ds-settings-zoo-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 3px;\n  background: var(--jp-layout-color2, #f0f0f0);\n  border: 1px solid var(--jp-border-color2, #ddd);\n  border-radius: 12px;\n  padding: 2px 6px 2px 8px;\n  font-size: 11px;\n  font-family: var(--jp-code-font-family, monospace);\n  max-width: 100%;\n  overflow: hidden;\n}\n\n.ds-settings-zoo-chip-name {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  color: var(--jp-ui-font-color0, #222);\n}\n\n.ds-settings-zoo-chip-remove {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 13px;\n  line-height: 1;\n  padding: 0 1px;\n  color: var(--jp-ui-font-color3, #aaa);\n  flex-shrink: 0;\n  border-radius: 50%;\n}\n.ds-settings-zoo-chip-remove:hover {\n  color: #dc3545;\n  background: rgba(220, 53, 69, 0.1);\n}\n\n.ds-settings-zoo-empty {\n  font-size: 11px;\n  color: var(--jp-ui-font-color3, #aaa);\n  font-style: italic;\n}\n\n.ds-settings-zoo-add {\n  display: flex;\n  gap: 6px;\n}\n\n.ds-settings-zoo-add-input {\n  flex: 1;\n  font-size: 12px;\n  font-family: var(--jp-code-font-family, monospace);\n  padding: 4px 7px;\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 4px;\n  background: var(--jp-layout-color1, #fff);\n  color: var(--jp-ui-font-color0, #222);\n  min-width: 0;\n}\n.ds-settings-zoo-add-input:focus {\n  outline: none;\n  border-color: var(--jp-brand-color1, #1976d2);\n  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);\n}\n\n.ds-settings-zoo-add-btn {\n  padding: 4px 10px;\n  font-size: 12px;\n  font-weight: 600;\n  background: var(--jp-layout-color2, #eee);\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 4px;\n  cursor: pointer;\n  white-space: nowrap;\n  flex-shrink: 0;\n  color: var(--jp-ui-font-color0, #333);\n}\n.ds-settings-zoo-add-btn:hover:not(:disabled) {\n  background: var(--jp-brand-color1, #1976d2);\n  border-color: var(--jp-brand-color1, #1976d2);\n  color: #fff;\n}\n.ds-settings-zoo-add-btn:disabled {\n  opacity: 0.4;\n  cursor: not-allowed;\n}\n\n/* ----------------------------------------------------------\n   Pending cell highlighting (applied to notebook cell nodes)\n   ---------------------------------------------------------- */\n\n.ds-assistant-pending {\n  border-left: 4px solid #28a745 !important;\n  box-shadow: inset 0 0 0 1px rgba(40, 167, 69, 0.25);\n  transition: border-left-color 0.2s ease, box-shadow 0.2s ease;\n}\n\n/* ── Report card ── */\n.ds-report-card {\n  background: var(--jp-layout-color2, #f5f5f5);\n  border: 1px solid var(--jp-border-color2, #ddd);\n  border-left: 4px solid #28a745;\n  border-radius: 6px;\n  padding: 10px 12px;\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n}\n\n.ds-report-card-header {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n}\n\n.ds-report-card-icon {\n  font-size: 16px;\n  line-height: 1;\n}\n\n.ds-report-card-title {\n  font-weight: 700;\n  font-size: 12px;\n  color: #28a745;\n}\n\n.ds-report-card-filename {\n  font-family: var(--jp-code-font-family, monospace);\n  font-size: 10px;\n  color: var(--jp-ui-font-color1, #333);\n  word-break: break-all;\n}\n\n.ds-report-card-stats {\n  display: flex;\n  gap: 6px;\n  font-size: 10px;\n  color: var(--jp-ui-font-color2, #666);\n  flex-wrap: wrap;\n}\n\n.ds-report-card-download {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  margin-top: 4px;\n  padding: 5px 12px;\n  font-size: 11px;\n  font-weight: 600;\n  background: #28a745;\n  color: #fff;\n  border-radius: 4px;\n  text-decoration: none;\n  width: fit-content;\n  transition: background 0.15s;\n}\n.ds-report-card-download:hover {\n  background: #218838;\n  color: #fff;\n  text-decoration: none;\n}\n\n/* ── Code-review message & fix cards ────────────────────────────────────── */\n\n.ds-code-review-message {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  width: 100%;\n}\n\n.ds-fix-panel {\n  border: 1px solid var(--jp-border-color1);\n  border-radius: 6px;\n  overflow: hidden;\n  width: 100%;\n}\n\n.ds-fix-panel-header {\n  background: var(--jp-layout-color2);\n  padding: 5px 10px;\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color1);\n  border-bottom: 1px solid var(--jp-border-color1);\n}\n\n.ds-fix-card {\n  padding: 7px 10px;\n  border-bottom: 1px solid var(--jp-border-color2);\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n  transition: background 0.12s;\n}\n\n.ds-fix-card:last-child {\n  border-bottom: none;\n}\n\n.ds-fix-card--applied {\n  opacity: 0.55;\n}\n\n.ds-fix-card-desc {\n  font-size: 11px;\n  font-weight: 500;\n  color: var(--jp-ui-font-color1);\n  line-height: 1.4;\n}\n\n.ds-fix-card-toggle {\n  margin: 0;\n}\n\n.ds-fix-card-toggle > summary {\n  font-size: 10px;\n  color: var(--jp-brand-color1);\n  cursor: pointer;\n  user-select: none;\n  list-style: none;\n  display: flex;\n  align-items: center;\n  gap: 3px;\n}\n\n.ds-fix-card-toggle > summary::before {\n  content: '▶';\n  font-size: 8px;\n  transition: transform 0.15s;\n}\n\n.ds-fix-card-toggle[open] > summary::before {\n  transform: rotate(90deg);\n}\n\n.ds-fix-card-code {\n  margin: 4px 0 0 0;\n  padding: 6px 8px;\n  background: var(--jp-layout-color3);\n  border-radius: 4px;\n  font-size: 10px;\n  font-family: var(--jp-code-font-family, monospace);\n  overflow-x: auto;\n  white-space: pre;\n  max-height: 160px;\n  line-height: 1.45;\n}\n\n.ds-fix-card-btn {\n  align-self: flex-end;\n  padding: 3px 11px;\n  font-size: 10px;\n  font-weight: 600;\n  border-radius: 10px;\n  border: 1px solid var(--jp-brand-color1);\n  background: transparent;\n  color: var(--jp-brand-color1);\n  cursor: pointer;\n  transition: background 0.15s, color 0.15s;\n  white-space: nowrap;\n}\n\n.ds-fix-card-btn:hover:not(:disabled) {\n  background: var(--jp-brand-color1);\n  color: #fff;\n}\n\n.ds-fix-card-btn:disabled {\n  border-color: #4caf50;\n  color: #4caf50;\n  cursor: default;\n}\n\n/* ── Reproducibility Guardian ────────────────────────────────────────────── */\n\n\n/* Panel container */\n.ds-repro-panel {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n  font-size: 12px;\n  color: var(--jp-ui-font-color1);\n}\n\n/* Panel header */\n.ds-repro-panel-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 8px 10px 6px;\n  border-bottom: 1px solid var(--jp-border-color1);\n  flex-shrink: 0;\n}\n.ds-repro-panel-title {\n  font-size: 13px;\n  font-weight: 600;\n}\n.ds-repro-badge {\n  font-size: 10px;\n  font-weight: 700;\n  padding: 2px 6px;\n  border-radius: 8px;\n  color: #fff;\n}\n.ds-repro-badge--critical { background: #d32f2f; }\n.ds-repro-badge--warning  { background: #f57c00; }\n\n/* Summary counts row */\n.ds-repro-counts {\n  display: flex;\n  gap: 8px;\n  padding: 5px 10px;\n  flex-shrink: 0;\n  border-bottom: 1px solid var(--jp-border-color2);\n}\n.ds-repro-count {\n  font-size: 10px;\n  font-weight: 600;\n  padding: 2px 6px;\n  border-radius: 4px;\n}\n.ds-repro-count--critical { color: #d32f2f; background: rgba(211,47,47,0.1); }\n.ds-repro-count--warning  { color: #f57c00; background: rgba(245,124,0,0.1); }\n.ds-repro-count--info     { color: #1976d2; background: rgba(25,118,210,0.1); }\n\n/* Scrollable issue list */\n.ds-repro-issues {\n  flex: 1;\n  overflow-y: auto;\n  padding: 4px 0;\n}\n\n/* All-OK state */\n.ds-repro-all-ok {\n  padding: 20px 12px;\n  text-align: center;\n  color: var(--jp-ui-font-color2);\n  font-size: 12px;\n}\n.ds-repro-timestamp {\n  font-size: 10px;\n  color: var(--jp-ui-font-color3);\n  margin-top: 4px;\n}\n\n/* Section */\n.ds-repro-section { margin-bottom: 4px; }\n.ds-repro-section-title {\n  padding: 4px 10px;\n  font-size: 10px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n  background: var(--jp-layout-color2);\n  border-top: 1px solid var(--jp-border-color2);\n}\n.ds-repro-section--critical .ds-repro-section-title { color: #d32f2f; }\n.ds-repro-section--warning  .ds-repro-section-title { color: #f57c00; }\n.ds-repro-section--info     .ds-repro-section-title { color: #1976d2; }\n.ds-repro-section-count { opacity: 0.7; font-weight: 400; }\n\n/* Issue card */\n.ds-repro-card {\n  padding: 7px 10px;\n  border-bottom: 1px solid var(--jp-border-color2);\n  border-left: 3px solid transparent;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n.ds-repro-card--critical { border-left-color: #d32f2f; }\n.ds-repro-card--warning  { border-left-color: #f57c00; }\n.ds-repro-card--info     { border-left-color: #1976d2; }\n\n.ds-repro-card-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 6px;\n}\n.ds-repro-card-title {\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color0);\n  line-height: 1.3;\n  flex: 1;\n}\n.ds-repro-card-loc {\n  font-size: 10px;\n  color: var(--jp-ui-font-color3);\n  white-space: nowrap;\n}\n.ds-repro-card-message {\n  font-size: 11px;\n  color: var(--jp-ui-font-color1);\n  line-height: 1.4;\n}\n.ds-repro-card-details > summary {\n  font-size: 10px;\n  color: var(--jp-brand-color1);\n  cursor: pointer;\n  user-select: none;\n  list-style: none;\n}\n.ds-repro-card-details > summary::before {\n  content: '▶ ';\n  font-size: 8px;\n}\n.ds-repro-card-details[open] > summary::before { content: '▼ '; }\n.ds-repro-card-explanation {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2);\n  line-height: 1.45;\n  margin-top: 3px;\n  padding-left: 4px;\n  border-left: 2px solid var(--jp-border-color2);\n}\n.ds-repro-card-suggestion {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2);\n  font-style: italic;\n}\n.ds-repro-card-actions {\n  display: flex;\n  gap: 5px;\n  justify-content: flex-end;\n  margin-top: 2px;\n}\n\n/* Buttons */\n.ds-repro-btn {\n  font-size: 10px;\n  font-weight: 600;\n  padding: 3px 10px;\n  border-radius: 10px;\n  border: 1px solid;\n  background: transparent;\n  cursor: pointer;\n  transition: background 0.15s, color 0.15s;\n  white-space: nowrap;\n}\n.ds-repro-btn:disabled { opacity: 0.5; cursor: default; }\n\n.ds-repro-btn--fix {\n  border-color: var(--jp-brand-color1);\n  color: var(--jp-brand-color1);\n}\n.ds-repro-btn--fix:hover:not(:disabled) {\n  background: var(--jp-brand-color1);\n  color: #fff;\n}\n.ds-repro-btn--dismiss {\n  border-color: var(--jp-border-color1);\n  color: var(--jp-ui-font-color2);\n}\n.ds-repro-btn--dismiss:hover:not(:disabled) {\n  background: var(--jp-layout-color3);\n}\n\n/* Footer */\n.ds-repro-footer {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 10px;\n  border-top: 1px solid var(--jp-border-color1);\n  flex-shrink: 0;\n}\n.ds-repro-btn--analyze {\n  border-color: var(--jp-brand-color1);\n  color: var(--jp-brand-color1);\n  flex-shrink: 0;\n}\n.ds-repro-btn--analyze:hover:not(:disabled) {\n  background: var(--jp-brand-color1);\n  color: #fff;\n}\n.ds-repro-btn--fixall {\n  border-color: #4caf50;\n  color: #4caf50;\n  flex-shrink: 0;\n}\n.ds-repro-btn--fixall:hover:not(:disabled) {\n  background: #4caf50;\n  color: #fff;\n}\n.ds-repro-footer .ds-repro-timestamp {\n  font-size: 9px;\n  color: var(--jp-ui-font-color3);\n  margin-left: auto;\n}\n\n/* Error */\n.ds-repro-error {\n  padding: 6px 10px;\n  font-size: 10px;\n  color: #d32f2f;\n  background: rgba(211,47,47,0.08);\n  border-top: 1px solid rgba(211,47,47,0.2);\n}\n\n/* ── Cell Tags & Metadata Panel ──────────────────────────────────────────── */\n\n/* Header button */\n.ds-tags-panel-btn {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 15px;\n  padding: 2px 4px;\n  border-radius: 4px;\n  opacity: 0.7;\n  transition: opacity 0.15s, background 0.15s;\n}\n.ds-tags-panel-btn:hover { opacity: 1; background: var(--jp-layout-color3, #ddd); }\n\n/* Panel wrapper */\n.ds-tags-panel {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow-y: auto;\n  padding: 8px;\n  gap: 6px;\n}\n\n/* Section switcher bar */\n.ds-tags-section-bar {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  margin-bottom: 4px;\n}\n.ds-tags-section-btn {\n  flex: 1;\n  padding: 5px 8px;\n  background: var(--jp-layout-color2, #f5f5f5);\n  border: 1px solid var(--jp-border-color2, #ddd);\n  border-radius: 6px;\n  font-size: 11px;\n  cursor: pointer;\n  color: var(--jp-ui-font-color2, #555);\n  transition: background 0.15s, color 0.15s;\n}\n.ds-tags-section-btn.active {\n  background: var(--jp-brand-color1, #1976d2);\n  color: #fff;\n  border-color: transparent;\n}\n.ds-tags-refresh-btn {\n  padding: 4px 8px;\n  background: none;\n  border: 1px solid var(--jp-border-color2, #ddd);\n  border-radius: 6px;\n  font-size: 13px;\n  cursor: pointer;\n  color: var(--jp-ui-font-color2, #555);\n}\n.ds-tags-refresh-btn:hover { background: var(--jp-layout-color2, #f5f5f5); }\n\n/* Tag chip (shared between panel and overlay) */\n.ds-tag-chip {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 2px 8px;\n  border-radius: 20px;\n  font-size: 10px;\n  font-weight: 600;\n  background: color-mix(in srgb, var(--tag-color, #3b82f6) 15%, transparent);\n  color: var(--tag-color, #3b82f6);\n  border: 1px solid color-mix(in srgb, var(--tag-color, #3b82f6) 40%, transparent);\n  cursor: default;\n  user-select: none;\n  white-space: nowrap;\n}\n.ds-tag-chip[title*=\"Jump\"] { cursor: pointer; }\n.ds-tag-chip[title*=\"Jump\"]:hover {\n  background: color-mix(in srgb, var(--tag-color, #3b82f6) 25%, transparent);\n}\n.ds-tag-chip-count {\n  background: var(--tag-color, #3b82f6);\n  color: #fff;\n  border-radius: 10px;\n  padding: 0 5px;\n  font-size: 9px;\n  min-width: 16px;\n  text-align: center;\n}\n.ds-tag-chip-remove {\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-size: 12px;\n  color: var(--tag-color, #3b82f6);\n  padding: 0;\n  line-height: 1;\n  opacity: 0.6;\n}\n.ds-tag-chip-remove:hover { opacity: 1; }\n\n/* Active cell section */\n.ds-tags-cell-section { display: flex; flex-direction: column; gap: 8px; }\n.ds-tags-cell-ref {\n  font-size: 11px;\n  font-weight: 600;\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-ui-font-color2, #555);\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n.ds-tags-cell-ref-hint {\n  font-size: 10px;\n  font-weight: 400;\n  color: var(--jp-ui-font-color3, #aaa);\n  font-family: var(--jp-ui-font-family);\n}\n\n.ds-tags-chips-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n}\n\n/* Add tag row */\n.ds-tags-add-row { display: flex; gap: 6px; }\n.ds-tags-input {\n  flex: 1;\n  padding: 4px 8px;\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 6px;\n  font-size: 11px;\n  background: var(--jp-layout-color0, #fff);\n  color: var(--jp-ui-font-color1, #111);\n}\n.ds-tags-input:focus { outline: none; border-color: var(--jp-brand-color1, #1976d2); }\n.ds-tags-add-btn {\n  padding: 4px 10px;\n  background: var(--jp-brand-color1, #1976d2);\n  color: #fff;\n  border: none;\n  border-radius: 6px;\n  font-size: 11px;\n  cursor: pointer;\n  white-space: nowrap;\n}\n.ds-tags-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }\n.ds-tags-add-btn:not(:disabled):hover { background: var(--jp-brand-color0, #1565c0); }\n\n/* Quick-pick */\n.ds-tags-quickpick {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 4px;\n  font-size: 10px;\n}\n.ds-tags-quickpick-label { color: var(--jp-ui-font-color3, #aaa); flex-shrink: 0; }\n.ds-tags-quickpick-btn {\n  padding: 2px 7px;\n  border-radius: 20px;\n  font-size: 10px;\n  border: 1px dashed color-mix(in srgb, var(--tag-color, #3b82f6) 50%, transparent);\n  background: none;\n  color: var(--tag-color, #3b82f6);\n  cursor: pointer;\n}\n.ds-tags-quickpick-btn:hover {\n  background: color-mix(in srgb, var(--tag-color, #3b82f6) 12%, transparent);\n}\n\n/* Metadata editor */\n.ds-tags-meta-section { display: flex; flex-direction: column; gap: 4px; }\n.ds-tags-meta-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color1, #222);\n}\n.ds-tags-meta-save-btn {\n  padding: 3px 10px;\n  background: var(--jp-layout-color2, #f5f5f5);\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 6px;\n  font-size: 10px;\n  cursor: pointer;\n}\n.ds-tags-meta-save-btn:hover { background: var(--jp-layout-color3, #e8e8e8); }\n.ds-tags-meta-editor {\n  width: 100%;\n  box-sizing: border-box;\n  padding: 6px 8px;\n  font-family: var(--jp-code-font-family, monospace);\n  font-size: 10px;\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 6px;\n  background: var(--jp-layout-color0, #fff);\n  color: var(--jp-ui-font-color1, #111);\n  resize: vertical;\n}\n.ds-tags-meta-editor:focus { outline: none; border-color: var(--jp-brand-color1, #1976d2); }\n.ds-tags-meta-editor.ds-tags-meta-error { border-color: #ef4444; }\n.ds-tags-meta-hint {\n  font-size: 10px;\n  color: var(--jp-ui-font-color3, #aaa);\n  margin: 0;\n  line-height: 1.4;\n}\n.ds-tags-meta-hint code {\n  background: rgba(0,0,0,0.06);\n  padding: 1px 4px;\n  border-radius: 3px;\n  font-size: 9px;\n}\n\n/* Error text */\n.ds-tags-error {\n  font-size: 10px;\n  color: #ef4444;\n  margin: 0;\n}\n\n/* Notebook overview */\n.ds-tags-notebook-section { display: flex; flex-direction: column; gap: 8px; }\n.ds-tags-filter-row { display: flex; gap: 6px; }\n.ds-tags-filter-input {\n  flex: 1;\n  padding: 4px 8px;\n  border: 1px solid var(--jp-border-color1, #ccc);\n  border-radius: 6px;\n  font-size: 11px;\n  background: var(--jp-layout-color0, #fff);\n  color: var(--jp-ui-font-color1, #111);\n}\n.ds-tags-filter-input:focus { outline: none; border-color: var(--jp-brand-color1, #1976d2); }\n.ds-tags-cloud {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n}\n.ds-tags-divider {\n  border: none;\n  border-top: 1px solid var(--jp-border-color2, #ddd);\n}\n.ds-tags-cells-list { display: flex; flex-direction: column; gap: 6px; }\n.ds-tags-cell-row {\n  padding: 7px 10px;\n  border: 1px solid var(--jp-border-color2, #ddd);\n  border-radius: 6px;\n  cursor: pointer;\n  transition: background 0.12s;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n.ds-tags-cell-row:hover { background: var(--jp-layout-color2, #f5f5f5); }\n.ds-tags-cell-row-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: baseline;\n}\n.ds-tags-cell-row-ref {\n  font-size: 10px;\n  font-weight: 600;\n  font-family: var(--jp-code-font-family, monospace);\n  color: var(--jp-ui-font-color2, #666);\n}\n.ds-tags-cell-row-type {\n  font-size: 9px;\n  color: var(--jp-ui-font-color3, #aaa);\n  text-transform: uppercase;\n}\n.ds-tags-cell-row-preview {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2, #555);\n  font-family: var(--jp-code-font-family, monospace);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.ds-tags-cell-row-tags { display: flex; flex-wrap: wrap; gap: 3px; }\n\n.ds-tags-empty {\n  font-size: 11px;\n  color: var(--jp-ui-font-color3, #aaa);\n  text-align: center;\n  padding: 20px 0;\n  margin: 0;\n}\n\n/* ── Cell tag overlay (pills injected into cell DOM) ─────────────────────── */\n\n/* Thin bar inserted above every cell — holds tags (left) + position (right) */\n.ds-cell-tag-overlay {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;  /* tags left, position right */\n  gap: 3px;\n  padding: 2px 6px;\n  background: color-mix(in srgb, var(--jp-layout-color2, #f5f5f5) 70%, transparent);\n  border-bottom: 1px solid var(--jp-border-color3, #eee);\n  pointer-events: none;       /* don't interfere with cell selection */\n  min-height: 18px;\n}\n\n/* Wrapper that keeps tag pills together on the left */\n.ds-overlay-tags {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 3px;\n  flex: 1;\n}\n\n/* Coloured tag pills */\n.ds-cell-tag-pill {\n  display: inline-block;\n  padding: 1px 6px;\n  border-radius: 10px;\n  font-size: 9px;\n  font-weight: 600;\n  background: color-mix(in srgb, var(--pill-color, #3b82f6) 15%, transparent);\n  color: var(--pill-color, #3b82f6);\n  border: 1px solid color-mix(in srgb, var(--pill-color, #3b82f6) 35%, transparent);\n  white-space: nowrap;\n}\n\n/* \"#N\" position badge — right-aligned, always visible */\n.ds-cell-position-badge {\n  flex-shrink: 0;\n  margin-left: auto;\n  font-size: 9px;\n  font-family: var(--jp-code-font-family, monospace);\n  font-weight: 600;\n  color: var(--jp-ui-font-color3, #aaa);\n  letter-spacing: 0.02em;\n  opacity: 0.75;\n  user-select: none;\n}\n\n/* Slightly darker in JupyterLab dark themes */\n.jp-mod-dark .ds-cell-position-badge,\nbody[data-jp-theme-light=\"false\"] .ds-cell-position-badge {\n  color: #666;\n  opacity: 0.85;\n}\n\n/* Night mode overrides */\n.ds-chat-night .ds-tags-input,\n.ds-chat-night .ds-tags-filter-input,\n.ds-chat-night .ds-tags-meta-editor {\n  background: #1e1e2e;\n  color: #cdd6f4;\n  border-color: #45475a;\n}\n.ds-chat-night .ds-tags-add-btn { background: #7c3aed; }\n.ds-chat-night .ds-tags-add-btn:hover { background: #6d28d9; }\n.ds-chat-night .ds-tags-cell-row { border-color: #45475a; }\n.ds-chat-night .ds-tags-cell-row:hover { background: #1e1e2e; }\n\n/* ─── Output Overlay: badges (E), hover (D), context menu (D) ─────────────── */\n\n/* Numbered badge injected at the top of each output element */\n.ds-output-badge {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  position: absolute;\n  top: 3px;\n  right: 6px;\n  background: rgba(0, 0, 0, 0.55);\n  color: #fff;\n  border-radius: 4px;\n  font-size: 10px;\n  padding: 1px 5px;\n  pointer-events: all;\n  cursor: pointer;\n  z-index: 10;\n  opacity: 0;\n  transition: opacity 0.15s ease;\n  user-select: none;\n  white-space: nowrap;\n  max-width: 240px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n/* Show badge on output hover */\n.jp-OutputArea-child:hover .ds-output-badge,\n.ds-output-child--hover .ds-output-badge {\n  opacity: 1;\n}\n\n.ds-output-badge-num {\n  font-weight: 700;\n  font-size: 9px;\n  opacity: 0.75;\n  letter-spacing: 0.02em;\n}\n\n.ds-output-badge-icon {\n  font-size: 11px;\n}\n\n.ds-output-badge-label {\n  font-size: 9.5px;\n  font-weight: 500;\n  opacity: 0.9;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* Light blue ring highlight on the output being hovered */\n.jp-OutputArea-child.ds-output-child--hover {\n  outline: 2px solid rgba(99, 179, 237, 0.55);\n  outline-offset: -2px;\n  border-radius: 3px;\n}\n\n/* ─── D: Right-click context menu ─────────────────────────────────────────── */\n.ds-output-ctx-menu {\n  background: #ffffff;\n  border: 1px solid #d1d5db;\n  border-radius: 8px;\n  box-shadow: 0 4px 16px rgba(0,0,0,0.18);\n  padding: 4px 0;\n  min-width: 220px;\n  max-width: 320px;\n  font-family: var(--jp-ui-font-family, system-ui, sans-serif);\n  font-size: 12px;\n  overflow: hidden;\n}\n\n.ds-output-ctx-menu-title {\n  padding: 6px 12px 4px;\n  font-size: 10px;\n  font-weight: 600;\n  color: #6b7280;\n  letter-spacing: 0.03em;\n  text-transform: uppercase;\n  border-bottom: 1px solid #f0f0f0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.ds-output-ctx-menu-item {\n  padding: 7px 12px;\n  cursor: pointer;\n  color: #1f2937;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  transition: background 0.1s;\n}\n\n.ds-output-ctx-menu-item:hover {\n  background: #eff6ff;\n  color: #2563eb;\n}\n\n/* ─── Disambiguation card ──────────────────────────────────────────────────── */\n.ds-assistant-message-disambiguation {\n  background: transparent !important;\n  padding: 0 !important;\n  border: none !important;\n}\n\n.ds-disambig-card {\n  background: var(--jp-layout-color1, #fff);\n  border: 1px solid var(--jp-border-color1, #d0d0d0);\n  border-left: 3px solid #f59e0b;\n  border-radius: 8px;\n  padding: 12px 14px;\n  margin: 6px 0;\n  max-width: 420px;\n  font-family: var(--jp-ui-font-family, system-ui, sans-serif);\n}\n\n.ds-disambig-header {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-bottom: 4px;\n}\n\n.ds-disambig-icon { font-size: 14px; }\n\n.ds-disambig-title {\n  font-size: 12px;\n  font-weight: 700;\n  color: var(--jp-ui-font-color1, #1f2937);\n  letter-spacing: 0.01em;\n}\n\n.ds-disambig-hint {\n  font-size: 11px;\n  color: var(--jp-ui-font-color2, #6b7280);\n  margin-bottom: 10px;\n  padding-left: 20px;\n  font-style: italic;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.ds-disambig-options {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.ds-disambig-btn {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 8px 10px;\n  border-radius: 6px;\n  border: 1px solid transparent;\n  cursor: pointer;\n  text-align: left;\n  transition: background 0.12s, border-color 0.12s;\n  background: var(--jp-layout-color2, #f7f7f7);\n}\n\n.ds-disambig-btn--chat {\n  border-color: #bfdbfe;\n}\n.ds-disambig-btn--chat:hover {\n  background: #eff6ff;\n  border-color: #60a5fa;\n}\n\n.ds-disambig-btn--cell {\n  border-color: #bbf7d0;\n}\n.ds-disambig-btn--cell:hover {\n  background: #f0fdf4;\n  border-color: #4ade80;\n}\n\n.ds-disambig-btn-icon { font-size: 16px; flex-shrink: 0; padding-top: 1px; }\n\n.ds-disambig-btn-body {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  min-width: 0;\n}\n\n.ds-disambig-btn-body strong {\n  font-size: 12px;\n  color: var(--jp-ui-font-color1, #1f2937);\n  font-weight: 600;\n}\n\n.ds-disambig-btn-body code {\n  font-size: 10.5px;\n  color: var(--jp-ui-font-color2, #6b7280);\n  background: transparent;\n  padding: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  max-width: 300px;\n  display: block;\n}\n\n/* Night mode */\n.ds-chat-night .ds-disambig-card {\n  background: #1e2030;\n  border-color: #414560;\n  border-left-color: #f59e0b;\n}\n.ds-chat-night .ds-disambig-title { color: #cdd6f4; }\n.ds-chat-night .ds-disambig-hint  { color: #7f849c; }\n.ds-chat-night .ds-disambig-btn {\n  background: #24273a;\n}\n.ds-chat-night .ds-disambig-btn--chat { border-color: #1e3a5f; }\n.ds-chat-night .ds-disambig-btn--chat:hover {\n  background: #172554;\n  border-color: #3b82f6;\n}\n.ds-chat-night .ds-disambig-btn--cell { border-color: #14532d; }\n.ds-chat-night .ds-disambig-btn--cell:hover {\n  background: #052e16;\n  border-color: #22c55e;\n}\n.ds-chat-night .ds-disambig-btn-body strong { color: #cdd6f4; }\n.ds-chat-night .ds-disambig-btn-body code   { color: #7f849c; }\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./node_modules/css-loader/dist/cjs.js!./style/index.css"
/*!***************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./style/index.css ***!
  \***************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! -!../node_modules/css-loader/dist/cjs.js!./base.css */ "./node_modules/css-loader/dist/cjs.js!./style/base.css");
// Imports



var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_2__["default"]);
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/* DS Assistant - Main CSS entry point */
`, "",{"version":3,"sources":["webpack://./style/index.css"],"names":[],"mappings":"AAAA,wCAAwC","sourcesContent":["/* DS Assistant - Main CSS entry point */\n@import url('./base.css');\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./node_modules/css-loader/dist/runtime/api.js"
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
(module) {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ },

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js"
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
(module) {



module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
(module) {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js"
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
(module) {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js"
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
(module) {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js"
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js"
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
(module) {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js"
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
(module) {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ },

/***/ "./style/index.js"
/*!************************!*\
  !*** ./style/index.js ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.css */ "./style/index.css");
// This file is required by JupyterLab to load styles via the JavaScript
// module system (referenced by "styleModule" in package.json).



/***/ },

/***/ "./style/index.css"
/*!*************************!*\
  !*** ./style/index.css ***!
  \*************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./index.css */ "./node_modules/css-loader/dist/cjs.js!./style/index.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }

}]);
//# sourceMappingURL=style_index_js.37b7eeecd6abfbc8bc87.js.map