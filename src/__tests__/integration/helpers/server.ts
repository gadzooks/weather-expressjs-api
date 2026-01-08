// server.ts

import path from 'path';
import { Express } from 'express';

// Import the Express app from the compiled dist folder
// This is necessary because the routes are set up at module load time
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, security/detect-non-literal-require
const app: Express = require(path.join(process.cwd(), 'dist', 'index.js'));

/**
 * Get the Express app instance for testing
 * @returns The Express app
 */
export function getApp(): Express {
  return app;
}
