import { CorsOptions } from 'cors';

/**
 * Parse comma-separated ALLOWED_ORIGINS environment variable into array
 * Example: "http://localhost:3000,http://localhost:5173"
 */
export function parseAllowedOrigins(): string[] {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';

  if (!allowedOriginsEnv) {
    console.warn('ALLOWED_ORIGINS not set - CORS will reject all origins');
    return [];
  }

  return allowedOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Create CORS options with origin whitelist
 * Implements dynamic origin checking for security
 */
export function getCorsOptions(): CorsOptions {
  const allowedOrigins = parseAllowedOrigins();

  console.log(
    `CORS configured with allowed origins: ${allowedOrigins.join(', ')}`
  );

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject with descriptive error
      const errorMessage = `Origin ${origin} not allowed by CORS policy. Allowed origins: ${allowedOrigins.join(', ')}`;
      console.warn(errorMessage);
      return callback(new Error(errorMessage), false);
    },
    credentials: true, // Allow cookies and authentication headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Amz-Date',
      'X-Api-Key',
      'X-Amz-Security-Token',
    ],
    exposedHeaders: ['Cache-Control', 'Vary'], // Headers the client can access
    maxAge: 86400, // Preflight cache for 24 hours (reduces OPTIONS requests)
  };
}

// Export for use in index.ts
export const corsOptions = getCorsOptions();
