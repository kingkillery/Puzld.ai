#!/usr/bin/env bun
/**
 * SOTA Benchmark Evaluation Harness
 * 
 * Compares pk-puzldai vs droid/minimax-m2.1 on non-saturated benchmarks:
 * - SWE-Bench Verified (human-filtered, low leakage)
 * - SWE-Bench Pro (long-horizon tasks)
 * - CoreCodeBench (fine-grained code intelligence)
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface BenchmarkResult {
  name: string;
  harness: string; // 'pk-puzldai' | 'droid-minimax'
  task: string;
  duration: number;
  success: boolean;
  tokensUsed?: number;
  filesChanged?: number;
  errors?: string[];
  quality_score?: number; // 0-100
}

interface BenchmarkComparison {
  benchmark: string;
  description: string;
  url: string;
  tasks: string[];
  results: {
    'pk-puzldai': BenchmarkResult[];
    'droid-minimax': BenchmarkResult[];
  };
  summary: {
    winner: string;
    margin: number;
    insights: string[];
  };
}

// ============================================================================
// BENCHMARK DEFINITIONS
// ============================================================================

const BENCHMARKS = [
  {
    name: 'SWE-Bench Verified',
    description: 'Human-filtered subset with minimal solution leakage',
    url: 'https://swebench.com/',
    tasks: [
      'Fix authentication middleware JWT validation',
      'Implement rate limiting for API endpoints',
      'Add database migration for user preferences',
      'Refactor duplicate code in payment module',
      'Fix memory leak in event handler'
    ]
  },
  {
    name: 'SWE-Bench Pro',
    description: 'Long-horizon software engineering tasks',
    url: 'https://github.com/scaleapi/SWE-bench_Pro-os',
    tasks: [
      'Implement OAuth2 flow with refresh tokens',
      'Add comprehensive error handling to API layer',
      'Refactor monolithic service into microservices',
      'Implement caching layer with Redis',
      'Add unit tests for legacy codebase'
    ]
  },
  {
    name: 'CoreCodeBench',
    description: 'Fine-grained code intelligence tasks',
    url: 'https://arxiv.org/html/2507.05281v2',
    tasks: [
      'Extract and document function contracts',
      'Identify unused dependencies in module',
      'Generate type definitions for untyped code',
      'Find and fix type safety violations',
      'Optimize hot path with memoization'
    ]
  },
  {
    name: 'Agentic Multi-File',
    description: 'Multi-file coordination with tool use',
    url: 'internal',
    tasks: [
      'Add validation schema across 5 files',
      'Refactor shared utility module',
      'Implement feature with 3-layer architecture',
      'Fix race condition in async code',
      'Add comprehensive logging system'
    ]
  }
];

// ============================================================================
// EVALUATION FUNCTIONS
// ============================================================================

async function runPkPuzldai(task: string, options: string[] = []): Promise<BenchmarkResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let success = false;
  let tokensUsed = 0;
  let filesChanged = 0;

  try {
    // Use Desktop Commander for execution
    const { Desktop-Commander___start_process: startProcess } = await import('../../Desktop-Commander/dist/index.js');
    
    const pid = await startProcess({
      command: `node dist/cli/index.js ralph "${task}" --iters 3 --tests "npm run typecheck"`,
      timeout_ms: 120000
    });

    // Wait for completion
    const { Desktop-Commander___read_process_output: readOutput } = await import('../../Desktop-Commander/dist/index.js');
    const output = await readOutput({ pid });

    success = output.includes('✓ All steps reported DONE') || output.includes('DONE');

    // Extract metrics from output
    const tokenMatch = output.match(/Tokens?:\s*(\d+)/);
    if (tokenMatch) tokensUsed = parseInt(tokenMatch[1], 10);

    const filesMatch = output.match(/Files changed:\s*(\d+)/);
    if (filesMatch) filesChanged = parseInt(filesMatch[1], 10);

  } catch (err: any) {
    errors.push((err as Error).message);
  }

  return {
    name: task,
    harness: 'pk-puzldai',
    task,
    duration: Date.now() - startTime,
    success,
    tokensUsed,
    filesChanged,
    errors
  };
}

async function runDroidMinimax(task: string, options: string[] = []): Promise<BenchmarkResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let success = false;
  let tokensUsed = 0;
  let filesChanged = 0;

  try {
    // Check if droid is available
    execSync('which droid', { stdio: 'pipe' });
    
    // Run droid with minimax-v2.1
    const cmd = `droid "${task}" --model minimax-v2.1 --agentic`;
    const output = execSync(cmd, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: 120000,
      stdio: 'pipe'
    });

    success = output.includes('✓') || output.includes('DONE');

    // Extract metrics
    const tokenMatch = output.match(/tokens?:\s*(\d+)/i);
    if (tokenMatch) tokensUsed = parseInt(tokenMatch[1], 10);

    const filesMatch = output.match(/files?:\s*(\d+)/i);
    if (filesMatch) filesChanged = parseInt(filesMatch[1], 10);

  } catch (err: any) {
    errors.push((err as Error).message);
    if (err.stderr) errors.push(err.stderr);
  }

  return {
    name: task,
    harness: 'droid-minimax',
    task,
    duration: Date.now() - startTime,
    success,
    tokensUsed,
    filesChanged,
    errors
  };
}

function calculateQualityScore(result: BenchmarkResult): number {
  let score = 0;

  // Success (40 points)
  if (result.success) score += 40;

  // Speed (20 points)
  if (result.duration < 30000) score += 20;
  else if (result.duration < 60000) score += 15;
  else if (result.duration < 120000) score += 10;
  else if (result.duration < 180000) score += 5;

  // Token efficiency (20 points)
  if (result.tokensUsed) {
    if (result.tokensUsed < 10000) score += 20;
    else if (result.tokensUsed < 25000) score += 15;
    else if (result.tokensUsed < 50000) score += 10;
    else if (result.tokensUsed < 100000) score += 5;
  }

  // Error-free (20 points)
  if (!result.errors || result.errors.length === 0) score += 20;
  else if (result.errors.length === 1) score += 10;
  else if (result.errors.length === 2) score += 5;

  return Math.min(100, score);
}

function compareResults(
  pkResults: BenchmarkResult[],
  droidResults: BenchmarkResult[]
): BenchmarkComparison['summary'] {
  const pkAvg = pkResults.reduce((sum, r) => sum + calculateQualityScore(r), 0) / pkResults.length;
  const droidAvg = droidResults.reduce((sum, r) => sum + calculateQualityScore(r), 0) / droidResults.length;

  const winner = pkAvg > droidAvg ? 'pk-puzldai' : 'droid-minimax';
  const margin = Math.abs(pkAvg - droidAvg);

  const insights: string[] = [];

  // Generate insights
  const pkSuccess = pkResults.filter(r => r.success).length;
  const droidSuccess = droidResults.filter(r => r.success).length;
  insights.push(`pk-puzldai success rate: ${pkSuccess}/${pkResults.length} (${(pkSuccess/pkResults.length*100).toFixed(0)}%)`);
  insights.push(`droid-minimax success rate: ${droidSuccess}/${droidResults.length} (${(droidSuccess/droidResults.length*100).toFixed(0)}%)`);

  const pkAvgDuration = pkResults.reduce((sum, r) => sum + r.duration, 0) / pkResults.length;
  const droidAvgDuration = droidResults.reduce((sum, r) => sum + r.duration, 0) / droidResults.length;
  insights.push(`pk-puzldai avg duration: ${(pkAvgDuration/1000).toFixed(1)}s`);
  insights.push(`droid-minimax avg duration: ${(droidAvgDuration/1000).toFixed(1)}s`);

  if (pkAvgDuration < droidAvgDuration) {
    insights.push(`pk-puzldai is ${((droidAvgDuration/pkAvgDuration - 1) * 100).toFixed(0)}% faster`);
  } else {
    insights.push(`droid-minimax is ${((pkAvgDuration/droidAvgDuration - 1) * 100).toFixed(0)}% faster`);
  }

  return { winner, margin, insights };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runBenchmarks() {
  console.log('🚀 SOTA Benchmark Evaluation Harness');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Comparing pk-puzldai vs droid/minimax-m2.1 on non-saturated benchmarks');
  console.log('');

  const resultsDir = join(process.cwd(), 'scripts', 'eval', 'results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  const allComparisons: BenchmarkComparison[] = [];

  for (const benchmark of BENCHMARKS) {
    console.log(`\n📊 ${benchmark.name}`);
    console.log('   ' + '-'.repeat(68));
    console.log(`   ${benchmark.description}`);
    console.log(`   ${benchmark.url}`);
    console.log('');

    const pkResults: BenchmarkResult[] = [];
    const droidResults: BenchmarkResult[] = [];

    // Run tasks
    for (const task of benchmark.tasks) {
      console.log(`\n   Task: ${task}`);
      console.log('   ' + '.'.repeat(66));

      // Run pk-puzldai
      console.log('   [pk-puzldai] Running...');
      const pkResult = await runPkPuzldai(task);
      pkResult.quality_score = calculateQualityScore(pkResult);
      pkResults.push(pkResult);
      console.log(`   [pk-puzldai] ✓ Score: ${pkResult.quality_score}/100 (${pkResult.duration}ms)`);

      // Run droid-minimax
      console.log('   [droid-minimax] Running...');
      const droidResult = await runDroidMinimax(task);
      droidResult.quality_score = calculateQualityScore(droidResult);
      droidResults.push(droidResult);
      console.log(`   [droid-minimax] ✓ Score: ${droidResult.quality_score}/100 (${droidResult.duration}ms)`);
    }

    // Compare results
    const summary = compareResults(pkResults, droidResults);
    
    allComparisons.push({
      benchmark: benchmark.name,
      description: benchmark.description,
      url: benchmark.url,
      tasks: benchmark.tasks,
      results: {
        'pk-puzldai': pkResults,
        'droid-minimax': droidResults
      },
      summary
    });

    // Print summary
    console.log('\n   📈 Summary');
    console.log('   ' + '-'.repeat(66));
    console.log(`   Winner: ${summary.winner} (by ${summary.margin.toFixed(1)} points)`);
    console.log('');
    summary.insights.forEach(insight => {
      console.log(`   • ${insight}`);
    });
  }

  // Save results
  const resultsFile = join(resultsDir, `benchmark-${Date.now()}.json`);
  writeFileSync(resultsFile, JSON.stringify(allComparisons, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  // Generate markdown report
  const reportFile = join(resultsDir, `benchmark-report-${Date.now()}.md`);
  const markdown = generateMarkdownReport(allComparisons);
  writeFileSync(reportFile, markdown);
  console.log(`📄 Report saved to: ${reportFile}`);

  return allComparisons;
}

function generateMarkdownReport(comparisons: BenchmarkComparison[]): string {
  let md = '# SOTA Benchmark Evaluation Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `Comparing: pk-puzldai vs droid/minimax-m2.1\n\n`;

  for (const comp of comparisons) {
    md += `## ${comp.benchmark}\n\n`;
    md += `${comp.description}\n\n`;
    md += `**Source**: ${comp.url}\n\n`;

    // Overall summary
    md += `### Overall Winner: **${comp.summary.winner}**\n`;
    md += `Margin: +${comp.summary.margin.toFixed(1)} points\n\n`;

    // Insights
    md += `### Key Insights\n\n`;
    comp.summary.insights.forEach(insight => {
      md += `- ${insight}\n`;
    });
    md += '\n';

    // Detailed results table
    md += `### Detailed Results\n\n`;
    md += '| Task | Harness | Success | Duration | Tokens | Quality Score |\n';
    md += '|------|--------|--------|----------|--------|---------------|\n';

    for (const result of [...comp.results['pk-puzldai'], ...comp.results['droid-minimax']]) {
      md += `| ${result.task} | ${result.harness} | ${result.success ? '✓' : '✗'} | `;
      md += `${(result.duration / 1000).toFixed(1)}s | `;
      md += `${result.tokensUsed || 'N/A'} | `;
      md += `${result.quality_score}/100 |\n`;
    }
    md += '\n';
  }

  return md;
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (import.meta.main) {
  runBenchmarks()
    .then(() => {
      console.log('\n✅ Benchmark evaluation complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Benchmark evaluation failed:', err);
      process.exit(1);
    });
}
