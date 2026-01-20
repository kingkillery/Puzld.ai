export {
  runCampaign,
  loadCampaign,
  resumeCampaign,
  type CampaignOptions,
  type CampaignResult
} from './campaign-engine.js';

export {
  type CampaignState,
  type CampaignStatus,
  type CampaignTask,
  type CampaignTaskStatus,
  type CampaignCheckpoint,
  type CampaignDecision,
  type CampaignArtifact,
  type CampaignStateInit,
  createInitialState,
  loadCampaignState,
  saveCampaignState,
  getDefaultStateDir,
  getStateFilePath,
  ensureStateDir
} from './campaign-state.js';

export {
  type TaskQueue,
  createQueueFromTasks,
  getNextTask,
  updateTaskStatus,
  hasWorkRemaining,
  getProgress
} from './campaign-queue.js';

export { runPlanner, runSubPlanner } from './campaign-planner.js';

export {
  type PlannerOutput,
  type SubPlannerOutput,
  type RecoveryOutput,
  type ConflictResolutionOutput,
  validatePlannerOutput,
  validateSubPlannerOutput,
  validateRecoveryOutput,
  validateConflictResolutionOutput
} from './campaign-schema.js';

export {
  type WorkerResult,
  runWorkerTask
} from './campaign-worker.js';

export {
  type AgentSpec,
  parseAgentSpec,
  resolveAgentForRole
} from './campaign-agent.js';

export { CAMPAIGN_DEFAULTS, type CampaignDefaults } from './campaign-defaults.js';

export { buildRepoMap, type RepoMapOptions } from './campaign-repo-map.js';

export {
  upsertCampaignProject,
  upsertCampaignTasks,
  logCampaignExecution
} from './campaign-db.js';
