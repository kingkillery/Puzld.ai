import { memo } from 'react';
import { Box, Text } from 'ink';
import { formatTokens } from '../../lib/formatters';
import { COLORS } from '../theme';

export type McpStatus = 'connected' | 'disconnected' | 'local' | 'checking';
export type ApprovalMode = 'default' | 'plan' | 'accept' | 'yolo';

interface StatusBarProps {
  agent: string;
  messageCount?: number;
  tokens?: number;
  mcpStatus?: McpStatus;
  approvalMode?: ApprovalMode;
  sessionName?: string;
  isLoading?: boolean;
  mode?: string;
  hasAutocomplete?: boolean;
  inputActive?: boolean;
  noColor?: boolean;
}

export const StatusBar = memo(function StatusBar({
  agent,
  messageCount = 0,
  tokens = 0,
  mcpStatus = 'local',
  approvalMode = 'default',
  sessionName,
  isLoading = false,
  mode,
  hasAutocomplete = false,
  inputActive = false,
  noColor = false
}: StatusBarProps) {
  // MCP status display
  const getMcpDisplay = () => {
    switch (mcpStatus) {
      case 'connected':
        return <Text color={noColor ? undefined : COLORS.success}>●</Text>;
      case 'disconnected':
        return <Text color={noColor ? undefined : COLORS.error}>○</Text>;
      case 'checking':
        return <Text color={noColor ? undefined : COLORS.warning}>◐</Text>;
      case 'local':
      default:
        return <Text dimColor>○</Text>;
    }
  };

  // Approval mode display with color coding
  const getApprovalDisplay = () => {
    switch (approvalMode) {
      case 'yolo':
        return <Text color={noColor ? undefined : COLORS.error} bold>YOLO</Text>;
      case 'accept':
        return <Text color={noColor ? undefined : COLORS.success}>AUTO</Text>;
      case 'plan':
        return <Text color={noColor ? undefined : COLORS.info}>PLAN</Text>;
      case 'default':
      default:
        return <Text dimColor>ASK</Text>;
    }
  };

  // Keyboard hints based on context
  const getKeyHints = () => {
    if (mode && mode !== 'chat') {
      return (
        <Text dimColor>
          <Text color={noColor ? undefined : COLORS.muted}>esc</Text>
          <Text dimColor>:back</Text>
        </Text>
      );
    }
    if (isLoading) {
      return (
        <Text dimColor>
          <Text color={noColor ? undefined : COLORS.muted}>esc</Text>
          <Text dimColor>:back </Text>
          <Text color={noColor ? undefined : COLORS.muted}>^C</Text>
          <Text dimColor>:cancel </Text>
          <Text color={noColor ? undefined : COLORS.muted}>^S</Text>
          <Text dimColor>:tools</Text>
        </Text>
      );
    }
    return (
      <Text dimColor>
        <Text color={noColor ? undefined : COLORS.muted}>j/k</Text>
        <Text dimColor>,</Text>
        <Text color={noColor ? undefined : COLORS.muted}>up/down</Text>
        <Text dimColor>:history </Text>
        <Text color={noColor ? undefined : COLORS.muted}>^R</Text>
        <Text dimColor>:search </Text>
        <Text color={noColor ? undefined : COLORS.muted}>tab</Text>
        <Text dimColor>:complete </Text>
        <Text color={noColor ? undefined : COLORS.muted}>/</Text>
        <Text dimColor>:commands </Text>
        <Text color={noColor ? undefined : COLORS.muted}>?</Text>
        <Text dimColor>:help</Text>
        {hasAutocomplete && (
          <>
            <Text dimColor> </Text>
            <Text color={noColor ? undefined : COLORS.muted}>enter</Text>
            <Text dimColor>:select</Text>
          </>
        )}
      </Text>
    );
  };

  return (
    <Box
      borderStyle="single"
      borderColor={noColor ? undefined : (inputActive ? COLORS.info : COLORS.border.default)}
      paddingX={1}
      marginTop={1}
      justifyContent="space-between"
    >
      {/* Left section: Agent + Session */}
      <Box>
        <Text color={noColor ? undefined : COLORS.warning} bold>{agent}</Text>
        {sessionName && (
          <>
            <Text dimColor> @ </Text>
            <Text color={noColor ? undefined : COLORS.info}>{sessionName.length > 12 ? sessionName.slice(0, 12) + '…' : sessionName}</Text>
          </>
        )}
      </Box>

      {/* Center section: Stats */}
      <Box>
        <Text dimColor>msgs:</Text>
        <Text>{messageCount}</Text>
        <Text dimColor> │ </Text>
        <Text dimColor>tok:</Text>
        <Text color={!noColor && tokens > 50000 ? COLORS.warning : undefined}>{formatTokens(tokens)}</Text>
      </Box>

      {/* Mode indicators */}
      <Box>
        <Text dimColor>mode:</Text>
        {getApprovalDisplay()}
        <Text dimColor> │ mcp:</Text>
        {getMcpDisplay()}
      </Box>

      {/* Right section: Key hints */}
      <Box>
        {getKeyHints()}
        <Text dimColor> │ </Text>
        <Text color={noColor ? undefined : COLORS.muted}>/help</Text>
      </Box>
    </Box>
  );
});
