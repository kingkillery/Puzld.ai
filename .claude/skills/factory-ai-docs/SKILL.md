---
name: factory-ai-docs
description: "Factory AI CLI/Droid documentation reference for BYOK custom models (OpenRouter/OpenAI/Anthropic/etc.), settings.json/config.json locations, custom droids (subagents) frontmatter, and droid exec headless usage. Use when asked to configure Factory Droid/CLI, model selection, BYOK providers, custom droids, or droid exec automation."
---

# Factory AI Docs Skill

Use this skill to answer questions about Factory CLI/Droid configuration and usage by consulting the bundled references.

## How to use

- For model setup or provider questions, read `references/byok-overview.md` and the provider-specific file (e.g., `references/openrouter.md`).
- For custom droids (subagents), read `references/custom-droids.md`.
- For headless automation, read `references/droid-exec.md`.
- For settings file location and general settings behavior, read `references/settings.md`.

## Notes

- Keep advice consistent with the documentation and avoid inventing fields.
- Prefer `settings.json` unless the docs explicitly call out legacy `config.json`.
- Do not include or store real API keys in examples.
