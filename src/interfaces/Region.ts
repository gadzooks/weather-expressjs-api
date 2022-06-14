import { Location } from './Location';

export interface Region {
  name: string;
  description: string;
  search_key?: string;
  locations: Location[];
}
