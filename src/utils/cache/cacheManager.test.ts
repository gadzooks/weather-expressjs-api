import * as cacheManager from './cacheManager';

describe('cacheManager', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheManager.clearCache();
  });

  afterEach(() => {
    // Clean up after each test
    cacheManager.clearCache();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      const key = 'test-key';
      const value = { name: 'test', data: [1, 2, 3] };

      const setResult = cacheManager.set(key, value);
      expect(setResult).toBe(true);

      const retrieved = cacheManager.get(key);
      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const retrieved = cacheManager.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should handle string values', () => {
      cacheManager.set('string-key', 'test-string');
      const retrieved = cacheManager.get('string-key');
      expect(retrieved).toBe('test-string');
    });

    it('should handle number values', () => {
      cacheManager.set('number-key', 42);
      const retrieved = cacheManager.get('number-key');
      expect(retrieved).toBe(42);
    });

    it('should handle array values', () => {
      const array = [1, 2, 3, 4, 5];
      cacheManager.set('array-key', array);
      const retrieved = cacheManager.get('array-key');
      expect(retrieved).toEqual(array);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');

      const stats = cacheManager.clearCache();
      expect(stats.keys).toBe(3);

      expect(cacheManager.get('key1')).toBeUndefined();
      expect(cacheManager.get('key2')).toBeUndefined();
      expect(cacheManager.get('key3')).toBeUndefined();
    });

    it('should return zero keys when clearing empty cache', () => {
      const stats = cacheManager.clearCache();
      expect(stats.keys).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      // Trigger some hits
      cacheManager.get('key1');
      cacheManager.get('key2');
      cacheManager.get('key1');

      // Trigger some misses
      cacheManager.get('non-existent1');
      cacheManager.get('non-existent2');

      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.keys).toBe(2);
      expect(stats.hitRate).toBe(60); // 3/5 = 60%
    });

    it('should return zero hit rate when no cache operations', () => {
      const stats = cacheManager.getStats();
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('getKeys', () => {
    it('should return all cache keys', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');

      const keys = cacheManager.getKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should return empty array when cache is empty', () => {
      const keys = cacheManager.getKeys();
      expect(keys).toHaveLength(0);
    });
  });

  describe('del', () => {
    it('should delete a specific cache entry', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');

      const delCount = cacheManager.del('key1');
      expect(delCount).toBe(1);
      expect(cacheManager.get('key1')).toBeUndefined();
      expect(cacheManager.get('key2')).toBe('value2');
    });

    it('should return 0 when deleting non-existent key', () => {
      const delCount = cacheManager.del('non-existent');
      expect(delCount).toBe(0);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      jest.useFakeTimers();

      cacheManager.set('temp-key', 'temp-value');
      expect(cacheManager.get('temp-key')).toBe('temp-value');

      // Fast-forward time by 1 hour + 1 second (beyond TTL)
      jest.advanceTimersByTime(3601 * 1000);

      // Entry should be expired
      expect(cacheManager.get('temp-key')).toBeUndefined();

      jest.useRealTimers();
    });
  });
});
