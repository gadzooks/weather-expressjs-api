import path from 'path';
import { createRequire } from 'module';
import { Express } from 'express';

// Import the Express app from the compiled dist folder
// This is necessary because the routes are set up at module load time
const require = createRequire(import.meta.url);
// eslint-disable-next-line security/detect-non-literal-require
const app: Express = require(path.join(process.cwd(), 'dist', 'index.js'));

/**
 * Get the Express app instance for testing
 * @returns The Express app
 */
export function getApp(): Express {
  return app;
}
