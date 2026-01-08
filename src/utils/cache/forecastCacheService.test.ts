import * as forecastCacheService from './forecastCacheService';
import * as cacheManager from './cacheManager';
import { Location } from '../../interfaces/geo/Location';
import Forecast from '../../interfaces/forecast/Forecast';

describe('forecastCacheService', () => {
  const mockLocation: Location = {
    name: 'seattle',
    region: 'cities',
    description: 'Seattle city',
    latitude: 47.606209,
    longitude: -122.332071
  };

  const mockForecast: Forecast = {
    latitude: 47.606209,
    longitude: -122.332071,
    description: 'Seattle weather',
    days: [
      {
        datetime: '2026-01-07',
        tempmax: 50,
        tempmin: 40,
        precip: 0.1,
        precipprob: 60,
        precipcover: 10,
        cloudCover: 80,
        sunrise: '07:30:00',
        sunset: '17:00:00',
        moonphase: 0.5,
        conditions: 'Rainy',
        description: 'Rainy day',
        icon: 'rain'
      }
    ],
    alerts: []
  };

  beforeEach(() => {
    // Clear cache before each test
    cacheManager.clearCache();
  });

  afterEach(() => {
    // Clean up after each test
    cacheManager.clearCache();
  });

  describe('getCacheKey', () => {
    it('should generate correct cache key from location', () => {
      const key = forecastCacheService.getCacheKey(mockLocation);
      expect(key).toBe('forecast:seattle');
    });

    it('should handle different location names', () => {
      const location: Location = {
        ...mockLocation,
        name: 'gold bar'
      };
      const key = forecastCacheService.getCacheKey(location);
      expect(key).toBe('forecast:gold bar');
    });
  });

  describe('get and set', () => {
    it('should store and retrieve a forecast', () => {
      forecastCacheService.set(mockLocation, mockForecast);
      const retrieved = forecastCacheService.get(mockLocation);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.latitude).toBe(mockForecast.latitude);
      expect(retrieved?.longitude).toBe(mockForecast.longitude);
      expect(retrieved?.days).toHaveLength(1);
      expect(retrieved?.days[0].datetime).toBe('2026-01-07');
    });

    it('should return null for non-existent location', () => {
      const location: Location = {
        ...mockLocation,
        name: 'non-existent'
      };
      const retrieved = forecastCacheService.get(location);
      expect(retrieved).toBeNull();
    });

    it('should handle multiple locations', () => {
      const location1: Location = { ...mockLocation, name: 'seattle' };
      const location2: Location = { ...mockLocation, name: 'portland' };
      const forecast1 = { ...mockForecast, description: 'Seattle weather' };
      const forecast2 = { ...mockForecast, description: 'Portland weather' };

      forecastCacheService.set(location1, forecast1);
      forecastCacheService.set(location2, forecast2);

      const retrieved1 = forecastCacheService.get(location1);
      const retrieved2 = forecastCacheService.get(location2);

      expect(retrieved1?.description).toBe('Seattle weather');
      expect(retrieved2?.description).toBe('Portland weather');
    });

    it('should wrap forecast with cache metadata', () => {
      forecastCacheService.set(mockLocation, mockForecast);

      // Access the underlying cached object directly
      const key = forecastCacheService.getCacheKey(mockLocation);
      const cachedObject = cacheManager.get(key);

      expect(cachedObject).toBeDefined();
      expect(cachedObject).toHaveProperty('forecast');
      expect(cachedObject).toHaveProperty('cachedAt');
      expect(cachedObject).toHaveProperty('expiresAt');
    });
  });

  describe('clearLocation', () => {
    it('should clear cache for specific location', () => {
      const location1: Location = { ...mockLocation, name: 'seattle' };
      const location2: Location = { ...mockLocation, name: 'portland' };

      forecastCacheService.set(location1, mockForecast);
      forecastCacheService.set(location2, mockForecast);

      const delCount = forecastCacheService.clearLocation(location1);
      expect(delCount).toBe(1);

      expect(forecastCacheService.get(location1)).toBeNull();
      expect(forecastCacheService.get(location2)).not.toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear all cached forecasts', () => {
      const location1: Location = { ...mockLocation, name: 'seattle' };
      const location2: Location = { ...mockLocation, name: 'portland' };
      const location3: Location = { ...mockLocation, name: 'vancouver' };

      forecastCacheService.set(location1, mockForecast);
      forecastCacheService.set(location2, mockForecast);
      forecastCacheService.set(location3, mockForecast);

      const stats = forecastCacheService.clearAll();
      expect(stats.keys).toBe(3);

      expect(forecastCacheService.get(location1)).toBeNull();
      expect(forecastCacheService.get(location2)).toBeNull();
      expect(forecastCacheService.get(location3)).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      forecastCacheService.set(mockLocation, mockForecast);

      const stats = forecastCacheService.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hitRate');
    });
  });
});
