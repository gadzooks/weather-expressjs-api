import { compressionMiddleware } from './compression';
import request from 'supertest';
import express from 'express';

describe('Compression Middleware', () => {
  it('should compress responses when Accept-Encoding includes gzip', async () => {
    const app = express();
    app.use(compressionMiddleware);
    app.get('/test', (_req, res) => {
      res.json({ data: 'x'.repeat(2000) });
    });

    const response = await request(app)
      .get('/test')
      .set('Accept-Encoding', 'gzip');

    expect(response.headers['content-encoding']).toBe('gzip');
  });

  it('should not compress small responses below threshold', async () => {
    const app = express();
    app.use(compressionMiddleware);
    app.get('/test', (_req, res) => {
      res.json({ data: 'small' });
    });

    const response = await request(app)
      .get('/test')
      .set('Accept-Encoding', 'gzip');

    // Small responses below 1024 bytes should not be compressed
    expect(response.headers['content-encoding']).toBeUndefined();
  });

  it('should respect x-no-compression header', async () => {
    const app = express();
    app.use(compressionMiddleware);
    app.get('/test', (_req, res) => {
      res.json({ data: 'x'.repeat(2000) });
    });

    const response = await request(app)
      .get('/test')
      .set('Accept-Encoding', 'gzip')
      .set('x-no-compression', '1');

    expect(response.headers['content-encoding']).toBeUndefined();
  });
});
