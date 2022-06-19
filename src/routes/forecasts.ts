import { Router } from 'express';
import { mockVisualCrossingForecast } from '../api/mock_service';
import { getForecastForAllRegions, VisualCrossingApi } from '../api/visual_crossing';
import mockWeatherForecastNormalized from '../api/mock_service_data/forecasts';
import { RegionHash, loadRegions } from '../utils/configParser';
var router = Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(mockWeatherForecastNormalized());
});

router.get('/mock', function(req, res, next) {
  const regionHash:RegionHash = loadRegions();

  getForecastForAllRegions(regionHash, mockVisualCrossingForecast)
    .then(result => res.status(200).json({data: result}))
    .catch(err => res.status(500).json(err));
});

// router.get('/real', function(req, res, next) {
//   const regionHash:RegionHash = loadRegions();

//   const results = getForecastForAllRegions(regionHash, VisualCrossingApi.getForecast);
//   res.json({data: results});
// });

export default router;