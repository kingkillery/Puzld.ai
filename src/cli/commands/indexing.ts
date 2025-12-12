/**
 * Index Command - Codebase Indexing (Phase 12)
 *
 * puzld index [path] - Index a codebase for semantic search
 */

import { indexCodebase, quickIndex, getIndexSummary, getConfigSummary, getGraphSummary, getIndexStats, clearCodeIndex } from '../../indexing';
import { searchCode, getTaskContext } from '../../indexing/searcher';
import chalk from 'chalk';
import { resolve } from 'path';

export interface IndexCommandOptions {
  quick?: boolean;
  clear?: boolean;
  stats?: boolean;
  search?: string;
  context?: string;
  config?: boolean;
  graph?: boolean;
  maxFiles?: number;
}

export async function indexCommand(
  path: string = '.',
  options: IndexCommandOptions
): Promise<void> {
  const rootDir = resolve(path);

  // Clear index
  if (options.clear) {
    clearCodeIndex();
    console.log(chalk.green('Index cleared.'));
    return;
  }

  // Show stats
  if (options.stats) {
    const stats = getIndexStats();
    console.log(chalk.cyan('Index Statistics:'));
    console.log(`  Files: ${stats.totalFiles}`);
    console.log(`  Chunks: ${stats.totalChunks}`);
    if (Object.keys(stats.byKind).length > 0) {
      console.log('  By kind:');
      for (const [kind, count] of Object.entries(stats.byKind)) {
        console.log(`    ${kind}: ${count}`);
      }
    }
    return;
  }

  // Search code
  if (options.search) {
    console.log(chalk.cyan(`Searching for: ${options.search}`));
    const results = await searchCode(options.search, rootDir, {
      limit: 10,
      includeContent: false,
    });

    if (results.length === 0) {
      console.log(chalk.yellow('No results found.'));
      return;
    }

    for (const result of results) {
      const score = (result.score * 100).toFixed(0);
      console.log(`${chalk.green(result.path)} ${chalk.dim(`(${score}% - ${result.matchReason})`)}`);
      if (result.matchedSymbols && result.matchedSymbols.length > 0) {
        console.log(chalk.dim(`  Symbols: ${result.matchedSymbols.join(', ')}`));
      }
    }
    return;
  }

  // Get context for a task
  if (options.context) {
    console.log(chalk.cyan(`Getting context for: ${options.context}`));
    const context = await getTaskContext(options.context, rootDir, {
      maxFiles: 5,
      maxTotalSize: 30 * 1024,
    });

    if (context.files.length === 0) {
      console.log(chalk.yellow('No relevant files found.'));
      return;
    }

    console.log(chalk.dim(`Found ${context.files.length} files (${(context.totalSize / 1024).toFixed(1)}KB):\n`));
    for (const file of context.files) {
      console.log(chalk.green(`--- ${file.path} ---`) + chalk.dim(` (${file.reason})`));
      console.log(file.content);
      console.log('');
    }
    return;
  }

  // Index the codebase
  console.log(chalk.cyan(`Indexing ${rootDir}...`));

  const result = options.quick
    ? await quickIndex(rootDir)
    : await indexCodebase(rootDir, {
        maxFiles: options.maxFiles,
      });

  // Show summary
  console.log(chalk.green('\n' + getIndexSummary(result)));

  // Show config details
  if (options.config || result.config.configFiles.length > 0) {
    console.log(chalk.cyan('\nProject Configuration:'));
    console.log(getConfigSummary(result.config));
  }

  // Show graph summary
  if (options.graph) {
    console.log(chalk.cyan('\nDependency Graph:'));
    console.log(getGraphSummary(result.graph));
  }
}
