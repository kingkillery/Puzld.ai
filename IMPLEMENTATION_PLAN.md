# IMPLEMENTATION_PLAN.md

## Goal
Fix `pk-puzldai` so that:

1. Claude runs in `-p/--print` mode without the "Input must be provided…" error.
2. The TUI banner/status area consistently shows the Factory (droid) agent alongside Claude/Gemini/etc.
3. Codex can be selected in the UI and its availability is reported correctly.

## Phases (one mergeable phase at a time)

### Phase 1 — Fix Claude `--tools` argument parsing (and add oracle)
- Reproduce: `claude -p ... --tools "" "hello"` fails because `--tools <tools...>` greedily consumes the positional prompt.
- Add a unit test that asserts we pass `--tools=` (equals form) so the prompt stays positional.
- Update `src/adapters/claude.ts` to use `--tools=` when disabling tools.
- Run `bun test` (and typecheck if needed).

### Phase 2 — Always render Factory in the banner/status panel
- Update `src/tui/components/Banner.tsx` so the 6th agent row is not dependent on changelog length.
- Ensure the banner still stays within layout constraints.

### Phase 3 — Allow selecting Factory in the Agent picker
- Update `src/tui/components/AgentPanel.tsx` to include `factory` (and show readiness).

### Phase 4 — Config robustness (only if needed after verification)
- If existing user configs cause codex/factory to remain disabled unexpectedly, implement a *deep merge* with defaults in `src/lib/config.ts` (without overriding explicit user settings).

### Phase 5 — Validators
- Run: `bun test` and `npm run typecheck` (or project equivalents).

### Phase 6 — Adversarial pass
- Empty/whitespace prompts, very long prompts, prompts containing quotes/newlines.
- Windows-specific arg parsing (.cmd shims, PATH resolution).
- Ensure “disable tools” doesn’t break Claude prompt delivery.

### Phase 7 - TUI Standards Alignment
- Gate TUI launch on TTY detection in CLI entry.
- Update status/footer hints and focus indicators.
- Respect NO_COLOR for terminal color output.
- Add Vim j/k navigation alongside arrows for history/autocomplete.
- Add ? shortcut overlay for quick help.
- Add Ctrl+R history search overlay and draft input persistence.

Verification:
- Run `pk-puzldai` with no args in a non-interactive shell and confirm help output.
- Set `NO_COLOR=1` and verify status/footer uses no color.
- Confirm j/k and up/down navigate history and autocomplete.
