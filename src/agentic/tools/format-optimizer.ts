/**
 * Output Format Optimizer
 *
 * Formats tool outputs to match training distribution patterns that LLMs
 * are optimized for: unified diffs, JSON structures, tree representations, etc.
 *
 * Based on research showing that format optimization alone can reduce errors
 * by 40% (Aider diff format study) without any model changes.
 */

import type { SemanticMetadata } from './types';

export type OutputFormat = 'auto' | 'json' | 'tree' | 'table' | 'diff' | 'text';

export class OutputFormatter {
  /**
   * Optimize output for LLM consumption based on content type
   */
  static optimizeForLLM(
    content: string,
    format: OutputFormat = 'auto',
    semantic?: SemanticMetadata
  ): string {
    // Auto-detect format if not specified
    if (format === 'auto') {
      format = this.detectBestFormat(content, semantic);
    }

    switch (format) {
      case 'json':
        return this.toStructuredJSON(content, semantic);
      case 'tree':
        return this.toTreeStructure(content, semantic);
      case 'table':
        return this.toMarkdownTable(content);
      case 'diff':
        return this.toUnifiedDiff(content);
      case 'text':
      default:
        return this.addTrainingDistributionHints(content, semantic);
    }
  }

  /**
   * Detect best format based on content characteristics
   */
  private static detectBestFormat(
    content: string,
    semantic?: SemanticMetadata
  ): OutputFormat {
    // If semantic metadata available, prefer JSON
    if (semantic?.entities || semantic?.relationships) {
      return 'json';
    }

    // If looks like file paths, use tree
    if (content.match(/^[\w\/.-]+\n/m) && content.split('\n').length > 3) {
      return 'tree';
    }

    // If contains diff markers, use unified diff
    if (content.includes('@@') || content.includes('---') && content.includes('+++')) {
      return 'diff';
    }

    // If tabular data, use table
    if (content.includes('\t') && content.split('\n').length > 2) {
      return 'table';
    }

    return 'text';
  }

  /**
   * Format as structured JSON (matches training on API responses)
   */
  private static toStructuredJSON(
    content: string,
    semantic?: SemanticMetadata
  ): string {
    const data: Record<string, unknown> = {};

    if (semantic) {
      if (semantic.summary) data.summary = semantic.summary;
      if (semantic.statistics) data.statistics = semantic.statistics;
      if (semantic.entities) data.entities = semantic.entities;
      if (semantic.relationships) data.relationships = semantic.relationships;
      if (semantic.context) data.context = semantic.context;
    }

    // Include raw content if not redundant with semantic data
    if (!semantic?.entities?.length) {
      data.content = content;
    }

    return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
  }

  /**
   * Format as tree structure (matches training on `tree` command output)
   */
  private static toTreeStructure(
    content: string,
    semantic?: SemanticMetadata
  ): string {
    const lines = content.trim().split('\n');
    const tree: string[] = [];

    // Add summary if available
    if (semantic?.summary) {
      tree.push(`# ${semantic.summary}\n`);
    }

    // Build tree from file paths
    const paths = lines.filter(l => l.trim().length > 0);
    const grouped = this.groupPathsByDirectory(paths);

    for (const [dir, files] of Object.entries(grouped)) {
      if (dir === '.') {
        // Root level files
        files.forEach((f, i) => {
          const isLast = i === files.length - 1;
          const prefix = isLast ? '└── ' : '├── ';
          const metadata = semantic?.entities?.find(e => e.path === f);
          const suffix = metadata ? ` (${metadata.type}${metadata.exports ? `: ${metadata.exports.join(', ')}` : ''})` : '';
          tree.push(prefix + f + suffix);
        });
      } else {
        // Directory
        tree.push(`├── ${dir}/`);
        files.forEach((f, i) => {
          const isLast = i === files.length - 1;
          const prefix = isLast ? '│   └── ' : '│   ├── ';
          const metadata = semantic?.entities?.find(e => e.path?.endsWith(f));
          const suffix = metadata ? ` (${metadata.type})` : '';
          tree.push(prefix + f + suffix);
        });
      }
    }

    // Add statistics if available
    if (semantic?.statistics) {
      tree.push('');
      tree.push(`📊 ${semantic.statistics.fileCount || paths.length} files`);
      if (semantic.statistics.totalMatches) {
        tree.push(`🔍 ${semantic.statistics.totalMatches} matches`);
      }
    }

    return tree.join('\n');
  }

  /**
   * Group file paths by directory for tree view
   */
  private static groupPathsByDirectory(paths: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    paths.forEach(path => {
      const lastSlash = path.lastIndexOf('/');
      if (lastSlash === -1) {
        // Root level file
        if (!grouped['.']) grouped['.'] = [];
        grouped['.'].push(path);
      } else {
        const dir = path.substring(0, lastSlash);
        const file = path.substring(lastSlash + 1);
        if (!grouped[dir]) grouped[dir] = [];
        grouped[dir].push(file);
      }
    });

    return grouped;
  }

  /**
   * Format as markdown table (matches training on GitHub markdown)
   */
  private static toMarkdownTable(content: string): string {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return content;

    // Detect delimiter (tab or multiple spaces)
    const delimiter = content.includes('\t') ? '\t' : /\s{2,}/;

    const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
    const headers = rows[0];
    const data = rows.slice(1);

    // Build markdown table
    const table: string[] = [];
    table.push('| ' + headers.join(' | ') + ' |');
    table.push('|' + headers.map(() => '---').join('|') + '|');
    data.forEach(row => {
      table.push('| ' + row.join(' | ') + ' |');
    });

    return table.join('\n');
  }

  /**
   * Format as unified diff (matches training on git diff output)
   */
  private static toUnifiedDiff(content: string): string {
    // If already in diff format, preserve it
    if (content.includes('@@ ') && (content.includes('---') || content.includes('+++'))) {
      return '```diff\n' + content + '\n```';
    }

    // Otherwise, wrap as code block
    return '```diff\n' + content + '\n```';
  }

  /**
   * Add training distribution hints (code fences, structure markers)
   */
  private static addTrainingDistributionHints(
    content: string,
    semantic?: SemanticMetadata
  ): string {
    let output = '';

    // Add summary as markdown header
    if (semantic?.summary) {
      output += `## ${semantic.summary}\n\n`;
    }

    // Detect and wrap code
    if (this.isCode(content)) {
      const language = this.detectLanguage(content);
      output += '```' + language + '\n' + content + '\n```';
    }
    // Detect and format JSON
    else if (this.isJSON(content)) {
      try {
        const parsed = JSON.parse(content);
        output += '```json\n' + JSON.stringify(parsed, null, 2) + '\n```';
      } catch {
        output += content;
      }
    }
    // Plain text
    else {
      output += content;
    }

    // Add context as footnote
    if (semantic?.context) {
      output += '\n\n*' + semantic.context + '*';
    }

    // Add statistics as footer
    if (semantic?.statistics) {
      output += '\n\n---\n';
      const stats = semantic.statistics;
      if (stats.totalMatches) output += `📊 ${stats.totalMatches} matches`;
      if (stats.fileCount) output += ` across ${stats.fileCount} files`;
      if (stats.lineCount) output += ` (${stats.lineCount} lines)`;
    }

    return output;
  }

  /**
   * Detect if content is code
   */
  private static isCode(content: string): boolean {
    // Check for common code patterns
    const codePatterns = [
      /^\s*(import|export|const|let|var|function|class|interface|type)\s/m,
      /^\s*(public|private|protected|static)\s/m,
      /[{}\[\]();]/,
      /=>/,
      /\b(if|else|for|while|return|async|await)\b/
    ];

    return codePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect programming language
   */
  private static detectLanguage(content: string): string {
    if (/^\s*(import|export).*from\s+['"]/.test(content)) return 'typescript';
    if (/^\s*interface\s+\w+/.test(content)) return 'typescript';
    if (/^\s*(def|class)\s+\w+/.test(content)) return 'python';
    if (/^\s*(public|private)\s+(class|interface)/.test(content)) return 'java';
    if (/^\s*#include\s+</.test(content)) return 'cpp';
    if (/^\s*(fn|let|mut)\s+/.test(content)) return 'rust';
    return '';
  }

  /**
   * Detect if content is JSON
   */
  private static isJSON(content: string): boolean {
    const trimmed = content.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Truncate output intelligently with semantic preservation
   */
  static truncateWithContext(
    content: string,
    maxLines: number = 100,
    semantic?: SemanticMetadata
  ): { content: string; truncated: boolean } {
    const lines = content.split('\n');

    if (lines.length <= maxLines) {
      return { content, truncated: false };
    }

    // Keep first and last portions, summarize middle
    const keepStart = Math.floor(maxLines * 0.6);
    const keepEnd = Math.floor(maxLines * 0.3);
    const omittedCount = lines.length - keepStart - keepEnd;

    const truncated = [
      ...lines.slice(0, keepStart),
      '',
      `... (${omittedCount} lines omitted) ...`,
      '',
      ...lines.slice(-keepEnd)
    ].join('\n');

    return { content: truncated, truncated: true };
  }
}
