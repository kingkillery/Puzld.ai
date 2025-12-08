import React, { memo } from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  agent: string;
  messageCount?: number;
  tokens?: number;
}

export const StatusBar = memo(function StatusBar({ agent, messageCount = 0, tokens = 0 }: StatusBarProps) {
  // Format tokens with K suffix for thousands
  const formatTokens = (t: number): string => {
    if (t >= 1000) {
      return (t / 1000).toFixed(1) + 'k';
    }
    return t.toString();
  };

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1} justifyContent="space-between">
      <Box>
        <Text dimColor>agent: </Text>
        <Text color="yellow">{agent}</Text>
      </Box>
      <Box>
        <Text dimColor>messages: </Text>
        <Text>{messageCount}</Text>
      </Box>
      <Box>
        <Text dimColor>tokens: </Text>
        <Text>{formatTokens(tokens)}</Text>
      </Box>
      <Box>
        <Text dimColor>/help for commands</Text>
      </Box>
    </Box>
  );
});
