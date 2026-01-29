// forecasts.ts

import { Router } from 'express';
import { mockVisualCrossingForecast } from '../api/mock/mock_vc_service';
import { VisualCrossingApi } from '../api/weather/visual_crossing';
import {
  getForecastForAllRegions,
  getHourlyForecastForLocation,
  getForecastForLocation
} from '../api/weather/weather_service';
import { RegionHash, Region } from '../interfaces/geo/Region';
import { Location } from '../interfaces/geo/Location';
import { loadRegions } from '../utils/forecast/configParser';
import * as forecastCacheService from '../utils/cache/forecastCacheService';
import * as s3CacheService from '../services/s3CacheService';
import { HourlyForecastResponse } from '../interfaces/forecast/HourlyForecastResponse';
import { LocationForecastResponse } from '../interfaces/forecast/LocationForecastResponse';
import { ForecastResponse } from '../interfaces/forecast/ForecastResponse';
import { serializeWithoutNulls } from '../utils/response/jsonSerializer';
const router = Router();

const regionHash: RegionHash = loadRegions();

/**
 * Check if cached forecast data starts from today's date.
 * Visual Crossing returns forecasts starting from today, so cached data
 * with yesterday's dates should be treated as stale.
 */
function isForecastCurrent(forecast: ForecastResponse): boolean {
  if (!forecast.dates || forecast.dates.length === 0) {
    return false;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const firstDate = forecast.dates[0];

  if (firstDate !== today) {
    console.log(
      `Cached forecast is stale: first date is ${firstDate}, expected ${today}`
    );
    return false;
  }

  return true;
}

// FIXME: add tests for these endpoints!

router.get('/mock', async function (req, res) {
  try {
    const cacheKey = 'forecasts-mock';

    // Try S3 cache first (persistent, survives Lambda restarts)
    let result = await s3CacheService.getCachedData<ForecastResponse>(cacheKey);

    // Treat cache as miss if dates are stale (don't start from today)
    if (!result || !isForecastCurrent(result)) {
      // S3 cache miss or stale - fetch from API (uses in-memory cache per location)
      result = await getForecastForAllRegions(
        regionHash,
        mockVisualCrossingForecast,
        'mock'
      );

      // Store in S3 for next time
      const ttlHours = parseInt(process.env.CACHE_TTL_HOURS || '3');
      await s3CacheService.setCachedData(cacheKey, result, ttlHours);
    }

    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Type': 'application/json',
      Vary: 'Accept-Encoding'
    });
    res.status(200).send(serializeWithoutNulls({ data: result }));
  } catch (err) {
    console.error('Error in /forecasts/mock:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

router.get('/real', async function (req, res) {
  try {
    const cacheKey = 'forecasts-real';

    // Try S3 cache first (persistent, survives Lambda restarts)
    let result = await s3CacheService.getCachedData<ForecastResponse>(cacheKey);

    // Treat cache as miss if dates are stale (don't start from today)
    if (!result || !isForecastCurrent(result)) {
      // S3 cache miss or stale - fetch from API (uses in-memory cache per location)
      result = await getForecastForAllRegions(
        regionHash,
        VisualCrossingApi.getForecast,
        'real'
      );

      // Store in S3 for next time
      const ttlHours = parseInt(process.env.CACHE_TTL_HOURS || '3');
      await s3CacheService.setCachedData(cacheKey, result, ttlHours);
    }

    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Type': 'application/json',
      Vary: 'Accept-Encoding'
    });
    res.status(200).send(serializeWithoutNulls({ data: result }));
  } catch (err) {
    console.error('Error in /forecasts/real:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

// Cache invalidation endpoint (POST)
router.post('/clear', function (req, res) {
  try {
    const endpoint = req.body?.endpoint as string | undefined;
    let keysCleared: number;
    let message: string;

    if (endpoint) {
      keysCleared = forecastCacheService.clearByEndpoint(endpoint);
      message = `In-memory cache cleared for endpoint: ${endpoint}. Note: S3 cache entries will expire based on TTL.`;
    } else {
      const stats = forecastCacheService.clearAll();
      keysCleared = stats.keys;
      message =
        'All in-memory caches cleared. Note: S3 cache entries will expire based on TTL.';
    }

    res.status(200).json({
      success: true,
      message,
      stats: {
        keysCleared,
        endpoint: endpoint || 'all',
        timestamp: new Date().toISOString()
      },
      note: 'S3 cache is not cleared by this endpoint. Cache entries will auto-expire based on TTL.'
    });
  } catch (err) {
    console.error('POST /clear error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

// FIXME: duplicate code with /geo/locations.ts?
// Helper function to find location by name
function findLocationByName(
  regionHash: RegionHash,
  locationName: string
): Location | null {
  for (const regionKey in regionHash) {
    // eslint-disable-next-line security/detect-object-injection
    const region = regionHash[regionKey];
    const location = region.locations.find((loc) => loc.name === locationName);
    if (location) return location;
  }
  return null;
}

// FIXME: move to utils/dateUtils.ts?
// Helper function to validate ISO date format
function isValidISODate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Helper to get all location names for error messages
function getAllLocationNames(regionHash: RegionHash): string[] {
  const names: string[] = [];
  for (const regionKey in regionHash) {
    // eslint-disable-next-line security/detect-object-injection
    const region = regionHash[regionKey];
    region.locations.forEach((loc) => names.push(loc.name));
  }
  return names.sort();
}

// GET /hourly/mock - Hourly forecast for a single location (mock data)
router.get('/hourly/mock', async function (req, res) {
  try {
    // Validate required location parameter
    const locationName = req.query.location as string;
    if (!locationName) {
      return res.status(400).json({
        error: 'Missing required parameter: location',
        message: 'Please provide a location name (e.g., ?location=san_juan)',
        example: '/forecasts/hourly/mock?location=san_juan'
      });
    }

    // Find location in config
    const location = findLocationByName(regionHash, locationName);
    if (!location) {
      return res.status(404).json({
        error: 'Location not found',
        message: `Location '${locationName}' does not exist in configuration`,
        availableLocations: getAllLocationNames(regionHash)
      });
    }

    // Validate optional date parameters
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (startDate && !isValidISODate(startDate)) {
      return res.status(400).json({
        error: 'Invalid startDate format',
        message: 'Date must be in ISO format (YYYY-MM-DD)',
        example: '?startDate=2026-01-11'
      });
    }

    if (endDate && !isValidISODate(endDate)) {
      return res.status(400).json({
        error: 'Invalid endDate format',
        message: 'Date must be in ISO format (YYYY-MM-DD)',
        example: '?endDate=2026-01-13'
      });
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before or equal to endDate'
      });
    }

    // FIXME: generate mock data dynamically based on date range
    // Fetch hourly forecast from daily cache
    const result: HourlyForecastResponse = await getHourlyForecastForLocation(
      location,
      mockVisualCrossingForecast,
      'mock',
      { startDate, endDate }
    );

    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Type': 'application/json',
      Vary: 'Accept-Encoding'
    });

    res.status(200).send(serializeWithoutNulls({ data: result }));
  } catch (err) {
    console.error('Error in /forecasts/hourly/mock:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

// GET /hourly/real - Hourly forecast for a single location (real API)
router.get('/hourly/real', async function (req, res) {
  // FIXME: refactor duplicate code with /hourly/mock
  try {
    const locationName = req.query.location as string;
    if (!locationName) {
      return res.status(400).json({
        error: 'Missing required parameter: location',
        message: 'Please provide a location name (e.g., ?location=san_juan)',
        example: '/forecasts/hourly/real?location=san_juan'
      });
    }

    const location = findLocationByName(regionHash, locationName);
    if (!location) {
      return res.status(404).json({
        error: 'Location not found',
        message: `Location '${locationName}' does not exist in configuration`,
        availableLocations: getAllLocationNames(regionHash)
      });
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (startDate && !isValidISODate(startDate)) {
      return res.status(400).json({
        error: 'Invalid startDate format',
        message: 'Date must be in ISO format (YYYY-MM-DD)',
        example: '?startDate=2026-01-11'
      });
    }

    if (endDate && !isValidISODate(endDate)) {
      return res.status(400).json({
        error: 'Invalid endDate format',
        message: 'Date must be in ISO format (YYYY-MM-DD)',
        example: '?endDate=2026-01-13'
      });
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'startDate must be before or equal to endDate'
      });
    }

    const result: HourlyForecastResponse = await getHourlyForecastForLocation(
      location,
      VisualCrossingApi.getForecast,
      'real',
      { startDate, endDate }
    );

    // FIXME: make this cache duration configurable and set it to 1 hour for hourly forecasts
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Type': 'application/json',
      Vary: 'Accept-Encoding'
    });

    res.status(200).send(serializeWithoutNulls({ data: result }));
  } catch (err) {
    console.error('Error in /forecasts/hourly/real:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

// GET /location/:locationName/mock - Get mock forecast for a single location
router.get('/location/:locationName/mock', async function (req, res) {
  try {
    const locationName = req.params.locationName;

    // Find location in config
    const location = findLocationByName(regionHash, locationName);
    if (!location) {
      return res.status(404).json({
        error: 'Location not found',
        message: `Location '${locationName}' does not exist in configuration`,
        availableLocations: getAllLocationNames(regionHash)
      });
    }

    // Find region for this location
    let region: Region | null = null;
    for (const regionKey in regionHash) {
      // eslint-disable-next-line security/detect-object-injection
      const r = regionHash[regionKey];
      if (r.locations.some((loc) => loc.name === locationName)) {
        region = r;
        break;
      }
    }

    if (!region) {
      return res.status(500).json({
        error: 'Internal server error',
        message: `Could not find region for location: ${locationName}`
      });
    }

    // Fetch forecast (from cache or API)
    const result: LocationForecastResponse = await getForecastForLocation(
      location,
      region,
      mockVisualCrossingForecast,
      'mock'
    );

    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Type': 'application/json',
      Vary: 'Accept-Encoding'
    });

    res.status(200).send(serializeWithoutNulls({ data: result }));
  } catch (err) {
    console.error('Error in /forecasts/location/:locationName/mock:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

// GET /location/:locationName/real - Get real forecast for a single location
router.get('/location/:locationName/real', async function (req, res) {
  try {
    const locationName = req.params.locationName;

    // Find location in config
    const location = findLocationByName(regionHash, locationName);
    if (!location) {
      return res.status(404).json({
        error: 'Location not found',
        message: `Location '${locationName}' does not exist in configuration`,
        availableLocations: getAllLocationNames(regionHash)
      });
    }

    // Find region for this location
    let region: Region | null = null;
    for (const regionKey in regionHash) {
      // eslint-disable-next-line security/detect-object-injection
      const r = regionHash[regionKey];
      if (r.locations.some((loc) => loc.name === locationName)) {
        region = r;
        break;
      }
    }

    if (!region) {
      return res.status(500).json({
        error: 'Internal server error',
        message: `Could not find region for location: ${locationName}`
      });
    }

    // Fetch forecast (from cache or API)
    const result: LocationForecastResponse = await getForecastForLocation(
      location,
      region,
      VisualCrossingApi.getForecast,
      'real'
    );

    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Type': 'application/json',
      Vary: 'Accept-Encoding'
    });

    res.status(200).send(serializeWithoutNulls({ data: result }));
  } catch (err) {
    console.error('Error in /forecasts/location/:locationName/real:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
