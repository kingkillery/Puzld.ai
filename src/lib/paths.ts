/**
 * Cross-Platform Path Utilities
 *
 * Centralized path handling for consistent Windows/Unix compatibility.
 * Addresses common issues:
 * - Backslash vs forward slash inconsistencies (C:\foo vs C:/foo)
 * - Case sensitivity (Windows is case-insensitive)
 * - Trailing slash handling
 * - Drive letter normalization
 */

import { resolve, normalize } from 'path';

/** Check if running on Windows */
const IS_WINDOWS = process.platform === 'win32';

/**
 * Normalize a path to a consistent format:
 * - Resolves to absolute path
 * - Uses forward slashes on all platforms
 * - Removes trailing slashes (except root)
 * - Lowercases drive letters on Windows
 *
 * @example
 * normalizePath('C:\\Users\\foo\\bar')  // 'C:/Users/foo/bar'
 * normalizePath('c:/users/foo/')        // 'c:/users/foo'
 */
export function normalizePath(p: string): string {
  if (!p) return '';

  // Resolve to absolute and normalize
  let normalized = normalize(resolve(p));

  // Convert backslashes to forward slashes
  normalized = toForwardSlash(normalized);

  // Remove trailing slash (but keep root like 'C:/' or '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    // Check if it's a drive root like 'C:/'
    if (!(IS_WINDOWS && /^[a-zA-Z]:\/$/.test(normalized))) {
      normalized = normalized.slice(0, -1);
    }
  }

  // Normalize drive letter to lowercase on Windows for consistent comparison
  if (IS_WINDOWS && /^[A-Z]:/.test(normalized)) {
    normalized = normalized[0].toLowerCase() + normalized.slice(1);
  }

  return normalized;
}

/**
 * Convert all backslashes to forward slashes
 */
export function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Convert to platform-native path separators
 */
export function toPlatformPath(p: string): string {
  if (IS_WINDOWS) {
    return p.replace(/\//g, '\\');
  }
  return p.replace(/\\/g, '/');
}

/**
 * Check if two paths are equal (handles cross-platform differences)
 * - Case-insensitive on Windows
 * - Normalizes both paths before comparison
 *
 * @example
 * pathsEqual('C:\\foo\\bar', 'c:/foo/bar')  // true on Windows
 * pathsEqual('/foo/bar', '/foo/bar/')       // true
 */
export function pathsEqual(a: string, b: string): boolean {
  const normalizedA = normalizePath(a);
  const normalizedB = normalizePath(b);

  if (IS_WINDOWS) {
    return normalizedA.toLowerCase() === normalizedB.toLowerCase();
  }

  return normalizedA === normalizedB;
}

/**
 * Check if child path is inside parent path (or equals it)
 * Safe replacement for path.startsWith() which doesn't handle:
 * - Mixed separators
 * - Case sensitivity on Windows
 * - Partial directory name matches (e.g., /foo/bar vs /foo/barbaz)
 *
 * @example
 * isSubPath('/foo/bar/baz', '/foo/bar')      // true
 * isSubPath('/foo/barbaz', '/foo/bar')       // false (not a subdirectory)
 * isSubPath('C:\\Users\\foo', 'c:/users')    // true on Windows
 */
export function isSubPath(child: string, parent: string): boolean {
  const normalizedChild = normalizePath(child);
  const normalizedParent = normalizePath(parent);

  // Use case-insensitive comparison on Windows
  const childLower = IS_WINDOWS ? normalizedChild.toLowerCase() : normalizedChild;
  const parentLower = IS_WINDOWS ? normalizedParent.toLowerCase() : normalizedParent;

  // Exact match
  if (childLower === parentLower) {
    return true;
  }

  // Check if child starts with parent + '/'
  // This prevents false positives like /foo/bar matching /foo/barbaz
  const parentWithSep = parentLower.endsWith('/') ? parentLower : parentLower + '/';
  return childLower.startsWith(parentWithSep);
}

/**
 * Get the directory portion of a path, handling both separators
 */
export function getDirectory(p: string): string {
  const normalized = normalizePath(p);
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash === -1) {
    return '.';
  }

  // Handle root paths
  if (lastSlash === 0) {
    return '/';
  }

  // Handle Windows drive root
  if (IS_WINDOWS && lastSlash === 2 && /^[a-z]:$/i.test(normalized.slice(0, 2))) {
    return normalized.slice(0, 3); // Include the slash for 'C:/'
  }

  return normalized.slice(0, lastSlash);
}

/**
 * Join path segments using forward slashes
 */
export function joinPaths(...segments: string[]): string {
  if (segments.length === 0) return '';

  // Filter out empty segments
  const filtered = segments.filter(s => s && s.length > 0);
  if (filtered.length === 0) return '';

  // Normalize each segment and join
  const result = filtered
    .map((s, i) => {
      let part = toForwardSlash(s);
      // Remove leading slash from non-first segments
      if (i > 0 && part.startsWith('/')) {
        part = part.slice(1);
      }
      // Remove trailing slash from non-last segments
      if (i < filtered.length - 1 && part.endsWith('/')) {
        part = part.slice(0, -1);
      }
      return part;
    })
    .join('/');

  return normalizePath(result);
}

/**
 * Check if a path is absolute
 */
export function isAbsolutePath(p: string): boolean {
  const normalized = toForwardSlash(p);

  // Unix absolute path
  if (normalized.startsWith('/')) {
    return true;
  }

  // Windows absolute path (drive letter)
  if (/^[a-zA-Z]:/.test(normalized)) {
    return true;
  }

  // UNC path
  if (normalized.startsWith('//')) {
    return true;
  }

  return false;
}

/**
 * Make a path relative to a base directory
 */
export function relativePath(from: string, to: string): string {
  const normalizedFrom = normalizePath(from);
  const normalizedTo = normalizePath(to);

  // Use case-insensitive comparison on Windows
  const fromLower = IS_WINDOWS ? normalizedFrom.toLowerCase() : normalizedFrom;
  const toLower = IS_WINDOWS ? normalizedTo.toLowerCase() : normalizedTo;

  // If to starts with from, just strip it
  if (toLower.startsWith(fromLower)) {
    let relative = normalizedTo.slice(normalizedFrom.length);
    if (relative.startsWith('/')) {
      relative = relative.slice(1);
    }
    return relative || '.';
  }

  // Otherwise use Node's path.relative equivalent
  const fromParts = normalizedFrom.split('/');
  const toParts = normalizedTo.split('/');

  // Find common prefix
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    const a = IS_WINDOWS ? fromParts[i].toLowerCase() : fromParts[i];
    const b = IS_WINDOWS ? toParts[i].toLowerCase() : toParts[i];
    if (a !== b) break;
    commonLength++;
  }

  // Build relative path
  const upCount = fromParts.length - commonLength;
  const downParts = toParts.slice(commonLength);

  const relativeParts = [
    ...Array(upCount).fill('..'),
    ...downParts
  ];

  return relativeParts.join('/') || '.';
}

/**
 * Check if we're running on Windows
 */
export function isWindows(): boolean {
  return IS_WINDOWS;
}
