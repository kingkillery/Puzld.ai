// Write tool - Create or overwrite files

import { writeFile, mkdir } from 'fs/promises';
import { resolve, dirname, relative } from 'path';
import type { Tool, ToolResult } from './types';

export const writeTool: Tool = {
  name: 'write',
  description: `Create a new file or overwrite an existing file with content.

WHEN TO USE:
- To create a new file
- To completely replace a file's contents
- For config files, new modules, etc.

NOTE: This will overwrite existing files. Use 'edit' for partial changes.

PARAMETERS:
- path: File path (relative to project root)
- content: Full file content to write`,

  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to create/overwrite',
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
      },
    },
    required: ['path', 'content'],
  },

  async execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult> {
    const path = params.path as string;
    const content = params.content as string;

    if (!path) {
      return { toolCallId: '', content: 'Error: path is required', isError: true };
    }
    if (content === undefined) {
      return { toolCallId: '', content: 'Error: content is required', isError: true };
    }

    try {
      const fullPath = resolve(cwd, path);
      const relPath = relative(cwd, fullPath);

      // Ensure directory exists
      await mkdir(dirname(fullPath), { recursive: true });

      // Write file
      await writeFile(fullPath, content, 'utf-8');

      const lines = content.split('\n').length;
      return {
        toolCallId: '',
        content: `Created/updated ${relPath} (${lines} lines, ${content.length} bytes)`,
      };
    } catch (err) {
      return { toolCallId: '', content: `Error writing file: ${(err as Error).message}`, isError: true };
    }
  },
};
