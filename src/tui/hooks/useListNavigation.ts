import { useState, useCallback } from 'react';
import { useInput } from 'ink';

interface UseListNavigationOptions<T> {
  items: T[];
  onSelect?: (item: T, index: number) => void;
  onBack?: () => void;
  initialIndex?: number;
  loop?: boolean; // Default true - wrap around top/bottom
  enabled?: boolean; // Default true
}

export function useListNavigation<T>({
  items,
  onSelect,
  onBack,
  initialIndex = 0,
  loop = false,
  enabled = true
}: UseListNavigationOptions<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((_, key) => {
    if (!enabled) return;

    if (key.escape && onBack) {
      onBack();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(curr => {
        if (loop) {
          return curr === 0 ? items.length - 1 : curr - 1;
        }
        return Math.max(0, curr - 1);
      });
    }

    if (key.downArrow) {
      setSelectedIndex(curr => {
        if (loop) {
          return curr === items.length - 1 ? 0 : curr + 1;
        }
        return Math.min(items.length - 1, curr + 1);
      });
    }

    if (key.return && onSelect) {
      const item = items[selectedIndex];
      if (item) {
        onSelect(item, selectedIndex);
      }
    }
  }, { isActive: enabled });

  const reset = useCallback(() => setSelectedIndex(initialIndex), [initialIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    selectedItem: items[selectedIndex],
    reset
  };
}
