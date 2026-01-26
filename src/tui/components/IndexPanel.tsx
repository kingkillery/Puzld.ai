import { Box, Text } from 'ink';
import { useListNavigation } from '../hooks/useListNavigation';
import { COLORS } from '../theme';

interface IndexOption {
  id: string;
  name: string;
  description: string;
}

interface IndexPanelProps {
  onSelect: (option: string) => void;
  onBack: () => void;
}

export function IndexPanel({ onSelect, onBack }: IndexPanelProps) {
  const options: IndexOption[] = [
    { id: 'full', name: 'Full Index', description: 'Index codebase with embeddings' },
    { id: 'quick', name: 'Quick Index', description: 'Index without embeddings (faster)' },
    { id: 'search', name: 'Search', description: 'Search indexed code' },
    { id: 'context', name: 'Context', description: 'Get relevant code for a task' },
    { id: 'config', name: 'Config', description: 'Show project configuration' },
    { id: 'graph', name: 'Graph', description: 'Show dependency graph' },
  ];

  const { selectedIndex } = useListNavigation({
    items: options,
    onSelect: (option) => onSelect(option.id),
    onBack
  });

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>Codebase Indexing</Text>
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
