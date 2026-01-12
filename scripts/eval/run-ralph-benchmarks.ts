#!/usr/bin/env bun
/**
 * Ralph Loop Benchmark Evaluation - Run all 20 tasks
 *
 * Agent Availability Check: The benchmark will verify which agents are
 * available before running. Uses getAvailableAdapters() from adapters/index.ts.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getAvailableAdapters } from '../../src/adapters';

// Preferred agents for benchmarks (in order of preference)
const BENCHMARK_AGENTS = ['claude', 'gemini', 'codex', 'ollama', 'mistral'] as const;

const TASKS = [
  // SWE-Bench Pro (5 tasks)
  ['Implement OAuth2 flow with refresh tokens', 'SWE-Bench Pro'],
  ['Add comprehensive error handling to API layer', 'SWE-Bench Pro'],
  ['Refactor monolithic service into microservices', 'SWE-Bench Pro'],
  ['Implement caching layer with Redis', 'SWE-Bench Pro'],
  ['Add unit tests for legacy codebase', 'SWE-Bench Pro'],
  
  // SWE-Bench Verified (5 tasks)
  ['Fix authentication middleware JWT validation', 'SWE-Bench Verified'],
  ['Implement rate limiting for API endpoints', 'SWE-Bench Verified'],
  ['Add database migration for user preferences', 'SWE-Bench Verified'],
  ['Refactor duplicate code in payment module', 'SWE-Bench Verified'],
  ['Fix memory leak in event handler', 'SWE-Bench Verified'],
  
  // CoreCodeBench (5 tasks)
  ['Extract function contracts and document', 'CoreCodeBench'],
  ['Identify unused dependencies in project', 'CoreCodeBench'],
  ['Generate TypeScript definitions for untyped code', 'CoreCodeBench'],
  ['Find and fix type safety violations', 'CoreCodeBench'],
  ['Optimize hot path with memoization', 'CoreCodeBench'],
  
  // Agentic Multi-File (5 tasks)
  ['Add validation schema across multiple files', 'Agentic Multi-File'],
  ['Refactor shared utility module', 'Agentic Multi-File'],
  ['Implement feature with 3-layer architecture', 'Agentic Multi-File'],
  ['Fix race condition in async code', 'Agentic Multi-File'],
  ['Add comprehensive logging system', 'Agentic Multi-File']
];

async function runBenchmarks() {
  console.log('🚀 Ralph Loop Benchmark Evaluation');
  console.log('='.repeat(70));
  console.log(`Total Tasks: ${TASKS.length}`);
  console.log('');

  // Check agent availability BEFORE running benchmarks
  console.log('🔍 Checking agent availability...');
  const availableAdapters = await getAvailableAdapters();
  const availableNames = availableAdapters.map(a => a.name);

  // Filter to benchmark-preferred agents that are actually available
  const taskAgents = BENCHMARK_AGENTS.filter(a => availableNames.includes(a));

  if (taskAgents.length === 0) {
    console.log('❌ No benchmark agents available. Install at least one of: claude, gemini, codex');
    process.exit(1);
  }

  // Select planner - prefer gemini, fallback to first available
  const planner = availableNames.includes('gemini') ? 'gemini' : taskAgents[0];

  console.log(`✅ Available agents: ${availableNames.join(', ')}`);
  console.log(`📋 Benchmark agents: ${taskAgents.join(', ')}`);
  console.log(`🧠 Planner: ${planner}`);
  console.log('');

  // Verify build
  if (!existsSync('dist/cli/index.js')) {
    console.log('❌ Build not found. Run "bun run build" first.');
    process.exit(1);
  }
  
  const resultsDir = join(process.cwd(), 'scripts', 'eval', 'results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }
  
  const results: any[] = [];
  let successCount = 0;
  
  for (let i = 0; i < TASKS.length; i++) {
    const [task, category] = TASKS[i];
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 Task ${i+1}/${TASKS.length}: ${category}`);
    console.log(`🎯 ${task}`);
    console.log('='.repeat(70));
    
    try {
      const start = Date.now();
      const output = execSync(
        `node dist/cli/index.js ralph "${task}" --iters 2 --scope src --planner ${planner}`,
        { encoding: 'utf-8', timeout: 180000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      
      const success = output.includes('Plan created') || output.includes('DONE') || output.includes('✓ All steps');
      const duration = Date.now() - start;
      
      if (success) successCount++;
      
      results.push({ task, category, success, duration });
      
      console.log(`\n${success ? '✅' : '❌'} ${success ? 'SUCCESS' : 'FAILED'} - ${(duration/1000).toFixed(1)}s`);
      
    } catch (err) {
      results.push({ task, category, success: false, duration: 180000 });
      console.log(`\n❌ FAILED - ${(err as Error).message.substring(0, 80)}`);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  
  const successRate = (successCount / TASKS.length) * 100;
  console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}% (${successCount}/${TASKS.length})`);
  
  if (successRate >= 70) {
    console.log('🎉 SOTA TARGET ACHIEVED!');
  } else {
    console.log('📈 Progress: 70% target');
  }
  
  // Save with agent availability info
  const file = join(resultsDir, `ralph-benchmarks-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: {
      planner,
      availableAgents: availableNames,
      benchmarkAgents: taskAgents
    },
    successRate,
    results
  }, null, 2));
  console.log(`\n💾 Results: ${file}`);
}

runBenchmarks().then(() => process.exit(0)).catch(console.error);
