/**
 * Trusted Directory System
 *
 * Security gate requiring user confirmation before operating in a new directory.
 * Similar to Claude Code, Gemini CLI, OpenCode, Crush CLI.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { homedir } from 'os';

export interface TrustConfig {
  trusted: string[];
  denied: string[];
}

const CONFIG_DIR = join(homedir(), '.puzldai');
const TRUST_FILE = join(CONFIG_DIR, 'trusted-dirs.json');

/**
 * Load trust configuration from disk
 */
export function loadTrustConfig(): TrustConfig {
  try {
    if (existsSync(TRUST_FILE)) {
      const content = readFileSync(TRUST_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Ignore errors, return default
  }
  return { trusted: [], denied: [] };
}

/**
 * Save trust configuration to disk
 */
export function saveTrustConfig(config: TrustConfig): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(TRUST_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Failed to save trust config:', err);
  }
}

/**
 * Check if a path matches a pattern (supports * wildcard for subdirs)
 */
function matchesPattern(path: string, pattern: string): boolean {
  const normalizedPath = resolve(path);
  const normalizedPattern = resolve(pattern.replace(/\/\*$/, ''));

  // Exact match
  if (normalizedPath === normalizedPattern) {
    return true;
  }

  // Wildcard match (pattern ends with /*)
  if (pattern.endsWith('/*')) {
    return normalizedPath.startsWith(normalizedPattern + '/');
  }

  return false;
}

/**
 * Check if a directory is trusted
 */
export function isDirectoryTrusted(directory: string): boolean {
  const config = loadTrustConfig();
  const normalizedDir = resolve(directory);

  // Check denied list first
  for (const pattern of config.denied) {
    if (matchesPattern(normalizedDir, pattern)) {
      return false;
    }
  }

  // Check trusted list
  for (const pattern of config.trusted) {
    if (matchesPattern(normalizedDir, pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Trust a directory
 */
export function trustDirectory(directory: string, includeSubdirs = false): void {
  const config = loadTrustConfig();
  const normalizedDir = resolve(directory);
  const entry = includeSubdirs ? `${normalizedDir}/*` : normalizedDir;

  // Remove from denied if present
  config.denied = config.denied.filter(d => !matchesPattern(normalizedDir, d));

  // Add to trusted if not already present
  if (!config.trusted.some(t => matchesPattern(normalizedDir, t))) {
    config.trusted.push(entry);
  }

  saveTrustConfig(config);
}

/**
 * Untrust a directory
 */
export function untrustDirectory(directory: string): void {
  const config = loadTrustConfig();
  const normalizedDir = resolve(directory);

  // Remove from trusted
  config.trusted = config.trusted.filter(t => {
    const pattern = t.replace(/\/\*$/, '');
    return resolve(pattern) !== normalizedDir;
  });

  saveTrustConfig(config);
}

/**
 * Deny a directory (explicitly block)
 */
export function denyDirectory(directory: string): void {
  const config = loadTrustConfig();
  const normalizedDir = resolve(directory);

  // Remove from trusted
  config.trusted = config.trusted.filter(t => !matchesPattern(normalizedDir, t));

  // Add to denied if not already present
  if (!config.denied.includes(normalizedDir)) {
    config.denied.push(normalizedDir);
  }

  saveTrustConfig(config);
}

/**
 * Get list of trusted directories
 */
export function getTrustedDirectories(): string[] {
  const config = loadTrustConfig();
  return config.trusted;
}

/**
 * Get list of denied directories
 */
export function getDeniedDirectories(): string[] {
  const config = loadTrustConfig();
  return config.denied;
}

/**
 * Get parent directory path
 */
export function getParentDirectory(directory: string): string {
  return dirname(resolve(directory));
}

/**
 * Clear all trust settings
 */
export function clearTrustSettings(): void {
  saveTrustConfig({ trusted: [], denied: [] });
}
