// Grep tool - Search file contents (with semantic enrichment)

import { resolve, relative } from 'path';
import { readdir, readFile, stat } from 'fs/promises';
import type { Tool, ToolResult, SemanticMetadata, SemanticStatistics } from './types';
import { OutputFormatter } from './format-optimizer';

const MAX_RESULTS = 50;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const CONTEXT_LINES = 2;

export const grepTool: Tool = {
  name: 'grep',
  description: `Search for text/patterns in files. Returns matching lines with context.

WHEN TO USE:
- To find where a function, variable, or string is used
- To search for error messages or specific code patterns
- To find all occurrences of something across the codebase

PARAMETERS:
- pattern: Text or regex to search for
- path: Directory to search (default: project root)
- include: Glob pattern to filter files (e.g., "*.ts")

TIPS:
- Use simple strings for exact matches
- Use regex for complex patterns
- Combine with 'view' to see full file context`,

  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Text or regex pattern to search for',
      },
      path: {
        type: 'string',
        description: 'Directory to search in (default: project root)',
      },
      include: {
        type: 'string',
        description: 'File pattern to include (e.g., "*.ts")',
      },
    },
    required: ['pattern'],
  },

  async execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult> {
    const pattern = params.pattern as string;
    const searchPath = resolve(cwd, (params.path as string) || '.');
    const include = params.include as string | undefined;

    if (!pattern) {
      return { toolCallId: '', content: 'Error: pattern is required', isError: true };
    }

    try {
      const regex = new RegExp(pattern, 'gi');
      const matches = await searchFiles(searchPath, regex, include, cwd);

      if (matches.length === 0) {
        return {
          toolCallId: '',
          content: `No matches found for: ${pattern}`,
          semantic: {
            summary: `No matches found for "${pattern}"`,
            statistics: { totalMatches: 0, fileCount: 0 }
          }
        };
      }

      const truncated = matches.length > MAX_RESULTS;
      const results = matches.slice(0, MAX_RESULTS);

      // Build semantic metadata
      const fileGroups = groupMatchesByFile(results);
      const uniqueFiles = Object.keys(fileGroups);

      const statistics: SemanticStatistics = {
        totalMatches: matches.length,
        fileCount: uniqueFiles.length,
        lineCount: results.length
      };

      // Build concise summary
      const summary = buildSearchSummary(pattern, statistics, uniqueFiles, truncated);

      // Build context string
      const context = buildSearchContext(fileGroups, pattern);

      // Generate traditional grep output
      const output = results.map(m =>
        `${m.file}:${m.line}: ${m.content}`
      ).join('\n');

      // Build semantic metadata
      const semantic: SemanticMetadata = {
        summary,
        statistics,
        context,
        entities: uniqueFiles.slice(0, 10).map(file => ({
          path: file,
          type: 'file',
          name: file.split('/').pop() || file
        }))
      };

      // Truncate output intelligently if needed
      const { content: finalContent, truncated: wasTruncated } =
        OutputFormatter.truncateWithContext(output, 100, semantic);

      if (wasTruncated || truncated) {
        semantic.context = (semantic.context || '') +
          `\n\n💡 Showing ${results.length} of ${matches.length} matches. Use 'include' parameter to narrow search.`;
      }

      // Format for LLM consumption
      const formattedContent = OutputFormatter.optimizeForLLM(
        finalContent,
        'json',
        semantic
      );

      return {
        toolCallId: '',
        content: formattedContent,
        semantic,
        truncated: wasTruncated || truncated
      };
    } catch (err) {
      return { toolCallId: '', content: `Error: ${(err as Error).message}`, isError: true };
    }
  },
};

interface Match {
  file: string;
  line: number;
  content: string;
}

async function searchFiles(
  dir: string,
  pattern: RegExp,
  include: string | undefined,
  cwd: string
): Promise<Match[]> {
  const matches: Match[] = [];
  const includeRegex = include ? globToRegex(include) : null;

  async function walk(currentDir: string) {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') ||
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === '.git') {
          continue;
        }

        const fullPath = resolve(currentDir, entry.name);
        const relativePath = relative(cwd, fullPath);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          // Check include pattern
          if (includeRegex && !includeRegex.test(entry.name)) {
            continue;
          }

          // Skip binary/large files
          try {
            const stats = await stat(fullPath);
            if (stats.size > MAX_FILE_SIZE) continue;
          } catch {
            continue;
          }

          // Search file
          try {
            const content = await readFile(fullPath, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              if (pattern.test(lines[i])) {
                matches.push({
                  file: relativePath,
                  line: i + 1,
                  content: lines[i].trim().slice(0, 200),
                });

                if (matches.length >= MAX_RESULTS * 2) return;
              }
            }
          } catch {
            // Skip files that can't be read as text
          }
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  await walk(dir);
  return matches;
}

function globToRegex(pattern: string): RegExp {
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regex}$`, 'i');
}

/**
 * Group matches by file for better organization
 */
function groupMatchesByFile(matches: Match[]): Record<string, Match[]> {
  const groups: Record<string, Match[]> = {};

  for (const match of matches) {
    if (!groups[match.file]) {
      groups[match.file] = [];
    }
    groups[match.file].push(match);
  }

  return groups;
}

/**
 * Build LLM-optimized summary of search results
 */
function buildSearchSummary(
  pattern: string,
  stats: SemanticStatistics,
  files: string[],
  truncated: boolean
): string {
  const matchStr = stats.totalMatches === 1 ? 'match' : 'matches';
  const fileStr = stats.fileCount === 1 ? 'file' : 'files';

  let summary = `Found ${stats.totalMatches} ${matchStr} for "${pattern}" across ${stats.fileCount} ${fileStr}`;

  // Add dominant file type if clear pattern
  const extensions = files.map(f => f.split('.').pop()).filter(Boolean);
  const extCounts = extensions.reduce((acc, ext) => {
    acc[ext!] = (acc[ext!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantExt = Object.entries(extCounts)
    .sort(([, a], [, b]) => b - a)[0];

  if (dominantExt && dominantExt[1] > files.length * 0.6) {
    summary += ` (mostly .${dominantExt[0]} files)`;
  }

  if (truncated) {
    summary += ' - results truncated';
  }

  return summary;
}

/**
 * Build contextual information about search results
 */
function buildSearchContext(
  fileGroups: Record<string, Match[]>,
  pattern: string
): string {
  const fileEntries = Object.entries(fileGroups)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  const topFiles = fileEntries.map(([file, matches]) =>
    `${file} (${matches.length} ${matches.length === 1 ? 'match' : 'matches'})`
  );

  return `Most matches in: ${topFiles.join(', ')}`;
}
