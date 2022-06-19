import 'jest';
import { RegionHash } from '../../interfaces/geo/Region';
import {loadRegions} from './configParser';


describe(('loadRegions'), () => {
    let regionHash: RegionHash;

    beforeAll(() => {
        regionHash = loadRegions();
    })

    it('should parse regions correctly', () => {
        expect(regionHash).toBeDefined();
        expect(Object.keys(regionHash).length).toEqual(9);
        
        const cities = regionHash['cities'];
        expect(cities.description).toBeDefined();
        expect(cities.name).toBeDefined();
        expect(cities.search_key).toBeUndefined();
        
        const locations = cities.locations;
        expect(locations.length).toBe(2);
    });

});