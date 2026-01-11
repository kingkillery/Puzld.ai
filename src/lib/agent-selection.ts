import type { AgentName } from '../executor/types';
import { adapters } from '../adapters';

const SAFETY_REDIRECTS: Record<string, AgentName> = {
  gemini: 'gemini-safe',
  codex: 'codex-safe'
};

const UNSAFE_ALIASES: Record<string, AgentName> = {
  'gemini-unsafe': 'gemini',
  'codex-unsafe': 'codex'
};

export function resolveAgentSelection(agent: string): { agent: AgentName; notice?: string } {
  let target = agent as AgentName;
  let notice: string | undefined;

  if (UNSAFE_ALIASES[target]) {
    target = UNSAFE_ALIASES[target];
    notice = `Using unsafe adapter override: ${agent}`;
  } else if (SAFETY_REDIRECTS[target]) {
    target = SAFETY_REDIRECTS[target];
    notice = `Redirected ${agent} → ${target} for safety`;
  }

  if (!adapters[target]) {
    notice = `Fallback to claude (unknown agent: ${agent})`;
    target = 'claude';
  }

  return { agent: target, notice };
}

export function resolveInteractiveAgent(agent: string): { agent: AgentName; notice?: string } {
  // Interactive mode should behave like resolveAgentSelection, but allow more subdued defaults
  if (agent === 'auto') {
    return resolveAgentSelection('claude');
  }
  return resolveAgentSelection(agent);
}
