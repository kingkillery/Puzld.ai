export const CAMPAIGN_DEFAULTS = {
  planner: 'droid:gpt-5.2-codex-medium',
  subPlanner: 'gemini:gemini-2.5-pro',
  workers: ['droid:minimax-m2.1', 'droid:glm-4.7'],
  maxWorkers: 8,
  checkpointEvery: 5,
  freshStartEvery: 25,
  autonomy: 'checkpoint' as const,
  gitMode: 'task-branch' as const,
  mergeStrategy: 'merge' as const,
  useDroid: true,
  stateDirName: '.campaign'
};

export type CampaignDefaults = typeof CAMPAIGN_DEFAULTS;
