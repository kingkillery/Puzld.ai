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

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
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
