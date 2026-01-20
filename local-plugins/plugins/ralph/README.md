# Ralph Plugin for Claude Code

Autonomous AI coding loop that ships features while you sleep.

Ralph picks stories from a PRD, implements them one by one, runs checks, commits, logs learnings, and repeats until all stories are complete.

## Installation

```bash
# Install from local directory
claude --plugin-dir /path/to/ralph-plugin

# Or copy to your plugins directory
cp -r ralph-plugin ~/.claude/plugins/
```

## Quick Start

```bash
# 1. Initialize Ralph in your project
/ralph init my-feature

# 2. Add user stories
/ralph add "Add login form validation"

# 3. Check status
/ralph status

# 4. Start the autonomous loop
/ralph start 20  # Run up to 20 iterations
```

## Commands

| Command | Description |
|---------|-------------|
| `/ralph init [branch]` | Initialize Ralph scaffolding (prd.json, prompt.md, progress.txt) |
| `/ralph add [title]` | Add a new user story to the PRD |
| `/ralph status` | Show progress - completed/remaining stories |
| `/ralph start [max]` | Start the autonomous loop (default: 10 iterations) |

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Ralph Loop                           │
├─────────────────────────────────────────────────────────┤
│  1. Pick highest-priority incomplete story              │
│  2. Implement that ONE story                            │
│  3. Run build/test checks                               │
│  4. Commit if passing                                   │
│  5. Mark story done in prd.json                         │
│  6. Log learnings to progress.txt                       │
│  7. Repeat until all stories pass                       │
└─────────────────────────────────────────────────────────┘
```

Each iteration is a **fresh Claude instance** with clean context. Memory persists via:
- **Git history**: Code changes and commit messages
- **prd.json**: Task list and completion status
- **progress.txt**: Learnings and codebase patterns

## File Structure

After initialization, Ralph creates:

```
scripts/ralph/
├── prd.json       # User stories and completion status
├── prompt.md      # Instructions for each iteration
├── progress.txt   # Learnings log
└── last_run.log   # Output from last run
```

## Writing Good User Stories

### Keep Stories Small

Each story must fit in one context window.

```json
// Too big
{"title": "Build entire auth system"}

// Right size
{"title": "Add login form"},
{"title": "Add email validation"},
{"title": "Add auth endpoint"}
```

### Be Explicit

Vague criteria lead to ambiguous implementations.

```json
// Vague
{"acceptanceCriteria": ["Users can log in"]}

// Explicit
{"acceptanceCriteria": [
  "Email/password fields present",
  "Email format validation",
  "Error message on failure",
  "./gradlew assembleDebug succeeds"
]}
```

### Always Include Build Check

Ralph needs feedback loops. Every story should include:

```json
{"acceptanceCriteria": [
  "...",
  "./gradlew :app:assembleDebug succeeds"
]}
```

## Monitoring

```bash
# Check story progress
cat scripts/ralph/prd.json | jq '.userStories[] | {id, passes}'

# View learnings
cat scripts/ralph/progress.txt

# Check recent commits
git log --oneline -10

# Watch the log
tail -f scripts/ralph/last_run.log
```

## Requirements

- Claude Code CLI (`claude` command available)
- Git (for commits and branch management)
- Bash (for the orchestration script)
- Project-specific build tools (Gradle, npm, cargo, etc.)

### Windows Users

The `ralph.sh` orchestration script requires a Bash environment:
- **Git Bash** (recommended, comes with Git for Windows)
- **WSL** (Windows Subsystem for Linux)
- **Cygwin**

Run `/ralph start` from within your Bash environment.

## Tips

1. **Front-load context**: Add known patterns to progress.txt before starting
2. **Start small**: Begin with 3-5 stories, not 20
3. **Watch first run**: Monitor initial iterations to catch issues
4. **Review after**: Human review remains essential
5. **One feature per branch**: Don't mix unrelated work

## When NOT to Use Ralph

- Exploratory work (don't know what to build)
- Major refactors without clear criteria
- Security-critical code (needs human review)
- Complex debugging (needs investigation)

## License

MIT
