// forecasts.ts

import { Router } from 'express';
import { mockVisualCrossingForecast } from '../api/mock/mock_vc_service';
import { VisualCrossingApi } from '../api/weather/visual_crossing';
import {
  getForecastForAllRegions,
  getHourlyForecastForLocation
} from '../api/weather/weather_service';
import { RegionHash } from '../interfaces/geo/Region';
import { Location } from '../interfaces/geo/Location';
import { loadRegions } from '../utils/forecast/configParser';
import * as forecastCacheService from '../utils/cache/forecastCacheService';
import { HourlyForecastResponse } from '../interfaces/forecast/HourlyForecastResponse';
const router = Router();

const regionHash: RegionHash = loadRegions();

// FIXME: add tests for these endpoints!

router.get('/mock', function (req, res) {
  getForecastForAllRegions(regionHash, mockVisualCrossingForecast, 'mock')
    .then((result) => {
      res.set({
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        Vary: 'Accept-Encoding'
      });
      res.status(200).json({ data: result });
    })
    .catch((err) => res.status(500).json(err));
});

router.get('/real', function (req, res) {
  getForecastForAllRegions(regionHash, VisualCrossingApi.getForecast, 'real')
    .then((result) => {
      res.set({
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        Vary: 'Accept-Encoding'
      });
      res.status(200).json({ data: result });
    })
    .catch((err) => res.status(500).json(err));
});

// Cache invalidation endpoint (POST)
router.post('/clear', function (req, res) {
  try {
    const endpoint = req.body?.endpoint as string | undefined;
    let keysCleared: number;
    let message: string;

    if (endpoint) {
      keysCleared = forecastCacheService.clearByEndpoint(endpoint);
      message = `Cache cleared successfully for endpoint: ${endpoint}`;
    } else {
      const stats = forecastCacheService.clearAll();
      keysCleared = stats.keys;
      message = 'All caches cleared successfully';
    }

    res.status(200).json({
      success: true,
      message,
      stats: {
        keysCleared,
        endpoint: endpoint || 'all',
        timestamp: new Date().toISOString()
      }
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
    // Fetch hourly forecast
    const result: HourlyForecastResponse = await getHourlyForecastForLocation(
      location,
      mockVisualCrossingForecast,
      'hourly-mock',
      { startDate, endDate }
    );

    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      Vary: 'Accept-Encoding'
    });

    res.status(200).json({ data: result });
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
      VisualCrossingApi.getHourlyForecast,
      'hourly-real',
      { startDate, endDate }
    );

    // FIXME: make this cache duration configurable and set it to 1 hour for hourly forecasts
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      Vary: 'Accept-Encoding'
    });

    res.status(200).json({ data: result });
  } catch (err) {
    console.error('Error in /forecasts/hourly/real:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
