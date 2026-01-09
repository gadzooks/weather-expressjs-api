import request from 'supertest';
import { getApp } from './helpers/server';

describe('CORS Integration Tests', () => {
  const app = getApp();

  // Set allowed origins for these tests
  const ALLOWED_ORIGIN = 'http://localhost:3000';
  const DISALLOWED_ORIGIN = 'https://malicious.com';

  beforeAll(() => {
    // Set environment variable before importing app
    process.env.ALLOWED_ORIGINS = ALLOWED_ORIGIN;
  });

  describe('Preflight OPTIONS Requests', () => {
    it('should handle OPTIONS request from allowed origin', async () => {
      const response = await request(app)
        .options('/forecasts/mock')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect([200, 204]).toContain(response.status);
      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN
      );
      expect(response.headers['access-control-allow-methods']).toMatch(/GET/);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-max-age']).toBe('86400');
    });

    it('should handle OPTIONS request from disallowed origin', async () => {
      const response = await request(app)
        .options('/forecasts/mock')
        .set('Origin', DISALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      // Expect no CORS headers or error response
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should include allowed headers in preflight response', async () => {
      const response = await request(app)
        .options('/forecasts/mock')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(response.headers['access-control-allow-headers']).toMatch(
        /Content-Type/
      );
      expect(response.headers['access-control-allow-headers']).toMatch(
        /Authorization/
      );
    });
  });

  describe('Actual GET Requests with CORS', () => {
    it('should return CORS headers for allowed origin on /forecasts/mock', async () => {
      const response = await request(app)
        .get('/forecasts/mock')
        .set('Origin', ALLOWED_ORIGIN);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.body).toHaveProperty('data');
    });

    it('should not return CORS headers for disallowed origin', async () => {
      const response = await request(app)
        .get('/forecasts/mock')
        .set('Origin', DISALLOWED_ORIGIN);

      // Request might succeed but without CORS headers
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should work without Origin header (Postman/curl scenario)', async () => {
      const response = await request(app).get('/forecasts/mock');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('should return CORS headers for allowed origin on /geo', async () => {
      const response = await request(app)
        .get('/geo/')
        .set('Origin', ALLOWED_ORIGIN);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN
      );
    });

    it('should return CORS headers for allowed origin on root /', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', ALLOWED_ORIGIN);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN
      );
    });
  });

  describe('Multiple Allowed Origins', () => {
    // Note: ALLOWED_ORIGINS is set in .env to: http://localhost:3000,http://localhost:5173,http://localhost:5174
    // These tests verify that all origins in that list work correctly

    it('should allow first origin in list', async () => {
      const response = await request(app)
        .get('/forecasts/mock')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000'
      );
    });

    it('should allow middle origin in list', async () => {
      const response = await request(app)
        .get('/forecasts/mock')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
      );
    });

    it('should allow last origin in list', async () => {
      const response = await request(app)
        .get('/forecasts/mock')
        .set('Origin', 'http://localhost:5174');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5174'
      );
    });

    it('should reject origin not in list', async () => {
      const response = await request(app)
        .get('/forecasts/mock')
        .set('Origin', 'https://notallowed.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('POST Requests with CORS', () => {
    it('should handle POST with CORS from allowed origin', async () => {
      const response = await request(app)
        .post('/forecasts/clear')
        .set('Origin', ALLOWED_ORIGIN)
        .send({});

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        ALLOWED_ORIGIN
      );
    });
  });
});
