/**
 * Remember Command
 *
 * Capture memories to personal or project memory files.
 * Compatible with factory-droid plugin memory format.
 */

import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import pc from 'picocolors';

interface RememberCommandOptions {
  scope?: 'personal' | 'project';
  list?: boolean;
}

/**
 * Get the personal memories file path
 */
function getPersonalMemoriesPath(): string {
  return join(homedir(), '.factory', 'memories.md');
}

/**
 * Get the project memories file path if in a project
 */
function getProjectMemoriesPath(): string | null {
  const cwd = process.cwd();
  const candidate = join(cwd, '.factory', 'memories.md');
  const parentDir = dirname(candidate);

  // Check if .factory directory exists or can be created
  if (existsSync(parentDir)) {
    return candidate;
  }

  // Check for common project markers
  const projectMarkers = [
    'package.json',
    '.git',
    'Cargo.toml',
    'go.mod',
    'pyproject.toml',
    'requirements.txt',
    'pom.xml',
    'build.gradle'
  ];

  for (const marker of projectMarkers) {
    if (existsSync(join(cwd, marker))) {
      return candidate;
    }
  }

  return null;
}

/**
 * Read memories from a file
 */
function readMemories(filePath: string): string[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim().startsWith('- ['))
    .map(line => line.trim());
}

/**
 * List memories from personal and/or project files
 */
function listMemories(scope?: 'personal' | 'project'): void {
  console.log('');
  console.log(pc.bold('=== Memories ==='));
  console.log('');

  if (!scope || scope === 'personal') {
    const personalPath = getPersonalMemoriesPath();
    console.log(pc.dim('Personal memories:'), personalPath);

    const personalMemories = readMemories(personalPath);
    if (personalMemories.length === 0) {
      console.log(pc.dim('  (none)'));
    } else {
      personalMemories.slice(-10).forEach(mem => {
        console.log(pc.cyan('  ' + mem));
      });
      if (personalMemories.length > 10) {
        console.log(pc.dim(`  ... and ${personalMemories.length - 10} more`));
      }
    }
    console.log('');
  }

  if (!scope || scope === 'project') {
    const projectPath = getProjectMemoriesPath();
    if (projectPath) {
      console.log(pc.dim('Project memories:'), projectPath);

      const projectMemories = readMemories(projectPath);
      if (projectMemories.length === 0) {
        console.log(pc.dim('  (none)'));
      } else {
        projectMemories.slice(-10).forEach(mem => {
          console.log(pc.green('  ' + mem));
        });
        if (projectMemories.length > 10) {
          console.log(pc.dim(`  ... and ${projectMemories.length - 10} more`));
        }
      }
    } else {
      console.log(pc.dim('Project memories:'), 'Not in a project directory');
    }
    console.log('');
  }
}

/**
 * Save a memory to the appropriate file
 */
function saveMemory(content: string, scope: 'personal' | 'project'): void {
  let filePath: string;

  if (scope === 'project') {
    const projectPath = getProjectMemoriesPath();
    if (!projectPath) {
      console.log(pc.red('Error: Not in a project directory. Use --scope personal'));
      process.exit(1);
    }
    filePath = projectPath;
  } else {
    filePath = getPersonalMemoriesPath();
  }

  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Format the memory with timestamp
  const date = new Date().toISOString().split('T')[0];
  const formattedMemory = `\n- [${date}] ${content}\n`;

  // Append to file
  appendFileSync(filePath, formattedMemory, 'utf-8');

  console.log('');
  console.log(pc.green('✓ Memory saved to'), pc.dim(filePath));
  console.log(pc.cyan(`  - [${date}] ${content}`));
  console.log('');
}

/**
 * Remember command handler
 */
export async function rememberCommand(
  memory: string | undefined,
  options: RememberCommandOptions
): Promise<void> {
  // List mode
  if (options.list) {
    listMemories(options.scope);
    return;
  }

  // Save mode - require memory content
  if (!memory || memory.trim() === '') {
    console.log(pc.red('Error: Memory content is required'));
    console.log(pc.dim('Usage: pk-puzldai remember "memory text" [--scope personal|project]'));
    console.log(pc.dim('       pk-puzldai remember --list [--scope personal|project]'));
    process.exit(1);
  }

  const scope = options.scope || 'personal';
  saveMemory(memory.trim(), scope);
}
