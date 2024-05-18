import { Router } from 'express';
import { getLocationsForRegions } from '../api/geo/geo_service';

const router = Router();

router.get('/', function (_req, res, _next) {
  res.send(getLocationsForRegions(null))
});

router.get('/:regionId', function (req, res, _next) {
  const regionId = req.params['regionId']
  res.send(getLocationsForRegions(regionId))
});


export default router;
