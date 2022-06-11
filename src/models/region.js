import { load } from 'js-yaml';
import { readFileSync } from 'fs';

function parseYaml(fileName) {
  // Get document, or throw exception on error
  try {
    const doc = load(readFileSync(fileName, 'utf8'));
    console.log(doc);
    return [null, doc];
  } catch (e) {
    console.log(e);
    return [e, null];
  }
}

const fileName = '../data/regional_lat_long.yml';

function loadRegionalConfiguration() {
  err, parsedRegions = parseYaml(fileName);
  if(err) {
    return null;
  }

  regions = parsedRegions.map((region) => {
    
  })


}