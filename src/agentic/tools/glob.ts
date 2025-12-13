// Glob tool - Find files by pattern

import { globSync } from 'glob';
import { resolve } from 'path';
import type { Tool, ToolResult } from './types';

const MAX_RESULTS = 100;

export const globTool: Tool = {
  name: 'glob',
  description: `Find files matching a glob pattern. Returns matching file paths sorted by path length.

WHEN TO USE:
- To find files by name pattern or extension
- To discover project structure
- Before using 'view' to find the right file

PATTERN SYNTAX:
- * matches any characters except /
- ** matches any characters including /
- ? matches single character
- {a,b} matches either a or b

EXAMPLES:
- "*.ts" - TypeScript files in current directory
- "**/*.ts" - All TypeScript files recursively
- "src/**/*.test.ts" - Test files in src
- "*.{ts,tsx}" - TS and TSX files`,

  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern to match files',
      },
      path: {
        type: 'string',
        description: 'Directory to search in (default: project root)',
      },
    },
    required: ['pattern'],
  },

  async execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult> {
    const pattern = params.pattern as string;
    const searchPath = resolve(cwd, (params.path as string) || '.');

    if (!pattern) {
      return { toolCallId: '', content: 'Error: pattern is required', isError: true };
    }

    try {
      const matches = globSync(pattern, {
        cwd: searchPath,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/.*'],
        nodir: true,
        absolute: false,
      });

      if (matches.length === 0) {
        return { toolCallId: '', content: 'No files found matching pattern: ' + pattern };
      }

      // Sort by path length (shortest first)
      matches.sort((a, b) => a.length - b.length);

      const truncated = matches.length > MAX_RESULTS;
      const results = matches.slice(0, MAX_RESULTS);

      let output = results.join('\n');
      if (truncated) {
        output += `\n\n(Showing ${MAX_RESULTS} of ${matches.length} results. Use a more specific pattern.)`;
      }

      return { toolCallId: '', content: output };
    } catch (err) {
      return { toolCallId: '', content: `Error: ${(err as Error).message}`, isError: true };
    }
  },
};
