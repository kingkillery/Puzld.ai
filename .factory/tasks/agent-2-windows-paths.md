# Task: Windows Path Handling Improvements

## Assignee
Agent 2

## Priority
Should (from Backlog S)

## Objective
Improve Windows path handling in the permission tracker and related file operations to prevent path comparison bugs.

## Context
From the discovery document (section O - Key Risks):
- Risk: "Windows path quirks" - Impact: Med, Likelihood: Med
- Mitigation needed: "Normalize separators; add Windows CI smoke tests; avoid path startsWith bugs for allowedDir"

Current issues:
- `allow_dir` comparisons may fail due to backslash vs forward slash inconsistencies
- Path normalization is inconsistent across the codebase
- No Windows-specific test coverage

## Deliverables

### 1. Path Normalization Utility (`src/lib/paths.ts`)
Create a centralized path utility:
```typescript
// src/lib/paths.ts
export function normalizePath(p: string): string;
export function isSubPath(child: string, parent: string): boolean;
export function pathsEqual(a: string, b: string): boolean;
export function toForwardSlash(p: string): string;
export function toPlatformPath(p: string): string;
```

### 2. Permission Tracker Fixes
Update `src/agentic/tools/permissions.ts` (or equivalent):
- [ ] Use `normalizePath()` for all path comparisons
- [ ] Fix `allowedDir` / `allow_dir` logic to handle:
  - `C:\Users\foo` vs `C:/Users/foo`
  - Trailing slash inconsistencies
  - Case sensitivity (Windows is case-insensitive)
- [ ] Add explicit Windows path handling in `isPathAllowed()` checks

### 3. Audit & Fix Other Path Usages
Search codebase for path comparisons and fix:
- [ ] `src/agentic/tools/*.ts` - All tool file path handling
- [ ] `src/indexing/*` - Index path storage/comparison
- [ ] `src/memory/*` - Session file paths
- [ ] `src/lib/config.ts` - Config directory paths

### 4. Windows Path Tests
Create `src/lib/paths.test.ts`:
- [ ] Test `normalizePath` with mixed separators
- [ ] Test `isSubPath` with Windows-style paths
- [ ] Test case-insensitive comparison on Windows
- [ ] Test UNC paths if relevant (`\\server\share`)
- [ ] Test drive letter handling (`C:` vs `c:`)

### 5. CI Smoke Test (if applicable)
- [ ] Document Windows path test cases in test file
- [ ] Ensure tests run on Windows (or are skipped gracefully on Unix)

## Files to Create/Modify
- NEW: `src/lib/paths.ts` - Path utilities
- NEW: `src/lib/paths.test.ts` - Path tests
- MODIFY: `src/agentic/tools/permissions.ts` - Use normalized paths
- MODIFY: Other files using path comparisons (audit needed)

## Code Patterns to Find & Fix

### Pattern 1: Direct path.startsWith
```typescript
// BAD
if (filePath.startsWith(allowedDir)) { ... }

// GOOD
import { isSubPath } from '../lib/paths';
if (isSubPath(filePath, allowedDir)) { ... }
```

### Pattern 2: Hardcoded separators
```typescript
// BAD
const configPath = baseDir + '/' + 'config.json';

// GOOD
import path from 'path';
const configPath = path.join(baseDir, 'config.json');
```

### Pattern 3: String path comparisons
```typescript
// BAD
if (pathA === pathB) { ... }

// GOOD
import { pathsEqual } from '../lib/paths';
if (pathsEqual(pathA, pathB)) { ... }
```

## Success Criteria
1. All path comparisons use centralized utilities
2. Permission tracker correctly handles Windows paths
3. Tests pass for mixed-separator scenarios
4. No regression on Unix/macOS path handling

## References
- Current permission handling: `src/agentic/tools/`
- Section O in discovery doc (Key Risks - Windows path quirks)
- Node.js `path` module documentation

## Notes
- Use `path.normalize()` as a foundation but add cross-platform logic
- Consider using `path.posix` vs `path.win32` for explicit handling
- Test with actual Windows paths, not just forward-slash simulation
