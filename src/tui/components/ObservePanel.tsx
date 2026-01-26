import { Box, Text } from 'ink';
import { useListNavigation } from '../hooks/useListNavigation';
import { COLORS } from '../theme';

interface ObserveOption {
  id: string;
  name: string;
  description: string;
}

interface ObservePanelProps {
  onSelect: (option: string) => void;
  onBack: () => void;
}

export function ObservePanel({ onSelect, onBack }: ObservePanelProps) {
  const options: ObserveOption[] = [
    { id: 'summary', name: 'Summary', description: 'Show observation statistics' },
    { id: 'list', name: 'List', description: 'List recent observations' },
    { id: 'export', name: 'Export', description: 'Export observations to file' },
    { id: 'preferences', name: 'Preferences', description: 'Export DPO preference pairs' },
  ];

  const { selectedIndex } = useListNavigation({
    items: options,
    onSelect: (option) => onSelect(option.id),
    onBack
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>Training Observations</Text>
        <Text> </Text>
        {options.map((option, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <Box key={option.id}>
              <Text color={COLORS.highlight}>{isSelected ? '>' : ' '} </Text>
              <Box width={14}>
                <Text color={isSelected ? COLORS.highlight : undefined} bold={isSelected}>
                  {option.name}
                </Text>
              </Box>
              <Text dimColor>  {option.description}</Text>
            </Box>
          );
        })}
        <Text> </Text>
        <Text dimColor>Up/Down navigate - Enter select - Esc back</Text>
      </Box>
    </Box>
  );
}
