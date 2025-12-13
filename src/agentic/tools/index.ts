// Tool registry - exports all available tools

export * from './types';

import { viewTool } from './view';
import { globTool } from './glob';
import { grepTool } from './grep';
import { bashTool } from './bash';
import { writeTool } from './write';
import { editTool } from './edit';
import type { Tool, ToolCall, ToolResult } from './types';

// All available tools
export const allTools: Tool[] = [
  viewTool,
  globTool,
  grepTool,
  bashTool,
  writeTool,
  editTool,
];

// Read-only tools (safe to run without review)
export const readOnlyTools: Tool[] = [
  viewTool,
  globTool,
  grepTool,
];

// Tools that modify files (require review)
export const writeTools: Tool[] = [
  writeTool,
  editTool,
];

// Shell tools (can be destructive)
export const shellTools: Tool[] = [
  bashTool,
];

// Get tool by name
export function getTool(name: string): Tool | undefined {
  return allTools.find(t => t.name === name);
}

// Execute a tool call
export async function executeTool(
  call: ToolCall,
  cwd: string
): Promise<ToolResult> {
  const tool = getTool(call.name);

  if (!tool) {
    return {
      toolCallId: call.id,
      content: `Error: Unknown tool '${call.name}'`,
      isError: true,
    };
  }

  try {
    const result = await tool.execute(call.arguments, cwd);
    return {
      ...result,
      toolCallId: call.id,
    };
  } catch (err) {
    return {
      toolCallId: call.id,
      content: `Error executing ${call.name}: ${(err as Error).message}`,
      isError: true,
    };
  }
}

// Execute multiple tool calls sequentially
export async function executeTools(
  calls: ToolCall[],
  cwd: string
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const call of calls) {
    const result = await executeTool(call, cwd);
    results.push(result);
  }

  return results;
}

// Re-export individual tools
export { viewTool, globTool, grepTool, bashTool, writeTool, editTool };

// Re-export permission system
export {
  type PermissionAction,
  type PermissionDecision,
  type PermissionRequest,
  type PermissionResult,
  type PermissionHandler,
  PermissionTracker,
  permissionTracker,
} from './permissions';
