import { Location } from './Location';

export type RegionHash = {[key: string]: Region};

export interface Region {
  name: string;
  description: string;
  search_key?: string;
  locations: Location[];
}
