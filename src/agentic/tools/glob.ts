// Glob tool - Find files by pattern (with semantic enrichment)

import { globSync } from 'glob';
import { resolve, join } from 'path';
import { statSync } from 'fs';
import type { Tool, ToolResult, SemanticMetadata, SemanticEntity, SemanticStatistics } from './types';
import { OutputFormatter } from './format-optimizer';

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
        return {
          toolCallId: '',
          content: 'No files found matching pattern: ' + pattern,
          semantic: {
            summary: `No files found matching "${pattern}"`,
            statistics: { fileCount: 0 }
          }
        };
      }

      // Gather file metadata
      const fileEntities: SemanticEntity[] = matches.map(file => {
        const fullPath = join(searchPath, file);
        try {
          const stats = statSync(fullPath);
          const ext = file.split('.').pop() || '';
          return {
            path: file,
            type: classifyFileType(ext),
            name: file.split('/').pop() || file,
            size: stats.size,
            lastModified: formatTimeAgo(stats.mtimeMs)
          };
        } catch {
          return {
            path: file,
            type: 'file',
            name: file.split('/').pop() || file
          };
        }
      });

      // Sort by modification time (most recent first) then by path length
      fileEntities.sort((a, b) => {
        if (a.lastModified && b.lastModified) {
          const aTime = parseTimeAgo(a.lastModified);
          const bTime = parseTimeAgo(b.lastModified);
          if (aTime !== bTime) return aTime - bTime;
        }
        return (a.path?.length || 0) - (b.path?.length || 0);
      });

      const truncated = fileEntities.length > MAX_RESULTS;
      const results = fileEntities.slice(0, MAX_RESULTS);

      // Build statistics
      const statistics: SemanticStatistics = {
        fileCount: matches.length,
        averageSize: Math.round(
          fileEntities.reduce((sum, f) => sum + (f.size || 0), 0) / fileEntities.length
        )
      };

      // Identify recently modified files (within last 24h)
      const recentFiles = results.filter(f =>
        f.lastModified && parseTimeAgo(f.lastModified) < 24 * 60 * 60 * 1000
      );

      if (recentFiles.length > 0) {
        statistics.recentActivity = `${recentFiles.length} file(s) modified in last 24h`;
      }

      // Build summary
      const summary = buildGlobSummary(pattern, statistics, results, truncated);

      // Build context
      const context = buildGlobContext(results);

      // Generate simple file list for traditional output
      const output = results.map(f => f.path).join('\n');

      // Build semantic metadata
      const semantic: SemanticMetadata = {
        summary,
        statistics,
        context,
        entities: results
      };

      // Truncate if needed
      const { content: finalContent, truncated: wasTruncated } =
        OutputFormatter.truncateWithContext(output, 100, semantic);

      if (wasTruncated || truncated) {
        semantic.context = (semantic.context || '') +
          `\n\n💡 Showing ${results.length} of ${matches.length} files. Use a more specific pattern to narrow results.`;
      }

      // Format for LLM consumption (tree view works best for file lists)
      const formattedContent = OutputFormatter.optimizeForLLM(
        finalContent,
        'tree',
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

/**
 * Classify file type based on extension
 */
function classifyFileType(ext: string): string {
  const typeMap: Record<string, string> = {
    // Source code
    ts: 'typescript',
    tsx: 'typescript-react',
    js: 'javascript',
    jsx: 'javascript-react',
    py: 'python',
    java: 'java',
    cpp: 'c++',
    c: 'c',
    rs: 'rust',
    go: 'go',

    // Config
    json: 'config',
    yaml: 'config',
    yml: 'config',
    toml: 'config',
    ini: 'config',

    // Documentation
    md: 'documentation',
    txt: 'documentation',
    rst: 'documentation',

    // Web
    html: 'web',
    css: 'stylesheet',
    scss: 'stylesheet',

    // Test
    test: 'test',
    spec: 'test',
  };

  return typeMap[ext.toLowerCase()] || 'file';
}

/**
 * Format time difference as human-readable string
 */
function formatTimeAgo(timestampMs: number): string {
  const now = Date.now();
  const diff = now - timestampMs;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * Parse time ago string back to milliseconds (for sorting)
 */
function parseTimeAgo(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([mhdw]|mo)\s+ago$/);
  if (!match) return Infinity;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    mo: 30 * 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 0);
}

/**
 * Build LLM-optimized summary of glob results
 */
function buildGlobSummary(
  pattern: string,
  stats: SemanticStatistics,
  files: SemanticEntity[],
  truncated: boolean
): string {
  const fileStr = stats.fileCount === 1 ? 'file' : 'files';
  let summary = `Found ${stats.fileCount} ${fileStr} matching "${pattern}"`;

  // Identify dominant file types
  const typeCounts: Record<string, number> = {};
  files.forEach(f => {
    typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
  });

  const sortedTypes = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  if (sortedTypes.length > 0) {
    const typeDesc = sortedTypes
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
    summary += ` (${typeDesc})`;
  }

  if (stats.recentActivity) {
    summary += ` - ${stats.recentActivity}`;
  }

  if (truncated) {
    summary += ' - results truncated';
  }

  return summary;
}

/**
 * Build contextual information about glob results
 */
function buildGlobContext(files: SemanticEntity[]): string {
  // Find most recently modified
  const recent = files
    .filter(f => f.lastModified)
    .slice(0, 3)
    .map(f => `${f.name} (${f.lastModified})`)
    .join(', ');

  if (recent) {
    return `Recently modified: ${recent}`;
  }

  return '';
}
