import { memo } from 'react';
import { Box, Text } from 'ink';

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
  // Format tokens with K suffix for thousands
  const formatTokens = (t: number): string => {
    if (t >= 1000) {
      return (t / 1000).toFixed(1) + 'k';
    }
    return t.toString();
  };

  // MCP status display
  const getMcpDisplay = () => {
    switch (mcpStatus) {
      case 'connected':
        return <Text color={noColor ? undefined : "green"}>●</Text>;
      case 'disconnected':
        return <Text color={noColor ? undefined : "red"}>○</Text>;
      case 'checking':
        return <Text color={noColor ? undefined : "yellow"}>◐</Text>;
      case 'local':
      default:
        return <Text dimColor>○</Text>;
    }
  };

  // Approval mode display with color coding
  const getApprovalDisplay = () => {
    switch (approvalMode) {
      case 'yolo':
        return <Text color={noColor ? undefined : "red"} bold>YOLO</Text>;
      case 'accept':
        return <Text color={noColor ? undefined : "green"}>AUTO</Text>;
      case 'plan':
        return <Text color={noColor ? undefined : "cyan"}>PLAN</Text>;
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
          <Text color={noColor ? undefined : 'gray'}>esc</Text>
          <Text dimColor>:back</Text>
        </Text>
      );
    }
    if (isLoading) {
      return (
        <Text dimColor>
          <Text color={noColor ? undefined : 'gray'}>esc</Text>
          <Text dimColor>:back </Text>
          <Text color={noColor ? undefined : 'gray'}>^C</Text>
          <Text dimColor>:cancel </Text>
          <Text color={noColor ? undefined : 'gray'}>^S</Text>
          <Text dimColor>:tools</Text>
        </Text>
      );
    }
    return (
      <Text dimColor>
        <Text color={noColor ? undefined : 'gray'}>j/k</Text>
        <Text dimColor>,</Text>
        <Text color={noColor ? undefined : 'gray'}>up/down</Text>
        <Text dimColor>:history </Text>
        <Text color={noColor ? undefined : 'gray'}>^R</Text>
        <Text dimColor>:search </Text>
        <Text color={noColor ? undefined : 'gray'}>tab</Text>
        <Text dimColor>:complete </Text>
        <Text color={noColor ? undefined : 'gray'}>/</Text>
        <Text dimColor>:commands </Text>
        <Text color={noColor ? undefined : 'gray'}>?</Text>
        <Text dimColor>:help</Text>
        {hasAutocomplete && (
          <>
            <Text dimColor> </Text>
            <Text color={noColor ? undefined : 'gray'}>enter</Text>
            <Text dimColor>:select</Text>
          </>
        )}
      </Text>
    );
  };

  return (
    <Box
      borderStyle={inputActive ? 'double' : 'round'}
      borderColor={noColor ? undefined : (inputActive ? 'cyan' : 'gray')}
      paddingX={1}
      marginTop={1}
      justifyContent="space-between"
    >
      {/* Left section: Agent + Session */}
      <Box>
        <Text color={noColor ? undefined : "yellow"} bold>{agent}</Text>
        {sessionName && (
          <>
            <Text dimColor> @ </Text>
            <Text color={noColor ? undefined : "cyan"}>{sessionName.length > 12 ? sessionName.slice(0, 12) + '…' : sessionName}</Text>
          </>
        )}
      </Box>

      {/* Center section: Stats */}
      <Box>
        <Text dimColor>msgs:</Text>
        <Text>{messageCount}</Text>
        <Text dimColor> │ </Text>
        <Text dimColor>tok:</Text>
        <Text color={!noColor && tokens > 50000 ? 'yellow' : undefined}>{formatTokens(tokens)}</Text>
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
        <Text color={noColor ? undefined : "gray"}>/help</Text>
      </Box>
    </Box>
  );
});
