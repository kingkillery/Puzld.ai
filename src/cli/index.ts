#!/usr/bin/env node
import { Command } from 'commander';
import { runCommand } from './commands/run';
import { checkCommand } from './commands/check';
import { auditCommand } from './commands/audit';
import { serveCommand } from './commands/serve';
import { mcpStatusCommand } from './commands/mcp-status';
import { agentCommand } from './commands/agent';
import { compareCommand } from './commands/compare';
import { planCommand } from './commands/plan';
import {
  templateListCommand,
  templateShowCommand,
  templateCreateCommand,
  templateEditCommand,
  templateDeleteCommand
} from './commands/template';
import {
  profileListCommand,
  profileShowCommand,
  profileSetDefaultCommand,
  profileCreateCommand,
  profileDeleteCommand
} from './commands/profile';
import {
  sessionListCommand,
  sessionNewCommand,
  sessionInfoCommand,
  sessionDeleteCommand,
  sessionClearCommand
} from './commands/session';
import {
  correctionCommand,
  debateCommand,
  consensusCommand
} from './commands/collaboration';
import { pickbuildCommand } from './commands/pickbuild';
import { pkpoetCommand } from './commands/pkpoet';
import { ralphCommand } from './commands/ralph';
import {
  poetiqCommand,
  adversaryCommand,
  discoverCommand,
  codereasonCommand,
  featureCommand
} from './commands/factory-modes';
import { rememberCommand } from './commands/remember';
import { interactiveCommand } from './commands/interactive';
import { doCommand } from './commands/do';
import { evalCommand } from './commands/eval';
import { campaignCommand } from './commands/campaign';
import {
  modelShowCommand,
  modelListCommand,
  modelSetCommand,
  modelClearCommand
} from './commands/model';
import { indexCommand } from './commands/indexing';
import {
  observeSummaryCommand,
  observeListCommand,
  observeExportCommand
} from './commands/observe';
import {
  loginCommand,
  logoutCommand,
  whoamiCommand
} from './commands/login';
import { tasksCommand } from './commands/tasks';
import { gameCommand } from './commands/game';
import { orchestrateCommand } from './commands/orchestrate';
import { chatCommand } from './commands/chat';
import { puzzleCommand } from './commands/puzzle';
import { arenaCommand } from './commands/arena';
import { loopCommand } from './commands/loop';
import { spawnCommand } from './commands/spawn';
import { continuePlanCommand } from './commands/continue-plan';
import { startTUI } from '../tui';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

const program = new Command();

program
  .name('pk-puzldai')
  .description('PuzldAI - Multi-LLM Orchestrator')
  .version(pkg.version);

// Primary command - just works
program
  .command('do')
  .description('Execute a task with automatic approach selection (recommended)')
  .argument('<task>', 'The task to execute')
  .option('-v, --verbose', 'Show detailed progress')
  .option('--verify <command>', 'Verification command (e.g., "npm test")')
  .action((task, opts) => doCommand(task, {
    verbose: opts.verbose,
    verify: opts.verify,
  }));

// ... (existing commands) ...

// Game commands
gameCommand(program);

// Campaign commands (hierarchical long-running agents)
campaignCommand(program);

// If no arguments, launch TUI only when interactive; otherwise show help
if (process.argv.length <= 2) {
  const isInteractive = Boolean(process.stdout.isTTY && process.stdin.isTTY);
  if (isInteractive) {
    startTUI();
  } else {
    console.log(pc.bold(pc.blue('\n  PK-PUZLDAI  ')));
    console.log(pc.dim('  Multi-LLM Orchestration Framework\n'));
    program.outputHelp();
  }
} else {
  program.parseAsync().then(() => {
    setTimeout(() => process.exit(0), 100);
  });
}
