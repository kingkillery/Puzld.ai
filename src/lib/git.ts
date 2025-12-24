/**
 * Git utility functions for agentic workflows
 * Wraps common git operations for use by the agentic loop
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const GIT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Git repository status information
 */
export interface GitStatus {
  isRepo: boolean;
  branch: string;
  isDirty: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

/**
 * Git diff information for a file
 */
export interface GitDiff {
  file: string;
  hunks: string;
  additions: number;
  deletions: number;
}

/**
 * Execute a git command and return stdout
 */
async function gitExec(cwd: string, args: string): Promise<string> {
  const { stdout } = await execAsync(`git ${args}`, {
    cwd,
    timeout: GIT_TIMEOUT_MS,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return stdout.trim();
}

/**
 * Check if a directory is a git repository
 */
export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    await gitExec(cwd, 'rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get comprehensive git status for a repository
 */
export async function getGitStatus(cwd: string): Promise<GitStatus> {
  const isRepo = await isGitRepo(cwd);

  if (!isRepo) {
    return {
      isRepo: false,
      branch: '',
      isDirty: false,
      staged: [],
      unstaged: [],
      untracked: [],
    };
  }

  try {
    // Get current branch
    let branch = '';
    try {
      branch = await gitExec(cwd, 'rev-parse --abbrev-ref HEAD');
    } catch {
      branch = 'HEAD'; // Detached HEAD state
    }

    // Get status with porcelain format for parsing
    const statusOutput = await gitExec(cwd, 'status --porcelain');

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    if (statusOutput) {
      const lines = statusOutput.split('\n');
      for (const line of lines) {
        if (!line) continue;

        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const filePath = line.slice(3);

        // Untracked files: ?? prefix
        if (indexStatus === '?' && workTreeStatus === '?') {
          untracked.push(filePath);
          continue;
        }

        // Staged changes (index has modification)
        if (indexStatus !== ' ' && indexStatus !== '?') {
          staged.push(filePath);
        }

        // Unstaged changes (work tree has modification)
        if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
          unstaged.push(filePath);
        }
      }
    }

    const isDirty = staged.length > 0 || unstaged.length > 0 || untracked.length > 0;

    return {
      isRepo: true,
      branch,
      isDirty,
      staged,
      unstaged,
      untracked,
    };
  } catch (err) {
    // Return minimal status on error
    return {
      isRepo: true,
      branch: '',
      isDirty: false,
      staged: [],
      unstaged: [],
      untracked: [],
    };
  }
}

/**
 * Get diff for unstaged changes, optionally filtered to a specific file
 */
export async function getGitDiff(cwd: string, file?: string): Promise<GitDiff[]> {
  const isRepo = await isGitRepo(cwd);
  if (!isRepo) return [];

  try {
    const fileArg = file ? ` -- "${file}"` : '';
    const diffOutput = await gitExec(cwd, `diff --numstat${fileArg}`);
    const diffContent = await gitExec(cwd, `diff${fileArg}`);

    const diffs: GitDiff[] = [];

    if (diffOutput) {
      const lines = diffOutput.split('\n');
      for (const line of lines) {
        if (!line) continue;
        const [additions, deletions, filePath] = line.split('\t');

        // Get hunks for this specific file
        let hunks = '';
        try {
          hunks = await gitExec(cwd, `diff -- "${filePath}"`);
        } catch {
          hunks = '';
        }

        diffs.push({
          file: filePath,
          hunks,
          additions: additions === '-' ? 0 : parseInt(additions, 10),
          deletions: deletions === '-' ? 0 : parseInt(deletions, 10),
        });
      }
    }

    return diffs;
  } catch {
    return [];
  }
}

/**
 * Get diff for staged changes
 */
export async function getStagedDiff(cwd: string, file?: string): Promise<GitDiff[]> {
  const isRepo = await isGitRepo(cwd);
  if (!isRepo) return [];

  try {
    const fileArg = file ? ` -- "${file}"` : '';
    const diffOutput = await gitExec(cwd, `diff --cached --numstat${fileArg}`);

    const diffs: GitDiff[] = [];

    if (diffOutput) {
      const lines = diffOutput.split('\n');
      for (const line of lines) {
        if (!line) continue;
        const [additions, deletions, filePath] = line.split('\t');

        // Get hunks for this specific file
        let hunks = '';
        try {
          hunks = await gitExec(cwd, `diff --cached -- "${filePath}"`);
        } catch {
          hunks = '';
        }

        diffs.push({
          file: filePath,
          hunks,
          additions: additions === '-' ? 0 : parseInt(additions, 10),
          deletions: deletions === '-' ? 0 : parseInt(deletions, 10),
        });
      }
    }

    return diffs;
  } catch {
    return [];
  }
}

/**
 * Stage a file for commit
 */
export async function stageFile(cwd: string, file: string): Promise<void> {
  await gitExec(cwd, `add "${file}"`);
}

/**
 * Unstage a file
 */
export async function unstageFile(cwd: string, file: string): Promise<void> {
  await gitExec(cwd, `reset HEAD "${file}"`);
}

/**
 * Commit staged changes with a message
 * @returns The commit hash
 */
export async function commit(cwd: string, message: string): Promise<string> {
  // Escape double quotes in the message
  const escapedMessage = message.replace(/"/g, '\\"');
  await gitExec(cwd, `commit -m "${escapedMessage}"`);

  // Get the commit hash
  const hash = await gitExec(cwd, 'rev-parse HEAD');
  return hash.slice(0, 8); // Short hash
}

/**
 * Restore a file to its last committed state (discard changes)
 * WARNING: This is destructive and cannot be undone
 */
export async function restoreFile(cwd: string, file: string): Promise<void> {
  // Try modern 'git restore' first, fall back to 'git checkout' for older git
  try {
    await gitExec(cwd, `restore "${file}"`);
  } catch {
    await gitExec(cwd, `checkout -- "${file}"`);
  }
}

/**
 * Get file contents at a specific commit
 */
export async function getFileAtCommit(
  cwd: string,
  file: string,
  commitHash: string
): Promise<string> {
  return await gitExec(cwd, `show ${commitHash}:"${file}"`);
}

/**
 * Get recent commit history
 */
export async function getRecentCommits(
  cwd: string,
  count: number = 10
): Promise<Array<{ hash: string; message: string; author: string; date: string }>> {
  const isRepo = await isGitRepo(cwd);
  if (!isRepo) return [];

  try {
    const logOutput = await gitExec(
      cwd,
      `log -${count} --pretty=format:"%h|%s|%an|%ad" --date=short`
    );

    if (!logOutput) return [];

    return logOutput.split('\n').map((line) => {
      const [hash, message, author, date] = line.split('|');
      return { hash, message, author, date };
    });
  } catch {
    return [];
  }
}

/**
 * Get the root directory of the git repository
 */
export async function getGitRoot(cwd: string): Promise<string | null> {
  try {
    return await gitExec(cwd, 'rev-parse --show-toplevel');
  } catch {
    return null;
  }
}
