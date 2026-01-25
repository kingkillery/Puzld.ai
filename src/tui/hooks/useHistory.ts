import { useState, useCallback } from 'react';

export function useHistory(maxSize = 50) {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempInput, setTempInput] = useState('');

  const addToHistory = useCallback((command: string) => {
    if (command.trim()) {
      setHistory(prev => {
        // Don't add duplicates consecutively
        if (prev[prev.length - 1] === command) return prev;
        const newHistory = [...prev, command];
        if (newHistory.length > maxSize) {
          return newHistory.slice(-maxSize);
        }
        return newHistory;
      });
    }
    setHistoryIndex(-1);
    setTempInput('');
  }, [maxSize]);

  const navigateHistory = useCallback((direction: 'up' | 'down', currentInput: string): string => {
    if (history.length === 0) return currentInput;

    if (direction === 'up') {
      if (historyIndex === -1) {
        // Save current input before navigating
        setTempInput(currentInput);
        setHistoryIndex(history.length - 1);
        return history[history.length - 1];
      } else if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        return history[historyIndex - 1];
      }
      return history[historyIndex];
    } else {
      if (historyIndex === -1) {
        return currentInput;
      } else if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1);
        return history[historyIndex + 1];
      } else {
        // Return to current input
        setHistoryIndex(-1);
        return tempInput;
      }
    }
  }, [history, historyIndex, tempInput]);


  const searchHistory = useCallback((query: string, direction: 'up' | 'down', currentInput: string): string => {
    if (history.length === 0) return currentInput;

    const normalized = query.trim().toLowerCase();
    const startIndex = historyIndex === -1 ? history.length : historyIndex;

    if (!normalized) {
      return navigateHistory(direction, currentInput);
    }

    if (direction === 'up') {
      for (let i = startIndex - 1; i >= 0; i -= 1) {
        if (history[i].toLowerCase().includes(normalized)) {
          if (historyIndex === -1) {
            setTempInput(currentInput);
          }
          setHistoryIndex(i);
          return history[i];
        }
      }
    } else {
      for (let i = startIndex + 1; i < history.length; i += 1) {
        if (history[i].toLowerCase().includes(normalized)) {
          setHistoryIndex(i);
          return history[i];
        }
      }
      setHistoryIndex(-1);
      return tempInput;
    }

    return historyIndex !== -1 ? history[historyIndex] : currentInput;
  }, [history, historyIndex, tempInput, navigateHistory]);

  return {
    history,
    addToHistory,
    navigateHistory,
    searchHistory,
    historyIndex,
  };
}
