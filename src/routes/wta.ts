// WTA Trip Reports Route

import { Router } from 'express';
import { getTripReports, clearWtaCache } from '../api/wta/wta_service';
import { WtaQueryParams } from '../interfaces/wta/TripReport';

const router = Router();

// GET /api/wta/reports?region=xxx&subregion=yyy&page=1
router.get('/reports', async function (req, res) {
  try {
    const { region, subregion, page } = req.query;

    if (!region || typeof region !== 'string') {
      res.status(400).json({
        error: 'Missing required parameter: region'
      });
      return;
    }

    const params: WtaQueryParams = {
      region,
      subregion: typeof subregion === 'string' ? subregion : undefined,
      page: page ? parseInt(String(page), 10) : 1
    };

    const result = await getTripReports(params);

    res.set({
      'Cache-Control': 'public, max-age=1800, s-maxage=1800', // 30 minutes
      Vary: 'Accept-Encoding'
    });

    res.status(200).json({ data: result });
  } catch (err) {
    console.error('WTA reports error:', err);
    res.status(500).json({
      error: 'Failed to fetch trip reports',
      message: err instanceof Error ? err.message : String(err)
    });
  }
});

// GET /api/wta/clear - Clear WTA cache
router.get('/clear', function (req, res) {
  try {
    const keysCleared = clearWtaCache();
    res.status(200).json({
      success: true,
      message: 'WTA cache cleared',
      keysCleared
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear WTA cache',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
