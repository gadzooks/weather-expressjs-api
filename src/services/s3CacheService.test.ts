/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - aws-sdk-client-mock has type incompatibilities with AWS SDK v3
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import {
  getCachedData,
  setCachedData,
  getCacheKeyPath
} from './s3CacheService';

const s3Mock = mockClient(S3Client);

describe('s3CacheService', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  describe('getCachedData', () => {
    it('should return cached data when valid and not expired', async () => {
      const testData = { message: 'test data' };
      const cachedData = {
        data: testData,
        expiresAt: Date.now() + 60000, // Expires in 1 minute
        cachedAt: Date.now()
      };

      // Mock S3 response with transformToString method
      const mockBody = {
        transformToString: jest
          .fn()
          .mockResolvedValue(JSON.stringify(cachedData))
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody
      });

      const result = await getCachedData<typeof testData>('test-key');

      expect(result).toEqual(testData);
      expect(s3Mock.calls()).toHaveLength(1);
      expect(s3Mock.call(0).args[0].input).toMatchObject({
        Bucket: 'gadzooks-sam-artifacts',
        Key: 'weather-cache/dev/test-key.json'
      });
    });

    it('should return null when cache is expired', async () => {
      const testData = { message: 'test data' };
      const cachedData = {
        data: testData,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        cachedAt: Date.now() - 3600000
      };

      const mockBody = {
        transformToString: jest
          .fn()
          .mockResolvedValue(JSON.stringify(cachedData))
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody
      });

      const result = await getCachedData<typeof testData>('expired-key');

      expect(result).toBeNull();
    });

    it('should return null when cache key does not exist (NoSuchKey)', async () => {
      const error = new Error('NoSuchKey');
      error.name = 'NoSuchKey';
      s3Mock.on(GetObjectCommand).rejects(error);

      const result = await getCachedData('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null and log error for unexpected S3 errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // @ts-expect-error - aws-sdk-client-mock type incompatibility
      s3Mock.on(GetObjectCommand).rejects(new Error('S3 connection error'));

      const result = await getCachedData('error-key');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('S3 cache read error'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it('should return null when S3 response body is empty', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: undefined
      });

      const result = await getCachedData('empty-body-key');

      expect(result).toBeNull();
    });
  });

  describe('setCachedData', () => {
    it('should store data in S3 with correct TTL and metadata', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const testData = { forecasts: [] };
      const ttlHours = 3;

      await setCachedData('test-key', testData, ttlHours);

      expect(s3Mock.calls()).toHaveLength(1);
      const putCall = s3Mock.call(0).args[0].input as PutObjectCommandInput;

      expect(putCall.Bucket).toBe('gadzooks-sam-artifacts');
      expect(putCall.Key).toBe('weather-cache/dev/test-key.json');
      expect(putCall.ContentType).toBe('application/json');
      expect(putCall.Metadata).toMatchObject({
        environment: 'dev',
        cacheKey: 'test-key',
        ttlHours: '3'
      });

      // Parse and verify body
      const body = JSON.parse(putCall.Body as string);
      expect(body.data).toEqual(testData);
      expect(body.cachedAt).toBeLessThanOrEqual(Date.now());
      expect(body.expiresAt).toBeGreaterThan(Date.now());

      // Verify TTL is approximately correct (within 1 second)
      const expectedExpiresAt = Date.now() + ttlHours * 60 * 60 * 1000;
      expect(Math.abs(body.expiresAt - expectedExpiresAt)).toBeLessThan(1000);
    });

    it('should not throw error when S3 put fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      s3Mock.on(PutObjectCommand).rejects(new Error('S3 write error'));

      // Should not throw
      await expect(
        setCachedData('test-key', { data: 'test' }, 1)
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('S3 cache write error'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it('should handle different TTL values correctly', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const testCases = [1, 3, 12, 24];

      for (const ttl of testCases) {
        s3Mock.reset();
        // @ts-expect-error - aws-sdk-client-mock type incompatibility
        s3Mock.on(PutObjectCommand).resolves({});

        await setCachedData('ttl-test', { data: 'test' }, ttl);

        const putCall = s3Mock.call(0).args[0].input as PutObjectCommandInput;
        const body = JSON.parse(putCall.Body as string);

        const expectedExpiresAt = Date.now() + ttl * 60 * 60 * 1000;
        expect(Math.abs(body.expiresAt - expectedExpiresAt)).toBeLessThan(1000);
      }
    });
  });

  describe('getCacheKeyPath', () => {
    it('should return correct S3 path for given key', () => {
      const path = getCacheKeyPath('forecasts-real');
      expect(path).toBe(
        's3://gadzooks-sam-artifacts/weather-cache/dev/forecasts-real.json'
      );
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.ENVIRONMENT;
      delete process.env.S3_CACHE_BUCKET;

      const path = getCacheKeyPath('test-key');
      expect(path).toBe(
        's3://gadzooks-sam-artifacts/weather-cache/dev/test-key.json'
      );
    });
  });
});
