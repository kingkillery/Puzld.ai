---
name: conflict-resolution
description: This skill provides strategies for resolving git merge conflicts in campaign branches. Use when workers create conflicting changes or when rebasing onto updated base branches.
---

# Conflict Resolution Strategies

Patterns for resolving merge conflicts in multi-worker campaigns.

## Conflict Types

### 1. Line-Level Conflicts
Same lines modified differently in both branches.

**Resolution Strategy**:
- Understand intent of both changes
- Merge semantically, not textually
- Preserve all intentional changes

### 2. Import Conflicts
Both branches add/modify imports.

**Resolution Strategy**:
```typescript
// Combine all imports
import { A, B } from './moduleA';  // from branch 1
import { C, D } from './moduleB';  // from branch 2
import { E } from './moduleC';     // from both (dedupe)
```

### 3. Function Conflicts
Both branches modify same function.

**Resolution Strategy**:
- If additive (both add code): merge carefully
- If conflicting logic: escalate for review
- If one refactors, one adds: apply refactor, then add

### 4. Type/Interface Conflicts
Both branches extend types.

**Resolution Strategy**:
```typescript
// Merge type definitions
interface User {
  id: string;
  name: string;      // from base
  email: string;     // from branch 1
  avatar?: string;   // from branch 2
}
```

## Git Commands Reference

### Detect Conflicts
```bash
# Check for conflicts
git status

# List conflicting files
git diff --name-only --diff-filter=U
```

### Resolve Conflicts
```bash
# After manual resolution
git add <resolved-file>

# Continue merge/rebase
git merge --continue
# or
git rebase --continue
```

### Abort if Needed
```bash
git merge --abort
git rebase --abort
```

## Conflict Markers

```
<<<<<<< HEAD (current branch)
  current branch code
=======
  incoming branch code
>>>>>>> feature-branch
```

Resolution: Remove markers and keep correct code.

## Semantic Merge Rules

### Preserve Both Changes When:
- Changes are additive (new functions, new fields)
- Changes affect different code paths
- Changes are in different scopes

### Choose One When:
- Logic is mutually exclusive
- Only one approach is correct
- Changes conflict on business logic

### Escalate When:
- Both changes are valid but incompatible
- Business decision required
- Risk of breaking functionality

## Validation After Merge

Always validate after resolving conflicts:

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Tests
npm test

# 4. Build
npm run build
```

If any step fails, the resolution is incomplete.

## Common Pitfalls

### 1. Losing Code
Always compare line counts before/after merge.

### 2. Duplicate Imports
Check for duplicate imports after merging.

### 3. Missing Dependencies
If both branches add dependencies, merge package.json carefully.

### 4. Stale References
After merge, search for references to removed code.

## Escalation Criteria

Escalate to user when:
1. Semantic ambiguity (both valid)
2. Business logic conflict
3. Breaking changes unavoidable
4. Test failures persist
5. Unclear original intent
