# Skills Resources Layout

The `.claude/skills/` directory holds prompt inserts and bundled resources for the agent. The `resources/` subfolders mirror key project assets (e.g., `config/`, `utilities/`, `examples/utility_scripts/`) so skills can reference stable paths during prompt assembly. Keep these copies in sync with the root sources when updating utilities or scripts to avoid drift between the prompt context and runtime code.
