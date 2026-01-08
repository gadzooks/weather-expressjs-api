import Forecast from '../../interfaces/forecast/Forecast';
import {
  ForecastResponse,
  LocationsById,
  RegionsById,
  ForecastsById,
  AlertsById
} from '../../interfaces/forecast/ForecastResponse';
import { Region, RegionHash } from '../../interfaces/geo/Region';
import { Location } from '../../interfaces/geo/Location';
import Alert from '../../interfaces/forecast/Alert';
import * as forecastCacheService from '../../utils/cache/forecastCacheService';

export async function getForecastForAllRegions(
  regionHash: RegionHash,
  callback: (location: Location) => Promise<Forecast | null>,
  endpoint: string = 'default'
): Promise<ForecastResponse> {
  const fcstResponse = initializeForecastResponse();

  let cacheHits = 0;
  let cacheMisses = 0;
  let totalLocations = 0;

  for (const regionKey in regionHash) {
    const region = regionHash[regionKey];
    const locations = region.locations;
    for (const i in locations) {
      totalLocations++;
      const location = locations[i];
      try {
        // Check cache first
        const cached = forecastCacheService.get(location, endpoint);
        let response: Forecast | null;

        if (cached) {
          response = cached;
          cacheHits++;
        } else {
          // Cache miss - call API
          response = await callback(location);
          cacheMisses++;

          // Store in cache if successful
          if (response) {
            forecastCacheService.set(location, response, endpoint);
          }
        }

        parseResponse(response, fcstResponse, region, location);
      } catch (error) {
        console.error(error);
      }
    }
    // break;
    // if (count == 2) break;
  }

  // Log cache statistics
  const hitRate =
    totalLocations > 0
      ? Math.round((cacheHits / totalLocations) * 10000) / 100
      : 0;
  console.log(
    `Cache stats: ${cacheHits} hits, ${cacheMisses} misses (${hitRate}% hit rate)`
  );

  return fcstResponse;
}

export function initializeForecastResponse() {
  const locationsById: LocationsById = {
    byId: {},
    allIds: []
  };

  const regionsById: RegionsById = {
    byId: {},
    allIds: []
  };

  const forecastsById: ForecastsById = {
    byId: {}
  };

  const alertsById: AlertsById = {};
  const allAlertIds: string[] = [];

  const fcstResponse: ForecastResponse = {
    dates: [],
    locations: locationsById,
    regions: regionsById,
    forecasts: forecastsById,
    alertsById: alertsById,
    allAlertIds: allAlertIds
  };

  return fcstResponse;
}

export function parseResponse(
  response: Forecast | null,
  fcstResponse: ForecastResponse,
  region: Region,
  location: Location
) {
  if (response !== null) {
    insertIntoRegionsById(fcstResponse, region.name, region);
    insertIntoLocationsById(fcstResponse, location.name, location);
    insertIntoForecastsById(fcstResponse, location, response);
    insertIntoDays(fcstResponse, response);
    insertIntoAlerts(fcstResponse, location, response);
  }
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

function insertIntoAlerts(
  fcstResponse: ForecastResponse,
  location: Location,
  response: Forecast
) {
  const alerts: Alert[] = response.alerts;

  if (alerts && alerts.length > 0) {
    const alertsById: AlertsById = fcstResponse.alertsById || {};
    fcstResponse.alertsById = alertsById;

    const uniqueIds = new Set<string>();

    alerts.map((weatherAlert) => {
      alertsById[weatherAlert.id] = weatherAlert;
      uniqueIds.add(weatherAlert.id);
    });

    location.alertIds = Array.from(uniqueIds);

    fcstResponse.allAlertIds.forEach((id) => uniqueIds.add(id));
    fcstResponse.allAlertIds = Array.from(uniqueIds);
  }
}
