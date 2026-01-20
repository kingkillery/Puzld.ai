---
domain: test
keywords: [test, coverage, unit, integration, jest, pytest, vitest, testing]
confidence: high
---

# Test Coverage Pattern

## Context
Use when adding tests to existing code or improving test coverage metrics.

## Steps
1. Run coverage report to identify gaps (`npm run coverage` or `pytest --cov`)
2. Prioritize testing: critical paths > edge cases > utilities
3. Write tests for public API surface first
4. Add integration tests for component interactions
5. Mock external dependencies (APIs, databases)
6. Add edge case tests (null, empty, boundary values)
7. Verify coverage improvement

## Pitfalls
- Don't test implementation details, test behavior
- Avoid excessive mocking that hides real bugs
- Watch for flaky tests (timing, random data)
- Coverage percentage isn't everything - test quality matters

## Example
```typescript
// Good: Tests behavior
it('should return user profile when authenticated', async () => {
  const result = await getProfile(validToken);
  expect(result.email).toBeDefined();
});

// Bad: Tests implementation
it('should call database.query with correct SQL', () => {
  // This breaks when implementation changes
});
```

## Verification Commands
- `npm run test:coverage` - Check coverage percentage
- `npm run test -- --watch` - Watch mode for TDD
- `pytest --cov --cov-report=html` - HTML coverage report
