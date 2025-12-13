// Edit tool - Search and replace in files

import { readFile, writeFile } from 'fs/promises';
import { resolve, relative } from 'path';
import type { Tool, ToolResult } from './types';

export const editTool: Tool = {
  name: 'edit',
  description: `Edit a file by replacing specific text. Use for targeted changes.

WHEN TO USE:
- To modify specific parts of a file
- For bug fixes, adding imports, changing function bodies
- When you don't want to rewrite the entire file

HOW IT WORKS:
- Finds exact match of 'search' text
- Replaces with 'replace' text
- Fails if 'search' not found or matches multiple times

TIPS:
- Include enough context in 'search' to be unique
- Use 'view' first to see the exact text
- For multiple edits, call 'edit' multiple times`,

  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to edit',
      },
      search: {
        type: 'string',
        description: 'Exact text to find (must be unique in file)',
      },
      replace: {
        type: 'string',
        description: 'Text to replace it with',
      },
    },
    required: ['path', 'search', 'replace'],
  },

  async execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult> {
    const path = params.path as string;
    const search = params.search as string;
    const replace = params.replace as string;

    if (!path) {
      return { toolCallId: '', content: 'Error: path is required', isError: true };
    }
    if (!search) {
      return { toolCallId: '', content: 'Error: search is required', isError: true };
    }
    if (replace === undefined) {
      return { toolCallId: '', content: 'Error: replace is required', isError: true };
    }

    try {
      const fullPath = resolve(cwd, path);
      const relPath = relative(cwd, fullPath);

      // Read file
      let content: string;
      try {
        content = await readFile(fullPath, 'utf-8');
      } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code === 'ENOENT') {
          return { toolCallId: '', content: `Error: File not found: ${relPath}`, isError: true };
        }
        throw err;
      }

      // Count matches
      const matches = content.split(search).length - 1;

      if (matches === 0) {
        return {
          toolCallId: '',
          content: `Error: Search text not found in ${relPath}. Use 'view' to see the file contents.`,
          isError: true,
        };
      }

      if (matches > 1) {
        return {
          toolCallId: '',
          content: `Error: Search text found ${matches} times in ${relPath}. Include more context to make it unique.`,
          isError: true,
        };
      }

      // Perform replacement
      const newContent = content.replace(search, replace);
      await writeFile(fullPath, newContent, 'utf-8');

      // Calculate diff summary
      const oldLines = search.split('\n').length;
      const newLines = replace.split('\n').length;
      const diff = newLines - oldLines;
      const diffStr = diff === 0 ? 'same lines' : diff > 0 ? `+${diff} lines` : `${diff} lines`;

      return {
        toolCallId: '',
        content: `Edited ${relPath}: replaced ${oldLines} lines with ${newLines} lines (${diffStr})`,
      };
    } catch (err) {
      return { toolCallId: '', content: `Error editing file: ${(err as Error).message}`, isError: true };
    }
  },
};
