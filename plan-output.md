Interactive CLI PTY integration plan with phased rollout, explicit assumptions/failure modes, file paths, interfaces, and verification. I read `plan.md` and this work should be tracked there; I cannot update it because the environment is read-only, so please mirror the new tasks/statuses in `plan.md`.

**Assumptions**
- Node 20+ and Bun runtime remain supported; native deps are acceptable for PTY (e.g., `node-pty`).
- We can detect prompts/permission requests via regex patterns or adapter-specific markers.
- CLI tools have stable interactive prompts (Claude Code/Codex/Factory/Crush) that can be pattern matched.
- TUI can consume a stream of output events and render them incrementally.
- Existing adapter pattern remains the public API; interactive mode is additive/opt-in.

**Failure Modes & Edge Cases**
- PTY not available on Windows or requires rebuild; fallback needed to non-PTY mode.
- Prompt detection fails due to localization or tool updates; degrade to manual input or safe default.
- Output throttling/partial tokens cause prompt regex to miss; require buffer + debounce.
- CLIs that spawn sub-processes or switch to raw mode (e.g., diff viewer) break parsing.
- Tool permission prompts are ambiguous or changed; avoid auto-approve unless explicitly configured.
- Stuck sessions on long-running prompts; need timeouts and abort handling.
- Input injection timing causes lost keystrokes; require readiness detection.
- User abort (Ctrl+C) should terminate child and clean up PTY reliably.
- Inconsistent newline handling (CRLF vs LF) on Windows.

**Phase 0: Architecture & Compatibility Baseline (Low)**
- Goal: define interfaces and keep existing adapters working.
- Files:
  - `src/adapters/adapter.ts` (or existing adapter interface) – add optional interactive hooks.
  - `src/adapters/index.ts` – register interactive-capable adapters.
- Interfaces (example):
  ```ts
  export interface InteractiveSession {
    id: string;
    send(input: string): Promise<void>;
    onOutput(cb: (chunk: string) => void): () => void;
    onPrompt(cb: (prompt: PromptEvent) => void): () => void;
    close(reason?: string): Promise<void>;
  }

  export interface InteractiveAdapter extends Adapter {
    supportsInteractive: true;
    startInteractive(options: RunOptions): Promise<InteractiveSession>;
    parsePrompt?(buffer: string): PromptEvent | null;
  }

  export type PromptEvent =
    | { type: 'permission'; tool?: string; message: string }
    | { type: 'input'; message: string }
    | { type: 'confirm'; message: string };
  ```
- Verification:
  - Typecheck builds with optional interactive fields.
- Backwards compatibility:
  - Existing `run()` path unchanged.

**Phase 1: PTY Layer + Session Manager (Medium)**
- Goal: PTY-backed session abstraction with stream parsing.
- Files:
  - New: `src/interactive/pty-session.ts` – wrapper around `node-pty`.
  - New: `src/interactive/session-manager.ts` – lifecycle, timeouts, cleanup.
  - New: `src/interactive/prompt-detector.ts` – regex-based prompt detection.
  - Update: `src/config/schema.ts` – interactive settings (timeout, auto-approve policy).
- Behavior:
  - Spawn CLI with PTY; feed input; emit output chunks.
  - Buffer output and pass to prompt detector.
  - Expose events to TUI for streaming.
- Verification:
  - Unit tests for prompt detection with fixture logs in `src/interactive/__tests__/prompt-detector.test.ts`.
  - Manual: start Claude Code in interactive mode, type prompt, observe output streaming.
- Complexity: Medium.

**Phase 2: Adapter Integration (Medium/High)**
- Goal: add interactive support per adapter without breaking non-interactive.
- Files:
  - `src/adapters/claude-code.ts` (or existing Claude adapter) – implement `startInteractive`.
  - `src/adapters/codex-cli.ts`
  - `src/adapters/factory.ts`
  - `src/adapters/crush.ts`
  - Update `src/adapters/index.ts` registry.
- Code patterns:
  - Map adapter config to CLI args (model, tools, MCP).
  - Provide adapter-specific prompt regexes in `parsePrompt`.
- Verification:
  - Start interactive sessions for each adapter; confirm output and prompt detection.
  - Ensure `run()` still works unchanged.
- Complexity: High for Windows handling + CLI differences.

**Phase 3: Permission Prompt Handling (High)**
- Goal: detect permission prompts and auto-respond based on policy.
- Files:
  - New: `src/interactive/permission-router.ts` – translate prompt into internal permission request.
  - Update: `src/agentic/permission-tracker.ts` – reuse existing approval logic.
  - Update: `src/tui/` – render permission prompt UI.
- Behavior:
  - Parse prompts into tool calls (e.g., “Allow tool X?”).
  - Apply policy: always ask, auto-approve, auto-deny.
  - Send response back to PTY session.
- Verification:
  - Simulated prompt fixtures and decision tests.
  - Manual run with a tool prompt in Claude Code.
- Complexity: High due to variability in prompts.

**Phase 4: Multi-turn Session State & Orchestration (Medium)**
- Goal: keep session across multiple user inputs.
- Files:
  - `src/context/session-store.ts` – persist session metadata.
  - `src/orchestrator/index.ts` – route tasks to interactive sessions when available.
  - `src/cli/commands/run.ts` / `src/cli/commands/orchestrate.ts` – add `--interactive` flag.
- Behavior:
  - Reuse session if active; reconnect to existing PTY where possible (or keep process alive).
  - Use a session registry keyed by adapter + workspace + task id.
- Verification:
  - Start a session, send multiple prompts, observe continuity.
- Complexity: Medium.

**Phase 5: UX/TUI Streaming Integration (Medium)**
- Goal: stream output with orchestration UI overlay.
- Files:
  - `src/tui/components/output-stream.tsx` (or existing) – render chunked output.
  - `src/tui/components/permission-modal.tsx` – use prompt events.
  - `src/tui/index.ts` – route session events to UI.
- Verification:
  - TUI shows streaming output and interactive prompts.
- Complexity: Medium.

**Phase 6: MCP passthrough + Tool Telemetry (Low/Medium)**
- Goal: allow MCP through interactive CLI and log tool usage.
- Files:
  - `src/observation/` – record tool usage events inferred from prompts.
  - `src/mcp/` – no changes required if CLI already supports MCP; document behavior.
- Verification:
  - Confirm MCP prompts in Claude Code are handled and logged.
- Complexity: Low/Medium.

**Phase 7: Hardening & Fallbacks (Medium)**
- Goal: robust behavior on failures.
- Files:
  - `src/interactive/pty-session.ts` – handle PTY errors, process exits.
  - `src/adapters/*` – fallback to `run()` when PTY fails.
  - `src/cli/commands/*` – warn and degrade gracefully.
- Verification:
  - Force PTY failure and ensure fallback works.
- Complexity: Medium.

**Phase 8: Windows/Unix Compatibility Pass (High)**
- Goal: handle PTY quirks per OS.
- Files:
  - `src/interactive/pty-session.ts` – OS-specific spawn options.
  - `src/lib/os-utils.ts` – new helpers for shell path, env, encoding.
- Verification:
  - Run on Windows and Unix; ensure prompt detection and input injection work.
- Complexity: High.

**Phase 9: Tests & Documentation (Medium)**
- Files:
  - Tests: `src/interactive/__tests__/*`, `scripts/agentic-smoke/*` updates.
  - Docs: `AGENTS.md`, `CLI-ADAPTERS.md`, `MODES.md`.
- Verification:
  - `bun test` includes prompt detector and session manager tests.
  - Smoke tests verify interactive path for each CLI.
- Complexity: Medium.

**Backwards Compatibility**
- Keep `Adapter.run()` and non-interactive path as default.
- Add `--interactive` flag; default off to avoid breaking automation.
- New interactive support is opt-in per adapter via `supportsInteractive`.

**Proposed File Additions/Changes Summary**
- Add: `src/interactive/pty-session.ts`
- Add: `src/interactive/session-manager.ts`
- Add: `src/interactive/prompt-detector.ts`
- Add: `src/interactive/permission-router.ts`
- Update: `src/adapters/*` (Claude/Codex/Factory/Crush)
- Update: `src/orchestrator/index.ts`
- Update: `src/cli/commands/run.ts`, `src/cli/commands/orchestrate.ts`
- Update: `src/tui/*`
- Update: `src/config/schema.ts`
- Tests: `src/interactive/__tests__/*`

**Verification Criteria per Phase**
- Phase 0: Typecheck passes with new interfaces.
- Phase 1: PTY session emits output + prompt events in test fixtures.
- Phase 2: Each adapter starts interactive session; `run()` unchanged.
- Phase 3: Permission prompts detected and resolved via policy.
- Phase 4: Multi-turn conversation persists.
- Phase 5: TUI renders streaming output and prompts.
- Phase 6: MCP prompts handled; telemetry logs tool usage.
- Phase 7: PTY failure falls back cleanly.
- Phase 8: Works on Windows and Unix.
- Phase 9: Tests and docs updated.

If you want, I can translate this into specific `plan.md` entries (phases/tasks/checklist + change log wording) for you to paste in, or proceed with a phase-by-phase implementation once write access is enabled.

Next steps if you want to proceed:
1) Confirm which adapters should be first-class for interactive mode (Claude Code vs Codex CLI vs Factory/Crush).
2) Decide the default permission policy (ask/auto-approve/auto-deny).
3) Enable write access so I can update `plan.md` and begin Phase 0/1.