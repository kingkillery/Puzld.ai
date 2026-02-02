/**
 * Shared TUI types extracted from index.tsx
 */

import type { ToolCallInfo } from './components/ToolActivity';
import type { CollaborationStep, CollaborationType } from './components/CollaborationView';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'compare' | 'collaboration';
  content: string;
  agent?: string;
  duration?: number;
  tokens?: { input: number; output: number };
  compareResults?: CompareResult[];
  collaborationSteps?: CollaborationStep[];
  collaborationType?: CollaborationType;
  pipelineName?: string;
  toolCalls?: ToolCallInfo[];
  timestamp?: number;
}

export interface CompareResult {
  agent: string;
  content: string;
  error?: string;
  duration?: number;
  loading?: boolean;
}

export interface AgentStatusInfo {
  name: string;
  ready: boolean;
}

export type AppMode = 'chat' | 'workflows' | 'sessions' | 'settings' | 'model' | 'compare' | 'collaboration' | 'agent' | 'review' | 'index' | 'observe' | 'plan' | 'trust' | 'approval-mode';

// Format timestamp for display (HH:MM)
export function formatTimestamp(ts?: number): string {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export const estimateWrappedLines = (text: string, width: number) => {
  if (!text) return 0;
  const safeWidth = Math.max(20, width);
  return text.split('\n').reduce((sum, line) => {
    const lineLen = line.length || 1;
    return sum + Math.max(1, Math.ceil(lineLen / safeWidth));
  }, 0);
};

let messageId = 0;
export const nextId = () => String(++messageId);
export const resetMessageId = (val = 0) => { messageId = val; };
export const getMessageId = () => messageId;
