/**
 * Git tool for agentic execution
 *
 * Provides git operations with appropriate permission levels:
 * - status/diff/show: read-only, no approval needed
 * - stage/unstage/commit: write permission required
 * - restore: write permission, always confirm (destructive)
 */

import type { Tool, ToolResult } from './types';
import {
  isGitRepo,
  getGitStatus,
  getGitDiff,
  getStagedDiff,
  stageFile,
  unstageFile,
  commit,
  restoreFile,
  getFileAtCommit,
  getRecentCommits,
} from '../../lib/git';

type GitAction =
  | 'status'
  | 'diff'
  | 'staged'
  | 'stage'
  | 'unstage'
  | 'commit'
  | 'restore'
  | 'show'
  | 'log';

interface GitToolParams {
  action: GitAction;
  file?: string;
  message?: string;
  commit?: string;
  count?: number;
}

// Actions that require write permission
const WRITE_ACTIONS: GitAction[] = ['stage', 'unstage', 'commit'];

// Actions that are destructive and always need confirmation
const DESTRUCTIVE_ACTIONS: GitAction[] = ['restore'];

// Actions that are read-only
const READ_ACTIONS: GitAction[] = ['status', 'diff', 'staged', 'show', 'log'];

/**
 * Determine the permission category for a git action
 */
export function getGitActionPermission(
  action: GitAction
): 'read' | 'write' | 'destructive' {
  if (READ_ACTIONS.includes(action)) return 'read';
  if (DESTRUCTIVE_ACTIONS.includes(action)) return 'destructive';
  if (WRITE_ACTIONS.includes(action)) return 'write';
  return 'write'; // Default to write for safety
}

/**
 * Check if an action is destructive (always requires confirmation)
 */
export function isDestructiveAction(action: GitAction): boolean {
  return DESTRUCTIVE_ACTIONS.includes(action);
}

export const gitTool: Tool = {
  name: 'git',
  description: `Git operations for version control.

ACTIONS:
- status: Show repository status (branch, staged/unstaged/untracked files)
- diff [file]: Show unstaged changes (optionally for specific file)
- staged [file]: Show staged changes (optionally for specific file)
- stage <file>: Stage a file for commit
- unstage <file>: Unstage a file
- commit <message>: Commit staged changes with message
- restore <file>: Discard changes to file (DESTRUCTIVE - cannot be undone!)
- show <commit>:<file>: Show file contents at a specific commit
- log [count]: Show recent commit history (default: 10)

PERMISSIONS:
- status, diff, staged, show, log: Read-only, no approval needed
- stage, unstage, commit: Write permission required
- restore: ALWAYS requires confirmation (destructive)

EXAMPLES:
\`\`\`tool
{"name": "git", "arguments": {"action": "status"}}
\`\`\`

\`\`\`tool
{"name": "git", "arguments": {"action": "diff", "file": "src/index.ts"}}
\`\`\`

\`\`\`tool
{"name": "git", "arguments": {"action": "stage", "file": "src/feature.ts"}}
\`\`\`

\`\`\`tool
{"name": "git", "arguments": {"action": "commit", "message": "Add new feature"}}
\`\`\`

\`\`\`tool
{"name": "git", "arguments": {"action": "show", "commit": "HEAD~1", "file": "src/index.ts"}}
\`\`\``,

  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description:
          'Git action: status, diff, staged, stage, unstage, commit, restore, show, log',
        enum: [
          'status',
          'diff',
          'staged',
          'stage',
          'unstage',
          'commit',
          'restore',
          'show',
          'log',
        ],
      },
      file: {
        type: 'string',
        description: 'File path for diff, stage, unstage, restore, or show actions',
      },
      message: {
        type: 'string',
        description: 'Commit message (required for commit action)',
      },
      commit: {
        type: 'string',
        description: 'Commit hash/ref for show action (e.g., HEAD~1, abc1234)',
      },
      count: {
        type: 'string',
        description: 'Number of commits to show in log (default: 10)',
      },
    },
    required: ['action'],
  },

  async execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult> {
    const { action, file, message, commit: commitRef, count } = params as unknown as GitToolParams;

    // Validate action
    const validActions: GitAction[] = [
      'status',
      'diff',
      'staged',
      'stage',
      'unstage',
      'commit',
      'restore',
      'show',
      'log',
    ];
    if (!validActions.includes(action)) {
      return {
        toolCallId: '',
        content: `Error: Invalid action '${action}'. Valid actions: ${validActions.join(', ')}`,
        isError: true,
      };
    }

    // Check if this is a git repository
    const isRepo = await isGitRepo(cwd);
    if (!isRepo) {
      return {
        toolCallId: '',
        content: 'Error: Not a git repository (or any parent up to mount point)',
        isError: true,
      };
    }

    try {
      switch (action) {
        case 'status': {
          const status = await getGitStatus(cwd);
          let output = `Branch: ${status.branch}\n`;
          output += `Dirty: ${status.isDirty ? 'Yes' : 'No'}\n\n`;

          if (status.staged.length > 0) {
            output += `Staged files (${status.staged.length}):\n`;
            status.staged.forEach((f) => (output += `  + ${f}\n`));
            output += '\n';
          }

          if (status.unstaged.length > 0) {
            output += `Modified files (${status.unstaged.length}):\n`;
            status.unstaged.forEach((f) => (output += `  M ${f}\n`));
            output += '\n';
          }

          if (status.untracked.length > 0) {
            output += `Untracked files (${status.untracked.length}):\n`;
            status.untracked.forEach((f) => (output += `  ? ${f}\n`));
          }

          if (!status.isDirty) {
            output += 'Working tree clean - no changes to commit.';
          }

          return { toolCallId: '', content: output };
        }

        case 'diff': {
          const diffs = await getGitDiff(cwd, file as string | undefined);

          if (diffs.length === 0) {
            return {
              toolCallId: '',
              content: file
                ? `No unstaged changes in ${file}`
                : 'No unstaged changes',
            };
          }

          let output = `Unstaged changes (${diffs.length} file${diffs.length > 1 ? 's' : ''}):\n\n`;
          for (const diff of diffs) {
            output += `--- ${diff.file} (+${diff.additions} -${diff.deletions})\n`;
            if (diff.hunks) {
              output += diff.hunks + '\n\n';
            }
          }

          return { toolCallId: '', content: output };
        }

        case 'staged': {
          const diffs = await getStagedDiff(cwd, file as string | undefined);

          if (diffs.length === 0) {
            return {
              toolCallId: '',
              content: file ? `No staged changes in ${file}` : 'No staged changes',
            };
          }

          let output = `Staged changes (${diffs.length} file${diffs.length > 1 ? 's' : ''}):\n\n`;
          for (const diff of diffs) {
            output += `--- ${diff.file} (+${diff.additions} -${diff.deletions})\n`;
            if (diff.hunks) {
              output += diff.hunks + '\n\n';
            }
          }

          return { toolCallId: '', content: output };
        }

        case 'stage': {
          if (!file) {
            return {
              toolCallId: '',
              content: 'Error: file is required for stage action',
              isError: true,
            };
          }

          await stageFile(cwd, file);
          return {
            toolCallId: '',
            content: `Staged: ${file}`,
          };
        }

        case 'unstage': {
          if (!file) {
            return {
              toolCallId: '',
              content: 'Error: file is required for unstage action',
              isError: true,
            };
          }

          await unstageFile(cwd, file);
          return {
            toolCallId: '',
            content: `Unstaged: ${file}`,
          };
        }

        case 'commit': {
          if (!message) {
            return {
              toolCallId: '',
              content: 'Error: message is required for commit action',
              isError: true,
            };
          }

          // Check if there are staged changes
          const status = await getGitStatus(cwd);
          if (status.staged.length === 0) {
            return {
              toolCallId: '',
              content:
                'Error: No staged changes to commit. Use "git stage <file>" first.',
              isError: true,
            };
          }

          const hash = await commit(cwd, message);
          return {
            toolCallId: '',
            content: `Committed: ${hash}\nMessage: ${message}\nFiles: ${status.staged.length}`,
          };
        }

        case 'restore': {
          if (!file) {
            return {
              toolCallId: '',
              content: 'Error: file is required for restore action',
              isError: true,
            };
          }

          await restoreFile(cwd, file);
          return {
            toolCallId: '',
            content: `Restored: ${file} (changes discarded)`,
          };
        }

        case 'show': {
          if (!commitRef || !file) {
            return {
              toolCallId: '',
              content: 'Error: commit and file are required for show action',
              isError: true,
            };
          }

          const contents = await getFileAtCommit(cwd, file, commitRef);
          return {
            toolCallId: '',
            content: `File: ${file} @ ${commitRef}\n${'─'.repeat(40)}\n${contents}`,
          };
        }

        case 'log': {
          const logCount = typeof count === 'number' ? count : 10;
          const commits = await getRecentCommits(cwd, logCount);

          if (commits.length === 0) {
            return { toolCallId: '', content: 'No commits found' };
          }

          let output = `Recent commits (${commits.length}):\n\n`;
          for (const c of commits) {
            output += `${c.hash} ${c.date} - ${c.message} (${c.author})\n`;
          }

          return { toolCallId: '', content: output };
        }

        default:
          return {
            toolCallId: '',
            content: `Error: Unknown action '${action}'`,
            isError: true,
          };
      }
    } catch (err) {
      return {
        toolCallId: '',
        content: `Git error: ${(err as Error).message}`,
        isError: true,
      };
    }
  },
};

// Export permission helpers for use in agent-loop
export { WRITE_ACTIONS, DESTRUCTIVE_ACTIONS, READ_ACTIONS };
