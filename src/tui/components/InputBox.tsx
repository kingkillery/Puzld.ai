import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  width?: number;
}

export function InputBox({ value, onChange, onSubmit, placeholder = 'Type a message...', disabled = false, width }: InputBoxProps) {
  // width = total outer width including corner chars (e.g., 68 = original default).
  // Minimum of 30 prevents negative repeat counts. Omitting width preserves original behavior.
  const MIN_WIDTH = 30;
  const effectiveWidth = width !== undefined ? Math.max(MIN_WIDTH, width) : undefined;

  // Border row: ╭ + borderDashes + ╮ (corners consume 2 chars of outer width).
  // Content row: "│ " (2) + "> " (2) + text + padding + "│" (1) = 5 + contentPad.
  // Original defaults: borderDashes=66, contentPad=60 (diff of 6 accounts for the 5 fixed chars + 1 space).
  const borderDashes = effectiveWidth !== undefined ? effectiveWidth - 2 : 66;
  const contentPad = borderDashes - 6;

  const topBorder = `╭${'─'.repeat(Math.max(0, borderDashes))}╮`;
  const bottomBorder = `╰${'─'.repeat(Math.max(0, borderDashes))}╯`;
  const rightPadding = Math.max(0, contentPad - value.length);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="gray">{topBorder}</Text>
      </Box>
      <Box>
        <Text color="gray">│ </Text>
        <Text color="green" bold>{'> '}</Text>
        {disabled ? (
          <Text dimColor>{placeholder}</Text>
        ) : (
          <TextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            placeholder={placeholder}
          />
        )}
        <Text color="gray">{' '.repeat(rightPadding)}│</Text>
      </Box>
      <Box>
        <Text color="gray">{bottomBorder}</Text>
      </Box>
    </Box>
  );
}
