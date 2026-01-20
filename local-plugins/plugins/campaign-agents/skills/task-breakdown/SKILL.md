---
name: task-breakdown
description: This skill provides patterns for breaking down campaign goals into granular, dependency-aware tasks. Use when planning campaigns, creating task graphs, or decomposing complex objectives.
---

# Task Breakdown Patterns

Patterns and strategies for decomposing campaign goals into executable tasks.

## Decomposition Strategies

### 1. Vertical Slicing
Break work by user-facing feature slices:
- Each slice is independently deployable
- Includes all layers (UI, API, DB)
- Enables incremental delivery

### 2. Horizontal Layering
Break work by technical layer:
- Foundation first (types, utilities, configs)
- Data layer (schemas, APIs, state)
- UI layer (components, pages, routes)
- Testing layer (unit, integration, e2e)

### 3. Dependency-First
Order by dependency graph:
1. Identify leaf nodes (no dependencies)
2. Work up dependency tree
3. Parallelize independent subtrees

## Task Granularity Guidelines

### Atomic Tasks
- Completable in single worker session
- Touch 1-5 files typically
- Clear success criteria
- Testable in isolation

### Task Sizing
| Size | Files | Est. Lines | Duration |
|------|-------|------------|----------|
| Small | 1-2 | < 100 | 5-15 min |
| Medium | 3-5 | 100-500 | 15-30 min |
| Large | 5-10 | 500+ | 30-60 min |

If task exceeds "Large", split further.

## Task Specification Template

```json
{
  "id": "T1",
  "title": "Concise action description",
  "description": "Detailed requirements and context",
  "domain": "ui|data|infra|test|devops|docs",
  "files": ["src/path/to/file.ts"],
  "dependencies": ["T0"],
  "entry_criteria": [
    {"criterion": "Dependency T0 completed", "check_command": "test -f .task-T0-complete"}
  ],
  "exit_criteria": [
    {"criterion": "Component renders without errors", "check_command": "npm run build"},
    {"criterion": "All tests pass", "check_command": "npm test"},
    {"criterion": "No type errors", "check_command": "npm run typecheck"}
  ],
  "step_hints": ["Check existing patterns in src/components", "Reuse utility functions"],
  "context_files": ["src/types.ts", "src/utils.ts"]
}
```

**Task ID Format:** Always use `T<number>` format (T1, T2, T3...). Sequential integers.

## Common Patterns by Campaign Type

### Migration Campaign
1. Set up target framework/library
2. Create shared utilities and types
3. Migrate leaf components first
4. Migrate parent components
5. Update imports and exports
6. Remove old framework code
7. Update tests

### Refactoring Campaign
1. Add tests for current behavior
2. Identify extraction boundaries
3. Extract shared code
4. Update consumers
5. Clean up old code
6. Validate behavior unchanged

### Feature Addition Campaign
1. Design data model
2. Create types/interfaces
3. Implement data layer
4. Build UI components
5. Wire up state management
6. Add error handling
7. Write tests
8. Add documentation

## Dependency Management

### Identifying Dependencies
- Import statements
- Shared state
- API contracts
- Database schemas
- Configuration files

### Breaking Circular Dependencies
1. Extract shared interface
2. Invert dependency direction
3. Introduce mediator pattern
4. Split into phases

## Risk Assessment

Tag tasks with risk levels:
- **Low**: Isolated changes, good test coverage
- **Medium**: Cross-cutting, some test coverage
- **High**: Core functionality, limited tests
- **Critical**: Data migration, authentication, billing

High/Critical tasks need extra review or user approval.
