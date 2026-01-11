/**
 * Evaluation CLI Command
 *
 * Run evaluations to verify the automatic approach selection
 * produces correct and high-quality results.
 */

import pc from 'picocolors';
import { createSpinner } from 'nanospinner';
import {
  runEvalSuite,
  runEval,
  classifyTask,
  DEFAULT_EVAL_TASKS,
  type EvalSummary,
} from '../../eval/evaluator';

interface EvalCommandOptions {
  task?: string;
  full?: boolean;
  classify?: boolean;
  verbose?: boolean;
}

/**
 * Print evaluation summary
 */
function printSummary(summary: EvalSummary): void {
  console.log('');
  console.log(pc.bold('=== Evaluation Summary ==='));
  console.log('');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed:      ${pc.green(summary.passed.toString())}`);
  console.log(`Failed:      ${summary.failed > 0 ? pc.red(summary.failed.toString()) : '0'}`);
  console.log(`Avg Quality: ${summary.avgQuality.toFixed(1)}/10`);
  console.log(`Avg Time:    ${(summary.avgDuration / 1000).toFixed(1)}s`);
  console.log('');

  // Print detailed results
  console.log(pc.bold('Results:'));
  for (const result of summary.results) {
    const statusIcon = result.success ? pc.green('OK') : pc.red('FAIL');
    const qualityStr = result.quality
      ? `[${result.quality.score}/10]`
      : '';

    console.log(
      `  ${statusIcon} ${result.classifiedAs.padEnd(10)} ${qualityStr.padEnd(8)} ${result.task.slice(0, 50)}...`
    );

    if (!result.success && result.error) {
      console.log(pc.red(`       Error: ${result.error}`));
    }
  }
}

/**
 * Print classification table
 */
function printClassificationTable(): void {
  console.log('');
  console.log(pc.bold('=== Task Classification Test ==='));
  console.log('');

  const testTasks = [
    { task: 'Implement user authentication', expected: 'implement' },
    { task: 'Fix the login bug', expected: 'fix' },
    { task: 'Check for security vulnerabilities', expected: 'security' },
    { task: 'Refactor the database layer', expected: 'refactor' },
    { task: 'Analyze the performance', expected: 'analyze' },
    { task: 'Explain how middleware works', expected: 'explain' },
    { task: 'Hello', expected: 'simple' },
    { task: 'Create a caching layer for database queries with invalidation', expected: 'implement' },
  ];

  let correct = 0;
  for (const { task, expected } of testTasks) {
    const result = classifyTask(task);
    const isCorrect = result === expected;
    if (isCorrect) correct++;

    const icon = isCorrect ? pc.green('OK') : pc.red('FAIL');
    const resultStr = isCorrect
      ? pc.dim(result)
      : `${pc.red(result)} (expected: ${expected})`;

    console.log(`  ${icon} "${task.slice(0, 40).padEnd(40)}" -> ${resultStr}`);
  }

  const accuracy = (correct / testTasks.length) * 100;
  console.log('');
  console.log(`Accuracy: ${accuracy === 100 ? pc.green('100%') : pc.yellow(`${accuracy.toFixed(0)}%`)} (${correct}/${testTasks.length})`);
}

/**
 * Evaluation command handler
 */
export async function evalCommand(options: EvalCommandOptions): Promise<void> {
  // Classification test only
  if (options.classify) {
    printClassificationTable();
    return;
  }

  // Single task evaluation
  if (options.task) {
    const spinner = createSpinner('Evaluating task...').start();

    const result = await runEval(options.task, { verbose: options.verbose });

    spinner.success({ text: 'Evaluation complete' });

    console.log('');
    console.log(pc.bold('Task:'), options.task);
    console.log(pc.bold('Classified as:'), result.classifiedAs);
    console.log(pc.bold('Mode used:'), result.modeUsed);
    console.log(pc.bold('Status:'), result.success ? pc.green('Success') : pc.red('Failed'));
    console.log(pc.bold('Duration:'), `${(result.duration / 1000).toFixed(1)}s`);

    if (result.quality) {
      console.log(pc.bold('Quality:'), `${result.quality.score}/10`);
      console.log(pc.bold('Reasoning:'), result.quality.reasoning);
    }

    if (result.error) {
      console.log(pc.bold('Error:'), pc.red(result.error));
    }

    return;
  }

  // Full evaluation suite
  if (options.full) {
    const spinner = createSpinner('Running full evaluation suite...').start();

    const summary = await runEvalSuite(DEFAULT_EVAL_TASKS, {
      verbose: options.verbose,
    });

    spinner.success({ text: 'Evaluation complete' });

    printSummary(summary);
    return;
  }

  // Default: quick classification test
  printClassificationTable();
}
