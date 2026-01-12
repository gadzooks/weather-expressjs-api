// location.integration.test.ts

import request from 'supertest';
import { getApp } from './helpers/server';
import { expectValidCacheHeaders } from './helpers/assertions';

describe('Location Forecast Endpoint', () => {
  const app = getApp();

  beforeEach(async () => {
    await request(app).post('/forecasts/clear');
  });

  describe('GET /forecasts/location/:locationName/mock', () => {
    it('should return 404 for invalid location', async () => {
      const response = await request(app).get(
        '/forecasts/location/invalid_location/mock'
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Location not found');
      expect(response.body).toHaveProperty('availableLocations');
      expect(Array.isArray(response.body.availableLocations)).toBe(true);
    });

    it('should return 200 with valid location', async () => {
      const response = await request(app).get(
        '/forecasts/location/seattle/mock'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should return valid LocationForecastResponse structure', async () => {
      const response = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      const { data } = response.body;

      // Validate top-level properties
      expect(data).toHaveProperty('location');
      expect(data).toHaveProperty('forecast');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('region');
      expect(data).toHaveProperty('metadata');

      // Validate location
      expect(data.location.name).toBe('seattle');
      expect(data.location).toHaveProperty('latitude');
      expect(data.location).toHaveProperty('longitude');
      expect(data.location).toHaveProperty('region');

      // Validate forecast array
      expect(Array.isArray(data.forecast)).toBe(true);
      expect(data.forecast.length).toBeGreaterThan(0);

      // Validate alerts array
      expect(Array.isArray(data.alerts)).toBe(true);

      // Validate region
      expect(data.region).toHaveProperty('name');
      expect(data.region).toHaveProperty('locations');

      // Validate metadata
      expect(data.metadata).toHaveProperty('cached');
      expect(data.metadata).toHaveProperty('endpoint');
      expect(data.metadata.endpoint).toBe('mock');
      expect(typeof data.metadata.cached).toBe('boolean');
    });

    it('should validate daily forecast structure', async () => {
      const response = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      const { data } = response.body;

      expect(data.forecast.length).toBeGreaterThan(0);

      const firstDay = data.forecast[0];
      expect(firstDay).toHaveProperty('datetime');
      expect(firstDay).toHaveProperty('tempmax');
      expect(firstDay).toHaveProperty('tempmin');
      expect(firstDay).toHaveProperty('temp');
      expect(firstDay).toHaveProperty('humidity');
      expect(firstDay).toHaveProperty('precipprob');
      expect(firstDay).toHaveProperty('conditions');
    });

    it('should include cache headers', async () => {
      const response = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      expectValidCacheHeaders(response.headers);
    });

    it('should reuse cache from /forecasts/mock endpoint', async () => {
      // First, populate cache with /forecasts/mock
      await request(app).get('/forecasts/mock');

      // Then request single location - should be a cache hit
      const response = await request(app).get(
        '/forecasts/location/seattle/mock'
      );

      expect(response.status).toBe(200);
      expect(response.body.data.metadata.cached).toBe(true);
      expect(response.body.data.metadata.endpoint).toBe('mock');
      expect(response.body.data.metadata).toHaveProperty('expiresAt');
    });

    it('should cache results on subsequent requests', async () => {
      // First request - cache miss
      const response1 = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      expect(response1.status).toBe(200);
      expect(response1.body.data.metadata.cached).toBe(false);

      // Second request - cache hit
      const response2 = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      expect(response2.status).toBe(200);
      expect(response2.body.data.metadata.cached).toBe(true);

      expect(response2.body.data.location.name).toBe('seattle');
    });

    it('should handle different locations independently', async () => {
      const response1 = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      const response2 = await request(app).get(
        '/forecasts/location/chelan/mock'
      );

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      expect(response1.body.data.location.name).toBe('seattle');
      expect(response2.body.data.location.name).toBe('chelan');

      expect(response1.body.data.location.latitude).not.toBe(
        response2.body.data.location.latitude
      );
    });

    it('should respond in less than 5 seconds', async () => {
      const startTime = Date.now();
      await request(app).get('/forecasts/location/seattle/mock');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should include expiresAt timestamp when cached', async () => {
      // First request
      await request(app).get('/forecasts/location/seattle/mock');

      // Second request (cached)
      const response = await request(app).get(
        '/forecasts/location/seattle/mock'
      );

      expect(response.body.data.metadata.cached).toBe(true);
      expect(response.body.data.metadata.expiresAt).toBeDefined();
      expect(typeof response.body.data.metadata.expiresAt).toBe('number');
      expect(response.body.data.metadata.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('GET /forecasts/location/:locationName/real', () => {
    it('should return 404 for invalid location', async () => {
      const response = await request(app).get(
        '/forecasts/location/invalid_location/real'
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Location not found');
    });

    it('should return 200 with valid location', async () => {
      const response = await request(app).get(
        '/forecasts/location/seattle/real'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should reuse cache from /forecasts/real endpoint', async () => {
      // First, populate cache with /forecasts/real
      await request(app).get('/forecasts/real');

      // Then request single location - should be a cache hit
      const response = await request(app).get(
        '/forecasts/location/seattle/real'
      );

      expect(response.status).toBe(200);
      expect(response.body.data.metadata.cached).toBe(true);
      expect(response.body.data.metadata.endpoint).toBe('real');
    });

    it('should cache real and mock data separately', async () => {
      // Request mock version
      const mockResponse = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      expect(mockResponse.body.data.metadata.cached).toBe(false);

      // Request real version (different cache key)
      const realResponse = await request(app).get(
        '/forecasts/location/seattle/real'
      );
      expect(realResponse.body.data.metadata.cached).toBe(false);

      // Request mock again - should be cached
      const mockResponse2 = await request(app).get(
        '/forecasts/location/seattle/mock'
      );
      expect(mockResponse2.body.data.metadata.cached).toBe(true);
    });
  });
});
