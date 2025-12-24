/**
 * Code Searcher (Phase 12)
 *
 * Finds relevant code for a given task/query.
 * Combines:
 * - Semantic search (embeddings via Phase 11)
 * - Keyword search (FTS5)
 * - Structure search (function/class names)
 * - Dependency graph (related files)
 */

import { search as searchMemory } from '../memory/vector-store';
import { getDatabase } from '../memory/database';
import type { FileStructure } from './ast-parser';
import { findRelatedFiles } from './ast-parser';
import type { DependencyGraph } from './dependency-graph';
import { getRelatedFiles as getGraphRelated } from './dependency-graph';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface SearchOptions {
  /** Maximum results to return */
  limit?: number;
  /** Minimum relevance score (0-1) */
  minScore?: number;
  /** Search method: 'semantic' | 'keyword' | 'hybrid' */
  method?: 'semantic' | 'keyword' | 'hybrid';
  /** Include file content in results */
  includeContent?: boolean;
  /** Maximum content size per file */
  maxContentSize?: number;
}

export interface CodeSearchResult {
  /** File path (relative) */
  path: string;
  /** Relevance score (0-1) */
  score: number;
  /** Why this file was matched */
  matchReason: string;
  /** File content (if requested) */
  content?: string;
  /** Matched functions/classes */
  matchedSymbols?: string[];
}

const DEFAULT_OPTIONS: Required<SearchOptions> = {
  limit: 10,
  minScore: 0.3,
  method: 'hybrid',
  includeContent: true,
  maxContentSize: 10 * 1024, // 10KB
};

/**
 * Search for relevant code given a task description
 */
export async function searchCode(
  query: string,
  rootDir: string,
  options: SearchOptions = {}
): Promise<CodeSearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results = new Map<string, CodeSearchResult>();

  // Semantic/Hybrid search via memory store
  // Uses FTS5 by default, falls back to semantic if embeddings available
  if (opts.method === 'semantic' || opts.method === 'hybrid') {
    const memoryResults = await searchMemory(query, {
      type: 'code',
      limit: opts.limit * 2,
    });

    for (const result of memoryResults) {
      const path = (result.item.metadata?.path as string) || '';
      if (!path) continue;

      const existing = results.get(path);
      const score = normalizeScore(result.score);

      if (!existing || existing.score < score) {
        results.set(path, {
          path,
          score,
          matchReason: 'semantic search',
        });
      }
    }
  }

  // Keyword search via FTS5
  if (opts.method === 'keyword' || opts.method === 'hybrid') {
    const keywordResults = searchByKeyword(query, opts.limit * 2);

    for (const result of keywordResults) {
      const existing = results.get(result.path);
      const score = result.score;

      if (!existing || existing.score < score) {
        results.set(result.path, {
          path: result.path,
          score,
          matchReason: result.matchReason,
          matchedSymbols: result.matchedSymbols,
        });
      } else if (existing && result.matchedSymbols) {
        // Merge matched symbols
        existing.matchedSymbols = [
          ...new Set([...(existing.matchedSymbols || []), ...result.matchedSymbols])
        ];
      }
    }
  }

  // Convert to array and sort by score
  let sortedResults = [...results.values()]
    .filter(r => r.score >= opts.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit);

  // Add file content if requested
  if (opts.includeContent) {
    sortedResults = sortedResults.map(result => {
      const fullPath = join(rootDir, result.path);
      if (existsSync(fullPath)) {
        try {
          let content = readFileSync(fullPath, 'utf-8');
          if (content.length > opts.maxContentSize) {
            content = content.slice(0, opts.maxContentSize) + '\n... (truncated)';
          }
          return { ...result, content };
        } catch {
          return result;
        }
      }
      return result;
    });
  }

  return sortedResults;
}

/**
 * Search using parsed file structures (no embeddings needed)
 */
export function searchByStructure(
  query: string,
  structures: FileStructure[],
  options: SearchOptions = {}
): CodeSearchResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const related = findRelatedFiles(structures, query);

  return related.slice(0, opts.limit).map((structure, index) => {
    const matchedSymbols: string[] = [];
    const queryLower = query.toLowerCase();

    // Find matching symbols
    for (const func of structure.functions) {
      if (func.name.toLowerCase().includes(queryLower)) {
        matchedSymbols.push(func.name);
      }
    }
    for (const cls of structure.classes) {
      if (cls.name.toLowerCase().includes(queryLower)) {
        matchedSymbols.push(cls.name);
      }
    }

    return {
      path: structure.relativePath,
      score: 1 - (index * 0.1), // Decay score by position
      matchReason: 'structure match',
      matchedSymbols,
    };
  });
}

/**
 * Search using dependency graph (find related files)
 */
export function searchByDependencies(
  filePath: string,
  graph: DependencyGraph,
  options: { depth?: number; limit?: number } = {}
): CodeSearchResult[] {
  const { depth = 2, limit = 10 } = options;
  const related = getGraphRelated(graph, filePath, depth);

  return related.slice(0, limit).map((path, index) => {
    const node = graph.nodes.get(path);
    return {
      path: node?.relativePath || path,
      score: 1 - (index * 0.1),
      matchReason: 'dependency graph',
    };
  });
}

/**
 * Keyword search using FTS5
 */
function searchByKeyword(
  query: string,
  limit: number
): Array<CodeSearchResult & { matchedSymbols?: string[] }> {
  const db = getDatabase();
  const results: Array<CodeSearchResult & { matchedSymbols?: string[] }> = [];

  try {
    // Search in memory FTS
    const rows = db.prepare(`
      SELECT
        m.id,
        m.content,
        m.metadata,
        bm25(memory_fts) as score
      FROM memory_fts
      JOIN memory m ON memory_fts.rowid = m.id
      WHERE memory_fts MATCH ?
      AND m.type = 'code'
      ORDER BY score
      LIMIT ?
    `).all(escapeQuery(query), limit) as Array<{
      id: number;
      content: string;
      metadata: string;
      score: number;
    }>;

    const seenPaths = new Set<string>();

    for (const row of rows) {
      const metadata = row.metadata ? JSON.parse(row.metadata) : {};
      const path = metadata.path as string;

      if (!path || seenPaths.has(path)) continue;
      seenPaths.add(path);

      // Extract matched symbols from metadata
      const matchedSymbols: string[] = [];
      const queryLower = query.toLowerCase();

      if (metadata.functions) {
        for (const func of metadata.functions as string[]) {
          if (func.toLowerCase().includes(queryLower)) {
            matchedSymbols.push(func);
          }
        }
      }
      if (metadata.classes) {
        for (const cls of metadata.classes as string[]) {
          if (cls.toLowerCase().includes(queryLower)) {
            matchedSymbols.push(cls);
          }
        }
      }

      results.push({
        path,
        score: normalizeScore(Math.abs(row.score)),
        matchReason: 'keyword match',
        matchedSymbols: matchedSymbols.length > 0 ? matchedSymbols : undefined,
      });
    }
  } catch {
    // FTS might not be initialized yet
  }

  return results;
}

/**
 * Normalize BM25/similarity scores to 0-1 range
 */
function normalizeScore(score: number): number {
  // BM25 scores are typically 0-25, similarity scores 0-1
  if (score > 1) {
    return Math.min(1, score / 25);
  }
  return Math.max(0, Math.min(1, score));
}

/**
 * Escape query for FTS5
 */
function escapeQuery(query: string): string {
  // Remove special FTS5 characters and convert to prefix search
  return query
    .replace(/[*()":^]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .map(word => `"${word}"*`)
    .join(' OR ');
}

/**
 * Get context for a task (combines multiple search strategies)
 */
export async function getTaskContext(
  task: string,
  rootDir: string,
  options: {
    maxFiles?: number;
    maxTotalSize?: number;
    structures?: FileStructure[];
  } = {}
): Promise<{
  files: Array<{ path: string; content: string; reason: string }>;
  totalSize: number;
}> {
  const { maxFiles = 5, maxTotalSize = 30 * 1024, structures } = options;
  const files: Array<{ path: string; content: string; reason: string }> = [];
  let totalSize = 0;

  // Search for relevant code
  const searchResults = await searchCode(task, rootDir, {
    limit: maxFiles * 2,
    includeContent: true,
    maxContentSize: maxTotalSize / maxFiles,
  });

  // Add structure-based results if available
  if (structures) {
    const structureResults = searchByStructure(task, structures, { limit: maxFiles });
    for (const result of structureResults) {
      if (!searchResults.find(r => r.path === result.path)) {
        const fullPath = join(rootDir, result.path);
        if (existsSync(fullPath)) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            searchResults.push({ ...result, content });
          } catch {
            // Skip unreadable files
          }
        }
      }
    }
  }

  // Select files within budget
  for (const result of searchResults) {
    if (files.length >= maxFiles) break;
    if (!result.content) continue;

    const contentSize = result.content.length;
    if (totalSize + contentSize > maxTotalSize) {
      // Try to fit a truncated version
      const remaining = maxTotalSize - totalSize;
      if (remaining > 1000) {
        files.push({
          path: result.path,
          content: result.content.slice(0, remaining) + '\n... (truncated)',
          reason: result.matchReason,
        });
        totalSize += remaining;
      }
      break;
    }

    files.push({
      path: result.path,
      content: result.content,
      reason: result.matchReason,
    });
    totalSize += contentSize;
  }

  return { files, totalSize };
}
