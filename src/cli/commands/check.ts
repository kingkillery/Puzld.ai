import { execa } from 'execa';
import pc from 'picocolors';
import type { CheckResult } from '../../lib/types';
import { getConfig } from '../../lib/config';
import { ui } from '../utils/ui';

export async function checkCommand(): Promise<void> {
  ui.header('Dependency Check', 'Verifying system requirements and configuration');

  const spinner = ui.spinner('Checking dependencies...');
  const results = await checkDependencies();
  spinner.stop();

  for (const result of results) {
    if (result.available) {
      console.log(`  ${pc.green('✓')} ${result.name}${result.version ? pc.dim(` (${result.version})`) : ''}`);
    } else {
      console.log(`  ${pc.red('✗')} ${pc.dim(result.name)}${result.error ? pc.red(` - ${result.error}`) : ''}`);
    }
  }

  const allGood = results.every(r => r.available);
  const available = results.filter(r => r.available).length;

  console.log('');
  if (allGood) {
    ui.success('All dependencies ready!');
  } else {
    ui.warn(`${available}/${results.length} dependencies available`);
  }

  // Show custom model configurations
  const config = getConfig();
  const customModels: { adapter: string; model: string }[] = [];

  if (config.adapters.claude.model) {
    customModels.push({ adapter: 'claude', model: config.adapters.claude.model });
  }
  if (config.adapters.gemini.model) {
    customModels.push({ adapter: 'gemini', model: config.adapters.gemini.model });
  }
  if (config.adapters.codex.model) {
    customModels.push({ adapter: 'codex', model: config.adapters.codex.model });
  }
  if (config.adapters.ollama.model && config.adapters.ollama.model !== 'llama3.2') {
    customModels.push({ adapter: 'ollama', model: config.adapters.ollama.model });
  }
  if (config.adapters.factory?.model) {
    customModels.push({ adapter: 'factory', model: config.adapters.factory.model });
  }
  if (config.adapters.crush?.model) {
    customModels.push({ adapter: 'crush', model: config.adapters.crush.model });
  }

  if (customModels.length > 0) {
    ui.divider();
    console.log(pc.bold('Custom Model Configurations:'));
    for (const { adapter, model } of customModels) {
      console.log(`  ${pc.cyan(adapter.padEnd(10))}: ${pc.dim(model)}`);
    }
  }

  // Show factory-specific config if enabled
  if (config.adapters.factory?.enabled) {
    const factory = config.adapters.factory;
    ui.divider();
    console.log(pc.bold('Factory (droid) Settings:'));
    if (factory.model) ui.detail('Model', factory.model);
    if (factory.autonomy) ui.detail('Autonomy', factory.autonomy);
    if (factory.reasoningEffort) ui.detail('Reasoning', factory.reasoningEffort);
    if (factory.skipPermissions) ui.detail('Skip Permissions', 'true');
  }

  // Show crush-specific config if enabled
  if (config.adapters.crush?.enabled) {
    const crush = config.adapters.crush;
    ui.divider();
    console.log(pc.bold('Crush Settings:'));
    if (crush.model) ui.detail('Model', crush.model);
    if (crush.autoAccept) ui.detail('Auto Accept', 'true');
  }
}

async function checkDependencies(): Promise<CheckResult[]> {
  const config = getConfig();
  const results: CheckResult[] = [];

  const cliChecks = [
    { name: 'claude', cmd: config.adapters.claude.path, args: ['--version'], enabled: config.adapters.claude.enabled },
    { name: 'gemini', cmd: config.adapters.gemini.path, args: ['--version'], enabled: config.adapters.gemini.enabled },
    { name: 'codex', cmd: config.adapters.codex.path, args: ['--version'], enabled: config.adapters.codex.enabled },
    { name: 'ollama', cmd: 'ollama', args: ['--version'], enabled: config.adapters.ollama.enabled },
    { name: 'factory (droid)', cmd: config.adapters.factory?.path || 'droid', args: ['--version'], enabled: config.adapters.factory?.enabled ?? false },
    { name: 'crush', cmd: config.adapters.crush?.path || 'crush', args: ['--version'], enabled: config.adapters.crush?.enabled ?? false },
    { name: 'ttyd', cmd: 'ttyd', args: ['--version'], enabled: true },
  ];

  for (const { name, cmd, args, enabled } of cliChecks) {
    // Check if disabled in config first
    if (!enabled) {
      results.push({ name, available: false, error: 'disabled in config' });
      continue;
    }

    try {
      const { stdout } = await execa(cmd, args, { timeout: 5000 });
      const version = stdout.trim().split('\n')[0].slice(0, 50);
      results.push({ name, available: true, version });
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      const msg = error.code === 'ENOENT' ? 'not found in PATH' : error.message;
      results.push({ name, available: false, error: msg });
    }
  }

  // Check Ollama server and router model in one fetch
  try {
    const response = await fetch(`${config.adapters.ollama.host}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      results.push({ name: 'ollama-server', available: true });

      const data = await response.json() as { models: Array<{ name: string }> };
      const routerBase = config.routerModel.split(':')[0];
      const hasRouter = data.models?.some(m => m.name.includes(routerBase));
      results.push({
        name: `router-model (${config.routerModel})`,
        available: hasRouter,
        error: hasRouter ? undefined : 'model not found'
      });
    } else {
      results.push({ name: 'ollama-server', available: false, error: 'bad response' });
      results.push({ name: `router-model (${config.routerModel})`, available: false, error: 'cannot check' });
    }
  } catch {
    results.push({ name: 'ollama-server', available: false, error: 'not running' });
    results.push({ name: `router-model (${config.routerModel})`, available: false, error: 'cannot check' });
  }

  return results;
}
