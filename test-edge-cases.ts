/**
 * Edge case tests for game adapters
 * Tests whitespace handling, validation edge cases, etc.
 */

import { factoryAiDroidAdapter } from './src/adapters/factory-ai-droid';
import { charmCrushAdapter } from './src/adapters/charm-crush';

console.log('=== Testing Factory AI Droid Edge Cases ===\n');

// Test whitespace robustness
let factoryState = factoryAiDroidAdapter.initializeGame({ difficulty: 'easy' });

console.log('--- Test: Extra whitespace in build command ---');
let response = await factoryAiDroidAdapter.run('build  droid   miner', { state: factoryState });
factoryState = response.state!;
console.log(factoryState.status === 'playing' && factoryState.data.droids.length === 1
  ? '✓ PASS: Extra whitespace handled correctly'
  : '✗ FAIL: Extra whitespace broke command parsing');

console.log('\n--- Test: Validation with game over state ---');
factoryState.status = 'won';
const isValid = factoryAiDroidAdapter.validateCommand!('build droid miner', factoryState);
console.log(!isValid
  ? '✓ PASS: Commands rejected when game is over'
  : '✗ FAIL: Commands accepted when game is over');

console.log('\n--- Test: Invalid droid type ---');
factoryState = factoryAiDroidAdapter.initializeGame({ difficulty: 'easy' });
response = await factoryAiDroidAdapter.run('build droid invalid', { state: factoryState });
console.log(response.state!.status === 'invalid'
  ? '✓ PASS: Invalid droid type rejected'
  : '✗ FAIL: Invalid droid type accepted');

console.log('\n\n=== Testing Charm Crush Edge Cases ===\n');

let charmState = charmCrushAdapter.initializeGame({ difficulty: 'easy' });

console.log('--- Test: Diagonal swap rejection ---');
response = await charmCrushAdapter.run('swap 0 0 1 1', { state: charmState });
console.log(response.state!.status === 'invalid'
  ? '✓ PASS: Diagonal swap rejected'
  : '✗ FAIL: Diagonal swap accepted');

console.log('\n--- Test: Out of bounds swap ---');
response = await charmCrushAdapter.run('swap 0 0 0 8', { state: charmState });
console.log(response.state!.status === 'invalid'
  ? '✓ PASS: Out of bounds swap rejected'
  : '✗ FAIL: Out of bounds swap accepted');

console.log('\n--- Test: Board persistence across commands ---');
const boardBefore = JSON.stringify(charmState.data.board);
response = await charmCrushAdapter.run('status', { state: charmState });
const boardAfter = JSON.stringify(response.state!.data.board);
console.log(boardBefore === boardAfter
  ? '✓ PASS: Board unchanged by status command'
  : '✗ FAIL: Board changed by status command');

console.log('\n--- Test: Swap that creates no match is undone ---');
// Try to find a swap that won't create a match
let foundNoMatchSwap = false;
for (let r = 0; r < 7; r++) {
  for (let c = 0; c < 7; c++) {
    // Try swapping right
    const testState = JSON.parse(JSON.stringify(charmState));
    const temp = testState.data.board[r][c];
    testState.data.board[r][c] = testState.data.board[r][c + 1];
    testState.data.board[r][c + 1] = temp;

    const matches = charmCrushAdapter.detectMatches(testState.data.board);
    if (matches.length === 0) {
      // Found a swap that creates no match
      const boardBeforeSwap = JSON.stringify(charmState.data.board);
      response = await charmCrushAdapter.run(`swap ${r} ${c} ${r} ${c + 1}`, { state: charmState });
      const boardAfterSwap = JSON.stringify(response.state!.data.board);

      console.log(boardBeforeSwap === boardAfterSwap && response.state!.status === 'invalid'
        ? '✓ PASS: No-match swap is undone'
        : '✗ FAIL: No-match swap changed board');
      foundNoMatchSwap = true;
      break;
    }
  }
  if (foundNoMatchSwap) break;
}

if (!foundNoMatchSwap) {
  console.log('⚠ SKIP: Could not find a no-match swap to test undo');
}

console.log('\n\n=== Edge Case Tests Complete ===\n');
