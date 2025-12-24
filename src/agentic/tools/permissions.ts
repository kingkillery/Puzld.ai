// Permission system for tool execution

import { isSubPath, getDirectory, normalizePath } from '../../lib/paths';

export type PermissionAction = 'read' | 'write' | 'execute';

export type PermissionDecision =
  | 'allow'           // Allow this specific action
  | 'allow_dir'       // Allow all in this directory
  | 'allow_all'       // Allow all of this type
  | 'deny'            // Deny this action
  | 'cancel';         // Cancel the entire operation

export interface PermissionRequest {
  action: PermissionAction;
  tool: string;
  path?: string;
  command?: string;
  description: string;
}

export interface PermissionResult {
  decision: PermissionDecision;
  /** For 'allow_dir' - the directory to auto-approve */
  allowedDir?: string;
}

export type PermissionHandler = (request: PermissionRequest) => Promise<PermissionResult>;

/**
 * Tracks auto-approved permissions during a session
 */
export class PermissionTracker {
  private allowedReadDirs: Set<string> = new Set();
  private allowedWriteDirs: Set<string> = new Set();
  private allowAllReads: boolean = false;
  private allowAllWrites: boolean = false;
  private allowAllExecute: boolean = false;

  /**
   * Check if an action is already auto-approved
   * Uses cross-platform path comparison to handle Windows/Unix differences
   */
  isAutoApproved(action: PermissionAction, path?: string): boolean {
    if (action === 'read') {
      if (this.allowAllReads) return true;
      if (path) {
        for (const dir of this.allowedReadDirs) {
          // Use isSubPath for proper cross-platform comparison
          // Handles: C:\foo vs c:/foo, trailing slashes, case sensitivity
          if (isSubPath(path, dir)) return true;
        }
      }
    }
    if (action === 'write') {
      if (this.allowAllWrites) return true;
      if (path) {
        for (const dir of this.allowedWriteDirs) {
          // Use isSubPath for proper cross-platform comparison
          if (isSubPath(path, dir)) return true;
        }
      }
    }
    if (action === 'execute') {
      return this.allowAllExecute;
    }
    return false;
  }

  /**
   * Record an approval decision for future auto-approval
   * Normalizes paths for consistent cross-platform storage
   */
  recordApproval(action: PermissionAction, decision: PermissionDecision, path?: string): void {
    if (decision === 'allow_all') {
      if (action === 'read') this.allowAllReads = true;
      if (action === 'write') this.allowAllWrites = true;
      if (action === 'execute') this.allowAllExecute = true;
    }
    if (decision === 'allow_dir' && path) {
      // Use getDirectory for cross-platform directory extraction
      // Handles both forward and backslash separators
      const dir = normalizePath(getDirectory(path));
      if (action === 'read') this.allowedReadDirs.add(dir);
      if (action === 'write') this.allowedWriteDirs.add(dir);
    }
  }

  /**
   * Reset all permissions
   */
  reset(): void {
    this.allowedReadDirs.clear();
    this.allowedWriteDirs.clear();
    this.allowAllReads = false;
    this.allowAllWrites = false;
    this.allowAllExecute = false;
  }
}

// Singleton tracker for the session
export const permissionTracker = new PermissionTracker();
