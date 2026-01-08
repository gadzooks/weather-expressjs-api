import NodeCache from 'node-cache';
import { CacheStats } from '../../interfaces/cache/CachedForecast';

// Create singleton NodeCache instance
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour TTL
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Don't clone objects for performance
  deleteOnExpire: true, // Auto-delete expired entries
  maxKeys: 100 // Max 100 locations (safety limit)
});

// Log cache events for debugging
cache.on('expired', (key) => {
  console.log(`Cache expired: ${key}`);
});

cache.on('set', (key) => {
  console.log(`Cache set: ${key}`);
});

cache.on('del', (key) => {
  console.log(`Cache deleted: ${key}`);
});

// Typed get method
export function get<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

// Typed set method
export function set<T>(key: string, value: T): boolean {
  return cache.set<T>(key, value);
}

// Clear all cache entries
export function clearCache(): CacheStats {
  const keys = cache.keys().length;
  cache.flushAll();
  console.log(`Cache cleared: ${keys} keys removed`);
  return {
    hits: 0,
    misses: 0,
    keys,
    hitRate: 0
  };
}

// Get cache statistics
export function getStats(): CacheStats {
  const stats = cache.getStats();
  const hits = stats.hits || 0;
  const misses = stats.misses || 0;
  const total = hits + misses;
  const hitRate = total > 0 ? (hits / total) * 100 : 0;

  return {
    hits,
    misses,
    keys: cache.keys().length,
    hitRate: Math.round(hitRate * 100) / 100 // Round to 2 decimal places
  };
}

// Get all cache keys
export function getKeys(): string[] {
  return cache.keys();
}

// Delete a specific cache entry
export function del(key: string): number {
  return cache.del(key);
}

// Export the cache instance for advanced usage if needed
export default cache;
