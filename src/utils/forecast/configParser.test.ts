import 'jest';
import { RegionHash } from '../../interfaces/geo/Region';
import { loadRegions } from './configParser';

describe('loadRegions', () => {
  let regionHash: RegionHash;

  beforeAll(() => {
    regionHash = loadRegions();
  });

  it('should parse cities correctly', () => {
    expect(regionHash).toBeDefined();
    expect(Object.keys(regionHash).length).toEqual(9);

    const cities = regionHash['cities'];
    expect(cities.description).toBeDefined();
    expect(cities.name).toBeDefined();
    expect(cities.search_key).toBeUndefined();

    const locations = cities.locations;
    expect(locations.length).toBe(2);
  });

  it('should parse regions correctly', () => {
    expect(regionHash).toBeDefined();
    expect(Object.keys(regionHash).length).toEqual(9);

    const cities = regionHash['central_cascades'];
    expect(cities.description).toBeDefined();
    expect(cities.name).toEqual('central_cascades');
    expect(cities.search_key).toEqual('b4845d8a21ad6a202944425c86b6e85f');

    const locations = cities.locations;
    expect(locations.length).toBe(4);
  });
});
