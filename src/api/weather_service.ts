import Forecast from "../interfaces/Forecast";
import { RegionHash } from "../utils/configParser";
import { ForecastResponse, ForecastsById, LocationsById, RegionsById } from "../interfaces/ForecastResponse";
import { Region } from "../interfaces/Region";
import { Location } from "../interfaces/Location";

export async function getForecastForAllRegions(regionHash: RegionHash, callback: (location: Location) => Promise<Forecast | null>): Promise<ForecastResponse> {
  const locationsById: LocationsById = {
    byId: {},
    allIds: new Array(),
  }

  const regionsById: RegionsById = {
    byId: {},
    allIds: new Array(),
  }

  const forecastsById: ForecastsById = {
    byId: {},
  }

  let fcstResponse: ForecastResponse = {
    dates: new Array(),
    locations: locationsById,
    regions: regionsById,
    forecasts: forecastsById,
  };

  for (const regionKey in regionHash) {
    const region = regionHash[regionKey];
    const locations = region.locations;
    console.log(`locations : ${locations}`);
    for(const i in locations ) {
      const location = locations[i];
      try {
        const response = await callback(location);
        if (response !== null) {
          // locations.map(async (location) => {
          console.log('111111111111');
          console.log('2222222222');
          console.log(response?.description);
          if (response !== null) {
            console.log('aaaaaaaaaa');
            console.log(location.name);
            console.log(response?.description);
            insertIntoRegionsById(fcstResponse, region.name, region);
            insertIntoLocationsById(fcstResponse, location.name, location);
            insertIntoForecastsById(fcstResponse, location, response);
            insertIntoDays(fcstResponse, response);
            console.log('44444444444444');
            console.log(fcstResponse);
            // return fcstResponse;
          }
        }
      } catch(error) {
        console.error(error);
      }
    }
    // break;
  }

  // Promise.all(promises);
  console.log('000000000000000000000000000');
  console.log(fcstResponse);
  return fcstResponse;
};

function insertIntoRegionsById(fcstResponse: ForecastResponse, regionKey: string, region: Region) {
  let regionObject: Region = fcstResponse.regions.byId[regionKey];
  if (!regionObject) {
    regionObject = { ...region };
  }
  fcstResponse.regions.byId[regionKey] = regionObject;

  const allIds: string[] = fcstResponse.regions.allIds;
  if (!allIds.includes(regionKey)) {
    allIds.push(regionKey);
  }
}

function insertIntoLocationsById(fcstResponse: ForecastResponse, locationKey: string, location: Location) {
  let locationObject: Location = fcstResponse.locations.byId[locationKey];
  if (!locationObject) {
    locationObject = { ...location };
  }
  fcstResponse.locations.byId[locationKey] = locationObject;

  const allIds: string[] = fcstResponse.locations.allIds;
  if (!allIds.includes(locationKey)) {
    allIds.push(locationKey);
  }
}

function insertIntoForecastsById(fcstResponse: ForecastResponse, location: Location, response: Forecast) {
  fcstResponse.forecasts.byId[location.name] = response.days;
  console.log(response.days[0]);
}

function insertIntoDays(fcstResponse: ForecastResponse, response: Forecast) {
  if (fcstResponse.dates.length === 0) {
    fcstResponse.dates = response.days.map((dailyForecast) => {
      return dailyForecast.datetime;
    })
  }
}

