import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter - applies to all routes
 * Prevents excessive requests from any single IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting in test environment
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Forecast-specific rate limiter - stricter limits for API endpoints
 * Protects against excessive calls to weather API
 */
export const forecastRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 requests per hour
  message: {
    error: 'Too many forecast requests from this IP, please try again later',
    retryAfter: '1 hour',
    tip: 'Forecast data is cached for 3 hours - repeated requests are unnecessary'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  // Custom handler to log when rate limit is exceeded
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many forecast requests from this IP, please try again later',
      retryAfter: '1 hour',
      tip: 'Forecast data is cached for 3 hours - repeated requests are unnecessary'
    });
  }
});

/**
 * Gets rate limiter configuration for testing/debugging
 */
export function getRateLimiterConfig() {
  return {
    global: {
      windowMs: 15 * 60 * 1000,
      max: 1000
    },
    forecast: {
      windowMs: 60 * 60 * 1000,
      max: 100
    }
  };
}
