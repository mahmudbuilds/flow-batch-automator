/**
 * Flow Batch Automator - Content Script
 * Runs exclusively on https://flow.google.com/* and https://labs.google/*
 * 
 * Clean, lightweight, high-contrast light theme UI without gradients.
 * Features:
 * - Direct Enter keyboard sequence dispatch + targeted circular arrow button clicking
 * - Clean white card design with sharp typography and solid status badges
 * - Isolated Shadow DOM UI to prevent CSS collisions
 * - Draggable & collapsible overlay panel + pinned floating toggle launcher
 * - Chrome toolbar action & message listener integration (TOGGLE_PANEL)
 * - React/Web-Component native prototype value setter
 * - MutationObserver-based generation completion detection
 * - Intelligent media extension detection (.png, .mp4, .webp, .jpg)
 * - Safe blob-to-DataURL resolution for background downloading
 * - Persistent configuration via chrome.storage.local
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__FLOW_BATCH_AUTOMATOR_LOADED__) {
    if (window.__FLOW_BATCH_AUTOMATOR_TOGGLE__) {
      window.__FLOW_BATCH_AUTOMATOR_TOGGLE__();
    }
    return;
  }
  window.__FLOW_BATCH_AUTOMATOR_LOADED__ = true;

  console.log('[Flow Batch Automator] Content script loaded successfully.');

  /* ==========================================================================
     DARK THEME EMBEDDED STYLESHEET (mirrors styles.css)
     ========================================================================== */
  const EMBEDDED_STYLES = `
/**
 * Flow Batch Automator - High-Contrast Dark Theme
 * Professional obsidian/black design with WCAG AAA readability,
 * crisp borders, defined surfaces, and bright typography.
 */

:host,
:host *,
.fba-pointer-events,
#fba-panel {
  --fba-panel-bg: #121418;
  --fba-header-bg: #181b22;
  --fba-card-bg: #191c24;
  --fba-input-bg: #1f232c;
  --fba-input-bg-focus: #262b36;
  --fba-log-bg: #0b0d11;
  --fba-border-subtle: #2b313d;
  --fba-border: #3d4554;
  --fba-border-strong: #525c6f;
  --fba-border-highlight: #717d94;
  --fba-text-primary: #ffffff;
  --fba-text-secondary: #f1f5f9;
  --fba-text-muted: #cbd5e1;
  --fba-text-subtle: #94a3b8;
  --fba-accent: #38bdf8;
  --fba-accent-hover: #0284c7;
  --fba-green: #22c55e;
  --fba-green-bright: #4ade80;
  --fba-amber: #f59e0b;
  --fba-amber-bright: #fde047;
  --fba-red: #ef4444;
  --fba-red-bright: #f87171;
  --fba-mono: "JetBrains Mono", "SF Mono", Consolas, Menlo, monospace;
}

:host {
  all: initial !important;
  display: block !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 0 !important;
  height: 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  color: #ffffff !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  -webkit-font-smoothing: antialiased !important;
}

* {
  box-sizing: border-box !important;
}

.fba-pointer-events {
  pointer-events: none !important;
}
.fba-pointer-events > * {
  pointer-events: auto !important;
}

/* ==========================================================================
   LAUNCHER BUTTON
   ========================================================================== */
#fba-launcher-btn {
  position: fixed !important;
  right: 0 !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 2147483647 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  background: #14161c !important;
  color: #ffffff !important;
  padding: 9px 15px 9px 13px !important;
  border: 1px solid #475266 !important;
  border-right: none !important;
  border-radius: 10px 0 0 10px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
  cursor: pointer !important;
  user-select: none !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  letter-spacing: -0.01em !important;
  transition: padding 0.15s ease, background 0.15s ease, border-color 0.15s ease !important;
  pointer-events: auto !important;
}
#fba-launcher-btn:hover {
  background: #1e222b !important;
  border-color: #64748b !important;
  padding-left: 17px !important;
}
#fba-launcher-btn svg {
  width: 14px !important;
  height: 14px !important;
  fill: #38bdf8 !important;
}

.fba-pulse-badge {
  display: inline-block !important;
  width: 7px !important;
  height: 7px !important;
  border-radius: 50% !important;
  background: #22c55e !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25) !important;
}
.fba-pulse-badge.running {
  background: #f59e0b !important;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3) !important;
  animation: fba-pulse 1.4s ease-in-out infinite !important;
}
@keyframes fba-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.9); }
}

/* ==========================================================================
   MAIN PANEL
   ========================================================================== */
#fba-panel {
  position: fixed !important;
  top: 60px !important;
  right: 20px !important;
  width: 410px !important;
  max-width: calc(100vw - 40px) !important;
  max-height: calc(100vh - 80px) !important;
  background: #121418 !important;
  border: 1px solid #434c5e !important;
  border-radius: 12px !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12), 0 24px 60px rgba(0, 0, 0, 0.95), 0 4px 12px rgba(0, 0, 0, 0.6) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  z-index: 2147483646 !important;
  pointer-events: auto !important;
  color: #ffffff !important;
}
#fba-panel.fba-hidden {
  display: none !important;
}

/* ==========================================================================
   HEADER
   ========================================================================== */
.fba-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 13px 16px !important;
  background: #181b22 !important;
  border-bottom: 1px solid #333a47 !important;
  cursor: grab !important;
  user-select: none !important;
}
.fba-header:active {
  cursor: grabbing !important;
}

.fba-title-wrap {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  min-width: 0 !important;
}

.fba-logo {
  width: 26px !important;
  height: 26px !important;
  border-radius: 7px !important;
  background: #ffffff !important;
  color: #0b0d11 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4) !important;
}
.fba-logo svg {
  width: 14px !important;
  height: 14px !important;
}

.fba-title-text {
  display: flex !important;
  flex-direction: column !important;
  line-height: 1.25 !important;
}
.fba-title {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  letter-spacing: -0.015em !important;
}
.fba-subtitle {
  font-size: 11.5px !important;
  color: #94a3b8 !important;
  font-weight: 500 !important;
}

.fba-header-right {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

/* Status Badges */
.fba-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 3px 9px !important;
  border-radius: 999px !important;
  letter-spacing: 0.02em !important;
  text-transform: uppercase !important;
}
.fba-badge::before {
  content: "" !important;
  width: 6px !important;
  height: 6px !important;
  border-radius: 50% !important;
  background: currentColor !important;
}
.fba-badge.idle {
  color: #cbd5e1 !important;
  background: #222631 !important;
  border: 1px solid #434c5e !important;
}
.fba-badge.running {
  color: #fef08a !important;
  background: #422006 !important;
  border: 1px solid #ca8a04 !important;
}
.fba-badge.paused {
  color: #bfdbfe !important;
  background: #172554 !important;
  border: 1px solid #3b82f6 !important;
}
.fba-badge.completed {
  color: #bbf7d0 !important;
  background: #052e16 !important;
  border: 1px solid #16a34a !important;
}
.fba-badge.error {
  color: #fecaca !important;
  background: #450a0a !important;
  border: 1px solid #dc2626 !important;
}

.fba-window-controls {
  display: flex !important;
  align-items: center !important;
}

.fba-icon-btn {
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #cbd5e1 !important;
  width: 28px !important;
  height: 28px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.15s ease !important;
  padding: 0 !important;
}
.fba-icon-btn:hover {
  background: #252a36 !important;
  border-color: #475266 !important;
  color: #ffffff !important;
}

/* ==========================================================================
   BODY & SCROLLBAR
   ========================================================================== */
.fba-body {
  padding: 0 !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  max-height: calc(100vh - 150px) !important;
  background: #121418 !important;
}
.fba-body::-webkit-scrollbar {
  width: 8px !important;
}
.fba-body::-webkit-scrollbar-track {
  background: #121418 !important;
}
.fba-body::-webkit-scrollbar-thumb {
  background: #333a47 !important;
  border-radius: 8px !important;
  border: 2px solid #121418 !important;
}
.fba-body::-webkit-scrollbar-thumb:hover {
  background: #475266 !important;
}

/* ==========================================================================
   SECTIONS & FIELDS
   ========================================================================== */
.fba-section {
  display: flex !important;
  flex-direction: column !important;
  gap: 11px !important;
  padding: 14px 16px !important;
  border-bottom: 1px solid #282e38 !important;
}
.fba-section:last-child {
  border-bottom: none !important;
}

.fba-field {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
}

.fba-label-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}

.fba-label {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #ffffff !important;
  letter-spacing: -0.01em !important;
}
.fba-label-sub {
  font-size: 11.5px !important;
  color: #cbd5e1 !important;
  font-weight: 500 !important;
}
.fba-section-title {
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #93c5fd !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
}

.fba-counter {
  font-family: "JetBrains Mono", Consolas, monospace !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #38bdf8 !important;
  background: #1a2230 !important;
  border: 1px solid #2563eb !important;
  padding: 2px 8px !important;
  border-radius: 6px !important;
}

/* ==========================================================================
   INPUTS & FORM CONTROLS
   ========================================================================== */
.fba-select,
.fba-input,
.fba-textarea {
  width: 100% !important;
  background: #1c2028 !important;
  border: 1px solid #3e4758 !important;
  border-radius: 7px !important;
  color: #ffffff !important;
  font-size: 13px !important;
  padding: 0 10px !important;
  height: 34px !important;
  outline: none !important;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s !important;
  font-family: inherit !important;
  margin: 0 !important;
}
.fba-select:hover,
.fba-input:hover,
.fba-textarea:hover {
  border-color: #5c677d !important;
  background: #212630 !important;
}
.fba-select:focus,
.fba-input:focus,
.fba-textarea:focus {
  border-color: #38bdf8 !important;
  background: #252a36 !important;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25) !important;
}
.fba-input::placeholder,
.fba-textarea::placeholder {
  color: #94a3b8 !important;
}

.fba-select {
  appearance: none !important;
  -webkit-appearance: none !important;
  padding-right: 32px !important;
  cursor: pointer !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 10px center !important;
}
.fba-select option {
  background: #181b22 !important;
  color: #ffffff !important;
}

.fba-textarea {
  height: auto !important;
  min-height: 105px !important;
  max-height: 220px !important;
  padding: 9px 11px !important;
  resize: vertical !important;
  line-height: 1.55 !important;
  font-family: "JetBrains Mono", Consolas, monospace !important;
  font-size: 12px !important;
  white-space: pre !important;
}

.fba-input[type="number"]::-webkit-inner-spin-button,
.fba-input[type="number"]::-webkit-outer-spin-button {
  opacity: 0.7 !important;
}

.fba-grid-2 {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 10px !important;
}
.fba-grid-3 {
  display: grid !important;
  grid-template-columns: 1fr 1fr 1fr !important;
  gap: 10px !important;
}

/* ==========================================================================
   CHECKBOXES & TOGGLES
   ========================================================================== */
.fba-checkbox-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px !important;
  font-size: 12.5px !important;
  font-weight: 500 !important;
  color: #f1f5f9 !important;
  cursor: pointer !important;
  user-select: none !important;
  padding: 3px 0 !important;
}
.fba-checkbox-row:hover {
  color: #ffffff !important;
}
.fba-checkbox-row input[type="checkbox"] {
  appearance: none !important;
  -webkit-appearance: none !important;
  position: relative !important;
  width: 34px !important;
  height: 20px !important;
  margin: 0 !important;
  border-radius: 999px !important;
  background: #2b3240 !important;
  border: 1px solid #4a5568 !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
  transition: background 0.15s ease, border-color 0.15s ease !important;
}
.fba-checkbox-row input[type="checkbox"]::after {
  content: "" !important;
  position: absolute !important;
  top: 2px !important;
  left: 2px !important;
  width: 14px !important;
  height: 14px !important;
  border-radius: 50% !important;
  background: #cbd5e1 !important;
  transition: transform 0.15s ease, background 0.15s ease !important;
}
.fba-checkbox-row input[type="checkbox"]:checked {
  background: #38bdf8 !important;
  border-color: #38bdf8 !important;
}
.fba-checkbox-row input[type="checkbox"]:checked::after {
  transform: translateX(14px) !important;
  background: #0f172a !important;
}

/* ==========================================================================
   ACCORDION (ADVANCED SETTINGS)
   ========================================================================== */
.fba-accordion {
  border: 1px solid #333a47 !important;
  border-radius: 8px !important;
  background: #161920 !important;
  overflow: hidden !important;
  margin: 2px 16px !important;
}
.fba-accordion-header {
  padding: 10px 14px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  cursor: pointer !important;
  user-select: none !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #e2e8f0 !important;
  background: #181b22 !important;
  transition: color 0.15s ease, background 0.15s ease !important;
}
.fba-accordion-header:hover {
  color: #ffffff !important;
  background: #20242e !important;
}
.fba-accordion-header svg {
  width: 14px !important;
  height: 14px !important;
  stroke: #cbd5e1 !important;
  transition: transform 0.2s ease !important;
}
.fba-accordion.open .fba-accordion-header svg {
  transform: rotate(180deg) !important;
}
.fba-accordion-content {
  display: none !important;
  padding: 12px 14px !important;
  flex-direction: column !important;
  gap: 10px !important;
  background: #14171e !important;
  border-top: 1px solid #282e38 !important;
}
.fba-accordion-content .fba-input {
  font-family: "JetBrains Mono", Consolas, monospace !important;
  font-size: 11.5px !important;
}
.fba-accordion.open .fba-accordion-content {
  display: flex !important;
}

/* ==========================================================================
   STATUS CARD
   ========================================================================== */
.fba-status-card {
  background: #181c24 !important;
  border: 1px solid #384252 !important;
  border-radius: 9px !important;
  padding: 12px 14px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 9px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
}
.fba-status-info {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #ffffff !important;
  font-variant-numeric: tabular-nums !important;
}
.fba-progress-track {
  width: 100% !important;
  height: 6px !important;
  background: #2b3240 !important;
  border: 1px solid #3c4558 !important;
  border-radius: 999px !important;
  overflow: hidden !important;
}
.fba-progress-bar {
  height: 100% !important;
  width: 0%;
  background: #38bdf8 !important;
  border-radius: 999px !important;
  transition: width 0.3s ease !important;
}
.fba-status-detail {
  font-size: 12px !important;
  color: #cbd5e1 !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}
.fba-timer-badge {
  font-family: "JetBrains Mono", Consolas, monospace !important;
  font-size: 11.5px !important;
  background: #422006 !important;
  border: 1px solid #f59e0b !important;
  color: #fef08a !important;
  padding: 1px 7px !important;
  border-radius: 6px !important;
  font-weight: 700 !important;
}

/* ==========================================================================
   BUTTONS
   ========================================================================== */
.fba-actions-row {
  display: flex !important;
  gap: 8px !important;
}

.fba-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  height: 35px !important;
  padding: 0 14px !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  letter-spacing: -0.01em !important;
  border-radius: 7px !important;
  cursor: pointer !important;
  user-select: none !important;
  font-family: inherit !important;
  transition: all 0.15s ease !important;
  white-space: nowrap !important;
  margin: 0 !important;
}
.fba-btn svg {
  width: 14px !important;
  height: 14px !important;
}

/* Primary: Pure Crisp White button on black */
.fba-btn-primary {
  flex: 2 !important;
  background: #ffffff !important;
  color: #0b0d11 !important;
  border: 1px solid #ffffff !important;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.15) !important;
}
.fba-btn-primary:hover:not(:disabled) {
  background: #e2e8f0 !important;
  border-color: #e2e8f0 !important;
  transform: translateY(-1px) !important;
}
.fba-btn-primary:active:not(:disabled) {
  transform: translateY(0) !important;
}

/* Secondary */
.fba-btn-secondary {
  flex: 1 !important;
  background: #252a35 !important;
  border: 1px solid #4a5568 !important;
  color: #f8fafc !important;
}
.fba-btn-secondary:hover:not(:disabled) {
  background: #323947 !important;
  border-color: #64748b !important;
  color: #ffffff !important;
}

/* Warning / Pause */
.fba-btn-warning {
  flex: 1 !important;
  background: #3b2507 !important;
  border: 1px solid #ca8a04 !important;
  color: #fef08a !important;
}
.fba-btn-warning:hover:not(:disabled) {
  background: #50320a !important;
  border-color: #eab308 !important;
}

/* Danger / Cancel */
.fba-btn-danger {
  flex: 1 !important;
  background: #3d1414 !important;
  border: 1px solid #dc2626 !important;
  color: #fecaca !important;
}
.fba-btn-danger:hover:not(:disabled) {
  background: #521919 !important;
  border-color: #ef4444 !important;
}

/* Ghost */
.fba-btn-ghost {
  background: transparent !important;
  border: 1px solid #3a4252 !important;
  color: #cbd5e1 !important;
  font-size: 11.5px !important;
  font-weight: 500 !important;
  height: 24px !important;
  padding: 0 8px !important;
  border-radius: 5px !important;
  cursor: pointer !important;
  font-family: inherit !important;
  transition: all 0.15s ease !important;
}
.fba-btn-ghost:hover {
  color: #ffffff !important;
  background: #252a35 !important;
  border-color: #5c677d !important;
}

.fba-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
}

/* ==========================================================================
   ACTIVITY LOG
   ========================================================================== */
.fba-log-container {
  max-height: 135px !important;
  min-height: 65px !important;
  overflow-y: auto !important;
  background: #0b0d11 !important;
  border: 1px solid #313745 !important;
  border-radius: 7px !important;
  padding: 8px 10px !important;
  font-family: "JetBrains Mono", Consolas, monospace !important;
  font-size: 11.5px !important;
  line-height: 1.6 !important;
  color: #e2e8f0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
}
.fba-log-container::-webkit-scrollbar {
  width: 6px !important;
}
.fba-log-container::-webkit-scrollbar-thumb {
  background: #2d3340 !important;
  border-radius: 6px !important;
}

.fba-log-entry {
  display: flex !important;
  gap: 9px !important;
  word-break: break-word !important;
}
.fba-log-time {
  color: #94a3b8 !important;
  flex-shrink: 0 !important;
  font-weight: 600 !important;
  font-variant-numeric: tabular-nums !important;
}

.fba-log-entry.info .fba-log-msg {
  color: #e2e8f0 !important;
}
.fba-log-entry.success .fba-log-msg {
  color: #4ade80 !important;
  font-weight: 600 !important;
}
.fba-log-entry.warn .fba-log-msg {
  color: #fde047 !important;
  font-weight: 600 !important;
}
.fba-log-entry.error .fba-log-msg {
  color: #fca5a5 !important;
  font-weight: 600 !important;
}

/* ==========================================================================
   DESTINATION FOLDER PICKER (FILE SYSTEM ACCESS API)
   ========================================================================== */
.fba-folder-section {
  background: #161922 !important;
  border: 1px solid #323b4b !important;
  border-radius: 8px !important;
  padding: 10px 12px !important;
  margin-top: 4px !important;
}

.fba-folder-status-pill {
  font-size: 10px !important;
  font-weight: 700 !important;
  padding: 2px 7px !important;
  border-radius: 999px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
}
.fba-folder-status-pill.active {
  background: #052e16 !important;
  color: #4ade80 !important;
  border: 1px solid #16a34a !important;
}
.fba-folder-status-pill.reauth {
  background: #422006 !important;
  color: #fde047 !important;
  border: 1px solid #ca8a04 !important;
}
.fba-folder-status-pill.idle {
  background: #1e2430 !important;
  color: #94a3b8 !important;
  border: 1px solid #3e4859 !important;
}

.fba-folder-control-row {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin-top: 6px !important;
}

.fba-btn-folder {
  flex: none !important;
  height: 32px !important;
  padding: 0 10px !important;
  font-size: 12px !important;
  background: #252a36 !important;
  border: 1px solid #4a566d !important;
  color: #ffffff !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  font-weight: 600 !important;
  transition: all 0.15s ease !important;
}
.fba-btn-folder:hover {
  background: #32394a !important;
  border-color: #38bdf8 !important;
}

.fba-folder-name-box {
  flex: 1 !important;
  min-width: 0 !important;
  height: 32px !important;
  background: #11141a !important;
  border: 1px solid #333c4d !important;
  border-radius: 6px !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 10px !important;
  font-family: "JetBrains Mono", Consolas, monospace !important;
  font-size: 11.5px !important;
  color: #e2e8f0 !important;
  overflow: hidden !important;
}

.fba-folder-name-text {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  display: block !important;
  width: 100% !important;
}

.fba-clear-folder-btn {
  flex: none !important;
  width: 28px !important;
  height: 28px !important;
  background: #261616 !important;
  border: 1px solid #7f1d1d !important;
  color: #fca5a5 !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.15s ease !important;
}
.fba-clear-folder-btn:hover {
  background: #450a0a !important;
  border-color: #dc2626 !important;
  color: #ffffff !important;
}

.fba-folder-hint {
  font-size: 11px !important;
  color: #94a3b8 !important;
  line-height: 1.35 !important;
  margin-top: 5px !important;
}
`;

  /* ==========================================================================
     DEFAULT SELECTORS CONFIGURATION
     ========================================================================== */
  const DEFAULT_SELECTORS = {
    promptInput: [
      'textarea[placeholder*="prompt" i]',
      'textarea[aria-label*="prompt" i]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea',
      'input[type="text"][placeholder*="prompt" i]'
    ].join(', '),

    submitButton: [
      'button[aria-label*="generate" i]:not([aria-label*="agent" i])',
      'button[aria-label*="send" i]:not([aria-label*="agent" i])',
      'button[aria-label*="submit" i]:not([aria-label*="agent" i])',
      'button[aria-label*="arrow" i]'
    ].join(', '),

    feedContainer: [
      '[data-testid*="canvas"]',
      '[data-testid*="feed"]',
      '[role="feed"]',
      'main',
      '[role="main"]',
      '.feed-container',
      '.canvas-container',
      'body'
    ].join(', '),

    generationCard: [
      '[data-testid*="card"]',
      '[data-testid*="generation"]',
      '[role="article"]',
      '.generation-card',
      '.asset-card',
      '.card'
    ].join(', '),

    modelSwitcher: [
      '[data-testid*="model-select"]',
      '[data-testid*="model-picker"]',
      'button[aria-haspopup="listbox"]',
      'button[aria-label*="model" i]',
      '[aria-label*="model target" i]'
    ].join(', '),

    upscaleButton: [
      'button[aria-label*="upscale" i]',
      'button[title*="upscale" i]',
      '[data-testid*="upscale"]',
      'button[aria-label*="maximize" i]',
      'button[aria-label*="enhance" i]',
      'button[aria-label*="2k" i]',
      'button[aria-label*="4k" i]'
    ].join(', ')
  };

  /* ==========================================================================
     STATE MANAGEMENT
     ========================================================================== */
  const state = {
    promptsText: '',
    delimiter: 'newline',
    delaySeconds: 15,
    timeoutSeconds: 90,
    prefix: 'scene_',
    startIndex: 1,
    paddingDigits: 3,
    folderName: 'flow_batch_generations',
    selectedModel: 'default',
    pauseOnError: false,
    autoScroll: true,
    autoUpscale: false,
    directoryHandle: null,

    selectors: { ...DEFAULT_SELECTORS },

    isRunning: false,
    isPaused: false,
    isCancelled: false,
    currentIndex: 0,
    totalCount: 0,
    promptsList: [],
    countdownTimer: null,
    cooldownRemaining: 0,
    
    isPanelOpen: true,
    panelPosition: { top: 60, right: 20 }
  };

  /* ==========================================================================
     SHADOW DOM MOUNTING & UI SETUP
     ========================================================================== */
  let host = document.getElementById('fba-host-container');
  if (!host) {
    host = document.createElement('div');
    host.id = 'fba-host-container';
    host.style.cssText = 'all: initial !important; display: block !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; z-index: 2147483647 !important; pointer-events: none !important;';
  }

  function mountHost() {
    const parent = document.body || document.documentElement;
    if (parent && !parent.contains(host)) {
      parent.appendChild(host);
    }
  }

  mountHost();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHost);
  }
  window.addEventListener('load', mountHost);
  setInterval(mountHost, 2000);

  const shadowRoot = host.shadowRoot || host.attachShadow({ mode: 'open' });

  let styleEl = shadowRoot.querySelector('style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    shadowRoot.appendChild(styleEl);
  }
  styleEl.textContent = EMBEDDED_STYLES;

  let uiContainer = shadowRoot.querySelector('.fba-pointer-events');
  if (!uiContainer) {
    uiContainer = document.createElement('div');
    uiContainer.className = 'fba-pointer-events';
    shadowRoot.appendChild(uiContainer);
  }

  uiContainer.innerHTML = `
    <!-- Floating Launcher Toggle Button -->
    <div id="fba-launcher-btn" title="Toggle Flow Batch Automator">
      <span class="fba-pulse-badge" id="fba-pulse-indicator"></span>
      <svg viewBox="0 0 24 24"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z"/></svg>
      <span>Batch</span>
    </div>

    <!-- Main Panel -->
    <div id="fba-panel">
      <!-- Header -->
      <div class="fba-header" id="fba-drag-header">
        <div class="fba-title-wrap">
          <div class="fba-logo">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z"/></svg>
          </div>
          <div class="fba-title-text">
            <span class="fba-title">Flow Batch</span>
            <span class="fba-subtitle">Queue automation</span>
          </div>
        </div>
        <div class="fba-header-right">
          <span class="fba-badge idle" id="fba-status-badge">Idle</span>
          <div class="fba-window-controls">
            <button class="fba-icon-btn" id="fba-close-btn" title="Hide panel">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div class="fba-body">
        <!-- Prompts -->
        <div class="fba-section">
          <div class="fba-field">
            <label class="fba-label" for="fba-model-select">Model</label>
            <select id="fba-model-select" class="fba-select">
              <option value="default">Use current selection</option>
              <option value="nano-banana">Nano Banana Pro (Gemini 3 Pro Image)</option>
              <option value="veo">Veo Video</option>
            </select>
          </div>

          <div class="fba-field">
            <div class="fba-label-row">
              <label class="fba-label" for="fba-prompts-input">Prompts</label>
              <span class="fba-counter" id="fba-prompt-count">0 prompts detected</span>
            </div>
            <textarea id="fba-prompts-input" class="fba-textarea" spellcheck="false" placeholder="One prompt per line, or separate with ---&#10;&#10;A dog&#10;A car&#10;A house"></textarea>
          </div>

          <div class="fba-grid-2">
            <select id="fba-delimiter-select" class="fba-select" title="Delimiter">
              <option value="newline">Split by new line</option>
              <option value="delimiter_triple_dash">Split by ---</option>
            </select>
            <button class="fba-btn fba-btn-secondary" id="fba-clear-prompts-btn">Clear</button>
          </div>
        </div>

        <!-- Configuration -->
        <div class="fba-section">
          <span class="fba-section-title">Timing</span>
          <div class="fba-grid-2">
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-delay-input">Delay (s)</label>
              <input type="number" id="fba-delay-input" class="fba-input" min="0" max="600" value="15" title="Seconds between prompts. Set lower (e.g. 0-5s) to speed up generation." />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-timeout-input">Timeout (s)</label>
              <input type="number" id="fba-timeout-input" class="fba-input" min="10" max="900" value="90" />
            </div>
          </div>

          <span class="fba-section-title" style="margin-top: 4px;">Output</span>
          <div class="fba-grid-3">
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-prefix-input">Prefix</label>
              <input type="text" id="fba-prefix-input" class="fba-input" value="scene_" />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-start-index-input">Start</label>
              <input type="number" id="fba-start-index-input" class="fba-input" min="0" value="1" />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-padding-input">Padding</label>
              <input type="number" id="fba-padding-input" class="fba-input" min="1" max="8" value="3" />
            </div>
          </div>
          <!-- Destination Folder (Native File System Access API) -->
          <div class="fba-folder-section">
            <div class="fba-label-row">
              <label class="fba-label-sub">Destination folder (Direct Save)</label>
              <span id="fba-folder-status" class="fba-folder-status-pill idle">Not selected</span>
            </div>
            <div class="fba-folder-control-row">
              <button type="button" class="fba-btn-folder" id="fba-pick-folder-btn" title="Choose local folder">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>
                <span id="fba-pick-folder-label">Select Folder</span>
              </button>
              <div class="fba-folder-name-box" id="fba-folder-name-box" title="No folder selected">
                <span class="fba-folder-name-text" id="fba-folder-name-text">No folder selected</span>
              </div>
              <button type="button" class="fba-clear-folder-btn" id="fba-clear-folder-btn" title="Clear selected folder" style="display: none;">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="fba-folder-hint" id="fba-folder-hint">
              Pick any local folder on your PC to save images directly with 0 download popups.
            </div>
          </div>

          <div class="fba-field" style="margin-top: 4px;">
            <label class="fba-label-sub" for="fba-folder-input">Fallback Chrome download folder</label>
            <input type="text" id="fba-folder-input" class="fba-input" value="flow_batch_generations" title="Used if no local folder is selected" />
          </div>

          <label class="fba-checkbox-row">
            <span>Pause on failure</span>
            <input type="checkbox" id="fba-pause-on-error" />
          </label>
          <label class="fba-checkbox-row">
            <span>Auto-scroll canvas</span>
            <input type="checkbox" id="fba-auto-scroll" checked />
          </label>
          <label class="fba-checkbox-row">
            <span>Download upscaled (2K / 4K / High-Res)</span>
            <input type="checkbox" id="fba-auto-upscale" />
          </label>
        </div>

        <!-- Advanced: DOM Selectors -->
        <div class="fba-accordion" id="fba-selectors-accordion">
          <div class="fba-accordion-header">
            <span>Advanced selectors</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          <div class="fba-accordion-content">
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-sel-input">Prompt input</label>
              <input type="text" id="fba-sel-input" class="fba-input" spellcheck="false" />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-sel-submit">Generate button</label>
              <input type="text" id="fba-sel-submit" class="fba-input" spellcheck="false" />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-sel-feed">Feed container</label>
              <input type="text" id="fba-sel-feed" class="fba-input" spellcheck="false" />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-sel-card">Asset card</label>
              <input type="text" id="fba-sel-card" class="fba-input" spellcheck="false" />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-sel-model">Model switcher</label>
              <input type="text" id="fba-sel-model" class="fba-input" spellcheck="false" />
            </div>
            <div class="fba-field">
              <label class="fba-label-sub" for="fba-sel-upscale">Upscale button</label>
              <input type="text" id="fba-sel-upscale" class="fba-input" spellcheck="false" />
            </div>
            <button class="fba-btn fba-btn-secondary" id="fba-reset-selectors-btn">Reset to defaults</button>
          </div>
        </div>

        <!-- Run -->
        <div class="fba-section">
          <div class="fba-status-card">
            <div class="fba-status-info">
              <span id="fba-progress-text">Ready (0 / 0)</span>
              <span id="fba-timer-indicator" class="fba-timer-badge" style="display: none;">00s</span>
            </div>
            <div class="fba-progress-track">
              <div class="fba-progress-bar" id="fba-progress-bar"></div>
            </div>
            <div class="fba-status-detail">
              <span id="fba-status-detail-text">Add prompts and start the queue.</span>
            </div>
          </div>

          <div class="fba-actions-row">
            <button class="fba-btn fba-btn-primary" id="fba-start-btn">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span>Start queue</span>
            </button>
            <button class="fba-btn fba-btn-warning" id="fba-pause-btn" disabled>Pause</button>
            <button class="fba-btn fba-btn-danger" id="fba-cancel-btn" disabled>Cancel</button>
          </div>
        </div>

        <!-- Activity Log -->
        <div class="fba-section">
          <div class="fba-label-row">
            <span class="fba-section-title">Activity</span>
            <button class="fba-btn-ghost" id="fba-clear-log">Clear</button>
          </div>
          <div class="fba-log-container" id="fba-log-box">
            <div class="fba-log-entry info">
              <span class="fba-log-time">--:--:--</span>
              <span class="fba-log-msg">Ready.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  /* ==========================================================================
     DOM REFERENCES IN SHADOW ROOT
     ========================================================================== */
  const el = {
    launcherBtn: shadowRoot.getElementById('fba-launcher-btn'),
    pulseIndicator: shadowRoot.getElementById('fba-pulse-indicator'),
    panel: shadowRoot.getElementById('fba-panel'),
    dragHeader: shadowRoot.getElementById('fba-drag-header'),
    closeBtn: shadowRoot.getElementById('fba-close-btn'),
    statusBadge: shadowRoot.getElementById('fba-status-badge'),
    modelSelect: shadowRoot.getElementById('fba-model-select'),
    promptsInput: shadowRoot.getElementById('fba-prompts-input'),
    promptCount: shadowRoot.getElementById('fba-prompt-count'),
    delimiterSelect: shadowRoot.getElementById('fba-delimiter-select'),
    clearPromptsBtn: shadowRoot.getElementById('fba-clear-prompts-btn'),
    delayInput: shadowRoot.getElementById('fba-delay-input'),
    timeoutInput: shadowRoot.getElementById('fba-timeout-input'),
    prefixInput: shadowRoot.getElementById('fba-prefix-input'),
    startIndexInput: shadowRoot.getElementById('fba-start-index-input'),
    paddingInput: shadowRoot.getElementById('fba-padding-input'),
    folderInput: shadowRoot.getElementById('fba-folder-input'),
    folderStatus: shadowRoot.getElementById('fba-folder-status'),
    pickFolderBtn: shadowRoot.getElementById('fba-pick-folder-btn'),
    pickFolderLabel: shadowRoot.getElementById('fba-pick-folder-label'),
    folderNameBox: shadowRoot.getElementById('fba-folder-name-box'),
    folderNameText: shadowRoot.getElementById('fba-folder-name-text'),
    clearFolderBtn: shadowRoot.getElementById('fba-clear-folder-btn'),
    folderHint: shadowRoot.getElementById('fba-folder-hint'),
    pauseOnError: shadowRoot.getElementById('fba-pause-on-error'),
    autoScroll: shadowRoot.getElementById('fba-auto-scroll'),
    autoUpscale: shadowRoot.getElementById('fba-auto-upscale'),
    selectorsAccordion: shadowRoot.getElementById('fba-selectors-accordion'),
    selInput: shadowRoot.getElementById('fba-sel-input'),
    selSubmit: shadowRoot.getElementById('fba-sel-submit'),
    selFeed: shadowRoot.getElementById('fba-sel-feed'),
    selCard: shadowRoot.getElementById('fba-sel-card'),
    selModel: shadowRoot.getElementById('fba-sel-model'),
    selUpscale: shadowRoot.getElementById('fba-sel-upscale'),
    resetSelectorsBtn: shadowRoot.getElementById('fba-reset-selectors-btn'),
    progressText: shadowRoot.getElementById('fba-progress-text'),
    timerIndicator: shadowRoot.getElementById('fba-timer-indicator'),
    progressBar: shadowRoot.getElementById('fba-progress-bar'),
    statusDetailText: shadowRoot.getElementById('fba-status-detail-text'),
    startBtn: shadowRoot.getElementById('fba-start-btn'),
    pauseBtn: shadowRoot.getElementById('fba-pause-btn'),
    cancelBtn: shadowRoot.getElementById('fba-cancel-btn'),
    clearLogBtn: shadowRoot.getElementById('fba-clear-log'),
    logBox: shadowRoot.getElementById('fba-log-box')
  };

  /* ==========================================================================
     LOGGING UTILITIES
     ========================================================================== */
  function addLog(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `fba-log-entry ${type}`;
    const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `<span class="fba-log-time">${timeStr}</span><span class="fba-log-msg">${escapeHtml(msg)}</span>`;
    el.logBox.appendChild(entry);
    el.logBox.scrollTop = el.logBox.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  /* ==========================================================================
     NATIVE FILE SYSTEM ACCESS API & INDEXEDDB STORAGE
     Enables direct, silent saving to any local folder on the user's computer
     without browser download popups or "Save As" prompts.
     ========================================================================== */
  const IDB_NAME = 'FlowBatchAutomatorDB';
  const IDB_STORE = 'settings';
  const IDB_DIR_KEY = 'targetDirectoryHandle';

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getStoredDirectoryHandle() {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(IDB_DIR_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('[Flow Batch Automator] Failed to read from IndexedDB:', e);
      return null;
    }
  }

  async function storeDirectoryHandle(handle) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(handle, IDB_DIR_KEY);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[Flow Batch Automator] Failed to save handle in IndexedDB:', e);
    }
  }

  async function clearStoredDirectoryHandle() {
    try {
      const db = await openDatabase();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.delete(IDB_DIR_KEY);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('[Flow Batch Automator] Failed to clear handle in IndexedDB:', e);
    }
  }

  async function verifyDirectoryPermission(dirHandle, readWrite = true) {
    if (!dirHandle) return false;
    const opts = { mode: readWrite ? 'readwrite' : 'read' };
    try {
      if ((await dirHandle.queryPermission(opts)) === 'granted') {
        return true;
      }
      if ((await dirHandle.requestPermission(opts)) === 'granted') {
        return true;
      }
    } catch (e) {
      console.warn('[Flow Batch Automator] Permission query/request error:', e);
    }
    return false;
  }

  function updateFolderUI(statusOverride) {
    if (state.directoryHandle) {
      const name = state.directoryHandle.name || 'Selected Folder';
      const isReauth = statusOverride === 'reauth';

      el.folderStatus.textContent = isReauth ? 'Authorize' : 'Direct Save';
      el.folderStatus.className = `fba-folder-status-pill ${isReauth ? 'reauth' : 'active'}`;
      el.folderNameText.textContent = `📁 ${name}`;
      el.folderNameBox.title = `Directly saving to: ${name}`;
      el.pickFolderLabel.textContent = isReauth ? 'Authorize' : 'Change';
      el.clearFolderBtn.style.display = 'flex';
      el.folderHint.textContent = isReauth
        ? `Permission needed for "${name}". Click Authorize to enable silent saving.`
        : `Silent saving active! Files write directly into "${name}" with 0 popups.`;
    } else {
      el.folderStatus.textContent = 'Not selected';
      el.folderStatus.className = 'fba-folder-status-pill idle';
      el.folderNameText.textContent = 'No folder selected';
      el.folderNameBox.title = 'No folder selected';
      el.pickFolderLabel.textContent = 'Select Folder';
      el.clearFolderBtn.style.display = 'none';
      el.folderHint.textContent = 'Pick any folder on your PC to save images directly with 0 download popups.';
    }
  }

  async function initSavedDirectory() {
    try {
      const savedHandle = await getStoredDirectoryHandle();
      if (savedHandle) {
        state.directoryHandle = savedHandle;
        const opts = { mode: 'readwrite' };
        let perm = 'prompt';
        try {
          perm = await savedHandle.queryPermission(opts);
        } catch (e) {}

        if (perm === 'granted') {
          updateFolderUI('active');
        } else {
          updateFolderUI('reauth');
        }
      } else {
        updateFolderUI('idle');
      }
    } catch (err) {
      console.warn('[Flow Batch Automator] Error initializing directory handle:', err);
      updateFolderUI('idle');
    }
  }

  async function promptPickDirectory() {
    if (typeof window.showDirectoryPicker !== 'function') {
      alert('The File System Access API is not supported in this browser. Will use Chrome Downloads.');
      return null;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (handle) {
        state.directoryHandle = handle;
        await storeDirectoryHandle(handle);
        updateFolderUI('active');
        addLog(`Destination folder set to "${handle.name}". Direct saving is active.`, 'success');
        return handle;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        addLog('Folder selection dialog cancelled.', 'info');
      } else {
        console.error('[Flow Batch Automator] showDirectoryPicker error:', err);
        addLog(`Folder picker error: ${err.message}`, 'warn');
      }
    }
    return null;
  }

  async function getUniqueFilenameInDir(dirHandle, baseName, extension) {
    let candidateName = `${baseName}.${extension}`;
    let counter = 1;
    while (true) {
      try {
        await dirHandle.getFileHandle(candidateName, { create: false });
        // File exists! Auto-increment filename (e.g. scene_001_1.png)
        candidateName = `${baseName}_${counter}.${extension}`;
        counter++;
      } catch (err) {
        // File does not exist, name is safe to use!
        return candidateName;
      }
    }
  }

  /* ==========================================================================
     DRAGGABLE OVERLAY & VISIBILITY
     ========================================================================== */
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  el.dragHeader.addEventListener('mousedown', (e) => {
    if (e.target.closest('#fba-close-btn')) return;
    isDragging = true;
    const rect = el.panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const maxX = window.innerWidth - el.panel.offsetWidth;
    const maxY = window.innerHeight - el.panel.offsetHeight;

    let x = Math.max(10, Math.min(e.clientX - dragOffset.x, maxX - 10));
    let y = Math.max(10, Math.min(e.clientY - dragOffset.y, maxY - 10));

    el.panel.style.left = `${x}px`;
    el.panel.style.top = `${y}px`;
    el.panel.style.right = 'auto';

    state.panelPosition = { top: y, left: x };
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      saveSettings();
    }
  });

  function updatePanelVisibility() {
    if (state.isPanelOpen) {
      el.panel.classList.remove('fba-hidden');
    } else {
      el.panel.classList.add('fba-hidden');
    }
  }

  function togglePanel() {
    state.isPanelOpen = !state.isPanelOpen;
    updatePanelVisibility();
    saveSettings();
  }

  window.__FLOW_BATCH_AUTOMATOR_TOGGLE__ = togglePanel;

  el.launcherBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });

  el.closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.isPanelOpen = false;
    updatePanelVisibility();
    saveSettings();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action === 'TOGGLE_PANEL') {
      togglePanel();
      sendResponse({ success: true, isPanelOpen: state.isPanelOpen });
      return false;
    }
    if (message && message.action === 'OPEN_PANEL') {
      state.isPanelOpen = true;
      updatePanelVisibility();
      saveSettings();
      sendResponse({ success: true, isPanelOpen: true });
      return false;
    }
    return false;
  });

  el.selectorsAccordion.querySelector('.fba-accordion-header').addEventListener('click', () => {
    el.selectorsAccordion.classList.toggle('open');
  });

  el.clearLogBtn.addEventListener('click', () => {
    el.logBox.innerHTML = '';
  });

  /* ==========================================================================
     PROMPTS PARSER
     ========================================================================== */
  function parsePrompts() {
    const raw = el.promptsInput.value;
    state.promptsText = raw;
    let list = [];

    if (state.delimiter === 'delimiter_triple_dash') {
      list = raw.split(/---+/g);
    } else {
      list = raw.split(/\r?\n+/g);
    }

    state.promptsList = list.map((p) => p.trim()).filter((p) => p.length > 0);
    el.promptCount.textContent = `${state.promptsList.length} prompt${state.promptsList.length === 1 ? '' : 's'} detected`;
    return state.promptsList;
  }

  el.promptsInput.addEventListener('input', () => {
    parsePrompts();
    saveSettings();
  });

  el.delimiterSelect.addEventListener('change', () => {
    state.delimiter = el.delimiterSelect.value;
    parsePrompts();
    saveSettings();
  });

  el.clearPromptsBtn.addEventListener('click', () => {
    if (confirm('Clear all prompts from the queue?')) {
      el.promptsInput.value = '';
      parsePrompts();
      saveSettings();
    }
  });

  function populateSelectorFields() {
    el.selInput.value = state.selectors.promptInput;
    el.selSubmit.value = state.selectors.submitButton;
    el.selFeed.value = state.selectors.feedContainer;
    el.selCard.value = state.selectors.generationCard;
    el.selModel.value = state.selectors.modelSwitcher;
    el.selUpscale.value = state.selectors.upscaleButton || DEFAULT_SELECTORS.upscaleButton;
  }

  [el.selInput, el.selSubmit, el.selFeed, el.selCard, el.selModel, el.selUpscale].forEach((input) => {
    input.addEventListener('change', () => {
      state.selectors.promptInput = el.selInput.value.trim() || DEFAULT_SELECTORS.promptInput;
      state.selectors.submitButton = el.selSubmit.value.trim() || DEFAULT_SELECTORS.submitButton;
      state.selectors.feedContainer = el.selFeed.value.trim() || DEFAULT_SELECTORS.feedContainer;
      state.selectors.generationCard = el.selCard.value.trim() || DEFAULT_SELECTORS.generationCard;
      state.selectors.modelSwitcher = el.selModel.value.trim() || DEFAULT_SELECTORS.modelSwitcher;
      state.selectors.upscaleButton = el.selUpscale.value.trim() || DEFAULT_SELECTORS.upscaleButton;
      saveSettings();
      addLog('DOM Selectors updated.', 'info');
    });
  });

  el.resetSelectorsBtn.addEventListener('click', () => {
    state.selectors = { ...DEFAULT_SELECTORS };
    populateSelectorFields();
    saveSettings();
    addLog('Reset selectors to defaults.', 'info');
  });

  /* ==========================================================================
     SETTINGS PERSISTENCE
     ========================================================================== */
  function saveSettings() {
    const toSave = {
      promptsText: el.promptsInput.value,
      delimiter: el.delimiterSelect.value,
      delaySeconds: isNaN(parseInt(el.delayInput.value, 10)) ? 15 : Math.max(0, parseInt(el.delayInput.value, 10)),
      timeoutSeconds: parseInt(el.timeoutInput.value, 10) || 90,
      prefix: el.prefixInput.value,
      startIndex: parseInt(el.startIndexInput.value, 10) || 1,
      paddingDigits: parseInt(el.paddingInput.value, 10) || 3,
      folderName: el.folderInput.value,
      selectedModel: el.modelSelect.value,
      pauseOnError: el.pauseOnError.checked,
      autoScroll: el.autoScroll.checked,
      autoUpscale: el.autoUpscale.checked,
      selectors: state.selectors,
      isPanelOpen: state.isPanelOpen,
      panelPosition: state.panelPosition
    };

    chrome.storage.local.set({ flow_batch_config: toSave });
  }

  function loadSettings() {
    chrome.storage.local.get(['flow_batch_config'], (res) => {
      if (res && res.flow_batch_config) {
        const c = res.flow_batch_config;
        if (c.promptsText !== undefined) el.promptsInput.value = c.promptsText;
        if (c.delimiter) el.delimiterSelect.value = c.delimiter;
        if (c.delaySeconds !== undefined) el.delayInput.value = c.delaySeconds;
        if (c.timeoutSeconds !== undefined) el.timeoutInput.value = c.timeoutSeconds;
        if (c.prefix !== undefined) el.prefixInput.value = c.prefix;
        if (c.startIndex !== undefined) el.startIndexInput.value = c.startIndex;
        if (c.paddingDigits !== undefined) el.paddingInput.value = c.paddingDigits;
        if (c.folderName !== undefined) el.folderInput.value = c.folderName;
        if (c.selectedModel) el.modelSelect.value = c.selectedModel;
        if (c.pauseOnError !== undefined) el.pauseOnError.checked = c.pauseOnError;
        if (c.autoScroll !== undefined) el.autoScroll.checked = c.autoScroll;
        if (c.autoUpscale !== undefined) el.autoUpscale.checked = c.autoUpscale;
        if (c.selectors) state.selectors = { ...DEFAULT_SELECTORS, ...c.selectors };
        if (c.isPanelOpen !== undefined) state.isPanelOpen = c.isPanelOpen;
        if (c.panelPosition) {
          state.panelPosition = c.panelPosition;
          if (c.panelPosition.left !== undefined) {
            el.panel.style.left = `${c.panelPosition.left}px`;
            el.panel.style.right = 'auto';
          }
          if (c.panelPosition.top !== undefined) {
            el.panel.style.top = `${c.panelPosition.top}px`;
          }
        }
      }

      state.delimiter = el.delimiterSelect.value;
      populateSelectorFields();
      parsePrompts();
      updatePanelVisibility();
    });
  }

  [el.modelSelect, el.delayInput, el.timeoutInput, el.prefixInput, el.startIndexInput, el.paddingInput, el.folderInput, el.pauseOnError, el.autoScroll, el.autoUpscale].forEach((input) => {
    input.addEventListener('change', () => {
      if (input === el.modelSelect) {
        if (el.modelSelect.value === 'veo') {
          el.timeoutInput.value = '300';
        } else if (el.modelSelect.value === 'nano-banana') {
          el.timeoutInput.value = '90';
        }
      }
      saveSettings();
    });
  });

  if (el.pickFolderBtn) {
    el.pickFolderBtn.addEventListener('click', async () => {
      if (state.directoryHandle) {
        try {
          const perm = await state.directoryHandle.queryPermission({ mode: 'readwrite' });
          if (perm !== 'granted') {
            const req = await state.directoryHandle.requestPermission({ mode: 'readwrite' });
            if (req === 'granted') {
              updateFolderUI('active');
              addLog(`Re-authorized folder "${state.directoryHandle.name}". Direct saving is active.`, 'success');
              return;
            }
          }
        } catch (e) {}
      }
      await promptPickDirectory();
    });
  }

  if (el.clearFolderBtn) {
    el.clearFolderBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      state.directoryHandle = null;
      await clearStoredDirectoryHandle();
      updateFolderUI('idle');
      addLog('Destination folder cleared. Switched to Chrome Downloads fallback.', 'info');
    });
  }

  /* ==========================================================================
     CORE AUTOMATION ENGINE: FLOW DOM INTERACTION
     ========================================================================== */

  /**
   * Sets value on React / Web-Component input with prototype descriptor and React _valueTracker reset
   */
  function setNativeInputValue(element, value) {
    element.focus();

    // 1. Reset React's internal value tracker so React notices the change
    if (element._valueTracker) {
      try {
        element._valueTracker.setValue('');
      } catch (e) {}
    }

    // 2. Set value using native prototype descriptor
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
      } else {
        element.value = value;
      }
    } else if (element.isContentEditable) {
      element.textContent = value;
      element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
    } else {
      element.value = value;
    }

    // 3. Dispatch beforeinput, input, and change events
    element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, composed: true, inputType: 'insertText', data: value }));
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    // 4. Trigger React prop callbacks directly if attached to DOM element
    for (const key in element) {
      if (key.startsWith('__reactProps$')) {
        const props = element[key];
        if (props && typeof props.onChange === 'function') {
          try { props.onChange({ target: element, currentTarget: element }); } catch (e) {}
        }
        if (props && typeof props.onInput === 'function') {
          try { props.onInput({ target: element, currentTarget: element }); } catch (e) {}
        }
      }
    }
  }

  /**
   * Dispatches authentic Enter key events to React, activeElement, input, and document
   */
  function pressEnter(element) {
    if (!element) return;
    element.focus();

    // 1. Direct React onKeyDown invocation if component is React-controlled
    for (const key in element) {
      if (key.startsWith('__reactProps$')) {
        const props = element[key];
        if (props && typeof props.onKeyDown === 'function') {
          try {
            props.onKeyDown({
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              charCode: 13,
              bubbles: true,
              cancelable: true,
              shiftKey: false,
              ctrlKey: false,
              metaKey: false,
              preventDefault: () => {},
              stopPropagation: () => {}
            });
          } catch (e) {}
        }
      }
    }

    // 2. Dispatch genuine DOM KeyboardEvents with keyCode: 13
    function fireKey(target, type, ctrl = false) {
      const ev = new KeyboardEvent(type, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        charCode: 13,
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        shiftKey: false,
        ctrlKey: ctrl,
        metaKey: ctrl
      });
      try {
        Object.defineProperty(ev, 'keyCode', { get: () => 13 });
        Object.defineProperty(ev, 'which', { get: () => 13 });
        Object.defineProperty(ev, 'charCode', { get: () => 13 });
        Object.defineProperty(ev, 'key', { get: () => 'Enter' });
        Object.defineProperty(ev, 'code', { get: () => 'Enter' });
      } catch (e) {}
      target.dispatchEvent(ev);
    }

    fireKey(element, 'keydown', false);
    fireKey(element, 'keypress', false);
    fireKey(element, 'keyup', false);

    if (document.activeElement && document.activeElement !== element) {
      fireKey(document.activeElement, 'keydown', false);
      fireKey(document.activeElement, 'keypress', false);
      fireKey(document.activeElement, 'keyup', false);
    }

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
  }

  /**
   * Simulates natural click sequence on an element and its SVG
   */
  function simulateClick(element) {
    if (!element) return false;
    element.focus();

    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy };

    element.dispatchEvent(new PointerEvent('pointerdown', opts));
    element.dispatchEvent(new MouseEvent('mousedown', opts));
    element.dispatchEvent(new PointerEvent('pointerup', opts));
    element.dispatchEvent(new MouseEvent('mouseup', opts));
    element.click();

    // Also trigger on child SVG or icon if present
    const innerIcon = element.querySelector('svg, path, i');
    if (innerIcon) {
      innerIcon.dispatchEvent(new MouseEvent('click', opts));
    }

    return true;
  }

  /**
   * Hybrid Model Switcher
   */
  async function ensureTargetModel(targetModel) {
    if (!targetModel || targetModel === 'default') {
      return true;
    }

    const switcher = document.querySelector(state.selectors.modelSwitcher);
    if (!switcher) {
      addLog(`Model switcher not found. Continuing with Flow active model.`, 'warn');
      return true;
    }

    addLog(`Attempting to switch model to: ${targetModel}...`, 'info');
    simulateClick(switcher);
    await sleep(600);

    const targetLabel = targetModel === 'veo' ? 'Veo' : 'Banana';
    const options = Array.from(document.querySelectorAll('[role="option"], [role="menuitem"], li, button'));
    const matched = options.find((opt) => opt.textContent && opt.textContent.toLowerCase().includes(targetLabel.toLowerCase()));

    if (matched) {
      simulateClick(matched);
      addLog(`Selected model: ${matched.textContent.trim()}`, 'success');
      await sleep(500);
      return true;
    }

    document.body.click();
    addLog(`Could not find option for "${targetLabel}". Using current model.`, 'warn');
    return true;
  }

  /**
   * Finds the prompt input element on Flow
   */
  function findPromptInput() {
    const selectors = state.selectors.promptInput.split(',').map((s) => s.trim());
    for (const sel of selectors) {
      try {
        const found = document.querySelector(sel);
        if (found && !found.closest('#fba-host-container') && isElementVisible(found)) {
          return found;
        }
      } catch (e) {}
    }
    return null;
  }

  /**
   * Specifically targets Flow's circular arrow submit button inside the prompt bar
   */
  function findFlowSubmitButton(inputEl) {
    if (!inputEl) return null;

    function isAgentButton(btn) {
      if (!btn) return false;
      const text = (btn.textContent || '').trim().toLowerCase();
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      const title = (btn.getAttribute('title') || '').toLowerCase();
      const cls = (typeof btn.className === 'string' ? btn.className : '').toLowerCase();
      return text === 'agent' || text.includes('agent') || aria.includes('agent') || title.includes('agent') || cls.includes('agent');
    }

    function isForbiddenButton(btn) {
      if (!btn) return true;
      if (btn.closest('#fba-host-container')) return true;
      if (btn.disabled) return true;
      if (!isElementVisible(btn)) return true;

      // 1. STRICTLY FORBID AGENT BUTTON UNDER ALL CONDITIONS
      if (isAgentButton(btn)) return true;

      const text = (btn.textContent || '').trim().toLowerCase();
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      const title = (btn.getAttribute('title') || '').toLowerCase();

      // 2. FORBID ADD / ATTACH (+)
      if (text === '+' || aria.includes('attach') || aria.includes('add') || aria.includes('upload') || title.includes('add')) {
        return true;
      }

      // 3. FORBID CLEAR / CLOSE (X) OR EXPAND
      if (text === '×' || text === 'x' || aria.includes('clear') || aria.includes('close') || aria.includes('expand')) {
        return true;
      }

      // 4. FORBID DROPDOWN MENUS (Aspect ratio, sliders)
      if (btn.getAttribute('aria-haspopup') === 'true' || btn.getAttribute('aria-haspopup') === 'menu' || btn.getAttribute('aria-haspopup') === 'dialog') {
        return true;
      }
      if (aria.includes('aspect') || aria.includes('ratio') || aria.includes('settings') || aria.includes('model') || aria.includes('format')) {
        return true;
      }

      return false;
    }

    // First: Check custom selector if provided (strictly ignoring forbidden buttons)
    if (state.selectors.submitButton) {
      const customSels = state.selectors.submitButton.split(',').map((s) => s.trim());
      for (const sel of customSels) {
        try {
          const match = document.querySelector(sel);
          if (match && !isForbiddenButton(match)) {
            return match;
          }
        } catch (e) {}
      }
    }

    // Search outward through ancestor wrappers of prompt input to find the prompt bar
    let container = inputEl;
    let barContainer = null;
    for (let i = 0; i < 8 && container && container !== document.body; i++) {
      container = container.parentElement;
      if (!container) break;
      const btns = container.querySelectorAll('button');
      if (btns.length >= 2) {
        barContainer = container;
        break;
      }
    }

    if (!barContainer) {
      barContainer = inputEl.parentElement || document.body;
    }

    // Collect all buttons in the prompt bar that are NOT forbidden
    const validButtons = Array.from(barContainer.querySelectorAll('button')).filter((b) => !isForbiddenButton(b));

    if (validButtons.length > 0) {
      // Look for an arrow SVG or submit/send aria-label
      const arrowBtn = validButtons.find((btn) => {
        const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
        const title = (btn.getAttribute('title') || '').toLowerCase();
        if (aria.includes('send') || aria.includes('generate') || aria.includes('submit') || aria.includes('arrow') || title.includes('send')) {
          return true;
        }
        const svg = btn.querySelector('svg');
        if (svg) {
          const path = btn.querySelector('path');
          const d = path ? (path.getAttribute('d') || '') : '';
          if (d.includes('arrow') || aria.includes('arrow') || d.includes('21L23 12')) {
            return true;
          }
        }
        return false;
      });

      if (arrowBtn) return arrowBtn;

      // In Flow, the circular submit arrow button is ALWAYS the rightmost button in the prompt bar!
      validButtons.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
      return validButtons[0];
    }

    // Global fallback near bottom of the viewport (excluding all forbidden buttons)
    const bottomCandidates = Array.from(document.querySelectorAll('button')).filter((b) => {
      if (isForbiddenButton(b)) return false;
      const rect = b.getBoundingClientRect();
      return rect.bottom > window.innerHeight - 250;
    });

    if (bottomCandidates.length > 0) {
      bottomCandidates.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
      return bottomCandidates[0];
    }

    return null;
  }

  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 0;
  }

  function getExistingMediaUrls() {
    const container = document.querySelector(state.selectors.feedContainer) || document.body;
    const urls = new Set();
    const mediaEls = container.querySelectorAll('img, video, [data-src]');
    mediaEls.forEach((m) => {
      const src = m.currentSrc || m.src || m.getAttribute('data-src');
      if (src && !src.startsWith('data:image/svg')) urls.add(src);
    });
    return urls;
  }

  function waitForGenerationOutput(existingUrls, timeoutSeconds) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeoutMs = timeoutSeconds * 1000;
      let observer = null;
      let checkTimer = null;

      function cleanup() {
        if (observer) observer.disconnect();
        if (checkTimer) clearInterval(checkTimer);
      }

      function checkForNewAsset() {
        if (state.isCancelled) {
          cleanup();
          return reject(new Error('Queue cancelled by user'));
        }

        const container = document.querySelector(state.selectors.feedContainer) || document.body;
        const mediaElements = Array.from(container.querySelectorAll('img, video, [data-src]'));

        for (const media of mediaElements) {
          const src = media.currentSrc || media.src || media.getAttribute('data-src');
          if (!src || existingUrls.has(src) || src.startsWith('data:image/svg')) continue;

          const parentCard = media.closest(state.selectors.generationCard) || media.parentElement;
          const isPending = parentCard && (
            parentCard.querySelector('[role="progressbar"], .loading, .spinner, [aria-busy="true"]') ||
            parentCard.classList.contains('generating') ||
            parentCard.classList.contains('loading')
          );

          if (isPending) {
            continue;
          }

          if (media instanceof HTMLImageElement) {
            if (media.complete && media.naturalWidth > 50) {
              cleanup();
              return resolve({ url: src, type: 'image', element: media });
            }
          } else if (media instanceof HTMLVideoElement) {
            if (media.readyState >= 2 || (media.duration > 0 && !isNaN(media.duration)) || src.includes('.mp4')) {
              cleanup();
              return resolve({ url: src, type: 'video', element: media });
            }
          } else if (src.length > 10) {
            cleanup();
            return resolve({ url: src, type: 'image', element: media });
          }
        }

        const elapsed = Date.now() - startTime;
        if (elapsed > timeoutMs) {
          cleanup();
          return reject(new Error(`Generation timed out after ${timeoutSeconds}s`));
        }

        if (state.autoScroll && container) {
          container.scrollTop = container.scrollHeight;
        }
      }

      const targetFeed = document.querySelector(state.selectors.feedContainer) || document.body;
      observer = new MutationObserver(() => {
        checkForNewAsset();
      });

      observer.observe(targetFeed, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'class', 'aria-busy'] });

      checkTimer = setInterval(checkForNewAsset, 1500);
      checkForNewAsset();
    });
  }

  async function resolveAssetUrl(rawUrl) {
    if (!rawUrl.startsWith('blob:')) {
      return rawUrl;
    }

    try {
      addLog('Converting local blob to Data URL for download...', 'info');
      const response = await fetch(rawUrl);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read blob data'));
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('[Flow Batch Automator] Blob conversion fallback:', err);
      return rawUrl;
    }
  }

  /**
   * Strips Google CDN thumbnail downscaling tokens (=s512, =w1024, etc.)
   * and replaces with =s0 for original full unscaled master resolution.
   */
  function enhanceHighResUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;

    if (/googleusercontent\.com|labs\.google/.test(url)) {
      if (/=[swh]\d+/.test(url)) {
        return url.replace(/=([swh]\d+[^&?]*)/, '=s0');
      }
    }
    return url;
  }

  /* ==========================================================================
     PAGE-WORLD (MAIN) HIGH-RES INTERCEPTION BRIDGE
     Communicates with injected.js running in world: 'MAIN'.
     Intercepts Flow's native 2K/4K downloads, transfers the binary buffer,
     and saves it directly into the user's selected folder or Chrome Downloads,
     completely eliminating browser download shelf popups and wrong filenames.
     ========================================================================== */

  let pendingUpscaleResolve = null;
  let pendingUpscaleReject = null;

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'FBA_MAIN') return;

    if (event.data.action === 'UPSCALE_BLOB_CAPTURED') {
      if (pendingUpscaleResolve) {
        pendingUpscaleResolve(event.data);
        pendingUpscaleResolve = null;
        pendingUpscaleReject = null;
      }
    } else if (event.data.action === 'UPSCALE_CAPTURE_FAILED') {
      if (pendingUpscaleReject) {
        pendingUpscaleReject(new Error(event.data.error || 'Upscale capture failed'));
        pendingUpscaleResolve = null;
        pendingUpscaleReject = null;
      }
    }
  });

  function waitForMainWorldUpscale(timeoutMs = 25000) {
    return new Promise((resolve) => {
      pendingUpscaleResolve = resolve;
      pendingUpscaleReject = (err) => {
        console.warn('[Flow Batch Automator] Upscale capture rejection:', err);
        resolve(null);
      };

      setTimeout(() => {
        if (pendingUpscaleResolve === resolve) {
          pendingUpscaleResolve = null;
          pendingUpscaleReject = null;
          resolve(null);
        }
      }, timeoutMs);
    });
  }

  function ensureMainWorldScript() {
    if (document.getElementById('fba-main-injected')) return;
    try {
      const s = document.createElement('script');
      s.id = 'fba-main-injected';
      s.src = chrome.runtime.getURL('injected.js');
      (document.head || document.documentElement).appendChild(s);
      console.log('[Flow Batch Automator] Injected main world script element.');
    } catch (e) {
      console.warn('[Flow Batch Automator] Failed to inject main world script tag:', e);
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Attempts to upscale generated image using Flow's native UI controls:
   * 1. Opens card 3-dots menu (⋮)
   * 2. Hovers/clicks "Download ▶"
   * 3. Locates "2K (Upscaled)"
   * 4. Arms MAIN-world interceptor to capture the 2K media buffer and suppress native download
   * 5. Saves the 2K buffer directly to the user's selected folder or sequential downloads
   * 6. Cleanly dismisses all open context menus
   */
  async function attemptUpscaleAsset(assetInfo, timeoutSeconds, baseSeqName) {
    ensureMainWorldScript();
    addLog('Upscaling enabled: Navigating Flow card menu for high-res download...', 'info');

    let upscaledAsset = null;
    const media = assetInfo.element;
    const parentCard = media ? (media.closest(state.selectors.generationCard) || media.parentElement) : null;

    if (parentCard) {
      try {
        // Bring card into center view
        try { parentCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        await sleep(300);

        // Hover over card so action buttons (heart, remix, 3-dots) appear
        const hoverOpts = { bubbles: true, cancelable: true, view: window };
        parentCard.dispatchEvent(new MouseEvent('mouseenter', hoverOpts));
        parentCard.dispatchEvent(new MouseEvent('mouseover', hoverOpts));
        parentCard.dispatchEvent(new PointerEvent('pointerover', hoverOpts));
        await sleep(350);

        // Find the 3-dots menu button (⋮) on the card
        let menuBtn = parentCard.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i], button[aria-label*="menu" i], button[aria-label*="action" i], [data-testid*="more"]');
        if (!menuBtn) {
          const cardButtons = Array.from(parentCard.querySelectorAll('button')).filter(isElementVisible);
          menuBtn = cardButtons.find((b) => {
            const label = ((b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '')).toLowerCase();
            return label.includes('more') || label.includes('menu') || label.includes('option');
          }) || cardButtons.find((b) => b.querySelector('svg circle')) || cardButtons[cardButtons.length - 1];
        }

        if (menuBtn) {
          addLog('Opening card options menu (⋮)...', 'info');
          simulateClick(menuBtn);
          await sleep(450);

          // STRICT SCOPING: Find the active context menu container that contains card actions ("Reuse prompt" / "Animate")
          // This prevents accidentally matching any sidebar or page buttons that say "Download" (which causes download.zip)
          const menuContainers = Array.from(document.querySelectorAll('[role="menu"], div, ul')).filter(isElementVisible);
          const activeCardMenu = menuContainers.find((c) => {
            const t = c.textContent || '';
            return (t.includes('Reuse prompt') || t.includes('Animate') || t.includes('Set project cover')) && t.includes('Download');
          });

          if (!activeCardMenu) {
            addLog('Card context menu container not detected.', 'warn');
          } else {
            // Find "Download" item STRICTLY inside activeCardMenu
            const cardMenuItems = Array.from(activeCardMenu.querySelectorAll('*')).filter(isElementVisible);
            const downloadItem = cardMenuItems.find((el) => {
              const t = (el.textContent || '').trim();
              return /^Download\b/i.test(t) && !t.includes('Reuse') && !t.includes('Animate');
            });

            if (downloadItem) {
              addLog('Found "Download ▶" in card menu. Opening resolution submenu...', 'info');

              // Hover & click Download item to reveal the flyout submenu
              downloadItem.focus();
              downloadItem.dispatchEvent(new MouseEvent('mouseenter', hoverOpts));
              downloadItem.dispatchEvent(new MouseEvent('mouseover', hoverOpts));
              downloadItem.dispatchEvent(new PointerEvent('pointerover', hoverOpts));
              downloadItem.dispatchEvent(new PointerEvent('pointermove', hoverOpts));
              simulateClick(downloadItem);
              downloadItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39, bubbles: true }));
              await sleep(450);

              // Poll briefly to locate "2K (Upscaled)" in the flyout submenu
              let opt2K = null;
              let opt1K = null;

              for (let attempt = 0; attempt < 6; attempt++) {
                const candidates = Array.from(document.querySelectorAll('*')).filter(isElementVisible);

                opt2K = candidates.find((el) => {
                  const t = (el.textContent || '').trim();
                  return /\b2K\b/i.test(t) && /upscaled/i.test(t) && !/upgrade/i.test(t) && !/\b1K\b/i.test(t);
                });

                if (opt2K) break;

                opt1K = candidates.find((el) => {
                  const t = (el.textContent || '').trim();
                  return /\b1K\b/i.test(t) && /original/i.test(t) && !/\b2K\b/i.test(t);
                });

                // Re-trigger hover/click on downloadItem if flyout didn't mount yet
                downloadItem.dispatchEvent(new MouseEvent('mouseenter', hoverOpts));
                downloadItem.dispatchEvent(new MouseEvent('mouseover', hoverOpts));
                downloadItem.dispatchEvent(new PointerEvent('pointerover', hoverOpts));
                simulateClick(downloadItem);
                await sleep(350);
              }

              const targetResolution = opt2K || opt1K;

              if (targetResolution) {
                const label = opt2K ? '2K (Upscaled)' : '1K (Original size)';
                addLog(`Found resolution item "${label}". Preparing capture...`, 'info');

                const targetFolder = state.directoryHandle ? state.directoryHandle.name : state.folderName;

                // 1. Arm MAIN-world interceptor promise BEFORE clicking
                const capturePromise = waitForMainWorldUpscale(25000);
                window.postMessage({ source: 'FBA_ISOLATED', action: 'ARM_UPSCALE_CAPTURE' }, '*');

                // 2. Also arm background rename as fallback in case native download slips through
                chrome.runtime.sendMessage({
                  action: 'ARM_NATIVE_RENAME',
                  folder: targetFolder,
                  baseName: baseSeqName,
                  ext: 'jpg'
                });

                const captureStartTime = Date.now();

                // 3. Click the 2K resolution item
                const clickable = targetResolution.closest('button, [role="menuitem"], div[role="menuitem"]') || targetResolution;
                clickable.focus();
                simulateClick(clickable);

                addLog(`Clicked "${label}". Capturing high-resolution media...`, 'info');

                // 4. Wait for MAIN world interceptor to capture the media buffer
                const captured = await capturePromise;

                if (captured && captured.buffer) {
                  const ext = (captured.mimeType && captured.mimeType.includes('png')) ? 'png' : 'jpg';
                  const sizeKb = Math.round(captured.size / 1024);

                  if (state.directoryHandle) {
                    // DIRECT SAVE TO LOCAL FOLDER VIA FILE SYSTEM ACCESS API
                    const hasPerm = await verifyDirectoryPermission(state.directoryHandle, true);
                    if (hasPerm) {
                      const uniqueFilename = await getUniqueFilenameInDir(state.directoryHandle, baseSeqName, ext);
                      const fileHandle = await state.directoryHandle.getFileHandle(uniqueFilename, { create: true });
                      const writable = await fileHandle.createWritable();
                      await writable.write(new Blob([captured.buffer], { type: captured.mimeType }));
                      await writable.close();

                      addLog(`✓ Saved ${uniqueFilename} (${sizeKb} KB, ${label}) directly into "${state.directoryHandle.name}"`, 'success');
                      upscaledAsset = { nativeDownloaded: true, filename: uniqueFilename, success: true };
                    }
                  } else {
                    // SAVE VIA CHROME DOWNLOADS (Sequential name in folder)
                    const blob = new Blob([captured.buffer], { type: captured.mimeType });
                    const dataUrl = await blobToDataUrl(blob);
                    const targetFilename = `${state.folderName}/${baseSeqName}.${ext}`;

                    const dlRes = await new Promise((res) => {
                      chrome.runtime.sendMessage({
                        action: 'DOWNLOAD_ASSET',
                        url: dataUrl,
                        filename: targetFilename
                      }, res);
                    });

                    if (dlRes && dlRes.success) {
                      addLog(`✓ Downloaded ${targetFilename} (${sizeKb} KB, ${label}) via Chrome Downloads`, 'success');
                      upscaledAsset = { nativeDownloaded: true, filename: targetFilename, success: true };
                    }
                  }
                } else {
                  // Fallback: Check if background intercepted a native download
                  addLog('Direct capture timed out, checking background download fallback...', 'info');
                  const bgRes = await new Promise((res) => {
                    chrome.runtime.sendMessage({
                      action: 'WAIT_FOR_NATIVE_DOWNLOAD_COMPLETE',
                      startTime: captureStartTime,
                      timeoutMs: 10000
                    }, res);
                  });

                  if (bgRes && bgRes.success && bgRes.download) {
                    addLog(`✓ High-res download completed via background: ${bgRes.download.filename || baseSeqName}`, 'success');
                    upscaledAsset = { nativeDownloaded: true, filename: bgRes.download.filename || baseSeqName, success: true };
                  }
                }
              } else {
                addLog('Flyout submenu did not reveal 2K option.', 'warn');
              }
            } else {
              addLog('"Download" item not found inside card context menu.', 'warn');
            }
          }
        }
      } catch (upscaleErr) {
        console.warn('[Flow Batch Automator] Native upscale navigation error:', upscaleErr);
      } finally {
        // Disarm MAIN world if still armed
        window.postMessage({ source: 'FBA_ISOLATED', action: 'DISARM_UPSCALE_CAPTURE' }, '*');

        // Cleanly dismiss any open menus (Escape key + body click)
        try {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
          await sleep(150);
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
          await sleep(100);
          document.body.click();
        } catch (e) {}
      }
    }

    if (upscaledAsset) {
      return upscaledAsset;
    }

    // Google CDN Master Resolution URL Transform (=s0)
    const masterUrl = enhanceHighResUrl(assetInfo.url);
    if (masterUrl !== assetInfo.url) {
      addLog('✓ Transformed URL to master uncompressed resolution (=s0).', 'success');
      assetInfo.url = masterUrl;
    } else {
      addLog('Could not capture upscale menu item. Saving detected asset.', 'info');
    }

    return assetInfo;
  }

  function determineExtension(assetInfo) {
    const { url, type, element } = assetInfo;

    if (element instanceof HTMLVideoElement || type === 'video' || url.includes('.mp4') || url.includes('video/mp4')) {
      return 'mp4';
    }
    if (url.includes('.webp') || url.startsWith('data:image/webp')) {
      return 'webp';
    }
    if (url.includes('.jpg') || url.includes('.jpeg') || url.startsWith('data:image/jpeg')) {
      return 'jpg';
    }
    return 'png';
  }

  /**
   * Saves generated asset directly into the user's selected folder via File System Access API
   * (with automatic filename collision incrementing) or falls back to chrome.downloads.
   */
  async function saveAssetToDisk(assetInfo, baseSeqName, ext) {
    if (state.directoryHandle) {
      try {
        const hasPerm = await verifyDirectoryPermission(state.directoryHandle, true);
        if (hasPerm) {
          addLog(`Direct saving ${baseSeqName}.${ext} to "${state.directoryHandle.name}"...`, 'info');

          // Fetch binary blob
          let finalUrl = await resolveAssetUrl(assetInfo.url);
          if (state.autoUpscale && assetInfo.type === 'image') {
            finalUrl = enhanceHighResUrl(finalUrl);
          }
          const blobRes = await fetch(finalUrl);
          if (!blobRes.ok) {
            throw new Error(`Failed to fetch media data: HTTP ${blobRes.status}`);
          }
          const blobData = await blobRes.blob();

          // Auto-increment filename if already exists (scene_001.png -> scene_001_1.png)
          const targetFilename = await getUniqueFilenameInDir(state.directoryHandle, baseSeqName, ext);
          if (targetFilename !== `${baseSeqName}.${ext}`) {
            addLog(`"${baseSeqName}.${ext}" already exists. Saving as "${targetFilename}" instead.`, 'info');
          }

          // Write directly to local disk without browser popups
          const fileHandle = await state.directoryHandle.getFileHandle(targetFilename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blobData);
          await writable.close();

          addLog(`✓ Direct save complete: ${targetFilename} (Saved into "${state.directoryHandle.name}")`, 'success');
          return { success: true, method: 'direct', filename: targetFilename };
        } else {
          addLog(`Write permission not granted for folder "${state.directoryHandle.name}". Falling back to Chrome Downloads.`, 'warn');
        }
      } catch (err) {
        console.error('[Flow Batch Automator] Direct folder save failed:', err);
        addLog(`Direct save error: ${err.message}. Falling back to Chrome Downloads...`, 'warn');
      }
    }

    // Fallback: chrome.downloads pipeline
    const fallbackFilename = `${state.folderName}/${baseSeqName}.${ext}`;
    addLog(`Downloading via Chrome Downloads: ${fallbackFilename}...`, 'info');
    let finalUrl = await resolveAssetUrl(assetInfo.url);
    if (state.autoUpscale && assetInfo.type === 'image') {
      finalUrl = enhanceHighResUrl(finalUrl);
    }

    return new Promise((resolveDownload, rejectDownload) => {
      chrome.runtime.sendMessage(
        {
          action: 'DOWNLOAD_ASSET',
          url: finalUrl,
          filename: fallbackFilename
        },
        (response) => {
          if (chrome.runtime.lastError) {
            return rejectDownload(new Error(chrome.runtime.lastError.message));
          }
          if (response && response.success) {
            addLog(`✓ Download started: ${fallbackFilename} (ID: ${response.downloadId})`, 'success');
            resolveDownload({ success: true, method: 'chrome.downloads', filename: fallbackFilename });
          } else {
            rejectDownload(new Error(response?.error || 'Unknown download error'));
          }
        }
      );
    });
  }

  /* ==========================================================================
     EXECUTION QUEUE LOOP
     ========================================================================== */
  async function runBatchQueue() {
    const prompts = parsePrompts();
    if (prompts.length === 0) {
      alert('Please enter at least one prompt in the queue.');
      return;
    }

    state.delaySeconds = isNaN(parseInt(el.delayInput.value, 10)) ? 15 : Math.max(0, parseInt(el.delayInput.value, 10));
    state.timeoutSeconds = parseInt(el.timeoutInput.value, 10) || 90;
    state.prefix = el.prefixInput.value || 'scene_';
    state.startIndex = parseInt(el.startIndexInput.value, 10) || 1;
    state.paddingDigits = parseInt(el.paddingInput.value, 10) || 3;
    state.folderName = el.folderInput.value || 'flow_batch_generations';
    state.selectedModel = el.modelSelect.value;
    state.pauseOnError = el.pauseOnError.checked;
    state.autoScroll = el.autoScroll.checked;
    state.autoUpscale = el.autoUpscale ? el.autoUpscale.checked : false;

    state.isRunning = true;
    state.isPaused = false;
    state.isCancelled = false;
    state.totalCount = prompts.length;

    updateUIState('running');
    if (state.directoryHandle) {
      addLog(`Starting Batch Queue with ${state.totalCount} prompts. Saving directly to "${state.directoryHandle.name}".`, 'info');
    } else {
      addLog(`Starting Batch Queue with ${state.totalCount} prompts. Saving to Chrome Downloads: "${state.folderName}".`, 'info');
    }

    await ensureTargetModel(state.selectedModel);

    for (let i = 0; i < state.totalCount; i++) {
      state.currentIndex = i;

      if (state.isCancelled) {
        addLog('Queue cancelled by user.', 'warn');
        break;
      }

      while (state.isPaused && !state.isCancelled) {
        updateUIState('paused');
        el.statusDetailText.textContent = `Queue paused at prompt ${i + 1} of ${state.totalCount}.`;
        await sleep(500);
      }

      if (state.isCancelled) break;
      updateUIState('running');

      const promptText = prompts[i];
      const assetSequenceNum = state.startIndex + i;
      const paddedNum = String(assetSequenceNum).padStart(state.paddingDigits, '0');

      updateProgress(i, state.totalCount, `[${i + 1}/${state.totalCount}] Submitting prompt: "${promptText.substring(0, 30)}..."`);
      addLog(`[${i + 1}/${state.totalCount}] Processing "${promptText.substring(0, 40)}..."`, 'info');

      try {
        const promptInput = findPromptInput();
        if (!promptInput) {
          throw new Error('Flow prompt input element not found. Verify selector in settings.');
        }

        const existingUrls = getExistingMediaUrls();

        // 1. Focus Flow's prompt box (real keystrokes go to the focused element)
        promptInput.focus();
        await sleep(150);

        // 2. Type prompt + press Enter using trusted keyboard input
        const res = await chrome.runtime.sendMessage({ action: 'TRUSTED_SUBMIT', text: promptText });
        if (!res || !res.success) {
          throw new Error('Typing failed: ' + (res && res.error ? res.error : 'no response'));
        }
        addLog(`Typed prompt #${i + 1} and pressed Enter.`, 'info');

        addLog(`Submitted prompt #${i + 1}. Waiting for Flow to generate asset...`, 'info');
        updateProgress(i, state.totalCount, `Generating ${state.prefix}${paddedNum} (timeout ${state.timeoutSeconds}s)...`);

        // 5. Observe generation completion
        let assetInfo = await waitForGenerationOutput(existingUrls, state.timeoutSeconds);

        const baseSeqName = `${state.prefix}${paddedNum}`;

        // Optional: Auto-upscale step for images
        if (state.autoUpscale && assetInfo.type === 'image') {
          assetInfo = await attemptUpscaleAsset(assetInfo, state.timeoutSeconds, baseSeqName);
        }

        // If native 2K download already handled the disk save, skip redundant saveAssetToDisk
        if (assetInfo && assetInfo.nativeDownloaded) {
          addLog(`✓ Asset #${i + 1} completed and saved: ${assetInfo.filename}`, 'success');
        } else {
          const ext = determineExtension(assetInfo);
          // Save directly to folder without popups (or fallback to chrome.downloads)
          await saveAssetToDisk(assetInfo, baseSeqName, ext);
        }

      } catch (err) {
        console.error('[Flow Batch Automator] Error processing prompt:', err);
        addLog(`❌ Error on prompt #${i + 1}: ${err.message}`, 'error');

        if (state.pauseOnError) {
          state.isPaused = true;
          addLog('Queue paused due to error (Pause on failure enabled).', 'warn');
          while (state.isPaused && !state.isCancelled) {
            updateUIState('paused');
            await sleep(500);
          }
          if (state.isCancelled) break;
        }
      }

      if (i < state.totalCount - 1 && !state.isCancelled) {
        await runCooldownTimer(state.delaySeconds, i + 1, state.totalCount);
      }
    }

    state.isRunning = false;
    state.isPaused = false;
    chrome.runtime.sendMessage({ action: 'DETACH_DEBUGGER' });
    updateProgress(state.totalCount, state.totalCount, state.isCancelled ? 'Queue cancelled.' : 'Batch completed successfully!');
    updateUIState(state.isCancelled ? 'idle' : 'completed');
    addLog(state.isCancelled ? 'Queue stopped.' : 'All batch prompts completed!', 'success');
  }

  async function runCooldownTimer(seconds, nextIndex, total) {
    if (!seconds || seconds <= 0) return;
    state.cooldownRemaining = seconds;
    el.timerIndicator.style.display = 'inline-block';

    while (state.cooldownRemaining > 0 && !state.isCancelled) {
      if (state.isPaused) {
        updateUIState('paused');
        await sleep(500);
        continue;
      }

      el.timerIndicator.textContent = `${state.cooldownRemaining}s`;
      el.statusDetailText.textContent = `Cooldown delay: ${state.cooldownRemaining}s before next prompt (${nextIndex + 1}/${total})...`;
      await sleep(1000);
      state.cooldownRemaining--;
    }

    el.timerIndicator.style.display = 'none';
  }

  /* ==========================================================================
     UI CONTROLS & EVENT LISTENERS
     ========================================================================== */
  el.startBtn.addEventListener('click', async () => {
    if (state.isRunning) return;

    // Prompt user to pick folder if none is selected yet
    if (!state.directoryHandle && typeof window.showDirectoryPicker === 'function') {
      addLog('No destination folder selected. Please choose a folder on your computer...', 'info');
      await promptPickDirectory();
    } else if (state.directoryHandle) {
      // Re-verify permission under the current user click gesture
      try {
        const perm = await state.directoryHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          const req = await state.directoryHandle.requestPermission({ mode: 'readwrite' });
          if (req === 'granted') {
            updateFolderUI('active');
          }
        }
      } catch (e) {}
    }

    runBatchQueue();
  });

  el.pauseBtn.addEventListener('click', () => {
    if (!state.isRunning) return;
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
      updateUIState('paused');
      addLog('Queue paused by user.', 'warn');
    } else {
      updateUIState('running');
      addLog('Queue resumed.', 'info');
    }
  });

  el.cancelBtn.addEventListener('click', () => {
    if (!state.isRunning) return;
    if (confirm('Cancel and halt current batch queue?')) {
      state.isCancelled = true;
      state.isRunning = false;
      state.isPaused = false;
      updateUIState('idle');
      addLog('Queue cancellation requested.', 'warn');
    }
  });

  function updateUIState(status) {
    el.statusBadge.className = `fba-badge ${status}`;
    el.statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);

    if (status === 'running') {
      el.pulseIndicator.className = 'fba-pulse-badge running';
      el.startBtn.disabled = true;
      el.pauseBtn.disabled = false;
      el.pauseBtn.textContent = 'Pause';
      el.cancelBtn.disabled = false;
      el.promptsInput.disabled = true;
    } else if (status === 'paused') {
      el.pulseIndicator.className = 'fba-pulse-badge running';
      el.startBtn.disabled = true;
      el.pauseBtn.disabled = false;
      el.pauseBtn.textContent = 'Resume';
      el.cancelBtn.disabled = false;
      el.promptsInput.disabled = true;
    } else {
      el.pulseIndicator.className = 'fba-pulse-badge';
      el.startBtn.disabled = false;
      el.pauseBtn.disabled = true;
      el.pauseBtn.textContent = 'Pause';
      el.cancelBtn.disabled = true;
      el.promptsInput.disabled = false;
      el.timerIndicator.style.display = 'none';
    }
  }

  function updateProgress(current, total, detail) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    el.progressBar.style.width = `${percent}%`;
    el.progressText.textContent = `Processing ${current} of ${total} (${percent}%)`;
    if (detail) el.statusDetailText.textContent = detail;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */
  ensureMainWorldScript();
  loadSettings();
  initSavedDirectory();
})();
