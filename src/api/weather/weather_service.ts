// weather_service.ts

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
import { HourlyForecastResponse } from '../../interfaces/forecast/HourlyForecastResponse';
import DailyForecastWithHours from '../../interfaces/forecast/DailyForecastWithHours';
import { LocationForecastResponse } from '../../interfaces/forecast/LocationForecastResponse';
import { CachedForecast } from '../../interfaces/cache/CachedForecast';
import * as cacheManager from '../../utils/cache/cacheManager';
import { CACHE_TTL_MS } from '../../utils/cache/cacheManager';

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
    // eslint-disable-next-line security/detect-object-injection
    const region = regionHash[regionKey];
    const locations = region.locations;
    for (const i in locations) {
      totalLocations++;
      // eslint-disable-next-line security/detect-object-injection
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
  // eslint-disable-next-line security/detect-object-injection
  let regionObject: Region = fcstResponse.regions.byId[regionKey];
  if (!regionObject) {
    regionObject = { ...region };
  }
  // eslint-disable-next-line security/detect-object-injection
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
  // eslint-disable-next-line security/detect-object-injection
  let locationObject: Location = fcstResponse.locations.byId[locationKey];
  if (!locationObject) {
    locationObject = { ...location };
  }
  // eslint-disable-next-line security/detect-object-injection
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

// Hourly forecast functions
export async function getHourlyForecastForLocation(
  location: Location,
  callback: (location: Location) => Promise<Forecast | null>,
  endpoint: string = 'hourly',
  options?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<HourlyForecastResponse> {
  // Check cache first
  const cached = forecastCacheService.get(location, endpoint);

  let forecast: Forecast | null;

  if (cached) {
    console.log(
      `Cache hit for hourly from daily cache: ${location.name}, endpoint: ${endpoint}`
    );
    forecast = cached;
  } else {
    console.log(
      `Cache miss for hourly, fetching daily: ${location.name}, endpoint: ${endpoint}`
    );
    forecast = await callback(location);

    if (forecast) {
      // Store in daily cache
      forecastCacheService.set(location, forecast, endpoint);
    }
  }

  if (!forecast) {
    throw new Error(`Failed to fetch forecast for location: ${location.name}`);
  }

  return buildHourlyResponse(forecast, location, options);
}

function buildHourlyResponse(
  forecast: Forecast,
  location: Location,
  options?: { startDate?: string; endDate?: string }
): HourlyForecastResponse {
  let filteredDays = forecast.days as DailyForecastWithHours[];
  let requestedDates: string[] | undefined;

  // Apply date filtering if provided
  if (options?.startDate || options?.endDate) {
    filteredDays = filterByDateRange(
      filteredDays,
      options.startDate,
      options.endDate
    );
    requestedDates = filteredDays.map((d) => d.datetime);
  }

  // Count total hours
  const totalHours = filteredDays.reduce(
    (sum, day) => sum + (day.hours?.length || 0),
    0
  );

  return {
    location,
    days: filteredDays,
    alerts: forecast.alerts || [],
    totalHours,
    requestedDates
  };
}

function filterByDateRange(
  days: DailyForecastWithHours[],
  startDate?: string,
  endDate?: string
): DailyForecastWithHours[] {
  return days.filter((day) => {
    const date = day.datetime;
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}

// Get forecast for a single location
export async function getForecastForLocation(
  location: Location,
  region: Region,
  callback: (location: Location) => Promise<Forecast | null>,
  endpoint: string = 'real'
): Promise<LocationForecastResponse> {
  // Check cache first
  const cached = forecastCacheService.get(location, endpoint);

  let forecast: Forecast | null;
  let wasCached = false;
  let expiresAt: number | undefined;

  if (cached) {
    console.log(
      `Cache hit for location: ${location.name}, endpoint: ${endpoint}`
    );
    forecast = cached;
    wasCached = true;

    // Get expiration time from cache
    const cacheKey = forecastCacheService.getCacheKey(location, endpoint);
    const cachedData = cacheManager.get<CachedForecast>(cacheKey);
    if (cachedData) {
      expiresAt = cachedData.expiresAt;
    }
  } else {
    console.log(
      `Cache miss for location: ${location.name}, endpoint: ${endpoint}`
    );
    forecast = await callback(location);

    if (forecast) {
      forecastCacheService.set(location, forecast, endpoint);
      // Calculate expiration
      expiresAt = Date.now() + CACHE_TTL_MS;
    }
  }

  if (!forecast) {
    throw new Error(`Failed to fetch forecast for location: ${location.name}`);
  }

  return {
    location,
    forecast: forecast.days,
    alerts: forecast.alerts || [],
    region,
    metadata: {
      cached: wasCached,
      endpoint,
      expiresAt
    }
  };
}
