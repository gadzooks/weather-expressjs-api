// crud service to return regions / locations

import { RegionHash } from '../../interfaces/geo/Region';
import { loadRegions } from '../../utils/forecast/configParser';

export function getLocationsForRegions(regionId: string | null): RegionHash {
  console.log(`getting locations for ${regionId}`);
  const allRegions: RegionHash = loadRegions();

  if (regionId === null) return allRegions;

  const regionsHash: RegionHash = {};
  // eslint-disable-next-line security/detect-object-injection
  regionsHash[regionId] = allRegions[regionId];

  return regionsHash;
}
