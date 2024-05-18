import { Router } from 'express';
import { getLocationsForRegions } from '../api/geo/geo_service';

const router = Router();

router.get('/', function (_req, res, _next) {
  res.send(getLocationsForRegions())
});

export default router;
