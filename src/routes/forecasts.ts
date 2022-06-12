import { Router } from 'express';
import { mockVisualCrossingForecast } from '../api/mock_service';
import { getForecastForAllRegions } from '../api/visual_crossing';
import mockWeatherForecastNormalized from '../mock_service/forecasts';
import { RegionHash, loadRegions } from '../utils/configParser';
var router = Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(mockWeatherForecastNormalized());
});

router.get('/mock', function(req, res, next) {
  const regionHash:RegionHash = loadRegions();

  const results = getForecastForAllRegions(regionHash);
  res.json({data: results});
});

export default router;