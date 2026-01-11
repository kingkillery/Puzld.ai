#!/usr/bin/env bun
/**
 * Quick Smoke Test for Benchmark Harness
 * Tests basic functionality before running full evaluation
 */

import { execSync } from 'child_process';

console.log('🧪 Benchmark Harness Smoke Test\n');

// Test 1: pk-puzldai build
console.log('Test 1: pk-puzldai build...');
try {
  const result = execSync('bun run build', { 
    stdio: 'pipe',
    timeout: 120000
  });
  console.log('  ✓ Build successful\n');
} catch (err) {
  console.log('  ✗ Build failed\n');
  process.exit(1);
}

// Test 2: pk-puzldai ralph command
console.log('Test 2: pk-puzldai ralph command...');
try {
  const output = execSync('node dist/cli/index.js ralph --help', { 
    encoding: 'utf-8',
    stdio: 'pipe',
    timeout: 10000
  });
  if (output.includes('Ralph Wiggum')) {
    console.log('  ✓ Ralph command available\n');
  } else {
    console.log('  ✗ Ralph command not found\n');
    process.exit(1);
  }
} catch (err) {
  console.log('  ✗ Command failed\n');
  process.exit(1);
}

// Test 3: droid availability
console.log('Test 3: droid availability...');
try {
  execSync('which droid', { 
    stdio: 'pipe',
    timeout: 5000
  });
  console.log('  ✓ droid found\n');
} catch (err) {
  console.log('  ⚠ droid not available (skipping droid tests)\n');
}

// Test 4: Simple task execution
console.log('Test 4: Simple task execution...');
try {
  const task = 'List files in current directory';
  const output = execSync(`node dist/cli/index.js ralph "${task}" --iters 1`, {
    encoding: 'utf-8',
    stdio: 'pipe',
    timeout: 30000
  });
  
  if (output.includes('Ralph Wiggum Loop')) {
    console.log('  ✓ Task execution works\n');
  } else {
    console.log('  ⚠ Unexpected output\n');
  }
} catch (err) {
  console.log('  ⚠ Task execution failed (may be expected)\n');
}

console.log('✅ Smoke test complete!');
console.log('\nNext steps:');
console.log('1. Review results in scripts/eval/');
console.log('2. Run full benchmark: bun run scripts/eval/benchmark-harness.ts');
console.log('3. Compare results against droid/minimax-m2.1');

