import path from 'path';

// Import the Express app from the compiled dist folder
// This is necessary because the routes are set up at module load time
const app = require(path.join(process.cwd(), 'dist', 'index.js'));

/**
 * Get the Express app instance for testing
 * @returns {any} The Express app
 */
export function getApp(): any {
  return app;
}
