/**
 * Centralized timeout constants (milliseconds).
 *
 * Import from here instead of hardcoding numeric literals.
 */

/** Default adapter/executor timeout – 2 minutes */
export const TIMEOUT_DEFAULT = 120_000;

/** Quick availability / version checks – 5 seconds */
export const TIMEOUT_PROBE = 5_000;

/** Audit / slower version checks – 15 seconds */
export const TIMEOUT_AUDIT = 15_000;

/** Campaign criterion validation, task output wait – 30 seconds */
export const TIMEOUT_VALIDATION = 30_000;

/** Eval judging / shell commands in eval – 1 minute */
export const TIMEOUT_EVAL = 60_000;

/** Interactive session / per-step budget – 5 minutes */
export const TIMEOUT_INTERACTIVE = 300_000;

/** Database cleanup interval – runs every 1 minute */
export const CLEANUP_INTERVAL = 60_000;

/** Max age for old tasks before deletion – 1 hour */
export const CLEANUP_MAX_AGE = 3_600_000;

/** MCP heartbeat interval – 30 seconds */
export const HEARTBEAT_INTERVAL = 30_000;

/** UI notification display – 3 seconds (default) */
export const UI_NOTIFICATION = 3_000;
