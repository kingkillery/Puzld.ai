# OpenRouter with Factory BYOK

Use OpenRouter through the generic chat-completion provider.

Typical fields:

- baseUrl: https://openrouter.ai/api/v1
- provider: generic-chat-completion-api
- model: OpenRouter model id (use the exact ID listed by OpenRouter)
- apiKey: your OpenRouter key
- optional: displayName, maxOutputTokens, noImageSupport, extraArgs

Notes:

- Choose models from the OpenRouter catalog and keep model IDs exact.
- If calls fail, check for 401/403/429 and confirm the key has access to the selected model.
