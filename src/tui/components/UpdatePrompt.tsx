import { Box, Text, useInput } from 'ink';
import { COLORS } from '../theme';

interface UpdatePromptProps {
  currentVersion: string;
  latestVersion: string;
  onUpdate: () => void;
  onSkip: () => void;
}

export function UpdatePrompt({ currentVersion, latestVersion, onUpdate, onSkip }: UpdatePromptProps) {
  useInput((input, key) => {
    if (input.toLowerCase() === 'u') {
      onUpdate();
    } else if (input.toLowerCase() === 's' || key.escape) {
      onSkip();
    }
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={COLORS.info}
        paddingX={2}
        paddingY={1}
      >
        <Text>
          <Text color={COLORS.info}>⬆</Text>
          <Text> Update available: </Text>
          <Text color={COLORS.muted}>{currentVersion}</Text>
          <Text> → </Text>
          <Text color={COLORS.success} bold>{latestVersion}</Text>
        </Text>
        <Text> </Text>
        <Text>
          <Text color={COLORS.info}>[U]</Text>
          <Text> Update now   </Text>
          <Text color={COLORS.muted}>[S]</Text>
          <Text> Skip</Text>
        </Text>
      </Box>
    </Box>
  );
}
