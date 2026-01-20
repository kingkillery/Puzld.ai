import type { AgentName } from '../../executor/types.js';
import type { CampaignTask } from './campaign-state.js';
import { runAdapter } from '../../lib/adapter-runner.js';
import { runAgentLoop } from '../../agentic/agent-loop.js';
import { adapters } from '../../adapters/index.js';
import { resolveAgentForRole } from './campaign-agent.js';
import { getGitStatus, getGitDiff, getStagedDiff, stageFile, commit, isGitRepo } from '../../lib/git.js';

export interface WorkerResult {
  taskId: string;
  success: boolean;
  summary: string;
  error?: string;
  artifacts: string[];
  gitDiff?: string;
}

export async function runWorkerTask(
  task: CampaignTask,
  workers: string[],
  cwd: string,
  useDroid: boolean
): Promise<WorkerResult> {
  // Select worker agent (round-robin through available workers)
  const workerSpec = workers[0] || 'droid:minimax-m2.1';
  const { agent, model } = await resolveAgentForRole('worker', workerSpec);

  // Build execution prompt from task
  const prompt = buildTaskPrompt(task, cwd);
  
  // Execute task
  try {
    const adapter = adapters[agent as AgentName];
    if (!adapter) {
      return {
        taskId: task.id,
        success: false,
        summary: '',
        error: `Unknown adapter for agent ${agent}`,
        artifacts: []
      };
    }

    let content = '';

    if (useDroid) {
      const loopResult = await runAgentLoop(adapter, prompt, { cwd, model });
      content = loopResult.content;
    } else {
      const result = await runAdapter(agent as AgentName, prompt, { model });
      if (result.error) {
        return {
          taskId: task.id,
          success: false,
          summary: '',
          error: result.error,
          artifacts: []
        };
      }
      content = result.content;
    }

    const artifacts = extractArtifacts(content);
    const commitResult = await commitWorkerChanges(cwd, task, artifacts);
    const summary = commitResult?.hash
      ? `${extractSummary(content)}\nCommit: ${commitResult.hash}`
      : extractSummary(content);

    return {
      taskId: task.id,
      success: true,
      summary,
      error: undefined,
      artifacts,
      gitDiff: commitResult?.diff
    };
  } catch (err) {
    const gitDiff = await getWorkingDiff(cwd);
    return {
      taskId: task.id,
      success: false,
      summary: '',
      error: (err as Error).message,
      artifacts: [],
      gitDiff
    };
  }
}

function buildTaskPrompt(task: CampaignTask, cwd: string): string {
  let prompt = `Task: ${task.title}\n\n`;
  
  if (task.description) {
    prompt += `Description: ${task.description}\n\n`;
  }

  if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
    prompt += `Acceptance Criteria:\n`;
    for (const criteria of task.acceptanceCriteria) {
      prompt += `- ${criteria}\n`;
    }
    prompt += '\n';
  }

  prompt += `Working Directory: ${cwd}\n\n`;
  prompt += `Execute this task using tools as needed. Run relevant tests or checks if you modify code. `;
  prompt += `If you make file changes, list them at the end along with any tests run.`;

  return prompt;
}

async function commitWorkerChanges(
  cwd: string,
  task: CampaignTask,
  artifacts: string[]
): Promise<{ hash: string; diff: string } | null> {
  const isRepo = await isGitRepo(cwd);
  if (!isRepo) {
    return null;
  }

  const status = await getGitStatus(cwd);
  if (!status.isDirty) {
    return null;
  }

  const filesToStage = [...status.unstaged, ...status.untracked];
  const stageTargets = filesToStage.length > 0 ? filesToStage : artifacts;

  for (const file of stageTargets) {
    await stageFile(cwd, file);
  }

  const updatedStatus = await getGitStatus(cwd);
  if (updatedStatus.staged.length === 0) {
    return null;
  }

  const stagedDiffs = await getStagedDiff(cwd);
  const diffText = formatGitDiffs(stagedDiffs);

  const message = `campaign: ${task.title}`;
  const hash = await commit(cwd, message);
  return { hash, diff: diffText };
}

async function getWorkingDiff(cwd: string): Promise<string> {
  const diffs = await getGitDiff(cwd);
  return formatGitDiffs(diffs);
}

function formatGitDiffs(diffs: Array<{ file: string; hunks: string }>): string {
  if (diffs.length === 0) {
    return '';
  }

  return diffs
    .map(diff => `# ${diff.file}\n${diff.hunks}`)
    .join('\n\n')
    .trim();
}

function extractSummary(content: string): string {
  // Take first 500 chars as summary
  const cleaned = content.trim();
  if (cleaned.length <= 500) {
    return cleaned;
  }
  return cleaned.slice(0, 500) + '...';
}

function extractArtifacts(content: string): string[] {
  const artifacts: string[] = [];
  
  // Look for file patterns like "Modified: file.ts" or "Created: path/to/file"
  const filePatterns = [
    /(?:Modified|Created|Updated|Deleted):\s*(\S+)/gi,
    /File:\s*(\S+)/gi
  ];

  for (const pattern of filePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        const filePath = match.replace(/^(?:Modified|Created|Updated|Deleted):\s*/i, '');
        if (filePath && !artifacts.includes(filePath)) {
          artifacts.push(filePath);
        }
      }
    }
  }

  return artifacts;
}
