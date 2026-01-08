import { Location } from '../../interfaces/geo/Location';
import Forecast from '../../interfaces/forecast/Forecast';
import { CachedForecast } from '../../interfaces/cache/CachedForecast';
import * as cacheManager from './cacheManager';

// Generate cache key from location
export function getCacheKey(location: Location): string {
  return `forecast:${location.name}`;
}

// Get cached forecast for a location
export function get(location: Location): Forecast | null {
  const key = getCacheKey(location);
  const cached = cacheManager.get<CachedForecast>(key);

  if (!cached) {
    return null;
  }

  // Return the forecast from the cached object
  return cached.forecast;
}

// Set cached forecast for a location
export function set(location: Location, forecast: Forecast): void {
  const key = getCacheKey(location);
  const now = Date.now();

  const cachedForecast: CachedForecast = {
    forecast,
    cachedAt: now,
    expiresAt: now + 3600 * 1000 // 1 hour from now
  };

  cacheManager.set(key, cachedForecast);
}

// Clear cache for a specific location
export function clearLocation(location: Location): number {
  const key = getCacheKey(location);
  return cacheManager.del(key);
}

// Clear all forecast caches
export function clearAll() {
  return cacheManager.clearCache();
}

// Get cache statistics
export function getStats() {
  return cacheManager.getStats();
}
