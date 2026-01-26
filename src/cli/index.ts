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

// Single-agent task execution
program
  .command('run')
  .description('Run a task with a single agent, pipeline, or profile')
  .argument('<task>', 'The task to execute')
  .option('-a, --agent <agent>', 'Agent to use')
  .option('-m, --model <model>', 'Model override')
  .option('-P, --pipeline <pipeline>', 'Pipeline string (agent:action,agent:action)')
  .option('-T, --template <name>', 'Pipeline template name')
  .option('-i, --interactive', 'Confirm each pipeline step before running')
  .option('--agentic', 'Enable tool access for single-agent runs')
  .option('--profile <name>', 'Orchestration profile to use')
  .option('--dry-run', 'Print execution plan without running')
  .option('--no-compress', 'Disable context compression')
  .action((task, opts) => runCommand(task, opts));

// System checks
program
  .command('check')
  .description('Verify system requirements and adapter availability')
  .action(() => checkCommand());

program
  .command('audit')
  .description('Run a comprehensive system audit')
  .option('--json', 'Output machine-readable JSON')
  .option('--verbose', 'Show detailed checks and fixes')
  .option('--fix', 'Attempt automated fixes where possible')
  .action((opts) => auditCommand(opts));

// Server and MCP
program
  .command('serve')
  .description('Start the API server or MCP bridge')
  .option('-p, --port <number>', 'API server port', (v: string) => Number(v))
  .option('--host <host>', 'API server host')
  .option('--web', 'Launch ttyd web terminal')
  .option('--mcp', 'Start MCP bridge instead of API server')
  .action((opts) => serveCommand(opts));

program
  .command('mcp-status')
  .description('Show MCP bridge status and capabilities')
  .action(() => mcpStatusCommand());

// Agent and model management
program
  .command('agent')
  .description('Interactive single-agent session')
  .option('-a, --agent <agent>', 'Agent to use')
  .option('-m, --model <model>', 'Model override')
  .action((opts) => agentCommand(opts));

program
  .command('compare')
  .description('Compare multiple agents on the same task')
  .argument('<task>', 'Task to compare')
  .option('-a, --agents <list>', 'Comma-separated agent list')
  .option('-s, --sequential', 'Run sequentially instead of parallel')
  .option('--pick', 'Select the best response')
  .action((task, opts) => compareCommand(task, opts));

program
  .command('plan')
  .description('Generate an execution plan')
  .argument('<task>', 'Task to plan')
  .option('--execute', 'Execute the generated plan')
  .option('--planner <agent>', 'Planner agent')
  .option('-i, --interactive', 'Confirm each step before running')
  .action((task, opts) => planCommand(task, opts));

// Template management
const template = program
  .command('template')
  .description('Manage pipeline templates');
template.command('list').description('List available templates').action(() => templateListCommand());
template.command('show').description('Show a template').argument('<name>', 'Template name').action((name) => templateShowCommand(name));
template.command('create').description('Create a new template').argument('<name>', 'Template name').option('-P, --pipeline <pipeline>', 'Pipeline string').option('-d, --description <text>', 'Description').action((name, opts) => templateCreateCommand(name, { pipeline: opts.pipeline, description: opts.description }));
template.command('edit').description('Edit a template').argument('<name>', 'Template name').option('-P, --pipeline <pipeline>', 'Pipeline string').option('-d, --description <text>', 'Description').action((name, opts) => templateEditCommand(name, { pipeline: opts.pipeline, description: opts.description }));
template.command('delete').description('Delete a template').argument('<name>', 'Template name').action((name) => templateDeleteCommand(name));

// Profile management
const profile = program
  .command('profile')
  .description('Manage orchestration profiles');
profile.command('list').description('List profiles').action(() => profileListCommand());
profile.command('show').description('Show a profile').argument('<name>', 'Profile name').action((name) => profileShowCommand(name));
profile.command('set-default').description('Set the default profile').argument('<name>', 'Profile name').action((name) => profileSetDefaultCommand(name));
profile.command('create').description('Create a profile').argument('<name>', 'Profile name').option('--from <name>', 'Clone from another profile').action((name, opts) => profileCreateCommand(name, opts));
profile.command('delete').description('Delete a profile').argument('<name>', 'Profile name').action((name) => profileDeleteCommand(name));

// Session management
const session = program
  .command('session')
  .description('Manage chat sessions');
session.command('list').description('List sessions').argument('[agent]', 'Filter by agent').action((agent) => sessionListCommand(agent));
session.command('new').description('Create a new session').argument('[agent]', 'Agent name').action((agent) => sessionNewCommand(agent));
session.command('info').description('Show session details').argument('<id>', 'Session ID').action((id) => sessionInfoCommand(id));
session.command('delete').description('Delete a session').argument('<id>', 'Session ID').action((id) => sessionDeleteCommand(id));
session.command('clear').description('Clear session history').argument('<id>', 'Session ID').action((id) => sessionClearCommand(id));

// Multi-agent collaboration
program
  .command('correct')
  .alias('correction')
  .description('Producer → Reviewer → Fix workflow')
  .argument('<task>', 'Task to correct')
  .option('--producer <agent>', 'Producer agent')
  .option('--reviewer <agent>', 'Reviewer agent')
  .option('--fix', 'Apply a fix after review')
  .action((task, opts) => correctionCommand(task, opts));

program
  .command('debate')
  .description('Multi-agent debate')
  .argument('<topic>', 'Debate topic')
  .option('-a, --agents <list>', 'Comma-separated agent list')
  .option('-r, --rounds <count>', 'Number of rounds')
  .option('--moderator <agent>', 'Moderator agent')
  .action((topic, opts) => debateCommand(topic, opts));

program
  .command('consensus')
  .description('Multi-agent consensus')
  .argument('<task>', 'Task to solve')
  .option('-a, --agents <list>', 'Comma-separated agent list')
  .option('-r, --rounds <count>', 'Number of voting rounds')
  .option('--synthesizer <agent>', 'Synthesizer agent')
  .action((task, opts) => consensusCommand(task, opts));

program
  .command('pickbuild')
  .description('Compare → Pick → Build workflow')
  .argument('<task>', 'Task to execute')
  .option('--agents <list>', 'Comma-separated proposer agents')
  .option('--picker <agent>', 'Picker agent (or "human")')
  .option('--build-agent <agent>', 'Build agent')
  .option('--reviewer <agent>', 'Reviewer agent')
  .option('-i, --interactive', 'Interactive plan selection')
  .option('--format <format>', 'Plan format (json|md)')
  .action((task, opts) => pickbuildCommand(task, opts));

// PK-Poet and factory modes
program
  .command('pkpoet')
  .description('PK-Poet: REASON → DISCOVER → ATTACK → FORTIFY → EXECUTE')
  .argument('<task>', 'Task to execute')
  .option('--depth <level>', 'Depth: shallow|medium|deep')
  .option('--agent <agent>', 'Default agent for all phases')
  .option('--verify <command>', 'Verification command')
  .option('-i, --interactive', 'Interactive phase confirmation')
  .action((task, opts) => pkpoetCommand(task, opts));

program
  .command('ralph')
  .description('Ralph Wiggum plan-first loop')
  .argument('<task>', 'Task to execute')
  .option('--planner <agent>', 'Planner agent')
  .option('--iters <count>', 'Max iterations')
  .option('--completion <token>', 'Completion token')
  .option('--model <model>', 'Model override')
  .option('--tests <command>', 'Verification command')
  .option('--scope <pattern>', 'Scope pattern')
  .option('--stop <token>', 'Stop token')
  .action((task, opts) => ralphCommand(task, {
    planner: opts.planner,
    iterations: opts.iters,
    completion: opts.completion,
    model: opts.model,
    tests: opts.tests,
    scope: opts.scope,
    stop: opts.stop
  }));

program.command('poetiq').description('Poetiq verification-first workflow').argument('<task>').option('--agent <agent>').option('--verify <command>').action((task, opts) => poetiqCommand(task, opts));
program.command('adversary').description('Adversary red-team analysis').argument('<task>').option('--agent <agent>').option('--files <list>').action((task, opts) => adversaryCommand(task, opts));
program.command('discover').alias('self-discover').description('Self-Discover atomic analysis').argument('<task>').option('--agent <agent>').option('--depth <level>').action((task, opts) => discoverCommand(task, opts));
program.command('codereason').description('Code-as-reasoning workflow').argument('<task>').option('--agent <agent>').option('--language <lang>').action((task, opts) => codereasonCommand(task, opts));
program.command('feature').description('Large-feature multi-phase workflow').argument('<task>').option('--agent <agent>').option('--verify <command>').action((task, opts) => featureCommand(task, opts));

// Memory and observation
program
  .command('remember')
  .description('Save or list memories')
  .argument('[memory]', 'Memory text')
  .option('--scope <scope>', 'Scope: personal|project')
  .option('--list', 'List memories')
  .action((memory, opts) => rememberCommand(memory, opts));

program
  .command('interact')
  .alias('interactive')
  .description('Run an interactive verification session')
  .argument('<prompt>', 'Initial prompt')
  .option('--agent <agent>', 'Primary agent')
  .option('--model <model>', 'Model override')
  .option('--verbose', 'Verbose output')
  .action((prompt, opts) => interactiveCommand(prompt, opts));

program
  .command('eval')
  .description('Evaluate task classification and approach selection')
  .option('--task <task>', 'Evaluate a single task')
  .option('--full', 'Run full evaluation suite')
  .option('--verbose', 'Verbose output')
  .action((opts) => evalCommand(opts));

// Model management
const model = program.command('model').description('Manage model settings');
model.command('show').description('Show current model settings').action(() => modelShowCommand());
model.command('list').description('List known models').argument('[agent]', 'Agent name').action((agent) => modelListCommand(agent));
model.command('set').description('Set a model for an agent').argument('<agent>').argument('<model>').action((agent, modelName) => modelSetCommand(agent, modelName));
model.command('clear').description('Clear an agent model override').argument('<agent>').action((agent) => modelClearCommand(agent));

// Indexing
program
  .command('index')
  .description('Index a codebase for semantic search')
  .argument('[path]', 'Path to index')
  .option('--quick', 'Quick index')
  .option('--clear', 'Clear index')
  .option('--stats', 'Show index stats')
  .option('--search <query>', 'Search indexed code')
  .option('--context <task>', 'Get context for a task')
  .option('--config', 'Show project config summary')
  .option('--graph', 'Show dependency graph summary')
  .option('--max-files <count>', 'Max files to index', (v: string) => Number(v))
  .action((path, opts) => indexCommand(path, opts));

// Observation
const observe = program.command('observe').description('Observation management');
observe.command('summary').description('Show observation summary').option('--agent <agent>').action((opts) => observeSummaryCommand(opts.agent));
observe.command('list').description('List recent observations').option('--agent <agent>').option('--limit <count>').action((opts) => observeListCommand(opts));
observe.command('export').description('Export observations to file').argument('<outputPath>').option('-f, --format <format>', 'Format: jsonl|json|csv').option('--agent <agent>').option('--limit <count>').action((outputPath, opts) => observeExportCommand(outputPath, opts));

// Auth
program.command('login').description('Login to MCP').option('--email <email>').option('--token <token>').option('--endpoint <url>').action((opts) => loginCommand(opts));
program.command('logout').description('Logout from MCP').action(() => logoutCommand());
program.command('whoami').description('Show current MCP login status').action(() => whoamiCommand());

// Tasks
program
  .command('tasks')
  .description('Manage background tasks')
  .argument('[action]', 'Action: list|show|output|kill|delete|clear')
  .argument('[target]', 'Task ID')
  .option('--status <status>', 'Filter by status')
  .option('--limit <count>', 'Max tasks to show', (v: string) => Number(v))
  .action((action, target, opts) => tasksCommand(action, target, opts));

// Orchestration
program
  .command('orchestrate')
  .description('Intelligent multi-agent orchestration')
  .argument('<task>', 'Task to execute')
  .option('-a, --agent <agent>', 'Primary agent')
  .option('--mode <mode>', 'Mode: delegate|coordinate|supervise')
  .option('--agents <list>', 'Comma-separated agent list')
  .option('--profile <name>', 'Profile to use')
  .option('--dry-run', 'Show plan without executing')
  .action((task, opts) => orchestrateCommand(task, opts));

program.command('chat').description('Start a conversational chat REPL').option('-a, --agent <agent>').option('-m, --model <model>').option('--agentic', 'Enable tool access').option('--session <id>', 'Resume a session').action((opts) => chatCommand(opts));
program.command('puzzle').description('Puzzle Assembly orchestration').argument('<task>').option('--proposers <count>').option('--refine <count>').option('--dry-run').option('--verbose').action((task, opts) => puzzleCommand(task, opts));
program.command('arena').description('Run the arena configuration tournament').option('--full').option('-c, --configs <list>').option('--list').option('--verbose').action((opts) => arenaCommand(opts));
program.command('loop').description('Run feedback loop experiments').option('-g, --generations <count>').option('--verbose').option('--reset').option('--parallel').action((opts) => loopCommand(opts));
program.command('spawn').description('Spawn custom agents').argument('[agents...]', 'Agent names').option('--parallel').option('--list').option('--model <model>').action((agents, opts) => spawnCommand(agents, opts));
program.command('continue-plan').description('Execute temp-plan.txt with PK-Poet agents').option('-s, --sequential').option('-a, --agent <name>').option('--dry-run').action((opts) => continuePlanCommand(opts));

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
