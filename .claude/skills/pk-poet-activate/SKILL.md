---
name: pk-poet-activate
description: Activation scaffold for pk-poet mode when the user includes the token "pk-poet".
---

# pk-poet activation

Trigger: if the user prompt contains the token "pk-poet".

When triggered, inject the pk-poet scaffolding context:
- Planning-first when scope is unclear or multi-file.
- Verification-first implementation (tests/harness first).
- Adversarial check before declaring done.
- Default outputs: Plan, Evidence, Result (concise).

Note: Codex skills do not support hooks. Apply this manually when the token appears.
