# BYOK overview

Key points from Factory BYOK docs:

- Custom models are configured locally and are only available in the CLI (not web or mobile).
- API keys remain local and are not uploaded to Factory servers.
- Current format: add models to ~/.factory/settings.json under customModels.
- Legacy format: ~/.factory/config.json under custom_models is still referenced in older docs.
- After adding models, switch with /model in the CLI; custom models appear in their own section.

Provider types (must match exactly):

- anthropic (Anthropic Messages API compatibility)
- openai (OpenAI Responses API compatibility; required for newest OpenAI models)
- generic-chat-completion-api (OpenAI Chat Completions API compatibility; used by OpenRouter and most OSS providers)

Troubleshooting highlights:

- If a model does not appear, validate JSON, required fields, and allow time for the file watcher.
- Invalid provider errors usually mean a typo or wrong provider string.
- Auth errors usually mean invalid key, insufficient permissions, or incorrect base URL.
