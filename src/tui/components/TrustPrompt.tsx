/**
 * TrustPrompt Component
 *
 * Displayed when launching in an untrusted directory.
 * Like Claude Code's workspace trust prompt.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { COLORS } from '../theme';
import { getParentDirectory } from '../../trust';

interface TrustPromptProps {
  directory: string;
  onTrust: (includeSubdirs: boolean) => void;
  onExit: () => void;
}

export const TrustPrompt: React.FC<TrustPromptProps> = ({
  directory,
  onTrust,
  onExit
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const parentDir = getParentDirectory(directory);

  const options = [
    { label: 'Yes, I trust this folder', action: () => onTrust(false) },
    { label: `Yes, trust parent (${parentDir})`, action: () => onTrust(true) },
    { label: 'No, exit', action: onExit }
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex(i => Math.min(options.length - 1, i + 1));
    } else if (key.return) {
      options[selectedIndex].action();
    } else if (key.escape) {
      onExit();
    } else if (input === '1') {
      options[0].action();
    } else if (input === '2') {
      options[1].action();
    } else if (input === '3') {
      options[2].action();
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Separator line */}
      <Text color={COLORS.warning}>{'─'.repeat(120)}</Text>

      {/* Header */}
      <Box marginBottom={1}>
        <Text color={COLORS.warning} bold>Accessing workspace:</Text>
      </Box>

      {/* Directory path */}
      <Box marginBottom={1}>
        <Text color={COLORS.info} bold>{directory}</Text>
      </Box>

      {/* Safety message */}
      <Box marginBottom={1} flexDirection="column">
        <Text wrap="wrap">
          Quick safety check: Is this a project you created or one you trust?
          {' '}
          <Text dimColor>
            (Like your own code, a well-known open source project, or work from your team).
          </Text>
        </Text>
        <Text dimColor>
          If not, take a moment to review what's in this folder first.
        </Text>
      </Box>

      {/* What PuzldAI will do */}
      <Box marginBottom={1}>
        <Text>
          PuzldAI will be able to <Text color={COLORS.warning}>read</Text>, <Text color={COLORS.warning}>edit</Text>, and <Text color={COLORS.warning}>execute files</Text> here.
        </Text>
      </Box>

      {/* Options */}
      <Box flexDirection="column">
        {options.map((option, index) => (
          <Box key={index}>
            <Text color={selectedIndex === index ? COLORS.highlight : undefined}>
              {selectedIndex === index ? '> ' : '  '}
              {index + 1}. {option.label}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Footer hint */}
      <Box marginTop={1}>
        <Text dimColor>Enter to confirm · Esc to cancel</Text>
      </Box>
    </Box>
  );
};
