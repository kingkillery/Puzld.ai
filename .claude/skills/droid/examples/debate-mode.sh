#!/bin/bash
# Example: Using debate mode for architectural decisions

# Debate microservices vs monolithic architecture
pk-puzldai debate "Should we migrate to microservices or improve our monolith?" \
  -a claude,gemini,codex \
  -r 3

# Debate API design choices
pk-puzldai debate "REST vs GraphQL for our new frontend" \
  -a claude,gemini \
  -r 2
