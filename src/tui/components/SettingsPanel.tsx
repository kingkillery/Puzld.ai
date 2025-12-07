import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { getSessionStats, type AgentSession } from '../../memory';

const HIGHLIGHT = '#8CA9FF';

type SettingsTab = 'status' | 'session' | 'config' | 'correct' | 'debate' | 'consensus';

interface SettingsPanelProps {
  onBack: () => void;
  version: string;
  currentAgent: string;
  routerAgent: string;
  plannerAgent: string;
  session: AgentSession | null;
  // Toggles
  sequential: boolean;
  pick: boolean;
  autoExecute: boolean;
  interactive: boolean;
  // Toggle setters
  onToggleSequential: () => void;
  onTogglePick: () => void;
  onToggleExecute: () => void;
  onToggleInteractive: () => void;
  // Collaboration settings
  correctFix: boolean;
  debateRounds: number;
  debateModerator: string;
  consensusRounds: number;
  consensusSynthesizer: string;
  onToggleCorrectFix: () => void;
  onSetDebateRounds: (n: number) => void;
  onSetDebateModerator: (agent: string) => void;
  onSetConsensusRounds: (n: number) => void;
  onSetConsensusSynthesizer: (agent: string) => void;
}

interface ConfigOption {
  key: string;
  label: string;
  value: boolean;
  onToggle: () => void;
}

const AGENTS = ['none', 'auto', 'claude', 'gemini', 'codex', 'ollama'];

export function SettingsPanel({
  onBack,
  version,
  currentAgent,
  routerAgent,
  plannerAgent,
  session,
  sequential,
  pick,
  autoExecute,
  interactive,
  onToggleSequential,
  onTogglePick,
  onToggleExecute,
  onToggleInteractive,
  correctFix,
  debateRounds,
  debateModerator,
  consensusRounds,
  consensusSynthesizer,
  onToggleCorrectFix,
  onSetDebateRounds,
  onSetDebateModerator,
  onSetConsensusRounds,
  onSetConsensusSynthesizer
}: SettingsPanelProps) {
  const [tab, setTab] = useState<SettingsTab>('status');
  const [configIndex, setConfigIndex] = useState(0);
  const [debateIndex, setDebateIndex] = useState(0);
  const [consensusIndex, setConsensusIndex] = useState(0);

  const configOptions: ConfigOption[] = [
    { key: 'sequential', label: 'Sequential compare', value: sequential, onToggle: onToggleSequential },
    { key: 'pick', label: 'Pick best from compare', value: pick, onToggle: onTogglePick },
    { key: 'autoExecute', label: 'Auto-execute autopilot', value: autoExecute, onToggle: onToggleExecute },
    { key: 'interactive', label: 'Interactive mode', value: interactive, onToggle: onToggleInteractive }
  ];

  const tabs: SettingsTab[] = ['status', 'session', 'config', 'correct', 'debate', 'consensus'];

  // Handle tab cycling and escape
  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.tab) {
      setTab(t => {
        const idx = tabs.indexOf(t);
        return tabs[(idx + 1) % tabs.length];
      });
    }
  });

  // Handle config navigation
  useInput((input, key) => {
    if (tab !== 'config') return;

    if (key.upArrow) {
      setConfigIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setConfigIndex(i => Math.min(configOptions.length - 1, i + 1));
    } else if (key.return || input === ' ') {
      configOptions[configIndex].onToggle();
    }
  }, { isActive: tab === 'config' });

  // Handle correct tab (just toggle fix)
  useInput((input, key) => {
    if (tab !== 'correct') return;
    if (key.return || input === ' ') {
      onToggleCorrectFix();
    }
  }, { isActive: tab === 'correct' });

  // Handle debate tab navigation
  useInput((input, key) => {
    if (tab !== 'debate') return;

    if (key.upArrow) {
      setDebateIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setDebateIndex(i => Math.min(1, i + 1));
    } else if (key.leftArrow) {
      if (debateIndex === 0) {
        onSetDebateRounds(Math.max(1, debateRounds - 1));
      } else {
        const idx = AGENTS.indexOf(debateModerator);
        onSetDebateModerator(AGENTS[Math.max(0, idx - 1)]);
      }
    } else if (key.rightArrow) {
      if (debateIndex === 0) {
        onSetDebateRounds(Math.min(5, debateRounds + 1));
      } else {
        const idx = AGENTS.indexOf(debateModerator);
        onSetDebateModerator(AGENTS[Math.min(AGENTS.length - 1, idx + 1)]);
      }
    }
  }, { isActive: tab === 'debate' });

  // Handle consensus tab navigation
  useInput((input, key) => {
    if (tab !== 'consensus') return;

    if (key.upArrow) {
      setConsensusIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setConsensusIndex(i => Math.min(1, i + 1));
    } else if (key.leftArrow) {
      if (consensusIndex === 0) {
        onSetConsensusRounds(Math.max(1, consensusRounds - 1));
      } else {
        const idx = AGENTS.indexOf(consensusSynthesizer);
        onSetConsensusSynthesizer(AGENTS[Math.max(0, idx - 1)]);
      }
    } else if (key.rightArrow) {
      if (consensusIndex === 0) {
        onSetConsensusRounds(Math.min(5, consensusRounds + 1));
      } else {
        const idx = AGENTS.indexOf(consensusSynthesizer);
        onSetConsensusSynthesizer(AGENTS[Math.min(AGENTS.length - 1, idx + 1)]);
      }
    }
  }, { isActive: tab === 'consensus' });

  // Get session stats
  const sessionStats = session ? getSessionStats(session) : null;

  const getFooterHint = () => {
    switch (tab) {
      case 'config':
      case 'correct':
        return 'Enter/Space to toggle · ';
      case 'debate':
      case 'consensus':
        return '←/→ to change · ↑/↓ to navigate · ';
      default:
        return '';
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Tab bar */}
      <Box marginBottom={1} flexWrap="wrap">
        <Text bold>Settings: </Text>
        {tabs.map((t, i) => (
          <React.Fragment key={t}>
            <Text inverse={tab === t} color={tab === t ? HIGHLIGHT : undefined}> {t.charAt(0).toUpperCase() + t.slice(1)} </Text>
            {i < tabs.length - 1 && <Text> </Text>}
          </React.Fragment>
        ))}
        <Text dimColor>  (Tab to cycle)</Text>
      </Box>

      {/* Tab content */}
      <Box flexDirection="column" paddingLeft={1}>
        {tab === 'status' && (
          <StatusTab
            version={version}
            currentAgent={currentAgent}
            routerAgent={routerAgent}
            plannerAgent={plannerAgent}
          />
        )}
        {tab === 'session' && (
          <SessionTab session={session} stats={sessionStats} />
        )}
        {tab === 'config' && (
          <ConfigTab options={configOptions} selectedIndex={configIndex} />
        )}
        {tab === 'correct' && (
          <CorrectTab fix={correctFix} />
        )}
        {tab === 'debate' && (
          <DebateTab
            rounds={debateRounds}
            moderator={debateModerator}
            selectedIndex={debateIndex}
          />
        )}
        {tab === 'consensus' && (
          <ConsensusTab
            rounds={consensusRounds}
            synthesizer={consensusSynthesizer}
            selectedIndex={consensusIndex}
          />
        )}
      </Box>

      {/* Footer hint */}
      <Box marginTop={1}>
        <Text dimColor>
          {getFooterHint()}Esc to exit
        </Text>
      </Box>
    </Box>
  );
}

interface StatusTabProps {
  version: string;
  currentAgent: string;
  routerAgent: string;
  plannerAgent: string;
}

function StatusTab({ version, currentAgent, routerAgent, plannerAgent }: StatusTabProps) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>{'Version:'.padEnd(20)}</Text>
        <Text>{version}</Text>
      </Box>
      <Box>
        <Text bold>{'Current Agent:'.padEnd(20)}</Text>
        <Text>{currentAgent}</Text>
      </Box>
      <Box>
        <Text bold>{'Router Agent:'.padEnd(20)}</Text>
        <Text>{routerAgent}</Text>
      </Box>
      <Box>
        <Text bold>{'Planner Agent:'.padEnd(20)}</Text>
        <Text>{plannerAgent}</Text>
      </Box>
    </Box>
  );
}

interface SessionTabProps {
  session: AgentSession | null;
  stats: ReturnType<typeof getSessionStats> | null;
}

function SessionTab({ session, stats }: SessionTabProps) {
  if (!session || !stats) {
    return <Text dimColor>No active session</Text>;
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleString();

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>{'Session ID:'.padEnd(20)}</Text>
        <Text dimColor>{session.id}</Text>
      </Box>
      <Box>
        <Text bold>{'Agent:'.padEnd(20)}</Text>
        <Text>{session.agent}</Text>
      </Box>
      <Box>
        <Text bold>{'Messages:'.padEnd(20)}</Text>
        <Text>{stats.messageCount}</Text>
      </Box>
      <Box>
        <Text bold>{'Tokens:'.padEnd(20)}</Text>
        <Text>{stats.totalTokens} </Text>
        <Text dimColor>(recent: {stats.recentTokens}, summary: {stats.summaryTokens})</Text>
      </Box>
      <Box>
        <Text bold>{'Compression:'.padEnd(20)}</Text>
        <Text>{stats.compressionRatio}%</Text>
      </Box>
      <Box>
        <Text bold>{'Created:'.padEnd(20)}</Text>
        <Text dimColor>{formatDate(session.createdAt)}</Text>
      </Box>
      <Box>
        <Text bold>{'Updated:'.padEnd(20)}</Text>
        <Text dimColor>{formatDate(session.updatedAt)}</Text>
      </Box>
      {session.summary && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Summary:</Text>
          <Text dimColor>{session.summary.slice(0, 200)}{session.summary.length > 200 ? '...' : ''}</Text>
        </Box>
      )}
    </Box>
  );
}

interface ConfigTabProps {
  options: ConfigOption[];
  selectedIndex: number;
}

function ConfigTab({ options, selectedIndex }: ConfigTabProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>Configure PulzdAI preferences</Text>
      <Box flexDirection="column" marginTop={1}>
        {options.map((opt, i) => {
          const isSelected = i === selectedIndex;
          return (
            <Box key={opt.key}>
              <Text color={isSelected ? HIGHLIGHT : undefined}>
                {isSelected ? '>' : ' '} {opt.label.padEnd(30)}
              </Text>
              <Text color={opt.value ? 'green' : 'gray'}>
                {opt.value ? 'true' : 'false'}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// --- Collaboration Tabs ---

interface CorrectTabProps {
  fix: boolean;
}

function CorrectTab({ fix }: CorrectTabProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>Cross-agent correction settings</Text>
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color={HIGHLIGHT}>&gt; {'Fix after review'.padEnd(30)}</Text>
          <Text color={fix ? 'green' : 'gray'}>{fix ? 'true' : 'false'}</Text>
        </Box>
        <Text dimColor marginTop={1}>
          When enabled, producer will fix issues identified in review.
        </Text>
      </Box>
    </Box>
  );
}

interface DebateTabProps {
  rounds: number;
  moderator: string;
  selectedIndex: number;
}

function DebateTab({ rounds, moderator, selectedIndex }: DebateTabProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>Multi-agent debate settings</Text>
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color={selectedIndex === 0 ? HIGHLIGHT : undefined}>
            {selectedIndex === 0 ? '>' : ' '} {'Rounds'.padEnd(30)}
          </Text>
          <Text>◀ {rounds} ▶</Text>
        </Box>
        <Box>
          <Text color={selectedIndex === 1 ? HIGHLIGHT : undefined}>
            {selectedIndex === 1 ? '>' : ' '} {'Moderator'.padEnd(30)}
          </Text>
          <Text>◀ {moderator} ▶</Text>
        </Box>
        <Text dimColor marginTop={1}>
          Moderator synthesizes final conclusion (none = no synthesis).
        </Text>
      </Box>
    </Box>
  );
}

interface ConsensusTabProps {
  rounds: number;
  synthesizer: string;
  selectedIndex: number;
}

function ConsensusTab({ rounds, synthesizer, selectedIndex }: ConsensusTabProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>Consensus building settings</Text>
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color={selectedIndex === 0 ? HIGHLIGHT : undefined}>
            {selectedIndex === 0 ? '>' : ' '} {'Voting rounds'.padEnd(30)}
          </Text>
          <Text>◀ {rounds} ▶</Text>
        </Box>
        <Box>
          <Text color={selectedIndex === 1 ? HIGHLIGHT : undefined}>
            {selectedIndex === 1 ? '>' : ' '} {'Synthesizer'.padEnd(30)}
          </Text>
          <Text>◀ {synthesizer} ▶</Text>
        </Box>
        <Text dimColor marginTop={1}>
          Synthesizer creates final output (auto = first agent).
        </Text>
      </Box>
    </Box>
  );
}
