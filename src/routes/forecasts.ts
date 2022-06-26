import { Router } from 'express';
import { mockVisualCrossingForecast } from '../api/mock/mock_vc_service';
import { VisualCrossingApi } from '../api/weather/visual_crossing';
import { getForecastForAllRegions } from '../api/weather/weather_service';
import { RegionHash } from '../interfaces/geo/Region';
import { loadRegions } from '../utils/forecast/configParser';
const router = Router();

const regionHash: RegionHash = loadRegions();

router.get('/mock', function (req, res, next) {
  getForecastForAllRegions(regionHash, mockVisualCrossingForecast)
    .then((result) => res.status(200).json({ data: result }))
    .catch((err) => res.status(500).json(err));
});

router.get('/real', function (req, res, next) {
  getForecastForAllRegions(regionHash, VisualCrossingApi.getForecast)
    .then((result) => res.status(200).json({ data: result }))
    .catch((err) => res.status(500).json(err));
});

export default router;
