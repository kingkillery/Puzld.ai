import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { formatDuration, formatTokens } from '../../lib/formatters';
import { COLORS, SYMBOLS } from '../theme';

export type AgentPhase = 'thinking' | 'tool_pending' | 'tool_running' | 'analyzing' | 'writing';

interface AgentStatusProps {
  agentName: string;
  isLoading: boolean;
  startTime?: number;
  tokens?: number;
  phase?: AgentPhase;
  toolCount?: number;
  iteration?: number;
  summary?: string;
  status?: string;
}

// ms per frame
const SPINNER_INTERVAL = 80;

function getPhaseDisplay(phase: AgentPhase): { text: string; color: string } {
  switch (phase) {
    case 'thinking':
      return { text: 'thinking...', color: COLORS.info };
    case 'tool_pending':
      return { text: 'awaiting permission', color: COLORS.warning };
    case 'tool_running':
      return { text: 'executing tool', color: COLORS.success };
    case 'analyzing':
      return { text: 'analyzing results', color: COLORS.accent };
    case 'writing':
      return { text: 'writing response', color: COLORS.primary };
    default:
      return { text: 'working...', color: COLORS.muted };
  }
}

export function AgentStatus({
  agentName,
  isLoading,
  startTime,
  tokens,
  phase = 'thinking',
  toolCount = 0,
  iteration = 1,
  summary,
  status
}: AgentStatusProps) {
  const [elapsed, setElapsed] = useState(0);
  const [spinnerFrame, setSpinnerFrame] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!isLoading || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  // Animate spinner
  useEffect(() => {
    if (!isLoading) {
      setSpinnerFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setSpinnerFrame(f => (f + 1) % SYMBOLS.spinner.length);
    }, SPINNER_INTERVAL);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Pulse effect for summary - cycles every 100ms
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!isLoading || !summary) {
      setPulse(0);
      return;
    }
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 10); // 0-9 cycle
    }, 100);
    return () => clearInterval(interval);
  }, [isLoading, summary]);

  if (!isLoading) return null;

  const spinner = SYMBOLS.spinner[spinnerFrame];
  const phaseInfo = getPhaseDisplay(phase);

  // Calculate pulse intensity (0.5 to 1.0)
  const pulseDim = pulse < 5 ? (0.7 + (pulse * 0.06)) : (1.0 - ((pulse - 5) * 0.06));

  return (
    <Box marginTop={1} flexDirection="column">
      <Box>
        <Text color={COLORS.accent}>{spinner} </Text>
        <Text color={COLORS.accent} bold>{agentName}</Text>
        {iteration > 1 && (
          <Text dimColor> (iter {iteration})</Text>
        )}
        <Text dimColor> · </Text>
        <Text color={phaseInfo.color} bold={pulse > 3 && pulse < 7}>
          {summary ? (pulseDim < 0.85 ? <Text dimColor>{summary}</Text> : summary) : (status || phaseInfo.text)}
        </Text>
      </Box>
      <Box marginLeft={2} marginBottom={summary ? 1 : 0}>
        {/* Progress Bar HUD style */}
        <Text dimColor>[</Text>
        <Text color={phaseInfo.color}>
          {'█'.repeat(Math.max(1, (spinnerFrame % 10) + 1))}
          {'░'.repeat(10 - ((spinnerFrame % 10) + 1))}
        </Text>
        <Text dimColor>] </Text>
        <Text color={phaseInfo.color} dimColor={pulseDim < 0.9}>
          {phase.replace('_', ' ').toUpperCase()}
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text dimColor>⏱ </Text>
        <Text color={COLORS.warning}>{formatDuration(elapsed)}</Text>
        {toolCount > 0 && (
          <>
            <Text dimColor> · </Text>
            <Text color={COLORS.success}>🔧 {toolCount} tool{toolCount !== 1 ? 's' : ''}</Text>
          </>
        )}
        {tokens !== undefined && tokens > 0 && (
          <>
            <Text dimColor> · </Text>
            <Text color={COLORS.info}>↓ {formatTokens(tokens)} tokens</Text>
          </>
        )}
        <Text dimColor> · </Text>
        <Text dimColor>esc to interrupt</Text>
      </Box>
    </Box>
  );
}
