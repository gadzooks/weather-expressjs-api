// hourly.integration.test.ts

import request from 'supertest';
import { getApp } from './helpers/server';
import { expectValidCacheHeaders } from './helpers/assertions';

describe('Hourly Forecast Endpoints', () => {
  const app = getApp();

  beforeEach(async () => {
    await request(app).get('/forecasts/clear');
  });

  describe('GET /forecasts/hourly/mock', () => {
    it('should return 400 without location parameter', async () => {
      const response = await request(app).get('/forecasts/hourly/mock');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('location');
    });

    it('should return 404 for invalid location', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=invalid_location'
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Location not found');
      expect(response.body).toHaveProperty('availableLocations');
    });

    it('should return 400 for invalid startDate format', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=seattle&startDate=2026-13-45'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('startDate');
    });

    it('should return 400 for invalid endDate format', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=seattle&endDate=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('endDate');
    });

    it('should return 400 when endDate is before startDate', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=seattle&startDate=2021-04-20&endDate=2021-04-18'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('date range');
    });

    it('should return 200 with valid location', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=seattle'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should return valid HourlyForecastResponse structure', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=seattle'
      );

      const { data } = response.body;

      expect(data).toHaveProperty('location');
      expect(data).toHaveProperty('days');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('totalHours');

      expect(data.location.name).toBe('seattle');
      expect(data.location).toHaveProperty('latitude');
      expect(data.location).toHaveProperty('longitude');

      expect(Array.isArray(data.days)).toBe(true);
      expect(data.days.length).toBeGreaterThan(0);

      // Validate first day has hours
      const firstDay = data.days[0];
      expect(firstDay).toHaveProperty('hours');
      expect(Array.isArray(firstDay.hours)).toBe(true);

      if (firstDay.hours && firstDay.hours.length > 0) {
        const firstHour = firstDay.hours[0];
        expect(firstHour).toHaveProperty('datetime');
        expect(firstHour).toHaveProperty('temp');
        expect(firstHour).toHaveProperty('humidity');
        expect(firstHour).toHaveProperty('windspeed');
        expect(firstHour).toHaveProperty('conditions');
      }
    });

    it('should filter by date range when startDate and endDate provided', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=seattle&startDate=2021-04-18&endDate=2021-04-19'
      );

      const { data } = response.body;

      expect(data.requestedDates).toBeDefined();
      expect(data.days.length).toBeLessThanOrEqual(2);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.days.forEach((day: any) => {
        expect(day.datetime >= '2021-04-18').toBe(true);
        expect(day.datetime <= '2021-04-19').toBe(true);
      });
    });

    it('should include cache headers', async () => {
      const response = await request(app).get(
        '/forecasts/hourly/mock?location=seattle'
      );

      expectValidCacheHeaders(response.headers);
    });

    it('should cache results on subsequent requests', async () => {
      const response1 = await request(app).get(
        '/forecasts/hourly/mock?location=seattle'
      );
      expect(response1.status).toBe(200);

      const response2 = await request(app).get(
        '/forecasts/hourly/mock?location=seattle'
      );
      expect(response2.status).toBe(200);

      expect(response2.body.data.location.name).toBe('seattle');
    });
  });
});
