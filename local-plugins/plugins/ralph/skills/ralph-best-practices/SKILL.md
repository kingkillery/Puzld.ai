---
name: Ralph Best Practices
description: |
  This skill should be used when the user asks about "Ralph", "autonomous coding loop", "writing user stories for Ralph", "PRD structure", "prd.json format", "progress.txt format", or needs guidance on making Ralph iterations more effective.
version: 1.0.0
---

# Ralph Best Practices

Ralph is an autonomous AI coding loop that ships features while you sleep. This skill provides guidance on using Ralph effectively.

## How Ralph Works

Ralph operates in iterations:
1. **Pick**: Select highest-priority incomplete story from `prd.json`
2. **Implement**: Write code to satisfy acceptance criteria
3. **Check**: Run build/test commands
4. **Commit**: Create git commit if checks pass
5. **Log**: Append learnings to `progress.txt`
6. **Mark done**: Set `passes: true` in `prd.json`
7. **Repeat**: Loop until all stories complete

Memory persists via:
- **Git history**: Code changes and commit messages
- **prd.json**: Task list and completion status
- **progress.txt**: Learnings and patterns

## Critical Success Factors

### 1. Small Stories

Each story must fit in one context window. If a story is too big, Ralph will struggle.

**Too big:**
```json
{
  "title": "Build entire authentication system"
}
```

**Right size:**
```json
{"title": "Add login form UI"},
{"title": "Add email validation"},
{"title": "Add login API endpoint"},
{"title": "Add session management"}
```

### 2. Explicit Acceptance Criteria

Vague criteria lead to ambiguous implementations.

**Vague:**
```json
{
  "acceptanceCriteria": ["Users can log in"]
}
```

**Explicit:**
```json
{
  "acceptanceCriteria": [
    "Email/password fields present",
    "Email format validation with error message",
    "Submit button disabled until form valid",
    "./gradlew :app:assembleDebug succeeds"
  ]
}
```

### 3. Feedback Loops

Ralph REQUIRES fast feedback. Always include build/test criteria:

- `./gradlew :app:assembleDebug succeeds`
- `npm run build && npm test`
- `cargo build && cargo test`
- `pytest passes`

Without feedback loops, broken code compounds across iterations.

### 4. Learnings Compound

By story 10, Ralph knows patterns from stories 1-9. The `progress.txt` file is critical:

**Codebase Patterns section** (at top):
```markdown
## Codebase Patterns
- Migrations: Use IF NOT EXISTS
- React hooks: useRef<Timeout | null>(null)
- This repo uses Result<T> for error handling
```

**Per-story learnings**:
```markdown
## [2024-01-15] - US-003
- What was implemented
- **Learnings:**
  - ServiceTemplate is a data class, not enum - use .id for matching
  - In Compose LazyColumn, use items(list) not forEach inside item{}
```

### 5. Priority Ordering

Stories execute in priority order (lower number = higher priority). Order them by:
1. **Dependencies first**: If B depends on A, A must have lower priority
2. **Foundation before features**: Data models before UI
3. **Core before polish**: Basic functionality before edge cases

## prd.json Structure

```json
{
  "branchName": "ralph/feature-name",
  "userStories": [
    {
      "id": "US-001",
      "title": "Short description (1 line)",
      "acceptanceCriteria": [
        "Specific criterion 1",
        "Specific criterion 2",
        "Build/test command succeeds"
      ],
      "priority": 1,
      "passes": false,
      "notes": "Optional implementation hints"
    }
  ]
}
```

**Fields:**
- `id`: Unique identifier (US-XXX format)
- `title`: What to implement (keep short)
- `acceptanceCriteria`: Array of specific requirements
- `priority`: Execution order (1 = first)
- `passes`: Completion status (Ralph sets to true)
- `notes`: Optional context for implementer

## progress.txt Structure

```markdown
# Ralph Progress Log
Started: 2024-01-15

## Codebase Patterns
- Pattern 1: How to do X in this codebase
- Pattern 2: Convention for Y

## Key Files
- path/to/important/file.kt
- path/to/config.json

---

## [2024-01-15] - US-001
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Common Gotchas

### Idempotent Operations
Database migrations, file creation, etc. must handle re-runs:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
```

### Interactive Prompts
Avoid commands that prompt for input:
```bash
# Bad - will hang
npm run db:generate

# Good - auto-accept
echo -e "\n\n\n" | npm run db:generate
```

### Schema Changes Cascade
When modifying data models, also check:
- API endpoints
- UI components
- Tests
- Serialization/deserialization

### Fixing Related Files is OK
If typecheck reveals errors in files outside the story scope, fix them. This isn't scope creep - it's maintaining a working build.

## When NOT to Use Ralph

- **Exploratory work**: When you don't know what to build yet
- **Major refactors**: Without clear acceptance criteria
- **Security-critical code**: Needs human review
- **Complex debugging**: Requires interactive investigation
- **Design decisions**: Architecture choices need human judgment

## Monitoring Ralph

Check progress during a run:
```bash
# Story status
cat scripts/ralph/prd.json | jq '.userStories[] | {id, passes}'

# Recent learnings
tail -50 scripts/ralph/progress.txt

# Git commits
git log --oneline -10
```

## Tips for Maximum Effectiveness

1. **Front-load context**: Put key patterns in progress.txt before starting
2. **One feature per branch**: Don't mix unrelated work
3. **Review after completion**: Human review remains essential
4. **Start small**: Begin with 3-5 stories, not 20
5. **Watch first run**: Monitor the first few iterations to catch issues early
