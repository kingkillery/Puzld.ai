// Agent loop - runs LLM with tools until completion

import type { Adapter, ModelResponse, RunOptions } from '../lib/types';
import { allTools, executeTools, executeTool, getTool } from './tools';
import type { Tool, ToolCall, ToolResult, AgentMessage } from './tools/types';
import {
  type PermissionRequest,
  type PermissionResult,
  type PermissionHandler,
  permissionTracker
} from './tools/permissions';

const MAX_ITERATIONS = 20;

// Tools that require read permission
const READ_TOOLS = ['view', 'grep', 'glob'];
// Tools that require write permission
const WRITE_TOOLS = ['write', 'edit'];
// Tools that require execute permission
const EXEC_TOOLS = ['bash'];

export interface AgentLoopOptions extends RunOptions {
  /** Tools available to the agent (default: all tools) */
  tools?: Tool[];
  /** Working directory for tool execution */
  cwd?: string;
  /** Callback when tool is called (before permission check) */
  onToolCall?: (call: ToolCall) => void;
  /** Callback when tool returns result */
  onToolResult?: (result: ToolResult) => void;
  /** Callback for each iteration */
  onIteration?: (iteration: number, response: string) => void;
  /** Permission handler - called when tool needs permission */
  onPermissionRequest?: PermissionHandler;
  /** Callback when tool starts executing (after permission granted) */
  onToolStart?: (call: ToolCall) => void;
  /** Callback when tool finishes */
  onToolEnd?: (call: ToolCall, result: ToolResult) => void;
}

export interface AgentLoopResult {
  content: string;
  model: string;
  iterations: number;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  tokens?: { input: number; output: number };
  duration?: number;
}

/**
 * Run an agent loop with tool access
 *
 * The agent can call tools to explore the codebase, then respond.
 * Loop continues until agent responds without tool calls.
 */
export async function runAgentLoop(
  adapter: Adapter,
  userMessage: string,
  options: AgentLoopOptions = {}
): Promise<AgentLoopResult> {
  const tools = options.tools ?? allTools;
  const cwd = options.cwd ?? process.cwd();
  const startTime = Date.now();

  const allToolCalls: ToolCall[] = [];
  const allToolResults: ToolResult[] = [];
  const messages: AgentMessage[] = [];

  // Build tool descriptions for system prompt
  const toolDescriptions = tools.map(t => {
    const params = Object.entries(t.parameters.properties || {})
      .map(([name, schema]) => `  - ${name}: ${(schema as { description: string }).description}`)
      .join('\n');
    const required = t.parameters.required?.join(', ') || 'none';
    return `## ${t.name}\n${t.description}\n\nParameters:\n${params}\nRequired: ${required}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `You are a helpful coding assistant with access to tools. You can explore the codebase and make changes.

# Available Tools

${toolDescriptions}

# How to Use Tools

To use a tool, respond with a JSON block:

\`\`\`tool
{
  "name": "tool_name",
  "arguments": {
    "param1": "value1"
  }
}
\`\`\`

You can call multiple tools by including multiple \`\`\`tool blocks.

After using tools, you'll receive the results and can continue exploring or provide your final response.

When you're done and ready to give your final answer, just respond normally without any tool blocks.

# Guidelines

- Use 'glob' and 'grep' to find relevant files
- Use 'view' to read file contents before editing
- Use 'edit' for targeted changes to existing files
- Use 'write' for new files or complete rewrites
- Use 'bash' for running commands (build, test, git, etc.)
- Explore thoroughly before making changes
- Explain your reasoning before and after tool use`;

  // Initial message
  messages.push({ role: 'user', content: userMessage });

  let lastResponse: ModelResponse | null = null;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Build prompt with history
    const prompt = buildPrompt(systemPrompt, messages);

    // Call LLM
    const response = await adapter.run(prompt, {
      ...options,
      disableTools: true, // We handle tools ourselves
    });

    lastResponse = response;

    if (response.error) {
      return {
        content: response.error,
        model: response.model,
        iterations,
        toolCalls: allToolCalls,
        toolResults: allToolResults,
        duration: Date.now() - startTime,
      };
    }

    options.onIteration?.(iterations, response.content);

    // Parse tool calls from response
    const toolCalls = parseToolCalls(response.content);

    if (toolCalls.length === 0) {
      // No tool calls - we're done
      return {
        content: response.content,
        model: response.model,
        iterations,
        toolCalls: allToolCalls,
        toolResults: allToolResults,
        tokens: response.tokens,
        duration: Date.now() - startTime,
      };
    }

    // Execute tools
    messages.push({
      role: 'assistant',
      content: response.content,
      toolCalls,
    });

    const results: ToolResult[] = [];
    let cancelled = false;

    for (const call of toolCalls) {
      options.onToolCall?.(call);
      allToolCalls.push(call);

      // Check if permission is needed
      const permissionResult = await checkAndRequestPermission(call, cwd, options.onPermissionRequest);

      if (permissionResult.decision === 'cancel') {
        cancelled = true;
        results.push({
          toolCallId: call.id,
          content: 'Operation cancelled by user',
          isError: true,
        });
        break;
      }

      if (permissionResult.decision === 'deny') {
        results.push({
          toolCallId: call.id,
          content: 'Permission denied by user',
          isError: true,
        });
        allToolResults.push(results[results.length - 1]);
        continue;
      }

      // Permission granted - execute tool
      options.onToolStart?.(call);
      const result = await executeTool(call, cwd);
      options.onToolEnd?.(call, result);

      results.push(result);
      options.onToolResult?.(result);
      allToolResults.push(result);
    }

    // If cancelled, return early
    if (cancelled) {
      return {
        content: 'Operation cancelled by user',
        model: lastResponse?.model || adapter.name,
        iterations,
        toolCalls: allToolCalls,
        toolResults: allToolResults,
        duration: Date.now() - startTime,
      };
    }

    // Add tool results to messages
    messages.push({
      role: 'tool',
      content: '',
      toolResults: results,
    });
  }

  // Max iterations reached
  return {
    content: lastResponse?.content || 'Max iterations reached without final response',
    model: lastResponse?.model || adapter.name,
    iterations,
    toolCalls: allToolCalls,
    toolResults: allToolResults,
    duration: Date.now() - startTime,
  };
}

/**
 * Build full prompt from system message and conversation history
 */
function buildPrompt(systemPrompt: string, messages: AgentMessage[]): string {
  let prompt = systemPrompt + '\n\n---\n\n';

  for (const msg of messages) {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n\n`;
    } else if (msg.role === 'tool') {
      prompt += 'Tool Results:\n';
      for (const result of msg.toolResults || []) {
        const status = result.isError ? 'ERROR' : 'SUCCESS';
        prompt += `[${status}] ${result.toolCallId}:\n${result.content}\n\n`;
      }
    }
  }

  prompt += 'Assistant: ';
  return prompt;
}

/**
 * Parse tool calls from LLM response
 */
function parseToolCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const toolBlockRegex = /```tool\s*([\s\S]*?)```/g;

  let match;
  let callId = 0;

  while ((match = toolBlockRegex.exec(content)) !== null) {
    try {
      const json = match[1].trim();
      const parsed = JSON.parse(json);

      if (parsed.name && typeof parsed.name === 'string') {
        calls.push({
          id: `call_${callId++}`,
          name: parsed.name,
          arguments: parsed.arguments || {},
        });
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return calls;
}

/**
 * Check if permission is needed and request it
 */
async function checkAndRequestPermission(
  call: ToolCall,
  cwd: string,
  handler?: PermissionHandler
): Promise<PermissionResult> {
  const path = call.arguments.path as string | undefined;
  const command = call.arguments.command as string | undefined;

  // Determine action type
  let action: 'read' | 'write' | 'execute';
  if (READ_TOOLS.includes(call.name)) {
    action = 'read';
  } else if (WRITE_TOOLS.includes(call.name)) {
    action = 'write';
  } else if (EXEC_TOOLS.includes(call.name)) {
    action = 'execute';
  } else {
    // Unknown tool type, allow by default
    return { decision: 'allow' };
  }

  // Check if already auto-approved
  const fullPath = path ? (path.startsWith('/') ? path : `${cwd}/${path}`) : undefined;
  if (permissionTracker.isAutoApproved(action, fullPath)) {
    return { decision: 'allow' };
  }

  // No handler = auto-allow (for non-interactive mode)
  if (!handler) {
    return { decision: 'allow' };
  }

  // Request permission
  const request: PermissionRequest = {
    action,
    tool: call.name,
    path: fullPath,
    command,
    description: getPermissionDescription(call),
  };

  const result = await handler(request);

  // Record approval for future auto-approve
  if (result.decision === 'allow_dir' || result.decision === 'allow_all') {
    permissionTracker.recordApproval(action, result.decision, fullPath);
  }

  return result;
}

/**
 * Get human-readable description for permission request
 */
function getPermissionDescription(call: ToolCall): string {
  switch (call.name) {
    case 'view':
      return `Read contents of file: ${call.arguments.path}`;
    case 'glob':
      return `Search for files matching: ${call.arguments.pattern}`;
    case 'grep':
      return `Search file contents for: ${call.arguments.pattern}`;
    case 'write':
      return `Create/overwrite file: ${call.arguments.path}`;
    case 'edit':
      return `Edit file: ${call.arguments.path}`;
    case 'bash':
      return `Execute command: ${call.arguments.command}`;
    default:
      return `Execute tool: ${call.name}`;
  }
}

export { allTools, executeTools };
