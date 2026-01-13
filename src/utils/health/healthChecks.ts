// healthChecks.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
// healthChecks.ts

import axios from 'axios';
import { getStats } from '../cache/cacheManager';

export interface HealthCheckResult {
  status: 'UP' | 'DOWN';
  details?: any;
}

/**
 * Check Visual Crossing API availability
 * Uses a lightweight test location (Seattle coordinates)
 */
export async function checkVisualCrossingApi(): Promise<HealthCheckResult> {
  const VC_API_KEY = process.env.VC_API_KEY || 'USE_VC_API_KEY';

  if (VC_API_KEY === 'USE_VC_API_KEY' || !VC_API_KEY) {
    return {
      status: 'DOWN',
      details: {
        error: 'VC_API_KEY not configured'
      }
    };
  }

  try {
    // Test with a simple forecast request (Seattle coordinates)
    // Use includeCurrentConditions=true for a lighter response
    // eslint-disable-next-line no-secrets/no-secrets
    const testUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/47.6062,-122.3321?key=${VC_API_KEY}&include=current`;

    const response = await axios.get(testUrl, {
      timeout: 3000, // 3 second timeout for health check
      validateStatus: (status) => status === 200
    });

    return {
      status: 'UP',
      details: {
        responseTime: response.headers['x-response-time'] || 'N/A',
        location: response.data?.resolvedAddress || 'Seattle, WA'
      }
    };
  } catch (error: any) {
    return {
      status: 'DOWN',
      details: {
        error: error.message,
        code: error.code || error.response?.status
      }
    };
  }
}

/**
 * Check cache health and statistics
 */
export function checkCacheHealth(): HealthCheckResult {
  try {
    const stats = getStats();

    return {
      status: 'UP',
      details: {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: `${stats.hitRate}%`,
        ttlHours: process.env.CACHE_TTL_HOURS || '3'
      }
    };
  } catch (error: any) {
    return {
      status: 'DOWN',
      details: {
        error: error.message
      }
    };
  }
}

/**
 * Aggregated health check for all dependencies
 */
export async function checkAllDependencies(): Promise<{
  status: 'UP' | 'DOWN';
  checks: {
    visualCrossingApi: HealthCheckResult;
    cache: HealthCheckResult;
  };
}> {
  const [apiCheck, cacheCheck] = await Promise.all([
    checkVisualCrossingApi(),
    Promise.resolve(checkCacheHealth())
  ]);

  const allUp = apiCheck.status === 'UP' && cacheCheck.status === 'UP';

  return {
    status: allUp ? 'UP' : 'DOWN',
    checks: {
      visualCrossingApi: apiCheck,
      cache: cacheCheck
    }
  };
}
