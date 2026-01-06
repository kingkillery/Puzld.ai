/**
 * Semantic Cache - Training Distribution Optimization Layer
 *
 * Implements basic semantic caching for tool results based on research showing:
 * - 45% cache hit rate on SWE-Bench (Asteria)
 * - 20% throughput improvement
 * - Semantic similarity matching > exact parameter matching
 *
 * Phase 1: In-memory cache with semantic similarity
 * Phase 2 (future): Three-tier MemGPT-style hierarchy
 */

import type { ToolResult, SemanticMetadata } from '../agentic/tools/types';
import { createHash } from 'crypto';

interface CachedToolResult {
  toolName: string;
  params: Record<string, unknown>;
  result: ToolResult;
  paramsHash: string;
  semanticKey: string;
  timestamp: number;
  accessCount: number;
  hitCount: number;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalEntries: number;
}

export class SemanticCache {
  private cache: Map<string, CachedToolResult>;
  private stats: CacheStats;
  private maxEntries: number;
  private ttlMs: number;

  constructor(maxEntries: number = 1000, ttlMs: number = 30 * 60 * 1000) {
    this.cache = new Map();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalEntries: 0
    };
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Get cached result if exists and fresh
   */
  get(toolName: string, params: Record<string, unknown>): ToolResult | null {
    this.stats.totalRequests++;

    const paramsHash = this.hashParams(toolName, params);
    const semanticKey = this.buildSemanticKey(toolName, params);

    // Try exact parameter match first
    let cached = this.cache.get(paramsHash);

    // Fallback to semantic similarity match
    if (!cached) {
      cached = this.findSemanticMatch(toolName, semanticKey);
    }

    // Check if cache entry is fresh
    if (cached && this.isFresh(cached)) {
      cached.accessCount++;
      cached.hitCount++;
      this.stats.cacheHits++;
      this.updateHitRate();

      // Mark result as coming from cache
      const result = { ...cached.result };
      if (result.semantic) {
        result.semantic = { ...result.semantic, cached: true };
      }

      return result;
    }

    // Remove stale entry
    if (cached) {
      this.cache.delete(paramsHash);
      this.stats.totalEntries--;
    }

    this.stats.cacheMisses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Store result in cache
   */
  set(toolName: string, params: Record<string, unknown>, result: ToolResult): void {
    // Don't cache errors
    if (result.isError) return;

    const paramsHash = this.hashParams(toolName, params);
    const semanticKey = this.buildSemanticKey(toolName, params);

    // Evict if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    const cached: CachedToolResult = {
      toolName,
      params,
      result,
      paramsHash,
      semanticKey,
      timestamp: Date.now(),
      accessCount: 1,
      hitCount: 0
    };

    this.cache.set(paramsHash, cached);
    this.stats.totalEntries = this.cache.size;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalEntries: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Hash parameters for exact matching
   */
  private hashParams(toolName: string, params: Record<string, unknown>): string {
    const normalized = this.normalizeParams(params);
    const str = toolName + ':' + JSON.stringify(normalized);
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Normalize parameters for consistent hashing
   */
  private normalizeParams(params: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    // Sort keys for consistent ordering
    const keys = Object.keys(params).sort();

    for (const key of keys) {
      const value = params[key];

      // Normalize strings (trim, lowercase for case-insensitive matching)
      if (typeof value === 'string') {
        normalized[key] = value.trim();
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Build semantic key for similarity matching
   */
  private buildSemanticKey(toolName: string, params: Record<string, unknown>): string {
    // Extract the semantically meaningful parts
    const parts: string[] = [toolName];

    // For grep: pattern is most important
    if (toolName === 'grep' && params.pattern) {
      parts.push('pattern:' + String(params.pattern).toLowerCase());
      if (params.path) parts.push('path:' + String(params.path));
    }

    // For glob: pattern is most important
    if (toolName === 'glob' && params.pattern) {
      parts.push('pattern:' + String(params.pattern).toLowerCase());
    }

    // For view: file path is most important
    if (toolName === 'view' && params.path) {
      parts.push('path:' + String(params.path));
    }

    return parts.join('|');
  }

  /**
   * Find cached entry with semantic similarity
   */
  private findSemanticMatch(
    toolName: string,
    semanticKey: string
  ): CachedToolResult | null {
    // Simple semantic matching: find entries with same tool and similar keys
    for (const cached of this.cache.values()) {
      if (cached.toolName !== toolName) continue;

      // Calculate simple similarity score
      const similarity = this.calculateSimilarity(semanticKey, cached.semanticKey);

      // High similarity threshold (0.8 = 80% similar)
      if (similarity >= 0.8) {
        return cached;
      }
    }

    return null;
  }

  /**
   * Calculate simple string similarity (Jaccard index on words)
   */
  private calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/[|:\s]/));
    const wordsB = new Set(b.toLowerCase().split(/[|:\s]/));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  /**
   * Check if cache entry is still fresh
   */
  private isFresh(cached: CachedToolResult): boolean {
    return (Date.now() - cached.timestamp) < this.ttlMs;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, cached] of this.cache.entries()) {
      // Prefer evicting entries with low hit count and old access time
      const score = cached.timestamp - (cached.hitCount * 10000);

      if (score < oldestTime) {
        oldestTime = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.cacheHits / this.stats.totalRequests;
    }
  }

  /**
   * Clean up stale entries
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.ttlMs) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    this.stats.totalEntries = this.cache.size;
  }
}

// Global singleton instance
let cacheInstance: SemanticCache | null = null;

/**
 * Get global cache instance
 */
export function getSemanticCache(): SemanticCache {
  if (!cacheInstance) {
    cacheInstance = new SemanticCache();

    // Periodic cleanup every 5 minutes
    setInterval(() => {
      cacheInstance?.cleanup();
    }, 5 * 60 * 1000);
  }

  return cacheInstance;
}

/**
 * Clear global cache
 */
export function clearSemanticCache(): void {
  cacheInstance?.clear();
}

/**
 * Get cache statistics
 */
export function getSemanticCacheStats(): CacheStats {
  return getSemanticCache().getStats();
}
