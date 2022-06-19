import { Router } from 'express';
import { mockVisualCrossingForecast } from '../api/mock_service';
import { VisualCrossingApi } from '../api/visual_crossing';
import mockWeatherForecastNormalized from '../api/mock_service_data/forecasts';
import { RegionHash, loadRegions } from '../utils/configParser';
import { getForecastForAllRegions } from '../api/weather_service';
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

router.get('/real', function(req, res, next) {
  const regionHash:RegionHash = loadRegions();

  getForecastForAllRegions(regionHash, VisualCrossingApi.getForecast)
    .then(result => res.status(200).json({ data: result }))
    .catch(err => res.status(500).json(err));

});

export default router;