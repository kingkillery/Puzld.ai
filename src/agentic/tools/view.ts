// View tool - Read file contents with line numbers

import { readFile, stat } from 'fs/promises';
import { resolve, relative } from 'path';
import type { Tool, ToolResult } from './types';

const MAX_FILE_SIZE = 250 * 1024; // 250KB
const DEFAULT_LIMIT = 2000;
const MAX_LINE_LENGTH = 2000;

export const viewTool: Tool = {
  name: 'view',
  description: `Read file contents with line numbers. Use this to examine source code, configs, or text files.

WHEN TO USE:
- When you need to see the contents of a specific file
- Before editing a file to understand its structure
- To examine code, configs, logs, or any text file

PARAMETERS:
- path: The file path (relative to project root or absolute)
- offset: Line number to start from (0-based, optional)
- limit: Number of lines to read (default: 2000)

TIPS:
- Use glob first to find files, then view to examine them
- For large files, use offset to read specific sections`,

  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read',
      },
      offset: {
        type: 'number',
        description: 'Line number to start reading from (0-based)',
      },
      limit: {
        type: 'number',
        description: 'Number of lines to read (default: 2000)',
      },
    },
    required: ['path'],
  },

  async execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult> {
    const path = params.path as string;
    const offset = (params.offset as number) || 0;
    const limit = (params.limit as number) || DEFAULT_LIMIT;

    if (!path) {
      return { toolCallId: '', content: 'Error: path is required', isError: true };
    }

    try {
      const fullPath = resolve(cwd, path);
      const relPath = relative(cwd, fullPath);

      // Check file exists and size
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        return { toolCallId: '', content: `Error: ${relPath} is a directory, not a file. Use 'ls' or 'glob' for directories.`, isError: true };
      }
      if (stats.size > MAX_FILE_SIZE) {
        return { toolCallId: '', content: `Error: File too large (${Math.round(stats.size / 1024)}KB). Max: ${MAX_FILE_SIZE / 1024}KB`, isError: true };
      }

      // Read file
      const content = await readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Apply offset and limit
      const selectedLines = lines.slice(offset, offset + limit);

      // Format with line numbers
      const formatted = selectedLines.map((line, i) => {
        const lineNum = offset + i + 1;
        const truncatedLine = line.length > MAX_LINE_LENGTH
          ? line.slice(0, MAX_LINE_LENGTH) + '...'
          : line;
        return `${String(lineNum).padStart(6)}|${truncatedLine}`;
      }).join('\n');

      let output = `<file path="${relPath}">\n${formatted}\n</file>`;

      // Add truncation notice
      if (lines.length > offset + limit) {
        output += `\n\n(File has ${lines.length} lines. Showing ${offset + 1}-${offset + selectedLines.length}. Use offset parameter to see more.)`;
      }

      return { toolCallId: '', content: output };
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOENT') {
        return { toolCallId: '', content: `Error: File not found: ${path}`, isError: true };
      }
      return { toolCallId: '', content: `Error reading file: ${error.message}`, isError: true };
    }
  },
};
