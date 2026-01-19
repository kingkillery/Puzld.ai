#!/bin/bash
# Example: Basic pk-puzldai workflow for feature development

# 1. Start with a plan-first approach using ralph
pk-puzldai ralph "Add user authentication with JWT" \
  --scope src/auth/ \
  --tests "npm test -- --testPathPattern=auth" \
  --iters 5

# 2. Once plan is approved, run the implementation
# (Ralph handles execution if you pass --execute flag)

# Alternative: Quick compare to see different approaches
pk-puzldai compare "Best way to implement JWT authentication in Node.js" \
  -a claude,gemini,ollama

# 3. Pick the best approach and build
pk-puzldai pickbuild "JWT authentication implementation" \
  -a claude,gemini \
  --build claude \
  --interactive
