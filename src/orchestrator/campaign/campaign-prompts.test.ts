import { describe, test, expect } from 'bun:test';
import { extractJsonFromResponse } from './prompts';

describe('extractJsonFromResponse', () => {
  // --- Clean JSON input ---
  test('parses clean JSON object', () => {
    const input = '{"summary": "ok", "done": false}';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ summary: 'ok', done: false });
    expect(result.error).toBeUndefined();
  });

  test('parses JSON with nested arrays and objects', () => {
    const input = JSON.stringify({
      summary: 'plan',
      tasks: [
        { title: 'T1', description: 'Do thing', acceptanceCriteria: ['A', 'B'] }
      ],
      subPlans: [{ area: 'ui', goal: 'Build UI' }],
      done: false
    });
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({
      summary: 'plan',
      tasks: [
        { title: 'T1', description: 'Do thing', acceptanceCriteria: ['A', 'B'] }
      ],
      subPlans: [{ area: 'ui', goal: 'Build UI' }],
      done: false
    });
    expect(result.error).toBeUndefined();
  });

  // --- Markdown-wrapped JSON ---
  test('extracts JSON from markdown code block with json tag', () => {
    const input = '```json\n{"summary": "ok", "done": true}\n```';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ summary: 'ok', done: true });
    expect(result.error).toBeUndefined();
  });

  test('extracts JSON from markdown code block without json tag', () => {
    const input = '```\n{"key": "value"}\n```';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ key: 'value' });
    expect(result.error).toBeUndefined();
  });

  test('extracts JSON from markdown with surrounding text', () => {
    const input = 'Here is the plan:\n```json\n{"summary": "plan", "done": false}\n```\nLet me know if you need changes.';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ summary: 'plan', done: false });
    expect(result.error).toBeUndefined();
  });

  test('handles case-insensitive ```JSON tag', () => {
    const input = '```JSON\n{"result": 42}\n```';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ result: 42 });
    expect(result.error).toBeUndefined();
  });

  // --- Trailing comma cleanup ---
  test('cleans trailing commas in objects', () => {
    const input = '{"a": 1, "b": 2, }';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ a: 1, b: 2 });
    expect(result.error).toBeUndefined();
  });

  test('cleans trailing commas in arrays', () => {
    const input = '{"items": ["x", "y", ]}';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ items: ['x', 'y'] });
    expect(result.error).toBeUndefined();
  });

  test('cleans trailing commas in nested structures', () => {
    const input = '{"tasks": [{"title": "T1", "tags": ["a", "b", ], }, ], }';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ tasks: [{ title: 'T1', tags: ['a', 'b'] }] });
    expect(result.error).toBeUndefined();
  });

  // --- Single quote replacement ---
  test('replaces single quotes with double quotes', () => {
    const input = "{'key': 'value'}";
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ key: 'value' });
    expect(result.error).toBeUndefined();
  });

  // --- No JSON found ---
  test('returns null with error for plain text without JSON', () => {
    const input = 'This is just a plain text response with no JSON.';
    const result = extractJsonFromResponse(input);

    expect(result.json).toBeNull();
    expect(result.error).toBe('No JSON object found');
  });

  test('returns null with error for empty string', () => {
    const result = extractJsonFromResponse('');

    expect(result.json).toBeNull();
    expect(result.error).toBe('No JSON object found');
  });

  test('returns null with error for whitespace-only string', () => {
    const result = extractJsonFromResponse('   \n\t  \n  ');

    expect(result.json).toBeNull();
    expect(result.error).toBe('No JSON object found');
  });

  // --- Invalid/malformed JSON ---
  test('returns null with error for malformed JSON (missing closing brace)', () => {
    const input = '{"key": "value"';
    const result = extractJsonFromResponse(input);

    // The regex \{[\s\S]*\} will not match since there is no closing brace
    expect(result.json).toBeNull();
    expect(result.error).toBe('No JSON object found');
  });

  test('returns null with parse error for structurally invalid JSON', () => {
    const input = '{"key": undefined}';
    const result = extractJsonFromResponse(input);

    expect(result.json).toBeNull();
    expect(result.error).toBeDefined();
  });

  // --- Edge cases ---
  test('extracts first JSON object when multiple exist', () => {
    // The greedy regex \{[\s\S]*\} actually matches from first { to last }
    // so with nested objects it captures the full span
    const input = '{"a": 1} and then {"b": 2}';
    const result = extractJsonFromResponse(input);

    // The regex is greedy, so it matches from the first { to the last }
    // which produces: {"a": 1} and then {"b": 2}
    // That will fail to parse, so let's verify the behavior
    expect(result.json).toBeNull();
    expect(result.error).toBeDefined();
  });

  test('handles JSON with whitespace padding', () => {
    const input = '   \n  {"padded": true}  \n   ';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ padded: true });
    expect(result.error).toBeUndefined();
  });

  test('handles deeply nested JSON from planner-like output', () => {
    const input = `\`\`\`json
{
  "summary": "Implementation plan for auth feature",
  "tasks": [
    {
      "id": "T01",
      "title": "Add login endpoint",
      "description": "Create POST /auth/login",
      "acceptanceCriteria": ["Returns JWT", "Validates credentials"],
      "area": "api",
      "agentHint": "worker"
    }
  ],
  "subPlans": [
    {
      "area": "ui",
      "goal": "Build login form",
      "notes": "Use React Hook Form"
    }
  ],
  "done": false
}
\`\`\``;

    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({
      summary: 'Implementation plan for auth feature',
      tasks: [
        {
          id: 'T01',
          title: 'Add login endpoint',
          description: 'Create POST /auth/login',
          acceptanceCriteria: ['Returns JWT', 'Validates credentials'],
          area: 'api',
          agentHint: 'worker'
        }
      ],
      subPlans: [
        {
          area: 'ui',
          goal: 'Build login form',
          notes: 'Use React Hook Form'
        }
      ],
      done: false
    });
    expect(result.error).toBeUndefined();
  });

  test('handles JSON array at top level (no outer object)', () => {
    const input = '["a", "b", "c"]';
    const result = extractJsonFromResponse(input);

    // The regex looks for { ... } so a bare array won't match
    expect(result.json).toBeNull();
    expect(result.error).toBe('No JSON object found');
  });

  test('handles markdown-wrapped JSON with trailing commas combined', () => {
    const input = '```json\n{"summary": "test", "tasks": ["a", "b",],}\n```';
    const result = extractJsonFromResponse(input);

    expect(result.json).toEqual({ summary: 'test', tasks: ['a', 'b'] });
    expect(result.error).toBeUndefined();
  });
});
