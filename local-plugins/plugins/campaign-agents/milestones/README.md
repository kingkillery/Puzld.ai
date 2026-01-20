# Milestones Library

This directory contains reusable patterns and step hints for common engineering tasks.
The campaign planner retrieves relevant hints based on task domain and keywords.

## How It Works

1. **Pattern Matching**: When planning tasks, the planner scans milestone files for relevant patterns
2. **Keyword Search**: Files are matched by domain tags and keywords in content
3. **Step Injection**: Matched patterns are injected as `step_hints` into task specifications

## File Structure

Each milestone file should follow this format:

```markdown
---
domain: ui|data|infra|test|devops
keywords: [list, of, searchable, terms]
confidence: high|medium|low
---

# Pattern Title

## Context
When to use this pattern...

## Steps
1. Step one
2. Step two
3. Step three

## Pitfalls
- Common mistake to avoid
- Another pitfall

## Example
Brief example of the pattern in action
```

## Adding New Patterns

1. Create a new `.md` file in this directory
2. Add YAML frontmatter with domain and keywords
3. Document the pattern with clear steps
4. Include common pitfalls and examples

## Built-in Patterns

- `react-migration.md` - Migrating from other frameworks to React
- `api-refactor.md` - Refactoring REST APIs
- `test-coverage.md` - Adding test coverage to legacy code
- `database-migration.md` - Safe database schema migrations

## Extending with Vector Search

For production use with large pattern libraries, integrate a vector database:

1. Embed milestone content using OpenAI/Cohere embeddings
2. Store in pgvector, Pinecone, or Qdrant
3. Query by semantic similarity to task description
4. Return top-k matched patterns as step_hints

The file-based approach works for <100 patterns; vector search recommended for larger libraries.
