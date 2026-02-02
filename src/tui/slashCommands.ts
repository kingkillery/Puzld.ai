/**
 * Slash command handler extracted from TUI App.
 *
 * All /commands are handled here. The App passes a context object
 * with the state setters and helpers needed.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

import {
  buildComparePlan,
  buildPipelinePlan,
  buildCorrectionPlan,
  buildDebatePlan,
  buildConsensusPlan,
  parseAgentsString,
  execute,
  type AgentName
} from '../executor';
import { loadTemplate } from '../executor/templates';
import { generatePlan } from '../executor/planner';
import { getConfig, saveConfig } from '../lib/config';
import { adapters } from '../adapters';
import { getProjectStructure } from '../agentic';
import { buildInjectionForAgent } from '../memory/injector';
import {
  isDirectoryTrusted,
  trustDirectory,
  getTrustedDirectories,
  untrustDirectory
} from '../trust';
import {
  indexCodebase,
  getIndexSummary,
  getConfigSummary,
  getGraphSummary,
  searchCode,
  getTaskContext,
  detectProjectConfig,
  buildDependencyGraph,
  parseFiles
} from '../indexing';
import {
  getExportSummary,
  getRecentObservations,
  exportObservations,
  exportPreferencePairs
} from '../observation';
import {
  createSessionCompat,
  clearUnifiedSessionMessages,
  type UnifiedSession,
} from '../context';
import { runCampaign, type CampaignOptions } from '../orchestrator/campaign/campaign-engine';

import type { Message, CompareResult } from './types';
import { nextId } from './types';
import type { CollaborationStep, CollaborationType } from './components/CollaborationView';
import type { ApprovalMode } from './components/ApprovalModePanel';
import type { McpStatus } from './components/StatusBar';

/** All the App state/setters the slash command handler needs */
export interface SlashCommandContext {
  // State readers
  currentAgent: string;
  currentRouter: string;
  currentPlanner: string;
  session: UnifiedSession | null;
  sequential: boolean;
  pick: boolean;
  executeMode: boolean;
  interactive: boolean;
  correctFix: boolean;
  debateRounds: number;
  debateModerator: string;
  consensusRounds: number;
  consensusSynthesizer: string;
  mcpStatus: McpStatus;
  messages: Message[];
  compareResults: CompareResult[];
  collaborationSteps: CollaborationStep[];
  collaborationType: CollaborationType;

  // State setters
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setMode: (mode: string) => void;
  setLoading: (v: boolean) => void;
  setInput: (v: string) => void;
  setInputKey: React.Dispatch<React.SetStateAction<number>>;
  setNotification: (v: string | null) => void;
  setCurrentAgent: (v: string) => void;
  setCurrentRouter: (v: string) => void;
  setCurrentPlanner: (v: string) => void;
  setSession: (v: UnifiedSession | null) => void;
  setSequential: (fn: (v: boolean) => boolean) => void;
  setPick: (fn: (v: boolean) => boolean) => void;
  setExecuteMode: (fn: (v: boolean) => boolean) => void;
  setInteractive: (fn: (v: boolean) => boolean) => void;
  setApprovalMode: (v: ApprovalMode) => void;
  setMcpStatus: (v: McpStatus) => void;
  setCompareResults: (v: CompareResult[]) => void;
  setCompareKey: React.Dispatch<React.SetStateAction<number>>;
  setCollaborationSteps: (v: CollaborationStep[]) => void;
  setCollaborationKey: React.Dispatch<React.SetStateAction<number>>;
  setCollaborationType: (v: CollaborationType) => void;
  setPipelineName: (v: string) => void;

  // Model setters
  handleSetClaudeModel: (m: string) => string | undefined;
  handleSetGeminiModel: (m: string) => string | undefined;
  handleSetCodexModel: (m: string) => string | undefined;
  handleSetOllamaModel: (m: string) => string | undefined;
  handleSetMistralModel: (m: string) => string | undefined;
  handleSetFactoryModel: (m: string) => string | undefined;
  claudeModel: string;
  geminiModel: string;
  codexModel: string;
  ollamaModel: string;
  mistralModel: string;

  // Refs
  abortControllerRef: React.MutableRefObject<AbortController | null>;

  // Helpers
  refreshAgentStatus: () => Promise<void>;
  addSystemMessage: (content: string, agent?: string) => void;
  resetMessageId: (val?: number) => void;
}

export async function handleSlashCommand(cmd: string, ctx: SlashCommandContext): Promise<void> {
  const match = cmd.slice(1).match(/^(\S+)\s*(.*)/);
  const command = match?.[1] || '';
  const rest = match?.[2] || '';

  const addMessage = (content: string, agent?: string) => {
    ctx.setMessages(prev => [...prev, { id: nextId(), role: 'assistant', content, agent }]);
  };

  const setAdapterEnabled = async (agentIdRaw: string, enabled: boolean) => {
    const agentId = agentIdRaw.trim();
    if (!agentId) {
      addMessage('Usage: /enable <claude|gemini|codex|ollama|mistral|factory|crush> (or /disable <agent>)');
      return;
    }

    const cfg = getConfig();
    switch (agentId) {
      case 'claude':
        cfg.adapters.claude.enabled = enabled;
        break;
      case 'gemini':
        cfg.adapters.gemini.enabled = enabled;
        break;
      case 'codex':
        cfg.adapters.codex.enabled = enabled;
        break;
      case 'ollama':
        cfg.adapters.ollama.enabled = enabled;
        break;
      case 'mistral': {
        if (!cfg.adapters.mistral) {
          cfg.adapters.mistral = { enabled, path: 'vibe' };
        } else {
          cfg.adapters.mistral.enabled = enabled;
        }
        break;
      }
      case 'factory': {
        if (!cfg.adapters.factory) {
          cfg.adapters.factory = { enabled, path: 'droid', autonomy: 'low', reasoningEffort: 'medium' };
        } else {
          cfg.adapters.factory.enabled = enabled;
        }
        break;
      }
      case 'crush': {
        if (!cfg.adapters.crush) {
          cfg.adapters.crush = { enabled, path: 'crush', autoAccept: false, debug: false };
        } else {
          cfg.adapters.crush.enabled = enabled;
        }
        break;
      }
      default:
        addMessage(`Unknown agent: ${agentId}`);
        return;
    }

    saveConfig(cfg);
    await ctx.refreshAgentStatus();

    if (!enabled && ctx.currentAgent === agentId) {
      ctx.setCurrentAgent('auto');
    }

    addMessage(`${enabled ? 'Enabled' : 'Disabled'} ${agentId}.`);
  };

  switch (command) {
    // === UTILITY ===
    case 'help':
      addMessage(`Just type a message - AI decides how to respond (answer, plan, or propose edits)

Commands:
  /compare <agents> <task>  - Compare agents side-by-side
  /autopilot <task>         - AI-generated execution plan
  /campaign <goal>          - Run long-running autonomous coding campaigns
  /workflow <name> <task>   - Run a saved workflow
  /workflows                - Manage workflows (interactive)
  /index                    - Codebase indexing options
  /index full               - Index with embeddings
  /index quick              - Index without embeddings
  /index search <query>     - Search indexed code
  /index context <task>     - Get relevant code for task
  /index config             - Show project configuration
  /index graph              - Show dependency graph
  /observe                  - Training observations panel
  /observe summary          - Show observation statistics
  /observe list             - List recent observations
  /observe export [path]    - Export observations to file
  /observe preferences      - Export DPO preference pairs
  /session                  - Start new session
  /resume                   - Resume a previous session

Multi-Agent Collaboration:
  /correct <prod> <rev> <task>  - Cross-agent correction (fix in settings)
  /debate <agents> <topic>      - Multi-agent debate (rounds in settings)
  /consensus <agents> <task>    - Build consensus (rounds in settings)

Options:
  /agent [name]     - Show/set agent (claude, gemini, codex, ollama, mistral, factory, auto)
  /enable <agent>   - Enable an agent in config
  /disable <agent>  - Disable an agent in config
  /approval-mode    - Set approval mode (default/plan/accept/yolo)
  /model [agent] [model] - Show/set model (or open model panel)
  /router [name]    - Show/set routing agent
  /planner [name]   - Show/set autopilot planner agent
  /sequential       - Toggle: compare one-at-a-time
  /pick             - Toggle: select best from compare
  /execute          - Toggle: auto-run autopilot plans
  /interactive      - Toggle: pause between steps

Trust:
  /trusted             - List trusted directories
  /trusted add [path]  - Trust a directory (default: current)
  /trusted remove [path] - Remove trust
  /add-dir [path]      - Alias for /trusted add

MCP Cloud:
  /login <token>       - Login to MCP server
  /logout              - Logout from MCP
  /mcp                 - Show MCP connection status

Utility:
  /settings  - Open settings panel
  /changelog - Show version history
  /help      - Show this help
  /clear     - Clear chat history
  /exit      - Exit

Keyboard:
  Tab        - Autocomplete command
  Up/Down    - Navigate autocomplete or history
  Ctrl+R     - History search
  ?          - Toggle quick help
  Enter      - Submit or select autocomplete
  Esc        - Cancel/clear

Compare View:
  ←/→        - Navigate agents
  Enter      - Expand selected
  Tab        - Show all stacked
  Esc        - Back`);
      break;

    case 'clear':
      ctx.setMessages([]);
      if (ctx.session) {
        const cleared = clearUnifiedSessionMessages(ctx.session);
        ctx.setSession(cleared);
      }
      ctx.resetMessageId(0);
      break;

    case 'enable':
    case 'activate':
      await setAdapterEnabled(rest, true);
      break;

    case 'disable':
      await setAdapterEnabled(rest, false);
      break;

    case 'index': {
      const subCmd = rest.trim().split(/\s+/)[0] || '';
      const searchQuery = rest.slice(subCmd.length).trim();

      if (!subCmd) {
        ctx.setMode('index');
        break;
      }

      if (subCmd === 'search' && !searchQuery) {
        addMessage('Usage: /index search <query>\nExample: /index search "authentication"', 'system');
        break;
      }

      if (subCmd === 'search' && searchQuery) {
        ctx.setLoading(true);
        try {
          const results = await searchCode(searchQuery, process.cwd(), {
            limit: 10,
            includeContent: false
          });
          if (results.length === 0) {
            addMessage('No results found.', 'system');
          } else {
            const resultList = results.map(r =>
              '  ' + r.path + ' (' + (r.score * 100).toFixed(0) + '% - ' + r.matchReason + ')'
            ).join('\n');
            addMessage('Found ' + results.length + ' matches:\n' + resultList, 'system');
          }
        } catch (err) {
          addMessage('Search error: ' + (err as Error).message, 'system');
        }
        ctx.setLoading(false);
      } else if (subCmd === 'context') {
        if (!searchQuery) {
          addMessage('Usage: /index context <task>\nExample: /index context "fix auth bug"', 'system');
          break;
        }
        ctx.setLoading(true);
        try {
          const context = await getTaskContext(searchQuery, process.cwd(), {
            maxFiles: 5,
            maxTotalSize: 30 * 1024
          });
          if (context.files.length === 0) {
            addMessage('No relevant files found.', 'system');
          } else {
            let msg = 'Found ' + context.files.length + ' relevant files (' + (context.totalSize / 1024).toFixed(1) + 'KB):\n\n';
            for (const file of context.files) {
              msg += '--- ' + file.path + ' (' + file.reason + ') ---\n';
              msg += file.content + '\n\n';
            }
            addMessage(msg.trim(), 'system');
          }
        } catch (err) {
          addMessage('Context error: ' + (err as Error).message, 'system');
        }
        ctx.setLoading(false);
      } else if (subCmd === 'config') {
        try {
          const config = detectProjectConfig(process.cwd());
          if (config.configFiles.length === 0) {
            addMessage('No project configuration files found.\n\nSupported: AGENTS.md, CLAUDE.md, .cursorrules, copilot-instructions.md', 'system');
          } else {
            addMessage('Project Configuration:\n' + getConfigSummary(config), 'system');
          }
        } catch (err) {
          addMessage('Config error: ' + (err as Error).message, 'system');
        }
      } else if (subCmd === 'graph') {
        ctx.setLoading(true);
        try {
          const rootDir = process.cwd();
          const files = globSync('**/*.{ts,tsx,js,jsx}', {
            cwd: rootDir,
            absolute: true,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
          }).slice(0, 500);
          const structures = parseFiles(files, rootDir);
          const graph = buildDependencyGraph(structures, rootDir);
          addMessage('Dependency Graph:\n' + getGraphSummary(graph), 'system');
        } catch (err) {
          addMessage('Graph error: ' + (err as Error).message, 'system');
        }
        ctx.setLoading(false);
      } else if (subCmd === 'full' || subCmd === 'quick') {
        ctx.setLoading(true);
        try {
          const result = await indexCodebase(process.cwd(), { skipEmbedding: subCmd === 'quick' });
          const summary = getIndexSummary(result);
          let msg = summary;
          if (result.config.configFiles.length > 0) {
            msg += '\n\nProject Config:\n' + getConfigSummary(result.config);
          }
          addMessage(msg, 'system');
        } catch (err) {
          addMessage('Index error: ' + (err as Error).message, 'system');
        }
        ctx.setLoading(false);
      } else {
        addMessage('Unknown subcommand: ' + subCmd + '\n\nUsage: /index [full|quick|search|context|config|graph]', 'system');
      }
      break;
    }

    case 'observe': {
      const subCmd = rest.trim().split(/\s+/)[0] || '';
      const subArg = rest.slice(subCmd.length).trim();

      if (!subCmd) {
        ctx.setMode('observe');
        break;
      }

      if (subCmd === 'summary') {
        try {
          const summary = getExportSummary({ agent: subArg || undefined });
          let msg = subArg ? `Observations (${subArg}):\n` : 'All Observations:\n';
          msg += '─'.repeat(40) + '\n';
          msg += `Total observations: ${summary.observations}\n`;
          msg += `Preference pairs: ${summary.preferencePairs}`;
          if (Object.keys(summary.bySignalType).length > 0) {
            msg += '\n\nBy signal type:';
            for (const [type, count] of Object.entries(summary.bySignalType)) {
              msg += `\n  ${type}: ${count}`;
            }
          }
          addMessage(msg, 'system');
        } catch (err) {
          addMessage('Summary error: ' + (err as Error).message, 'system');
        }
      } else if (subCmd === 'list') {
        try {
          const limit = parseInt(subArg) || 10;
          const observations = getRecentObservations({ limit });
          if (observations.length === 0) {
            addMessage('No observations found.', 'system');
          } else {
            let msg = 'Recent Observations:\n' + '─'.repeat(40) + '\n';
            observations.forEach((obs, i) => {
              const date = new Date(obs.timestamp).toLocaleString();
              const prompt = obs.prompt?.slice(0, 60) || '(no prompt)';
              msg += `${i + 1}. [${date}] ${obs.agent}/${obs.model}\n`;
              msg += `   ${obs.tokensIn || 0} in / ${obs.tokensOut || 0} out | ${obs.durationMs || 0}ms\n`;
              msg += `   ${prompt}${obs.prompt && obs.prompt.length > 60 ? '...' : ''}\n\n`;
            });
            addMessage(msg.trim(), 'system');
          }
        } catch (err) {
          addMessage('List error: ' + (err as Error).message, 'system');
        }
      } else if (subCmd === 'export') {
        const outputPath = subArg || 'observations.jsonl';
        try {
          const result = exportObservations({
            outputPath,
            format: outputPath.endsWith('.json') ? 'json' : outputPath.endsWith('.csv') ? 'csv' : 'jsonl',
            limit: 10000,
            includeContent: true
          });
          if (result.success) {
            addMessage(`Exported ${result.count} observations to ${result.path}`, 'system');
          } else {
            addMessage(`Export failed: ${result.error}`, 'system');
          }
        } catch (err) {
          addMessage('Export error: ' + (err as Error).message, 'system');
        }
      } else if (subCmd === 'preferences') {
        const outputPath = subArg || 'preferences.jsonl';
        try {
          const result = exportPreferencePairs({
            outputPath,
            format: outputPath.endsWith('.json') ? 'json' : 'jsonl',
            limit: 10000
          });
          if (result.success) {
            addMessage(`Exported ${result.count} preference pairs to ${result.path}`, 'system');
          } else {
            addMessage(`Export failed: ${result.error}`, 'system');
          }
        } catch (err) {
          addMessage('Export error: ' + (err as Error).message, 'system');
        }
      } else {
        addMessage('Unknown subcommand: ' + subCmd + '\n\nUsage: /observe [summary|list|export|preferences]', 'system');
      }
      break;
    }

    case 'resume':
      ctx.setMode('sessions');
      break;

    case 'settings':
      ctx.setMode('settings');
      break;

    case 'model':
      if (rest) {
        const [agent, ...modelParts] = rest.split(' ');
        const modelName = modelParts.join(' ');
        if (['claude', 'gemini', 'codex', 'ollama', 'mistral'].includes(agent)) {
          if (modelName) {
            switch (agent) {
              case 'claude': ctx.handleSetClaudeModel(modelName); break;
              case 'gemini': ctx.handleSetGeminiModel(modelName); break;
              case 'codex': ctx.handleSetCodexModel(modelName); break;
              case 'ollama': ctx.handleSetOllamaModel(modelName); break;
              case 'mistral': ctx.handleSetMistralModel(modelName); break;
            }
            addMessage(`Model for ${agent} set to: ${modelName}`);
          } else {
            let currentModel = '';
            switch (agent) {
              case 'claude': currentModel = ctx.claudeModel; break;
              case 'gemini': currentModel = ctx.geminiModel; break;
              case 'codex': currentModel = ctx.codexModel; break;
              case 'ollama': currentModel = ctx.ollamaModel; break;
              case 'mistral': currentModel = ctx.mistralModel; break;
            }
            addMessage(`${agent} model: ${currentModel || '(default)'}`);
          }
        } else {
          addMessage('Unknown agent. Use: claude, gemini, codex, ollama, mistral');
        }
      } else {
        ctx.setMode('model');
      }
      break;

    case 'session': {
      const freshSession = createSessionCompat(ctx.currentAgent);
      ctx.setSession(freshSession);
      ctx.setMessages([]);
      ctx.resetMessageId(0);
      addMessage('New session started');
      break;
    }

    case 'exit':
      process.exit(0);
      break;

    // === MCP COMMANDS ===
    case 'login': {
      const token = rest.trim();
      if (token) {
        const currentConfig = getConfig();
        const fullConfig = { ...currentConfig };
        fullConfig.cloud = {
          ...fullConfig.cloud,
          endpoint: fullConfig.cloud?.endpoint || 'https://api.puzld.cc',
          token
        };
        saveConfig(fullConfig);
        ctx.setMcpStatus('checking');
        addMessage('Token saved. Verifying...');

        const endpoint = fullConfig.cloud.endpoint || 'https://api.puzld.cc';
        fetch(`${endpoint}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).then(res => {
          if (res.ok) {
            ctx.setMcpStatus('connected');
            ctx.addSystemMessage('Logged in to MCP successfully.');
          } else {
            ctx.setMcpStatus('disconnected');
            ctx.addSystemMessage('Token saved but could not verify (MCP server may be offline).');
          }
        }).catch(() => {
          ctx.setMcpStatus('disconnected');
          ctx.addSystemMessage('Token saved but MCP server is not reachable.');
        });
      } else {
        addMessage('Usage: /login <token>\n\nOr use CLI: puzld login');
      }
      break;
    }

    case 'logout': {
      const currentConfig = getConfig();
      if (!currentConfig.cloud?.token) {
        addMessage('Not logged in.');
      } else {
        const fullConfig = { ...currentConfig };
        fullConfig.cloud = {
          endpoint: fullConfig.cloud?.endpoint ?? 'https://api.puzld.cc',
          machineId: fullConfig.cloud?.machineId,
          token: undefined,
        };
        saveConfig(fullConfig);
        ctx.setMcpStatus('local');
        addMessage('Logged out from MCP.');
      }
      break;
    }

    case 'mcp': {
      const subCmd = rest.trim();
      const currentConfig = getConfig();

      if (!subCmd || subCmd === 'status') {
        const endpoint = currentConfig.cloud?.endpoint || 'https://api.puzld.cc';
        const hasToken = !!currentConfig.cloud?.token;
        const machineId = currentConfig.cloud?.machineId || '(not registered)';

        let statusMsg = `MCP Status: ${ctx.mcpStatus}\n`;
        statusMsg += `─`.repeat(30) + '\n';
        statusMsg += `Endpoint: ${endpoint}\n`;
        statusMsg += `Logged in: ${hasToken ? 'Yes' : 'No'}\n`;
        statusMsg += `Machine ID: ${machineId}\n\n`;

        if (!hasToken) {
          statusMsg += 'Run /login <token> to connect to MCP.';
        } else if (ctx.mcpStatus === 'connected') {
          statusMsg += 'Connected. Run "puzld serve --mcp" in another terminal to start the bridge.';
        } else {
          statusMsg += 'Token saved but not connected. MCP server may be offline.';
        }

        addMessage(statusMsg);
      } else {
        addMessage('Usage: /mcp [status]\n\nShow MCP connection status.');
      }
      break;
    }

    case 'trusted': {
      const subCmd = rest.trim().split(/\s+/)[0] || '';
      const pathArg = rest.slice(subCmd.length).trim() || process.cwd();

      if (!subCmd) {
        const trusted = getTrustedDirectories();
        if (trusted.length === 0) {
          addMessage('No trusted directories.\n\nUsage:\n  /trusted add [path]    - Trust a directory\n  /trusted remove [path] - Remove trust');
        } else {
          addMessage(`Trusted directories:\n${trusted.map(d => `  • ${d}`).join('\n')}\n\nCommands:\n  /trusted add [path]    - Trust a directory\n  /trusted remove [path] - Remove trust`);
        }
      } else if (subCmd === 'add') {
        const targetPath = pathArg;
        if (isDirectoryTrusted(targetPath)) {
          addMessage(`Already trusted: ${targetPath}`);
        } else {
          trustDirectory(targetPath, false);
          addMessage(`Trusted: ${targetPath}`);
        }
      } else if (subCmd === 'remove') {
        const targetPath = pathArg;
        untrustDirectory(targetPath);
        addMessage(`Removed trust: ${targetPath}\nRestart puzldai to see the trust prompt.`);
      } else {
        addMessage('Usage:\n  /trusted              - List trusted directories\n  /trusted add [path]   - Trust a directory (default: current)\n  /trusted remove [path] - Remove trust');
      }
      break;
    }

    case 'add-dir': {
      const targetPath = rest.trim() || process.cwd();
      if (isDirectoryTrusted(targetPath)) {
        addMessage(`Already trusted: ${targetPath}`);
      } else {
        trustDirectory(targetPath, false);
        addMessage(`Trusted: ${targetPath}`);
      }
      break;
    }

    case 'changelog': {
      try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const changelogPath = join(__dirname, '..', '..', 'CHANGELOG.md');
        const changelog = readFileSync(changelogPath, 'utf-8');

        const lines = changelog.split('\n');
        let formatted = '';
        let inVersion = false;
        let versionCount = 0;
        const maxVersions = rest ? parseInt(rest, 10) || Infinity : Infinity;

        for (const line of lines) {
          if (line.startsWith('## [')) {
            if (line.includes('[Unreleased]')) continue;
            versionCount++;
            if (versionCount > maxVersions) break;
            inVersion = true;
            const match = line.match(/## \[(.+?)\] - (.+)/);
            if (match) {
              formatted += `\n━━━ v${match[1]} (${match[2]}) ━━━\n`;
            }
          } else if (inVersion) {
            if (line.startsWith('### ')) {
              formatted += `\n${line.replace('### ', '▸ ')}\n`;
            } else if (line.startsWith('#### ')) {
              formatted += `  ${line.replace('#### ', '• ')}\n`;
            } else if (line.startsWith('- ')) {
              formatted += `    ${line}\n`;
            } else if (line.startsWith('---')) {
              // skip
            } else if (line.trim()) {
              formatted += `  ${line}\n`;
            }
          }
        }

        if (!formatted.trim()) {
          addMessage('No changelog entries found.');
        } else {
          addMessage(`Release Notes (${versionCount} versions):\n${formatted}`);
        }
      } catch (err) {
        addMessage('Could not read changelog: ' + (err as Error).message);
      }
      break;
    }

    // === VALUE OPTIONS ===
    case 'agent':
      if (rest) {
        ctx.setCurrentAgent(rest);
        ctx.setNotification('Agent set to: ' + rest);
        setTimeout(() => ctx.setNotification(null), 2000);
      } else {
        ctx.setMode('agent');
      }
      break;

    case 'approval-mode':
      if (rest) {
        const validModes: ApprovalMode[] = ['default', 'plan', 'accept', 'yolo'];
        if (validModes.includes(rest as ApprovalMode)) {
          ctx.setApprovalMode(rest as ApprovalMode);
          const modeNames: Record<ApprovalMode, string> = {
            default: 'Default',
            plan: 'Plan (no execution)',
            accept: 'Accept Edits (auto-apply)',
            yolo: 'YOLO (full auto)'
          };
          ctx.setNotification('Approval mode: ' + modeNames[rest as ApprovalMode]);
          setTimeout(() => ctx.setNotification(null), 2000);
        } else {
          addMessage('Invalid mode. Use: default, plan, accept, yolo');
        }
      } else {
        ctx.setMode('approval-mode');
      }
      break;

    case 'router':
      if (rest) {
        ctx.setCurrentRouter(rest);
        addMessage('Router set to: ' + rest);
      } else {
        addMessage('Current router: ' + ctx.currentRouter);
      }
      break;

    case 'planner':
      if (rest) {
        ctx.setCurrentPlanner(rest);
        addMessage('Planner set to: ' + rest);
      } else {
        addMessage('Current planner: ' + ctx.currentPlanner);
      }
      break;

    // === TOGGLE OPTIONS ===
    case 'sequential':
      ctx.setSequential(s => !s);
      addMessage('Sequential mode: ' + (!ctx.sequential ? 'ON' : 'OFF'));
      break;

    case 'pick':
      ctx.setPick(p => !p);
      addMessage('Pick mode: ' + (!ctx.pick ? 'ON' : 'OFF'));
      break;

    case 'execute':
      ctx.setExecuteMode(e => !e);
      addMessage('Execute mode: ' + (!ctx.executeMode ? 'ON' : 'OFF'));
      break;

    case 'interactive':
      ctx.setInteractive(i => !i);
      addMessage('Interactive mode: ' + (!ctx.interactive ? 'ON' : 'OFF'));
      break;

    // === WORKFLOWS ===
    case 'workflows':
      ctx.setMode('workflows');
      break;

    // === COMMANDS ===
    case 'compare': {
      const compareMatch = rest.match(/^(\S+)\s+(?:"([^"]+)"|(.+))$/);
      if (!compareMatch) {
        addMessage('Usage: /compare <agents> <task>\nExample: /compare claude,gemini "explain async"');
        break;
      }
      const agentsStr = compareMatch[1];
      const task = compareMatch[2] || compareMatch[3];
      const agents = parseAgentsString(agentsStr);

      if (agents.length < 2) {
        addMessage('Compare needs at least 2 agents.\nExample: /compare claude,gemini "task"');
        break;
      }

      ctx.setMessages(prev => [...prev, { id: nextId(), role: 'user', content: '/compare ' + agentsStr + ' "' + task + '"' }]);

      ctx.setCompareKey(k => k + 1);
      ctx.setCompareResults(agents.map(agent => ({
        agent,
        content: '',
        loading: true
      })));
      ctx.setMode('compare');

      try {
        const projectStructure = getProjectStructure(process.cwd());

        const plan = buildComparePlan(task, {
          agents: agents as AgentName[],
          sequential: ctx.sequential,
          pick: ctx.pick,
          projectStructure
        });

        const result = await execute(plan);

        const resultMap = new Map(result.results.map(r => [r.stepId, r]));

        const visualResults: CompareResult[] = agents.map((agent, i) => {
          const stepResult = resultMap.get('step_' + i);
          return {
            agent,
            content: stepResult?.content || '',
            error: stepResult?.error,
            duration: stepResult?.duration,
            loading: false
          };
        });

        ctx.setCompareResults(visualResults);
      } catch (err) {
        const errorResults = agents.map(agent => ({
          agent,
          content: '',
          error: (err as Error).message,
          loading: false
        }));
        ctx.setCompareResults(errorResults);
      }
      break;
    }

    case 'autopilot': {
      const taskMatch = rest.match(/^(?:"([^"]+)"|(.+))$/);
      if (!taskMatch) {
        addMessage('Usage: /autopilot <task>\nExample: /autopilot "build a REST API"');
        break;
      }
      const task = taskMatch[1] || taskMatch[2];

      ctx.setMessages(prev => [...prev, { id: nextId(), role: 'user', content: '/autopilot "' + task + '"' }]);
      ctx.setLoading(true);

      try {
        const planResult = await generatePlan(task, ctx.currentPlanner as AgentName);

        if (planResult.error || !planResult.plan) {
          addMessage('Error: ' + (planResult.error || 'Failed to generate plan'), 'autopilot');
          ctx.setLoading(false);
          break;
        }

        const plan = planResult.plan;

        let planDisplay = 'Plan: ' + (plan.prompt || task) + '\n\n';
        plan.steps.forEach((step, i) => {
          const description = step.prompt.split('Original task:')[0].trim();
          planDisplay += (i + 1) + '. [' + (step.agent || 'auto') + '] ' + step.action + '\n';
          planDisplay += '   ' + description.slice(0, 80) + (description.length > 80 ? '...' : '') + '\n';
        });

        if (ctx.executeMode) {
          addMessage(planDisplay, 'autopilot');
          ctx.setLoading(false);

          const initialSteps: CollaborationStep[] = plan.steps.map(step => ({
            agent: step.agent || 'auto',
            role: step.action || 'execute',
            content: '',
            loading: true
          }));

          ctx.setCollaborationKey(k => k + 1);
          ctx.setCollaborationSteps(initialSteps);
          ctx.setCollaborationType('pipeline');
          ctx.setPipelineName('Autopilot');
          ctx.setMode('collaboration');

          const result = await execute(plan);

          const pipelineSteps: CollaborationStep[] = plan.steps.map((step) => {
            const stepResult = result.results.find(r => r.stepId === step.id);
            return {
              agent: step.agent || 'auto',
              role: step.action || 'execute',
              content: stepResult?.content || '',
              error: stepResult?.error,
              duration: stepResult?.duration,
              loading: false
            };
          });

          ctx.setCollaborationSteps(pipelineSteps);
        } else {
          addMessage(planDisplay + '\nUse /execute to enable auto-execution', 'autopilot');
          ctx.setLoading(false);
        }
      } catch (err) {
        addMessage('Error: ' + (err as Error).message);
        ctx.setLoading(false);
      }

      break;
    }

    case 'campaign': {
      const goalMatch = rest.match(/^(?:"([^"]+)"|(.+))$/);
      if (!goalMatch) {
        addMessage('Usage: /campaign <goal>\nExample: /campaign "Build a user authentication system"');
        break;
      }
      const goal = goalMatch[1] || goalMatch[2];

      ctx.setMessages(prev => [...prev, { id: nextId(), role: 'user', content: '/campaign "' + goal + '"' }]);
      ctx.setLoading(true);

      try {
        const options: CampaignOptions = {
          goal,
          autonomy: 'checkpoint',
          useDroid: true
        };

        const result = await runCampaign(options);

        const summary = `
Campaign ${result.status}
Tasks: ${result.tasksCompleted}/${result.tasksTotal} completed
Duration: ${(result.duration / 1000).toFixed(1)}s
Checkpoints: ${result.checkpoints}
Decisions: ${result.decisions}
${result.recoverySummary ? '\nRecovery:\n' + result.recoverySummary : ''}
${result.finalSummary ? '\nSummary:\n' + result.finalSummary : ''}
`.trim();

        addMessage(summary, 'campaign');
      } catch (err) {
        addMessage('Error: ' + (err as Error).message, 'campaign');
      }

      ctx.setLoading(false);
      break;
    }

    case 'workflow': {
      const wfMatch = rest.match(/^(\S+)\s+(?:"([^"]+)"|(.+))$/);
      if (!wfMatch) {
        addMessage('Usage: /workflow <name> <task>\nExample: /workflow code-review "my code here"');
        break;
      }
      const wfName = wfMatch[1];
      const task = wfMatch[2] || wfMatch[3];

      const template = loadTemplate(wfName);
      if (!template) {
        addMessage('Workflow not found: ' + wfName + '\nUse /workflows to see available workflows.');
        break;
      }
      if (!template.steps || template.steps.length === 0) {
        addMessage('Workflow "' + wfName + '" has no steps.\nEdit it in /workflows to add steps.');
        break;
      }

      ctx.setMessages(prev => [...prev, { id: nextId(), role: 'user', content: '/workflow ' + wfName + ' "' + task + '"' }]);

      const plan = buildPipelinePlan(task, { steps: template.steps });

      const initialSteps: CollaborationStep[] = plan.steps.map(step => ({
        agent: step.agent || 'auto',
        role: step.action || 'execute',
        content: '',
        loading: true
      }));

      ctx.setCollaborationKey(k => k + 1);
      ctx.setCollaborationSteps(initialSteps);
      ctx.setCollaborationType('pipeline');
      ctx.setPipelineName(wfName);
      ctx.setMode('collaboration');

      try {
        const result = await execute(plan);

        const pipelineSteps: CollaborationStep[] = plan.steps.map((step) => {
          const stepResult = result.results.find(r => r.stepId === step.id);
          return {
            agent: step.agent || 'auto',
            role: step.action || 'execute',
            content: stepResult?.content || '',
            error: stepResult?.error,
            duration: stepResult?.duration,
            loading: false
          };
        });

        ctx.setCollaborationSteps(pipelineSteps);
      } catch (err) {
        const errorSteps = initialSteps.map(s => ({
          ...s,
          content: '',
          error: (err as Error).message,
          loading: false
        }));
        ctx.setCollaborationSteps(errorSteps);
      }

      break;
    }

    // === MULTI-AGENT COLLABORATION ===
    case 'correct': {
      const correctMatch = rest.match(/^(\S+)\s+(\S+)\s+(?:"([^"]+)"|(.+))$/);
      if (!correctMatch) {
        addMessage('Usage: /correct <producer> <reviewer> <task>\nExample: /correct claude gemini "write a function"');
        break;
      }
      const producer = correctMatch[1];
      const reviewer = correctMatch[2];
      const task = correctMatch[3] || correctMatch[4];

      ctx.setMessages(prev => [...prev, { id: nextId(), role: 'user', content: '/correct ' + producer + ' ' + reviewer + ' "' + task + '"' }]);

      const initialSteps: CollaborationStep[] = [
        { agent: producer, role: 'producer', content: '', loading: true },
        { agent: reviewer, role: 'reviewer', content: '', loading: true },
      ];
      if (ctx.correctFix) {
        initialSteps.push({ agent: producer, role: 'fix', content: '', loading: true });
      }

      ctx.setCollaborationKey(k => k + 1);
      ctx.setCollaborationSteps(initialSteps);
      ctx.setCollaborationType('correct');
      ctx.setMode('collaboration');

      try {
        let taskWithMemory = task;
        try {
          const injection = await buildInjectionForAgent(task, producer, {
            maxTokens: 1000,
            includeConversation: true,
            includeDecisions: true,
            includePatterns: true
          });
          if (injection.itemCount > 0) {
            taskWithMemory = `${injection.content}\n\nTask: ${task}`;
          }
        } catch {
          // Continue without memory
        }

        const plan = buildCorrectionPlan(taskWithMemory, {
          producer: producer as AgentName | 'auto',
          reviewer: reviewer as AgentName | 'auto',
          fixAfterReview: ctx.correctFix
        });

        const controller = new AbortController();
        ctx.abortControllerRef.current = controller;

        const result = await execute(plan, { signal: controller.signal });
        ctx.abortControllerRef.current = null;

        if (result.status === 'cancelled') {
          const cancelledSteps = initialSteps.map(s => ({
            ...s,
            content: s.loading ? '' : s.content,
            error: s.loading ? 'Cancelled by user' : undefined,
            loading: false
          }));
          ctx.setCollaborationSteps(cancelledSteps);
          ctx.setNotification(null);
          ctx.addSystemMessage('Correction cancelled.');
          return;
        }

        const steps: CollaborationStep[] = [
          {
            agent: producer,
            role: 'producer',
            content: result.results[0]?.content || '',
            error: result.results[0]?.error,
            duration: result.results[0]?.duration,
            loading: false
          },
          {
            agent: reviewer,
            role: 'reviewer',
            content: result.results[1]?.content || '',
            error: result.results[1]?.error,
            duration: result.results[1]?.duration,
            loading: false
          }
        ];

        if (ctx.correctFix && result.results[2]) {
          steps.push({
            agent: producer,
            role: 'fix',
            content: result.results[2]?.content || '',
            error: result.results[2]?.error,
            duration: result.results[2]?.duration,
            loading: false
          });
        }

        ctx.setCollaborationSteps(steps);
      } catch (err) {
        const errorSteps = initialSteps.map(s => ({
          ...s,
          content: '',
          error: (err as Error).message,
          loading: false
        }));
        ctx.setCollaborationSteps(errorSteps);
      }

      ctx.setLoading(false);
      break;
    }

    case 'debate': {
      const debateMatch = rest.match(/^(\S+)\s+(?:"([^"]+)"|(.+))$/);
      if (!debateMatch) {
        addMessage('Usage: /debate <agents> <topic>\nExample: /debate claude,gemini "Is AI safe?"');
        break;
      }
      const agentsStr = debateMatch[1];
      const topic = debateMatch[2] || debateMatch[3];
      const agents = parseAgentsString(agentsStr);

      if (agents.length < 2) {
        addMessage('Debate needs at least 2 agents.\nExample: /debate claude,gemini "topic"');
        break;
      }

      const moderator = ctx.debateModerator !== 'none' ? ctx.debateModerator as AgentName : undefined;

      ctx.setMessages(prev => [...prev, { id: nextId(), role: 'user', content: '/debate ' + agentsStr + ' "' + topic + '"' }]);

      const initialDebateSteps: CollaborationStep[] = [];
      for (let round = 0; round < ctx.debateRounds; round++) {
        for (const agent of agents) {
          initialDebateSteps.push({
            agent,
            role: `round-${round}`,
            round,
            content: '',
            loading: true
          });
        }
      }
      if (moderator) {
        initialDebateSteps.push({
          agent: moderator,
          role: 'moderator',
          content: '',
          loading: true
        });
      }

      ctx.setCollaborationKey(k => k + 1);
      ctx.setCollaborationSteps(initialDebateSteps);
      ctx.setCollaborationType('debate');
      ctx.setMode('collaboration');

      try {
        let topicWithMemory = topic;
        try {
          const injection = await buildInjectionForAgent(topic, agents[0], {
            maxTokens: 1000,
            includeConversation: true,
            includeDecisions: true,
            includePatterns: true
          });
          if (injection.itemCount > 0) {
            topicWithMemory = `${injection.content}\n\nDebate topic: ${topic}`;
          }
        } catch {
          // Continue without memory
        }

        const plan = buildDebatePlan(topicWithMemory, {
          agents: agents as AgentName[],
          rounds: ctx.debateRounds,
          moderator
        });

        const controller = new AbortController();
        ctx.abortControllerRef.current = controller;

        const result = await execute(plan, { signal: controller.signal });
        ctx.abortControllerRef.current = null;

        if (result.status === 'cancelled') {
          const cancelledSteps = initialDebateSteps.map(s => ({
            ...s,
            content: s.loading ? '' : s.content,
            error: s.loading ? 'Cancelled by user' : undefined,
            loading: false
          }));
          ctx.setCollaborationSteps(cancelledSteps);
          ctx.setNotification(null);
          ctx.addSystemMessage('Debate cancelled.');
          return;
        }

        const debateSteps: CollaborationStep[] = [];
        for (let round = 0; round < ctx.debateRounds; round++) {
          for (let i = 0; i < agents.length; i++) {
            const stepIndex = round * agents.length + i;
            const stepResult = result.results[stepIndex];
            debateSteps.push({
              agent: agents[i],
              role: `round-${round}`,
              round,
              content: stepResult?.content || '',
              error: stepResult?.error,
              duration: stepResult?.duration,
              loading: false
            });
          }
        }

        if (moderator) {
          const conclusionStep = result.results[result.results.length - 1];
          debateSteps.push({
            agent: moderator,
            role: 'moderator',
            content: conclusionStep?.content || '',
            error: conclusionStep?.error,
            duration: conclusionStep?.duration,
            loading: false
          });
        }

        ctx.setCollaborationSteps(debateSteps);
      } catch (err) {
        const errorSteps = initialDebateSteps.map(s => ({
          ...s,
          content: '',
          error: (err as Error).message,
          loading: false
        }));
        ctx.setCollaborationSteps(errorSteps);
      }

      break;
    }

    case 'consensus': {
      const consensusMatch = rest.match(/^(\S+)\s+(?:"([^"]+)"|(.+))$/);
      if (!consensusMatch) {
        addMessage('Usage: /consensus <agents> <task>\nExample: /consensus claude,gemini,ollama "best approach for..."');
        break;
      }
      const agentsStr = consensusMatch[1];
      const task = consensusMatch[2] || consensusMatch[3];
      const agents = parseAgentsString(agentsStr);

      if (agents.length < 2) {
        addMessage('Consensus needs at least 2 agents.\nExample: /consensus claude,gemini "task"');
        break;
      }

      const synth = ctx.consensusSynthesizer !== 'auto' ? ctx.consensusSynthesizer as AgentName : undefined;

      ctx.setMessages(prev => [...prev, { id: nextId(), role: 'user', content: '/consensus ' + agentsStr + ' "' + task + '"' }]);

      const initialConsensusSteps: CollaborationStep[] = [];

      for (const agent of agents) {
        initialConsensusSteps.push({
          agent,
          role: 'proposal',
          content: '',
          loading: true
        });
      }

      for (let round = 0; round < ctx.consensusRounds; round++) {
        for (const agent of agents) {
          initialConsensusSteps.push({
            agent,
            role: 'vote',
            round,
            content: '',
            loading: true
          });
        }
      }

      initialConsensusSteps.push({
        agent: synth || agents[0],
        role: 'synthesis',
        content: '',
        loading: true
      });

      ctx.setCollaborationKey(k => k + 1);
      ctx.setCollaborationSteps(initialConsensusSteps);
      ctx.setCollaborationType('consensus');
      ctx.setMode('collaboration');

      try {
        let taskWithMemory = task;
        try {
          const injection = await buildInjectionForAgent(task, agents[0], {
            maxTokens: 1000,
            includeConversation: true,
            includeDecisions: true,
            includePatterns: true
          });
          if (injection.itemCount > 0) {
            taskWithMemory = `${injection.content}\n\nTask: ${task}`;
          }
        } catch {
          // Continue without memory
        }

        const projectStructure = getProjectStructure(process.cwd());

        const plan = buildConsensusPlan(taskWithMemory, {
          agents: agents as AgentName[],
          maxRounds: ctx.consensusRounds,
          synthesizer: synth,
          projectStructure
        });

        const controller = new AbortController();
        ctx.abortControllerRef.current = controller;

        const result = await execute(plan, { signal: controller.signal });
        ctx.abortControllerRef.current = null;

        if (result.status === 'cancelled') {
          const cancelledSteps = initialConsensusSteps.map(s => ({
            ...s,
            content: s.loading ? '' : s.content,
            error: s.loading ? 'Cancelled by user' : undefined,
            loading: false
          }));
          ctx.setCollaborationSteps(cancelledSteps);
          ctx.setNotification(null);
          ctx.addSystemMessage('Consensus cancelled.');
          return;
        }

        const consensusSteps: CollaborationStep[] = [];
        let resultIndex = 0;

        for (const agent of agents) {
          const stepResult = result.results[resultIndex++];
          consensusSteps.push({
            agent,
            role: 'proposal',
            content: stepResult?.content || '',
            error: stepResult?.error,
            duration: stepResult?.duration,
            loading: false
          });
        }

        for (let round = 0; round < ctx.consensusRounds; round++) {
          for (const agent of agents) {
            const stepResult = result.results[resultIndex++];
            consensusSteps.push({
              agent,
              role: 'vote',
              round,
              content: stepResult?.content || '',
              error: stepResult?.error,
              duration: stepResult?.duration,
              loading: false
            });
          }
        }

        const synthResult = result.results[resultIndex];
        consensusSteps.push({
          agent: synth || agents[0],
          role: 'synthesis',
          content: synthResult?.content || '',
          error: synthResult?.error,
          duration: synthResult?.duration,
          loading: false
        });

        ctx.setCollaborationSteps(consensusSteps);
      } catch (err) {
        const errorSteps = initialConsensusSteps.map(s => ({
          ...s,
          content: '',
          error: (err as Error).message,
          loading: false
        }));
        ctx.setCollaborationSteps(errorSteps);
      }

      break;
    }

    default:
      addMessage('Unknown command: /' + command + '\nType /help for available commands.');
  }
}
