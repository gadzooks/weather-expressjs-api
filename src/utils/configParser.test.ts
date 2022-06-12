import 'jest';
import {loadRegions, RegionHash} from './configParser';


describe(('loadRegions'), () => {
    let regionHash: RegionHash;

    beforeEach(() => {
        regionHash = loadRegions();
    })

    it('should parse regions correctly', () => {
        expect(regionHash).toBeDefined();
        

    });

});