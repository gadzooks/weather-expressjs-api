import { Router } from 'express';
import { mockVisualCrossingForecast } from '../api/mock/mock_vc_service';
import { VisualCrossingApi } from '../api/weather/visual_crossing';
import { getForecastForAllRegions } from '../api/weather/weather_service';
import { RegionHash } from '../interfaces/geo/Region';
import { loadRegions } from '../utils/forecast/configParser';
import * as forecastCacheService from '../utils/cache/forecastCacheService';
const router = Router();

const regionHash: RegionHash = loadRegions();

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

// Cache invalidation endpoint (GET)
router.get('/clear', function (req, res) {
  try {
    const endpoint = req.query.endpoint as string | undefined;
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
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: err
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

export default router;
