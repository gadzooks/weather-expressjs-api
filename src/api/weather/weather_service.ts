import Forecast from '../../interfaces/forecast/Forecast';
import {
  ForecastResponse,
  LocationsById,
  RegionsById,
  ForecastsById
} from '../../interfaces/forecast/ForecastResponse';
import { Region, RegionHash } from '../../interfaces/geo/Region';
import { Location } from '../../interfaces/geo/Location';

export async function getForecastForAllRegions(
  regionHash: RegionHash,
  callback: (location: Location) => Promise<Forecast | null>
): Promise<ForecastResponse> {
  const locationsById: LocationsById = {
    byId: {},
    allIds: new Array()
  };

  const regionsById: RegionsById = {
    byId: {},
    allIds: new Array()
  };

  const forecastsById: ForecastsById = {
    byId: {}
  };

  let fcstResponse: ForecastResponse = {
    dates: new Array(),
    locations: locationsById,
    regions: regionsById,
    forecasts: forecastsById
  };

  for (const regionKey in regionHash) {
    const region = regionHash[regionKey];
    const locations = region.locations;
    let count = 0;
    for (const i in locations) {
      count++;
      const location = locations[i];
      try {
        const response = await callback(location);
        if (response !== null) {
          if (response !== null) {
            insertIntoRegionsById(fcstResponse, region.name, region);
            insertIntoLocationsById(fcstResponse, location.name, location);
            insertIntoForecastsById(fcstResponse, location, response);
            insertIntoDays(fcstResponse, response);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    // break;
    if (count == 5) break;
  }

  return fcstResponse;
}

function insertIntoRegionsById(
  fcstResponse: ForecastResponse,
  regionKey: string,
  region: Region
) {
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

function insertIntoLocationsById(
  fcstResponse: ForecastResponse,
  locationKey: string,
  location: Location
) {
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

function insertIntoForecastsById(
  fcstResponse: ForecastResponse,
  location: Location,
  response: Forecast
) {
  fcstResponse.forecasts.byId[location.name] = response.days;
}

function insertIntoDays(fcstResponse: ForecastResponse, response: Forecast) {
  if (fcstResponse.dates.length === 0) {
    fcstResponse.dates = response.days.map((dailyForecast) => {
      return dailyForecast.datetime;
    });
  }
}
