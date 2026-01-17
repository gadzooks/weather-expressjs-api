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
    it('should generate correct cache key from location with default endpoint', () => {
      const key = forecastCacheService.getCacheKey(mockLocation);
      expect(key).toBe('forecast:default:seattle');
    });

    it('should generate correct cache key with custom endpoint', () => {
      const key = forecastCacheService.getCacheKey(mockLocation, 'real');
      expect(key).toBe('forecast:real:seattle');
    });

    it('should handle different location names', () => {
      const location: Location = {
        ...mockLocation,
        name: 'gold bar'
      };
      const key = forecastCacheService.getCacheKey(location);
      expect(key).toBe('forecast:default:gold bar');
    });

    it('should isolate caches by endpoint', () => {
      const keyReal = forecastCacheService.getCacheKey(mockLocation, 'real');
      const keyMock = forecastCacheService.getCacheKey(mockLocation, 'mock');
      expect(keyReal).not.toBe(keyMock);
      expect(keyReal).toBe('forecast:real:seattle');
      expect(keyMock).toBe('forecast:mock:seattle');
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

    it('should isolate caches by endpoint', () => {
      const forecast1 = { ...mockForecast, description: 'Real API data' };
      const forecast2 = { ...mockForecast, description: 'Mock API data' };

      // Set different data for same location but different endpoints
      forecastCacheService.set(mockLocation, forecast1, 'real');
      forecastCacheService.set(mockLocation, forecast2, 'mock');

      // Retrieve should get correct data based on endpoint
      const retrievedReal = forecastCacheService.get(mockLocation, 'real');
      const retrievedMock = forecastCacheService.get(mockLocation, 'mock');

      expect(retrievedReal?.description).toBe('Real API data');
      expect(retrievedMock?.description).toBe('Mock API data');
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

  describe('clearByEndpoint', () => {
    it('should clear only caches for specified endpoint', () => {
      const location1: Location = { ...mockLocation, name: 'seattle' };
      const location2: Location = { ...mockLocation, name: 'portland' };

      // Set data for both real and mock endpoints
      forecastCacheService.set(location1, mockForecast, 'real');
      forecastCacheService.set(location2, mockForecast, 'real');
      forecastCacheService.set(location1, mockForecast, 'mock');
      forecastCacheService.set(location2, mockForecast, 'mock');

      // Clear only 'real' endpoint
      const deletedCount = forecastCacheService.clearByEndpoint('real');
      expect(deletedCount).toBe(2);

      // Real endpoint should be cleared
      expect(forecastCacheService.get(location1, 'real')).toBeNull();
      expect(forecastCacheService.get(location2, 'real')).toBeNull();

      // Mock endpoint should still have data
      expect(forecastCacheService.get(location1, 'mock')).not.toBeNull();
      expect(forecastCacheService.get(location2, 'mock')).not.toBeNull();
    });

    it('should clear only mock endpoint caches', () => {
      const location: Location = { ...mockLocation, name: 'seattle' };

      forecastCacheService.set(location, mockForecast, 'real');
      forecastCacheService.set(location, mockForecast, 'mock');

      const deletedCount = forecastCacheService.clearByEndpoint('mock');
      expect(deletedCount).toBe(1);

      expect(forecastCacheService.get(location, 'real')).not.toBeNull();
      expect(forecastCacheService.get(location, 'mock')).toBeNull();
    });

    it('should return 0 when clearing non-existent endpoint', () => {
      const deletedCount = forecastCacheService.clearByEndpoint('nonexistent');
      expect(deletedCount).toBe(0);
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
