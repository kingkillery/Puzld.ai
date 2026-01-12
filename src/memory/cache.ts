// Simple cache implementation for pk-puzldai

export interface ICache<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

export class MemoryCache<T = any> implements ICache<T> {
  private cache = new Map<string, T>();

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export class RedisCache<T = any> implements ICache<T> {
  private client: any;

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  get(key: string): T | undefined {
    const value = this.client.get(key);
    return value ? JSON.parse(value) : undefined;
  }

  set(key: string, value: T): void {
    this.client.set(key, JSON.stringify(value));
  }

  delete(key: string): void {
    this.client.del(key);
  }

  clear(): void {
    this.client.flushAll?.();
  }

  has(key: string): boolean {
    return this.client.exists(key) === 1;
  }
}

export function createCache<T = any>(options?: { ttl?: number; maxSize?: number }): ICache<T> {
  return new MemoryCache<T>();
}

export type TaskEntry = {
  id: string;
  status: string;
  result?: string;
  createdAt: number;
  updatedAt: number;
};
