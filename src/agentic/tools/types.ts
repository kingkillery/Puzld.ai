// Tool system types for agentic execution

export interface JSONSchema {
  type: string;
  properties?: Record<string, {
    type: string;
    description: string;
    enum?: string[];
  }>;
  required?: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// Semantic metadata for enriched tool results
export interface SemanticEntity {
  path?: string;
  type: string;
  name?: string;
  exports?: string[];
  lastModified?: string;
  size?: number;
  lineCount?: number;
}

export interface SemanticRelationship {
  from: string;
  to: string;
  type: 'import' | 'reference' | 'extends' | 'implements' | 'calls';
}

export interface SemanticStatistics {
  totalMatches?: number;
  fileCount?: number;
  lineCount?: number;
  recentActivity?: string;
  averageSize?: number;
}

export interface SemanticMetadata {
  summary: string;                    // LLM-optimized concise summary
  entities?: SemanticEntity[];        // Structured entities found
  relationships?: SemanticRelationship[]; // Dependency/import graph
  statistics?: SemanticStatistics;    // Usage/context stats
  context?: string;                   // Additional context for LLM
  cached?: boolean;                   // Whether result came from cache
  cacheKey?: string;                  // For semantic cache invalidation
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
  semantic?: SemanticMetadata;        // Optional semantic enrichment
  truncated?: boolean;                // Whether output was truncated
  fullResultCacheKey?: string;        // Key to retrieve full result
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: JSONSchema;
}

// Convert Tool to API format
export function toToolDefinition(tool: Tool): ToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  };
}

// Response from LLM with potential tool calls
export interface AgentResponse {
  content: string;
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  toolCalls?: ToolCall[];
}

// Message types for agent loop
export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}
