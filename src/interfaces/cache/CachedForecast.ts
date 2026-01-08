import Forecast from '../forecast/Forecast';

export interface CachedForecast {
  forecast: Forecast;
  cachedAt: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
}
