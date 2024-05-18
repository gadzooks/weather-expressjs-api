// crud service to return regions / locations

import { RegionHash } from '../../interfaces/geo/Region';
import { loadRegions } from '../../utils/forecast/configParser';

export function getLocationsForRegions(
): RegionHash {
  const regionHash: RegionHash = loadRegions();
  return regionHash

}