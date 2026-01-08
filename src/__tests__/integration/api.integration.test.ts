import request from 'supertest';
import { getApp } from './helpers/server';
import {
  expectValidForecastResponse,
  expectValidRegionHash,
  expectValidCacheHeaders,
  expectValidDailyForecast,
  expectValidCacheClearResponse,
} from './helpers/assertions';
import DailyForecast from '../../interfaces/forecast/DailyForecast';

describe('Weather API Integration Tests', () => {
  const app = getApp();

  beforeEach(async () => {
    await request(app).get('/forecasts/clear');
  });

  describe('Health Check', () => {
    it('GET / should return 200 with HTML content', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Hello from the TypeScript world');
    });
  });

  describe('Forecast Endpoints', () => {
    describe('GET /forecasts/mock', () => {
      it('should return 200 status', async () => {
        const response = await request(app).get('/forecasts/mock');

        expect(response.status).toBe(200);
      });

      it('should return JSON content-type', async () => {
        const response = await request(app).get('/forecasts/mock');

        expect(response.headers['content-type']).toMatch(/application\/json/);
      });

      it('should include cache headers', async () => {
        const response = await request(app).get('/forecasts/mock');

        expectValidCacheHeaders(response.headers);
      });

      it('should return valid ForecastResponse structure', async () => {
        const response = await request(app).get('/forecasts/mock');

        expect(response.body).toHaveProperty('data');
        expectValidForecastResponse(response.body.data);
      });

      it('should have 15 days of forecasts', async () => {
        const response = await request(app).get('/forecasts/mock');

        expect(response.body.data.dates.length).toBe(15);
      });

      it('should have forecasts for all locations', async () => {
        const response = await request(app).get('/forecasts/mock');
        const { data } = response.body;

        data.locations.allIds.forEach((locationId: string) => {
          // eslint-disable-next-line security/detect-object-injection
          const locationForecasts = data.forecasts.byId[locationId];
          expect(locationForecasts).toBeDefined();
          expect(locationForecasts).toBeInstanceOf(Array);
          expect(locationForecasts.length).toBe(15);

          // Validate each daily forecast
          locationForecasts.forEach((dailyForecast: DailyForecast) => {
            expectValidDailyForecast(dailyForecast);
          });
        });
      });

      it('should have at least 8 regions', async () => {
        const response = await request(app).get('/forecasts/mock');

        expect(response.body.data.regions.allIds.length).toBeGreaterThanOrEqual(
          8
        );
      });

      it('should respond in less than 5 seconds', async () => {
        const startTime = Date.now();
        await request(app).get('/forecasts/mock');
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(5000);
      });
    });

    describe('Cache Management', () => {
      describe('GET /forecasts/clear', () => {
        it('should return 200 status', async () => {
          const response = await request(app).get('/forecasts/clear');

          expect(response.status).toBe(200);
        });

        it('should return valid cache clear response', async () => {
          await request(app).get('/forecasts/mock');

          const response = await request(app).get('/forecasts/clear');

          expectValidCacheClearResponse(response.body);
        });

        it('should clear cached forecast data', async () => {
          await request(app).get('/forecasts/mock');

          const clearResponse = await request(app).get('/forecasts/clear');
          expect(clearResponse.body.stats.keysCleared).toBeGreaterThan(0);

          const clearResponse2 = await request(app).get('/forecasts/clear');
          expect(clearResponse2.body.stats.keysCleared).toBe(0);
        });
      });

      describe('POST /forecasts/clear', () => {
        it('should return 200 status', async () => {
          const response = await request(app).post('/forecasts/clear');

          expect(response.status).toBe(200);
        });

        it('should return valid cache clear response', async () => {
          await request(app).get('/forecasts/mock');

          const response = await request(app).post('/forecasts/clear');

          expectValidCacheClearResponse(response.body);
        });

        it('should clear cached forecast data', async () => {
          await request(app).get('/forecasts/mock');

          const clearResponse = await request(app).post('/forecasts/clear');
          expect(clearResponse.body.stats.keysCleared).toBeGreaterThan(0);

          const clearResponse2 = await request(app).post(
            '/forecasts/clear'
          );
          expect(clearResponse2.body.stats.keysCleared).toBe(0);
        });
      });
    });
  });

  describe('Geo Endpoints', () => {
    describe('GET /geo/', () => {
      it('should return 200 status', async () => {
        const response = await request(app).get('/geo/');

        expect(response.status).toBe(200);
      });

      it('should return JSON content-type', async () => {
        const response = await request(app).get('/geo/');

        expect(response.headers['content-type']).toMatch(/application\/json/);
      });

      it('should return valid RegionHash structure', async () => {
        const response = await request(app).get('/geo/');

        expectValidRegionHash(response.body);
      });

      it('should have at least 8 regions', async () => {
        const response = await request(app).get('/geo/');

        const regionNames = Object.keys(response.body);
        expect(regionNames.length).toBeGreaterThanOrEqual(8);
      });
    });

    describe('GET /geo/:regionId', () => {
      it('should return 200 status for valid region (cities)', async () => {
        const response = await request(app).get('/geo/cities');

        expect(response.status).toBe(200);
      });

      it('should return single region data for cities', async () => {
        const response = await request(app).get('/geo/cities');

        expect(response.body).toHaveProperty('cities');
        expect(response.body.cities).toHaveProperty('locations');
        expect(response.body.cities.locations).toBeInstanceOf(Array);
        expect(response.body.cities.locations.length).toBeGreaterThan(0);
      });

      it('should return 200 status for valid region (central_cascades)', async () => {
        const response = await request(app).get('/geo/central_cascades');

        expect(response.status).toBe(200);
      });

      it('should return single region data for central_cascades', async () => {
        const response = await request(app).get('/geo/central_cascades');

        expect(response.body).toHaveProperty('central_cascades');
        expect(response.body.central_cascades.locations.length).toBeGreaterThan(
          0
        );
      });

      it('should handle invalid region ID gracefully', async () => {
        const response = await request(app).get('/geo/invalid_region_id');

        expect([200, 404]).toContain(response.status);
      });
    });
  });
});
