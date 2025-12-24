# Task: Git-Aware Mode Implementation

## Assignee
Agent 3

## Priority
Could (from Backlog S)

## Objective
Add explicit git integration beyond shell-only git commands, enabling git-aware workflows for diffing, committing, and undoing changes.

## Context
From the discovery document:
- Section H (Integration Inventory): "Git (TBD): currently likely implicit via shell; consider explicit git integration"
- Section T (UX Copy): "For file edits: suggest 'restore from git' when available and keep a session log of applied diffs"
- Currently git is only accessible via `bash` tool, which requires explicit permission approval

## Deliverables

### 1. Git Utility Module (`src/lib/git.ts`)
Create a git helper that wraps common operations:
```typescript
// src/lib/git.ts
export interface GitStatus {
  isRepo: boolean;
  branch: string;
  isDirty: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitDiff {
  file: string;
  hunks: string;
  additions: number;
  deletions: number;
}

export async function getGitStatus(cwd: string): Promise<GitStatus>;
export async function getGitDiff(cwd: string, file?: string): Promise<GitDiff[]>;
export async function stageFile(cwd: string, file: string): Promise<void>;
export async function unstageFile(cwd: string, file: string): Promise<void>;
export async function commit(cwd: string, message: string): Promise<string>; // returns commit hash
export async function restoreFile(cwd: string, file: string): Promise<void>; // git checkout -- file
export async function getFileAtCommit(cwd: string, file: string, commit: string): Promise<string>;
export async function isGitRepo(cwd: string): Promise<boolean>;
```

### 2. Git Tool for Agentic Loop (`src/agentic/tools/git.ts`)
Add a new agentic tool with sub-commands:
```typescript
// Tool: git
// Permission category: "git" (new category, or reuse "exec" with less friction)

interface GitToolArgs {
  action: 'status' | 'diff' | 'stage' | 'unstage' | 'commit' | 'restore' | 'show';
  file?: string;
  message?: string;  // for commit
  commit?: string;   // for show
}
```

Features:
- [ ] `git status` - Show repo state (no approval needed - read-only)
- [ ] `git diff` - Show unstaged changes (no approval needed)
- [ ] `git stage <file>` - Stage a file (write permission)
- [ ] `git unstage <file>` - Unstage a file (write permission)
- [ ] `git commit -m "<message>"` - Commit staged changes (write permission)
- [ ] `git restore <file>` - Discard changes to file (write permission + confirmation)
- [ ] `git show <commit>:<file>` - Show file at commit (read-only)

### 3. Undo Integration
Enhance the permission/diff preview system:
- [ ] After an edit is applied, offer "restore from git" if file was clean before
- [ ] Track which files were modified in session for potential rollback
- [ ] Add `--undo-last-edit` or similar CLI flag/command

### 4. Git Context Injection
Enhance context manager to include git info:
- [ ] Current branch name in system prompt
- [ ] Dirty file list (if relevant to task)
- [ ] Recent commit messages (optional, for context)

### 5. Register Tool & Update Docs
- [ ] Add `git` to tool registry in `src/agentic/tools/index.ts`
- [ ] Add tool alias normalization for git-related names
- [ ] Update CLAUDE.md / tool documentation

## Files to Create/Modify
- NEW: `src/lib/git.ts` - Git utility functions
- NEW: `src/lib/git.test.ts` - Git utility tests
- NEW: `src/agentic/tools/git.ts` - Git agentic tool
- MODIFY: `src/agentic/tools/index.ts` - Register git tool
- MODIFY: `src/agentic/tools/permissions.ts` - Add git permission category (if needed)
- MODIFY: `src/agentic/agent-loop.ts` - Handle git tool calls
- MODIFY: Context manager (if exists) - Inject git context

## Permission Model for Git Tool

| Action | Permission | Approval Required |
|--------|-----------|-------------------|
| status | read | No (read-only) |
| diff | read | No (read-only) |
| show | read | No (read-only) |
| stage | write | Yes, unless "allow all writes" |
| unstage | write | Yes, unless "allow all writes" |
| commit | write | Yes, always show message preview |
| restore | write | Yes, always (destructive) |

## Success Criteria
1. Git tool works in agentic loop for common operations
2. `git status` and `git diff` work without prompts (read-only)
3. `git commit` shows message preview before execution
4. `git restore` warns about data loss and requires confirmation
5. Session tracks modified files for potential rollback
6. Tests cover basic git operations

## References
- Current bash tool: `src/agentic/tools/bash.ts`
- Tool registry: `src/agentic/tools/index.ts`
- Section H in discovery doc (Integration Inventory)
- Section T in discovery doc (UX Copy & Interaction Rules)

## Notes
- Use `simple-git` npm package if available, or spawn `git` directly
- Handle "not a git repo" gracefully
- Consider `.gitignore` awareness for file listings
- Don't reinvent git - just provide convenient wrappers for agentic use
