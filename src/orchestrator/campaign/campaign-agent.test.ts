import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { parseAgentSpec, resolveAgentForRole } from './campaign-agent';
import type { AgentSpec } from './campaign-agent';
import { CAMPAIGN_DEFAULTS } from './campaign-defaults';

// ---------------------------------------------------------------------------
// parseAgentSpec – pure synchronous parsing
// ---------------------------------------------------------------------------

describe('parseAgentSpec', () => {
  test('parses simple adapter name', () => {
    const result = parseAgentSpec('droid');
    expect(result).toEqual({ adapter: 'droid' });
  });

  test('parses adapter:model format', () => {
    const result = parseAgentSpec('droid:gpt-5.2');
    expect(result).toEqual({ adapter: 'droid', model: 'gpt-5.2' });
  });

  test('parses gemini with model', () => {
    const result = parseAgentSpec('gemini:gemini-2.5-pro');
    expect(result).toEqual({ adapter: 'gemini', model: 'gemini-2.5-pro' });
  });

  test('parses claude without model', () => {
    const result = parseAgentSpec('claude');
    expect(result).toEqual({ adapter: 'claude' });
  });

  test('parses claude with model', () => {
    const result = parseAgentSpec('claude:opus-4.5');
    expect(result).toEqual({ adapter: 'claude', model: 'opus-4.5' });
  });

  test('parses factory adapter', () => {
    const result = parseAgentSpec('factory');
    expect(result).toEqual({ adapter: 'factory' });
  });

  test('parses factory with model', () => {
    const result = parseAgentSpec('factory:gpt-5.2-codex-medium');
    expect(result).toEqual({ adapter: 'factory', model: 'gpt-5.2-codex-medium' });
  });

  test('parses codex without model', () => {
    const result = parseAgentSpec('codex');
    expect(result).toEqual({ adapter: 'codex' });
  });

  test('parses ollama without model', () => {
    const result = parseAgentSpec('ollama');
    expect(result).toEqual({ adapter: 'ollama' });
  });

  test('parses ollama with model', () => {
    const result = parseAgentSpec('ollama:llama3.2');
    expect(result).toEqual({ adapter: 'ollama', model: 'llama3.2' });
  });

  // Edge cases

  test('falls back to droid for malformed spec with multiple colons', () => {
    // e.g. "a:b:c" -> parts.length === 3 -> fallback
    const result = parseAgentSpec('a:b:c');
    expect(result).toEqual({ adapter: 'droid' });
  });

  test('handles empty string as single part', () => {
    // '' splits to [''] -> parts.length === 1
    const result = parseAgentSpec('');
    expect(result).toEqual({ adapter: '' as AgentSpec['adapter'] });
  });

  test('handles spec with empty model after colon', () => {
    // 'droid:' splits to ['droid', ''] -> adapter:model with empty model
    const result = parseAgentSpec('droid:');
    expect(result).toEqual({ adapter: 'droid', model: '' });
  });

  test('preserves model casing', () => {
    const result = parseAgentSpec('gemini:Gemini-2.5-Pro-PREVIEW');
    expect(result.model).toBe('Gemini-2.5-Pro-PREVIEW');
  });

  test('handles unknown adapter name gracefully', () => {
    // Unknown adapter names are cast — parseAgentSpec does not validate
    const result = parseAgentSpec('unknown-adapter');
    expect(result.adapter).toBe('unknown-adapter');
    expect(result.model).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// resolveAgentForRole – async resolution with mocked dependencies
// ---------------------------------------------------------------------------

// Mock the adapters registry so resolveAgentSelection can find entries
// and the fs/promises import for planner subdroid detection fails (no file)
mock.module('../../adapters/index.js', () => ({
  adapters: {
    claude: { name: 'claude', isAvailable: async () => true, run: async () => ({}) },
    'gemini-safe': { name: 'gemini-safe', isAvailable: async () => true, run: async () => ({}) },
    'codex-safe': { name: 'codex-safe', isAvailable: async () => true, run: async () => ({}) },
    ollama: { name: 'ollama', isAvailable: async () => true, run: async () => ({}) },
    factory: { name: 'factory', isAvailable: async () => true, run: async () => ({}) },
    gemini: { name: 'gemini', isAvailable: async () => true, run: async () => ({}) },
    codex: { name: 'codex', isAvailable: async () => true, run: async () => ({}) },
    mistral: { name: 'mistral', isAvailable: async () => true, run: async () => ({}) },
  }
}));

// Ensure the planner subdroid file check always fails (no .factory/droids/planner.json)
// so we exercise the default code path, not the early-return subdroid path
mock.module('fs/promises', () => ({
  exists: async () => false,
}));

describe('resolveAgentForRole', () => {
  // -----------------------------------------------------------------------
  // Agent name mapping: the switch in resolveAgentForRole
  // -----------------------------------------------------------------------

  describe('agent name mapping', () => {
    test('droid maps to factory adapter', async () => {
      const result = await resolveAgentForRole('worker', 'droid');
      expect(result.agent).toBe('factory');
    });

    test('factory maps to factory adapter', async () => {
      const result = await resolveAgentForRole('worker', 'factory');
      expect(result.agent).toBe('factory');
    });

    test('gemini maps to gemini-safe via safety redirect', async () => {
      const result = await resolveAgentForRole('worker', 'gemini');
      expect(result.agent).toBe('gemini-safe');
    });

    test('claude stays as claude', async () => {
      const result = await resolveAgentForRole('worker', 'claude');
      expect(result.agent).toBe('claude');
    });

    test('codex maps to codex-safe via safety redirect', async () => {
      const result = await resolveAgentForRole('worker', 'codex');
      expect(result.agent).toBe('codex-safe');
    });

    test('ollama stays as ollama', async () => {
      const result = await resolveAgentForRole('worker', 'ollama');
      expect(result.agent).toBe('ollama');
    });
  });

  // -----------------------------------------------------------------------
  // Model passthrough
  // -----------------------------------------------------------------------

  describe('model passthrough', () => {
    test('passes model from spec to result', async () => {
      const result = await resolveAgentForRole('worker', 'droid:gpt-5.2');
      expect(result.model).toBe('gpt-5.2');
    });

    test('model is undefined when not provided', async () => {
      const result = await resolveAgentForRole('worker', 'claude');
      expect(result.model).toBeUndefined();
    });

    test('preserves complex model string', async () => {
      const result = await resolveAgentForRole('worker', 'factory:gpt-5.2-codex-medium');
      expect(result.model).toBe('gpt-5.2-codex-medium');
    });
  });

  // -----------------------------------------------------------------------
  // Default role resolution (exercises getDefaultForRole)
  // -----------------------------------------------------------------------

  describe('default role resolution', () => {
    test('planner role uses CAMPAIGN_DEFAULTS.planner', async () => {
      // No userSpec, no defaultSpec → getDefaultForRole('planner')
      const result = await resolveAgentForRole('planner');
      // CAMPAIGN_DEFAULTS.planner = 'droid:gpt-5.2-codex-medium'
      // droid → factory, model = gpt-5.2-codex-medium
      expect(result.agent).toBe('factory');
      expect(result.model).toBe('gpt-5.2-codex-medium');
    });

    test('subplanner role uses CAMPAIGN_DEFAULTS.subPlanner', async () => {
      const result = await resolveAgentForRole('subplanner');
      // CAMPAIGN_DEFAULTS.subPlanner = 'gemini:gemini-2.5-pro'
      // gemini → gemini-safe, model = gemini-2.5-pro
      expect(result.agent).toBe('gemini-safe');
      expect(result.model).toBe('gemini-2.5-pro');
    });

    test('worker role uses CAMPAIGN_DEFAULTS.workers[0]', async () => {
      const result = await resolveAgentForRole('worker');
      // CAMPAIGN_DEFAULTS.workers[0] = 'droid:minimax-m2.1'
      // droid → factory, model = minimax-m2.1
      expect(result.agent).toBe('factory');
      expect(result.model).toBe('minimax-m2.1');
    });
  });

  // -----------------------------------------------------------------------
  // userSpec overrides defaultSpec
  // -----------------------------------------------------------------------

  describe('spec priority', () => {
    test('userSpec overrides defaultSpec', async () => {
      const result = await resolveAgentForRole('worker', 'claude:opus-4.5', 'droid:gpt-5.2');
      expect(result.agent).toBe('claude');
      expect(result.model).toBe('opus-4.5');
    });

    test('defaultSpec used when userSpec is undefined', async () => {
      const result = await resolveAgentForRole('worker', undefined, 'ollama:llama3.2');
      expect(result.agent).toBe('ollama');
      expect(result.model).toBe('llama3.2');
    });
  });

  // -----------------------------------------------------------------------
  // Planner subdroid → factory adapter regression
  // -----------------------------------------------------------------------

  describe('planner subdroid regression', () => {
    test('planner with droid spec resolves to factory adapter', async () => {
      // This is the key regression: 'droid' in campaign-agent.ts maps to 'factory'
      // which then goes through resolveAgentSelection
      const result = await resolveAgentForRole('planner', 'droid:gpt-5.2-codex-medium');
      expect(result.agent).toBe('factory');
      expect(result.model).toBe('gpt-5.2-codex-medium');
    });

    test('planner default resolves droid to factory', async () => {
      // Default planner = 'droid:gpt-5.2-codex-medium' → factory adapter
      const parsed = parseAgentSpec(CAMPAIGN_DEFAULTS.planner);
      expect(parsed.adapter).toBe('droid');

      const result = await resolveAgentForRole('planner');
      expect(result.agent).toBe('factory');
    });
  });
});
