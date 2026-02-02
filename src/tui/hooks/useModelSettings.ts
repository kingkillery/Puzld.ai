/**
 * Hook for model selection state and persistence.
 */

import { useState } from 'react';
import { getConfig, saveConfig } from '../../lib/config';
import { getCLIDefaults } from '../../lib/cliConfigs';
import { getModelSuggestions } from '../../lib/models';

function createModelSetter(
  setState: (v: string) => void,
  agentKey: string,
  getDefaultConfig?: () => Record<string, unknown>
): (model: string) => string | undefined {
  return (model: string): string | undefined => {
    setState(model);
    const cfg = getConfig();
    const adapters = cfg.adapters as Record<string, any>;

    if (!adapters[agentKey]) {
      adapters[agentKey] = getDefaultConfig?.() ?? { enabled: true };
    }
    adapters[agentKey].model = model;
    saveConfig(cfg);

    // Ollama models are dynamic, no warning needed
    if (agentKey === 'ollama') return undefined;

    const known = getModelSuggestions(agentKey);
    if (known.length > 0 && !known.includes(model)) {
      return `Warning: "${model}" not in known models. It may still work.`;
    }
    return undefined;
  };
}

export function useModelSettings() {
  const config = getConfig();
  const cliDefaults = getCLIDefaults();

  const [claudeModel, setClaudeModel] = useState(config.adapters.claude.model || cliDefaults.claude || '');
  const [geminiModel, setGeminiModel] = useState(config.adapters.gemini.model || cliDefaults.gemini || '');
  const [codexModel, setCodexModel] = useState(config.adapters.codex.model || cliDefaults.codex || '');
  const [ollamaModel, setOllamaModel] = useState(config.adapters.ollama.model || cliDefaults.ollama || '');
  const [mistralModel, setMistralModel] = useState(config.adapters.mistral?.model || '');
  const [factoryModel, setFactoryModel] = useState(config.adapters.factory?.model || '');

  return {
    claudeModel,
    geminiModel,
    codexModel,
    ollamaModel,
    mistralModel,
    factoryModel,
    handleSetClaudeModel: createModelSetter(setClaudeModel, 'claude'),
    handleSetGeminiModel: createModelSetter(setGeminiModel, 'gemini'),
    handleSetCodexModel: createModelSetter(setCodexModel, 'codex'),
    handleSetOllamaModel: createModelSetter(setOllamaModel, 'ollama'),
    handleSetMistralModel: createModelSetter(setMistralModel, 'mistral', () => ({ enabled: true, path: 'vibe' })),
    handleSetFactoryModel: createModelSetter(setFactoryModel, 'factory', () => ({ enabled: true, path: 'droid', autonomy: 'low', reasoningEffort: 'medium' })),
  };
}
