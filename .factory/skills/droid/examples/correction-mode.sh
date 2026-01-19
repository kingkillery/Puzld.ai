#!/bin/bash
# Example: Using correction mode for quality code generation

# Producer generates code, reviewer catches issues, producer fixes
pk-puzldai correct "Implement a REST API for user management" \
  --producer claude \
  --reviewer gemini \
  --model sonnet

# Useful for:
# - Writing tests with separate implementation and review
# - Security-sensitive code (audit trail)
# - Learning from AI feedback
