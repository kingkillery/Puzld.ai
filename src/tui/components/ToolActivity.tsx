import React from 'react';
import { Box, Text } from 'ink';

export interface ToolCallInfo {
  id: string;
  name: string;
  args: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
}

interface ToolActivityProps {
  calls: ToolCallInfo[];
  iteration: number;
}

const TOOL_ICONS: Record<string, string> = {
  view: '📄',
  glob: '🔍',
  grep: '🔎',
  bash: '⚡',
  write: '✏️',
  edit: '📝',
};

export function ToolActivity({ calls, iteration }: ToolActivityProps) {
  if (calls.length === 0) return null;

  // Show last 5 calls
  const recentCalls = calls.slice(-5);

  return (
    <Box flexDirection="column" marginY={1}>
      <Box>
        <Text dimColor>─── </Text>
        <Text color="cyan" dimColor>Agent Activity</Text>
        <Text dimColor> ({iteration} iterations) ───</Text>
      </Box>
      {recentCalls.map((call, i) => (
        <Box key={call.id} paddingLeft={1}>
          <Text dimColor>{TOOL_ICONS[call.name] || '🔧'} </Text>
          <Text color={call.status === 'error' ? 'red' : call.status === 'done' ? 'green' : 'yellow'}>
            {call.name}
          </Text>
          <Text dimColor>({call.args.slice(0, 40)}{call.args.length > 40 ? '...' : ''})</Text>
          {call.status === 'running' && <Text color="yellow"> ⏳</Text>}
          {call.status === 'done' && <Text color="green"> ✓</Text>}
          {call.status === 'error' && <Text color="red"> ✗</Text>}
        </Box>
      ))}
      {calls.length > 5 && (
        <Box paddingLeft={1}>
          <Text dimColor>... and {calls.length - 5} more</Text>
        </Box>
      )}
    </Box>
  );
}
