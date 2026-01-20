import type { AgentName } from '../../executor/types.js';
import { resolveAgentSelection } from '../../lib/agent-selection.js';
import { adapters } from '../../adapters/index.js';
import { CAMPAIGN_DEFAULTS } from './campaign-defaults.js';

export interface AgentSpec {
  adapter: 'droid' | 'gemini' | 'claude' | 'codex' | 'ollama' | 'factory';
  model?: string;
}

export function parseAgentSpec(spec: string): AgentSpec {
  // Support formats: "droid", "droid:model-name", "gemini:model", "agent-name"
  const parts = spec.split(':');
  
  if (parts.length === 1) {
    // Simple adapter name
    return { adapter: parts[0] as AgentSpec['adapter'] };
  }

  if (parts.length === 2) {
    // adapter:model format
    return {
      adapter: parts[0] as AgentSpec['adapter'],
      model: parts[1]
    };
  }

  // Fallback
  return { adapter: 'droid' };
}

export async function resolveAgentForRole(
  role: 'planner' | 'subplanner' | 'worker',
  userSpec?: string,
  defaultSpec?: string
): Promise<{ agent: AgentName; model?: string }> {
  // Check for planner subdroid
  if (role === 'planner') {
    const droidPath = '.factory/droids/planner.json';
    try {
      const { exists } = await import('fs/promises');
      const plannerExists = await exists(droidPath);
      if (plannerExists) {
        // Use planner subdroid via factory adapter
        return { agent: 'factory', model: 'gpt-5.2-codex-medium' };
      }
    } catch {
      // Fall through to default
    }
  }

  const spec = userSpec || defaultSpec || getDefaultForRole(role);
  const parsed = parseAgentSpec(spec);

  // Map adapter name to AgentName
  let agent: AgentName;
  switch (parsed.adapter) {
    case 'droid':
    case 'factory':
      agent = 'factory';
      break;
    case 'gemini':
      agent = 'gemini-safe';
      break;
    case 'claude':
      agent = 'claude';
      break;
    case 'codex':
      agent = 'codex-safe';
      break;
    case 'ollama':
      agent = 'ollama';
      break;
    default:
      agent = 'factory';
  }

  const selection = resolveAgentSelection(agent);
  return { agent: selection.agent, model: parsed.model };
}

function getDefaultForRole(role: string): string {
  switch (role) {
    case 'planner':
      return CAMPAIGN_DEFAULTS.planner;
    case 'subplanner':
      return CAMPAIGN_DEFAULTS.subPlanner;
    case 'worker':
      return CAMPAIGN_DEFAULTS.workers[0];
    default:
      return CAMPAIGN_DEFAULTS.planner;
  }
}
