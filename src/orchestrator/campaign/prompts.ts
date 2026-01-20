export const plannerPrompt = (input: {
  goal: string;
  checkpointSummary: string;
  openTasks: string;
  completedTasks: string;
  constraints: string;
  repoMap: string;
  gitContext: string;
}): string => {
  return `You are the campaign planner. Break the goal into executable tasks.

Goal:
${input.goal}

Checkpoint Summary:
${input.checkpointSummary}

Open Tasks:
${input.openTasks}

Completed Tasks:
${input.completedTasks}

Constraints:
${input.constraints}

Repo Map (structure only):
${input.repoMap}

Git Context:
${input.gitContext}

Return ONLY valid JSON with this schema:
{
  "summary": "short planning summary",
  "tasks": [
    {
      "id": "optional",
      "title": "short task title",
      "description": "what to do",
      "acceptanceCriteria": ["criterion 1", "criterion 2"],
      "area": "optional domain label",
      "agentHint": "worker|subplanner"
    }
  ],
  "subPlans": [
    {
      "area": "domain label",
      "goal": "sub-plan goal",
      "notes": "optional notes"
    }
  ],
  "done": false
}`;
};

export const subPlannerPrompt = (input: {
  goal: string;
  area: string;
  notes?: string;
}): string => {
  return `You are a domain sub-planner. Create executable tasks for the area.

Area: ${input.area}
Goal: ${input.goal}
Notes: ${input.notes ?? 'none'}

Return ONLY valid JSON with this schema:
{
  "summary": "short planning summary",
  "tasks": [
    {
      "id": "optional",
      "title": "short task title",
      "description": "what to do",
      "acceptanceCriteria": ["criterion 1", "criterion 2"],
      "area": "${input.area}",
      "agentHint": "worker"
    }
  ],
  "done": false
}`;
};

export const recoveryPrompt = (input: {
  lastCheckpoint: string;
  activeTasks: string;
  failedTasks: string;
  repoSummary: string;
}): string => {
  return `You are resuming a long-running campaign. Use the checkpoint and task status to propose a safe resume plan.

Last Checkpoint:
${input.lastCheckpoint}

Active Tasks:
${input.activeTasks}

Failed Tasks:
${input.failedTasks}

Repo Summary:
${input.repoSummary}

Return ONLY valid JSON with this schema:
{
  "summary": "short recovery summary",
  "resumePlan": [
    {
      "step": "string",
      "action": "string",
      "owner": "planner|subplanner|worker"
    }
  ],
  "risks": [
    {
      "risk": "string",
      "mitigation": "string"
    }
  ]
}`;
};

export const conflictPrompt = (input: {
  conflictingFiles: string;
  diffSummary: string;
  preferredStrategy: 'merge' | 'rebase' | 'squash';
}): string => {
  return `Resolve merge conflicts for a campaign task. Prefer the provided strategy when safe.

Conflicting Files:
${input.conflictingFiles}

Diff Summary:
${input.diffSummary}

Preferred Strategy:
${input.preferredStrategy}

Return ONLY valid JSON with this schema:
{
  "decision": "string",
  "resolutionSteps": ["string"],
  "riskNotes": ["string"]
}`;
};

// JSON extraction utilities for LLM responses
export function extractJsonFromResponse(content: string): { json: unknown; error?: string } {
  let jsonStr = content.trim();

  // Remove markdown code blocks
  jsonStr = jsonStr
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find JSON object
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (!match) {
    return { json: null, error: 'No JSON object found' };
  }

  const cleanJson = match[0]
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/'/g, '"');

  try {
    return { json: JSON.parse(cleanJson) };
  } catch (err) {
    return { json: null, error: (err as Error).message };
  }
}
