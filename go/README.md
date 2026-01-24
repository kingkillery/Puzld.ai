# Go Orchestrator (Experimental)

This directory contains a minimal Go implementation of the agent loop, modeled on a simple "call model ? run tools ? append results" cycle.

## Usage

```
cd go
ANTHROPIC_API_KEY=... go run ./cmd/puzldai-agent <<'EOF'
Refactor the main orchestrator loop to be minimal.
EOF
```

### Flags

- `-model` (default: `claude-3-5-sonnet-latest` or `PUZLDAI_MODEL`)
- `-max-iters` (default: 20)
- `-cwd` (default: current working directory)

## Integration Defaults

PuzldAI uses the Go agent loop by default for non-interactive Claude agent loops. Configure via `~/.puzldai/config.json`:

```
"agentLoopEngine": "go",
"goAgent": {
  "enabled": true,
  "binaryPath": "C:/path/to/puzldai-agent.exe",
  "model": "claude-3-5-sonnet-latest",
  "maxIters": 20
}
```

If `binaryPath` is omitted, PuzldAI falls back to `go run ./go/cmd/puzldai-agent`.

## Tools

- `view` (read file)
- `glob` (list files)
- `grep` (search file contents)
- `write` (create/overwrite file)
- `edit` (search/replace)
- `bash` (shell command)
