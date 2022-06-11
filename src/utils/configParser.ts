import { load } from 'js-yaml';
import fs from 'fs';
import path from "path";

import { readFileSync } from 'fs';
import { Location } from '../models/Location';
import { Region } from '../models/Region';

type RegionHash = {[key: string]: Region};

const configDir = 'config';
const locationFileName = 'locations.yml';
const regionFileName = 'regions.yml';

function parseYaml(fileName :string) :any {
  // Get document, or throw exception on error
    const doc = load(fs.readFileSync(path.resolve(__dirname, `../${configDir}/` + fileName), 'utf8'));
    // console.log(doc);
    return doc;
}

// regions: {
//   byId: {
//     central_cascades: {
//       id: "central_cascades",
//       description: "Central Cascades",
//       regionId: "central_cascades",
//       locations: ["renton", "yakima"],
//     },
//     western_wa: {
//       id: "western_wa",
//       description: "Western WA",
//       regionId: "western_wa",
//       locations: ["seattle", "bellevue"],
//     },
//   },
//   allIds: ["central_cascades", "western_wa"],
// },
// locations: {
//   byId: {
//     renton: {
//       id: "renton",
//       description: "Renton",
//       regionId: "central_cascades",
//     },

// forecasts: {
//   byId: {
//     renton: [
//       {
//         time: "2021-04-17T07:00:00.000+00:00",
//         summary: "Clear conditions throughout the day.",
//         icon: "day-hail",
//         precipProbability: 0.0,
//         temperature: 60.9,
//         precipAmount: 0.0,
//       },
//       {
//         time: "2021-04-18T07:00:00.000+00:00",
//         summary: "Clear conditions throughout the day.",
//         icon: "day-sunny",

function loadRegions() :RegionHash {
  const regions: Region[] = [];
  const regionsHash: RegionHash = {};
  const config = parseYaml(regionFileName);
  console.log('loading regional ');
  for(const property in config) {
    const regionObject = config[property];
    // console.log(`${property} : ${config[property]}`)
    const region: Region = {
      name: property,
      search_key: regionObject.search_key,
      description: regionObject.description,
      locations: new Array(),
    }
    regions.push(region);
    regionsHash[property] = region;
  }

  loadRegionalConfiguration(locationFileName, regionsHash)

  console.log('---------------');
  console.log(regions[0]);
  console.log('---------------');

  return regionsHash;
};

function loadRegionalConfiguration(f :string, regionsHash :RegionHash) :RegionHash {
  const config = parseYaml(f);
  let flag = true;
  console.log('load locations ');
  for(const property in config) {
    // console.log(`${property} : ${config[property]}`)
    const locationObject = config[property];

    const region: Region = regionsHash[locationObject.region];
    // console.log(`region selected is : ${locationObject.region}` );

    const location: Location = {
      name: property,
      description: locationObject.description,
      latitude: locationObject.latitude,
      longitude: locationObject.longitude,
      region: region.name,
    }

    if(flag) {
      flag = false;
      console.log('---------------');
      console.log(location);
      console.log('---------------');
    }

    region.locations.push(location);
  }

  return regionsHash;
};

// module.exports = loadRegionalConfiguration;
export default loadRegions;