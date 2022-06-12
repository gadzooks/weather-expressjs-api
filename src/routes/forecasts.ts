import { Router } from 'express';
import mockWeatherForecastNormalized from '../mock_service/forecasts';
var router = Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(mockWeatherForecastNormalized());
});

export default router;