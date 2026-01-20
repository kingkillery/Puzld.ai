import pc from 'picocolors';
import type { Command } from 'commander';
import {
  runCampaign,
  loadCampaign,
  resumeCampaign,
  type CampaignOptions,
  type CampaignResult
} from '../../orchestrator/campaign/campaign-engine.js';
import { CAMPAIGN_DEFAULTS } from '../../orchestrator/campaign/campaign-defaults.js';

export function campaignCommand(program: Command): void {
  program
    .command('campaign')
    .description('Run long-running autonomous coding campaigns with hierarchical planner/worker agents')
    .argument('<goal>', 'The campaign goal')
    .option('--state <path>', 'Override campaign state directory')
    .option('--planner <agent>', `Planner agent (default: ${CAMPAIGN_DEFAULTS.planner})`)
    .option('--sub-planner <agent>', `Sub-planner agent (default: ${CAMPAIGN_DEFAULTS.subPlanner})`)
    .option('--worker <agents>', `Worker agents comma-separated (default: ${CAMPAIGN_DEFAULTS.workers.join(',')})`)
    .option('--max-workers <n>', 'Maximum concurrent workers', String(CAMPAIGN_DEFAULTS.maxWorkers))
    .option('--checkpoint-every <n>', 'Checkpoint after N tasks', String(CAMPAIGN_DEFAULTS.checkpointEvery))
    .option('--fresh-start-every <n>', 'Fresh start after N tasks', String(CAMPAIGN_DEFAULTS.freshStartEvery))
    .option('--autonomy <level>', 'Autonomy level: checkpoint or auto', CAMPAIGN_DEFAULTS.autonomy)
    .option('--git-mode <mode>', 'Git mode: task-branch, campaign-branch, or patches', CAMPAIGN_DEFAULTS.gitMode)
    .option('--merge-strategy <strategy>', 'Merge strategy: merge, rebase, or squash', CAMPAIGN_DEFAULTS.mergeStrategy)
    .option('--use-droid', 'Enable droid execution for workers')
    .option('--no-droid', 'Disable droid execution')
    .option('--dry-run', 'Show plan without executing')
    .option('--resume', 'Resume existing campaign')
    .action(async (goal: string, opts) => {
      try {
        await executeCampaignCommand(goal, opts);
      } catch (error) {
        console.error(pc.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });

  program
    .command('hierarchy')
    .alias('campaign-long-running')
    .description('Alias for campaign command')
    .argument('<goal>', 'The campaign goal')
    .action(async (goal: string, opts) => {
      try {
        await executeCampaignCommand(goal, opts);
      } catch (error) {
        console.error(pc.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    });
}

async function executeCampaignCommand(goal: string, opts: Record<string, unknown>): Promise<void> {
  console.log(pc.bold('\n🚀 Campaign Mode - Hierarchical Long-Running Agents\n'));
  console.log(pc.dim(`Goal: ${goal.slice(0, 100)}${goal.length > 100 ? '...' : ''}\n`));

  const options: CampaignOptions = {
    goal,
    stateDir: opts.state as string | undefined,
    planner: opts.planner as string | undefined,
    subPlanner: opts.subPlanner as string | undefined,
    workers: opts.worker ? (opts.worker as string).split(',') : undefined,
    maxWorkers: opts.maxWorkers ? parseInt(opts.maxWorkers as string, 10) : undefined,
    checkpointEvery: opts.checkpointEvery ? parseInt(opts.checkpointEvery as string, 10) : undefined,
    freshStartEvery: opts.freshStartEvery ? parseInt(opts.freshStartEvery as string, 10) : undefined,
    autonomy: (opts.autonomy as 'checkpoint' | 'auto') || 'checkpoint',
    gitMode: (opts.gitMode as 'task-branch' | 'campaign-branch' | 'patches') || 'task-branch',
    mergeStrategy: (opts.mergeStrategy as 'merge' | 'rebase' | 'squash') || 'merge',
    useDroid: opts.useDroid !== false,
    dryRun: opts.dryRun === true
  };

  // Show configuration
  console.log(pc.dim('Configuration:'));
  console.log(pc.dim(`  Planner: ${options.planner || CAMPAIGN_DEFAULTS.planner}`));
  console.log(pc.dim(`  Workers: ${options.workers?.join(', ') || CAMPAIGN_DEFAULTS.workers.join(',')}`));
  console.log(pc.dim(`  Autonomy: ${options.autonomy}`));
  console.log(pc.dim(`  Git Mode: ${options.gitMode}`));
  console.log(pc.dim(`  Checkpoint every: ${options.checkpointEvery || CAMPAIGN_DEFAULTS.checkpointEvery} tasks`));
  if (options.dryRun) {
    console.log(pc.yellow('\n🔍 Dry run mode - showing plan only\n'));
  }
  console.log();

  let result: CampaignResult;

  if (opts.resume) {
    console.log(pc.cyan('Resuming existing campaign...\n'));
    result = await resumeCampaign(process.cwd(), options);
  } else {
    // Check for existing campaign
    const existing = await loadCampaign(process.cwd(), options.stateDir);
    if (existing && existing.status === 'running') {
      console.log(pc.yellow('Found active campaign. Use --resume to continue or delete .campaign/campaign.json to start fresh.\n'));
      console.log(pc.dim(`Campaign ID: ${existing.campaignId}`));
      console.log(pc.dim(`Status: ${existing.status}`));
      console.log(pc.dim(`Tasks: ${existing.tasks.length}`));
      return;
    }

    result = await runCampaign(options);
  }

  // Display results
  displayResults(result);
}

function displayResults(result: CampaignResult): void {
  console.log();
  console.log(pc.bold('─── Campaign Results ───\n'));

  if (result.error) {
    console.log(pc.red(`Error: ${result.error}`));
    return;
  }

  console.log(`${pc.bold('Status:')} ${getStatusColor(result.status)(result.status)}`);
  console.log(`${pc.bold('Tasks:')} ${result.tasksCompleted}/${result.tasksTotal} completed`);
  console.log(`${pc.bold('Duration:')} ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`${pc.bold('Checkpoints:')} ${result.checkpoints}`);
  console.log(`${pc.bold('Decisions:')} ${result.decisions}`);

  if (result.recoverySummary) {
    console.log();
    console.log(pc.bold('Recovery Summary:'));
    console.log(pc.dim(result.recoverySummary));
  }

  if (result.finalSummary) {
    console.log();
    console.log(pc.bold('Summary:'));
    console.log(pc.dim(result.finalSummary));
  }
}

function getStatusColor(status: CampaignResult['status']): (str: string) => string {
  switch (status) {
    case 'completed':
      return pc.green;
    case 'failed':
      return pc.red;
    case 'running':
      return pc.yellow;
    default:
      return pc.dim;
  }
}
