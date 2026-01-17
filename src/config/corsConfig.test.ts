/* eslint-disable @typescript-eslint/no-require-imports */
// require() is needed in tests to dynamically import after setting env vars

describe('CORS Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('parseAllowedOrigins', () => {
    it('should parse single origin', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const { parseAllowedOrigins } = require('./corsConfig');
      const origins = parseAllowedOrigins();

      expect(origins).toEqual(['http://localhost:3000']);
    });

    it('should parse multiple comma-separated origins', () => {
      process.env.ALLOWED_ORIGINS =
        'http://localhost:3000,https://example.com,https://app.example.com';
      const { parseAllowedOrigins } = require('./corsConfig');
      const origins = parseAllowedOrigins();

      expect(origins).toEqual([
        'http://localhost:3000',
        'https://example.com',
        'https://app.example.com'
      ]);
    });

    it('should trim whitespace from origins', () => {
      process.env.ALLOWED_ORIGINS =
        ' http://localhost:3000 , https://example.com ';
      const { parseAllowedOrigins } = require('./corsConfig');
      const origins = parseAllowedOrigins();

      expect(origins).toEqual(['http://localhost:3000', 'https://example.com']);
    });

    it('should return empty array when ALLOWED_ORIGINS is empty string', () => {
      process.env.ALLOWED_ORIGINS = '';
      const { parseAllowedOrigins } = require('./corsConfig');
      const origins = parseAllowedOrigins();

      expect(origins).toEqual([]);
    });

    it('should return empty array when ALLOWED_ORIGINS is not set', () => {
      delete process.env.ALLOWED_ORIGINS;
      const { parseAllowedOrigins } = require('./corsConfig');
      const origins = parseAllowedOrigins();

      expect(origins).toEqual([]);
    });

    it('should filter out empty strings from split', () => {
      process.env.ALLOWED_ORIGINS =
        'http://localhost:3000,,https://example.com';
      const { parseAllowedOrigins } = require('./corsConfig');
      const origins = parseAllowedOrigins();

      expect(origins).toEqual(['http://localhost:3000', 'https://example.com']);
    });
  });

  describe('getCorsOptions', () => {
    it('should create cors options with origin callback', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const { getCorsOptions } = require('./corsConfig');
      const options = getCorsOptions();

      expect(options).toHaveProperty('origin');
      expect(typeof options.origin).toBe('function');
      expect(options.credentials).toBe(true);
      expect(options.methods).toContain('GET');
      expect(options.maxAge).toBe(86400);
    });

    it('should only allow GET method', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const { getCorsOptions } = require('./corsConfig');
      const options = getCorsOptions();

      expect(options.methods).toEqual(['GET']);
      expect(options.methods).toHaveLength(1);
      expect(options.methods).not.toContain('POST');
      expect(options.methods).not.toContain('PUT');
      expect(options.methods).not.toContain('DELETE');
      expect(options.methods).not.toContain('PATCH');
    });

    it('should allow origin in whitelist', (done) => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://example.com';
      const { getCorsOptions } = require('./corsConfig');
      const options = getCorsOptions();

      options.origin(
        'http://localhost:3000',
        (err: Error | null, allowed: boolean) => {
          expect(err).toBeNull();
          expect(allowed).toBe(true);
          done();
        }
      );
    });

    it('should reject origin not in whitelist', (done) => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const { getCorsOptions } = require('./corsConfig');
      const options = getCorsOptions();

      options.origin(
        'https://malicious.com',
        (err: Error | null, allowed: boolean) => {
          expect(err).toBeInstanceOf(Error);
          expect(err?.message).toContain('not allowed by CORS');
          expect(allowed).toBe(false);
          done();
        }
      );
    });

    it('should allow requests with no origin', (done) => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const { getCorsOptions } = require('./corsConfig');
      const options = getCorsOptions();

      options.origin(undefined, (err: Error | null, allowed: boolean) => {
        expect(err).toBeNull();
        expect(allowed).toBe(true);
        done();
      });
    });
  });
});
