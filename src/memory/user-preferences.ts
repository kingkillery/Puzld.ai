/**
 * User Preferences Persistence
 *
 * Storage for CLI settings and user preferences backed by SQLite.
 */

import { getDatabase } from './database';

export interface UserPreferences {
  // UI/Workflow Settings
  interactive?: boolean;
  sequential?: boolean;
  pick?: boolean;
  autoExecute?: boolean; // Maps to executeMode

  // Collaboration Settings
  correctFix?: boolean;
  debateRounds?: number;
  debateModerator?: string;
  consensusRounds?: number;
  consensusSynthesizer?: string;

  // Agent Settings
  currentAgent?: string;
  approvalMode?: string; // 'default' | 'plan' | 'accept' | 'yolo'
  allowAllEdits?: boolean;
}

// Prepared statements
let getPrefStmt: any | null = null;
let setPrefStmt: any | null = null;
let getAllPrefStmt: any | null = null;

function initStatements(): void {
  const db = getDatabase();
  getPrefStmt = db.prepare('SELECT value FROM user_preferences WHERE key = ?');
  setPrefStmt = db.prepare('INSERT OR REPLACE INTO user_preferences (key, value, updated_at) VALUES (?, ?, ?)');
  getAllPrefStmt = db.prepare('SELECT key, value FROM user_preferences');
}

function ensureStatements(): void {
  if (!getPrefStmt) {
    initStatements();
  }
}

/**
 * Get a single preference
 */
export function getPreference<T>(key: keyof UserPreferences, defaultValue?: T): T | undefined {
  ensureStatements();
  try {
    const row = getPrefStmt.get(key) as { value: string } | undefined;
    if (!row) return defaultValue;
    return JSON.parse(row.value) as T;
  } catch (error) {
    console.error(`Failed to get preference ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set a single preference
 */
export function setPreference<T>(key: keyof UserPreferences, value: T): void {
  ensureStatements();
  try {
    const jsonValue = JSON.stringify(value);
    setPrefStmt.run(key, jsonValue, Date.now());
  } catch (error) {
    console.error(`Failed to set preference ${key}:`, error);
  }
}

/**
 * Get all preferences
 */
export function getAllPreferences(): Partial<UserPreferences> {
  ensureStatements();
  try {
    const rows = getAllPrefStmt.all() as Array<{ key: string; value: string }>;
    const prefs: Partial<UserPreferences> = {};
    for (const row of rows) {
      try {
        // Cast key to keyof UserPreferences safely
        const key = row.key as keyof UserPreferences;
        prefs[key] = JSON.parse(row.value);
      } catch {
        // Ignore parse errors
      }
    }
    return prefs;
  } catch (error) {
    console.error('Failed to get all preferences:', error);
    return {};
  }
}
