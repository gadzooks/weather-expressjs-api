import { Location } from '../../interfaces/geo/Location';
import Forecast from '../../interfaces/forecast/Forecast';
import { CachedForecast } from '../../interfaces/cache/CachedForecast';
import * as cacheManager from './cacheManager';
import { CACHE_TTL_MS } from './cacheManager';

// Generate cache key from location with optional endpoint prefix
export function getCacheKey(
  location: Location,
  endpoint: string = 'default'
): string {
  return `forecast:${endpoint}:${location.name}`;
}

// Get cached forecast for a location
export function get(
  location: Location,
  endpoint: string = 'default'
): Forecast | null {
  const key = getCacheKey(location, endpoint);
  const cached = cacheManager.get<CachedForecast>(key);

  if (!cached) {
    return null;
  }

  // Return the forecast from the cached object
  return cached.forecast;
}

// Set cached forecast for a location
export function set(
  location: Location,
  forecast: Forecast,
  endpoint: string = 'default'
): void {
  const key = getCacheKey(location, endpoint);
  const now = Date.now();

  const cachedForecast: CachedForecast = {
    forecast,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS // Uses configurable TTL (default 3 hours)
  };

  cacheManager.set(key, cachedForecast);
}

// Clear cache for a specific location
export function clearLocation(
  location: Location,
  endpoint: string = 'default'
): number {
  const key = getCacheKey(location, endpoint);
  return cacheManager.del(key);
}

// Clear all forecast caches
export function clearAll() {
  return cacheManager.clearCache();
}

// Clear caches for a specific endpoint
export function clearByEndpoint(endpoint: string): number {
  const prefix = `forecast:${endpoint}:`;
  const allKeys = cacheManager.getKeys();
  const matchingKeys = allKeys.filter((key) => key.startsWith(prefix));

  let deletedCount = 0;
  matchingKeys.forEach((key) => {
    deletedCount += cacheManager.del(key);
  });

  return deletedCount;
}

// Get cache statistics
export function getStats() {
  return cacheManager.getStats();
}
