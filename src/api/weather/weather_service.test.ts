// weather_service.test.ts

import {
  initializeForecastResponse,
  parseResponse,
  getHourlyForecastForLocation
} from './weather_service';
import { loadRegions } from '../../utils/forecast/configParser';
import { mockVisualCrossingForecast } from '../mock/mock_vc_service';
import { ForecastResponse } from '../../interfaces/forecast/ForecastResponse';
import { Location } from '../../interfaces/geo/Location';
import Forecast from '../../interfaces/forecast/Forecast';
import DailyForecastWithHours from '../../interfaces/forecast/DailyForecastWithHours';
import * as forecastCacheService from '../../utils/cache/forecastCacheService';

const REGIONS = loadRegions();
let results: ForecastResponse;

beforeEach(() => {
  results = initializeForecastResponse();
});

describe('parse forecast response', () => {
  it('should handle null forecast', () => {
    const region = REGIONS['cities'];
    expect(() =>
      parseResponse(null, results, region, region.locations[0])
    ).not.toThrow();
  });

  it('should parse forecast for a region correctly', async () => {
    const region = REGIONS['cities'];
    const location = region.locations[1];
    const apiResponse = await mockVisualCrossingForecast(location);

    parseResponse(apiResponse, results, region, location);

    expect(results.dates.length).toEqual(15);
    expect(results.locations.byId[location.name]).toBeDefined();
    expect(results.locations.allIds).toContain(location.name);
    expect(results.locations.allIds.length).toEqual(1);

    const resultsRegions = results.regions.byId[region.name];
    expect(resultsRegions.name).toEqual(region.name);
    expect(results.regions.allIds.length).toEqual(1);
    expect(results.regions.allIds).toContain(region.name);

    const resultsForecast = results.forecasts.byId[location.name];
    expect(resultsForecast.length).toEqual(15);

    const dailyForecast = resultsForecast[0];
    expect(dailyForecast.datetime).toBeTruthy();
    expect(dailyForecast.tempmax).toBeTruthy();
    expect(dailyForecast.tempmin).toBeTruthy();
    // TODO expect(dailyForecast.cloudCover).toBeTruthy()
    expect(dailyForecast.sunrise).toBeTruthy();
    expect(dailyForecast.sunset).toBeTruthy();
    expect(dailyForecast.moonphase).toBeTruthy();
    expect(dailyForecast.description).toBeTruthy();
    expect(dailyForecast.icon).toBeTruthy();
  });

  it('should parse forecast alerts for a region correctly', async () => {
    const region = REGIONS['mt_rainier'];
    const location = region.locations[3];
    const apiResponse = await mockVisualCrossingForecast(location);

    parseResponse(apiResponse, results, region, location);

    const alertIds = results.alertsById;
    const alertId =
      'NOAA-NWS-ALERTS-WA12619ABCAC9C.AvalancheWarning.12619AD89588WA.SEWSABSEW.48f14a084d383b4e2e16869bf8a0f678';

    expect(alertId).toContain(alertId);
    // eslint-disable-next-line security/detect-object-injection
    const alert = alertIds[alertId];
    expect(alert.description).toBeTruthy();
    expect(alert.ends).toBeTruthy();
    expect(alert.endsEpoch).toBeTruthy();
    expect(alert.event).toBeTruthy();
    expect(alert.headline).toBeTruthy();
    expect(alert.id).toBeTruthy();
    expect(alert.link).toBeTruthy();

    const locationAlerts = location.alertIds;
    expect(locationAlerts).toEqual([alertId]);

    const allAlertIds = results.allAlertIds;
    expect(allAlertIds).toEqual([alertId]);
  });

  it('should include hours in daily forecast response', async () => {
    const region = REGIONS['cities'];
    const location = region.locations[0]; // Seattle
    const apiResponse = await mockVisualCrossingForecast(location);

    parseResponse(apiResponse, results, region, location);

    const forecast = results.forecasts.byId[location.name];
    const dayWithHours = forecast[0] as DailyForecastWithHours;

    expect(dayWithHours.hours).toBeDefined();
    expect(Array.isArray(dayWithHours.hours)).toBe(true);
  });

  it('should have 24 hours per day in daily forecast', async () => {
    const region = REGIONS['cities'];
    const location = region.locations[0]; // Seattle
    const apiResponse = await mockVisualCrossingForecast(location);

    parseResponse(apiResponse, results, region, location);

    const forecast = results.forecasts.byId[location.name];

    // Check all days have 24 hours
    forecast.forEach((day: DailyForecastWithHours) => {
      expect(day.hours).toBeDefined();
      expect(day.hours?.length).toBe(24);

      // Check first hour has required fields
      if (day.hours && day.hours.length > 0) {
        const firstHour = day.hours[0];
        expect(firstHour.datetime).toBeTruthy();
        expect(firstHour.temp).toBeDefined();
        expect(firstHour.datetimeEpoch).toBeDefined();
      }
    });
  });
});

describe('getHourlyForecastForLocation', () => {
  const mockLocation: Location = {
    name: 'test_location',
    region: 'test_region',
    description: 'Test Location',
    latitude: 47.6,
    longitude: -122.3
  };

  const mockForecast: Forecast = {
    latitude: 47.6,
    longitude: -122.3,
    description: 'Test forecast',
    days: [
      {
        datetime: '2026-01-11',
        tempmax: 50,
        tempmin: 40,
        precip: 0.1,
        precipprob: 50,
        precipcover: 10,
        cloudCover: 0.5,
        sunrise: '07:00:00',
        sunset: '17:00:00',
        moonphase: 0.5,
        conditions: 'Cloudy',
        description: 'Cloudy day',
        icon: 'cloudy',
        hours: [
          {
            datetime: '00:00:00',
            datetimeEpoch: 1768118400,
            temp: 42,
            feelslike: 40,
            humidity: 80,
            dew: 38,
            precip: 0,
            precipprob: 0,
            preciptype: null,
            snow: 0,
            snowdepth: 0,
            windgust: 10,
            windspeed: 5,
            winddir: 180,
            pressure: 1020,
            visibility: 10,
            cloudcover: 50,
            solarradiation: 0,
            solarenergy: 0,
            uvindex: 0,
            severerisk: 10,
            conditions: 'Cloudy',
            icon: 'cloudy'
          }
        ]
      } as DailyForecastWithHours,
      {
        datetime: '2026-01-12',
        tempmax: 52,
        tempmin: 42,
        precip: 0.2,
        precipprob: 60,
        precipcover: 20,
        cloudCover: 0.7,
        sunrise: '07:00:00',
        sunset: '17:00:00',
        moonphase: 0.6,
        conditions: 'Rain',
        description: 'Rainy day',
        icon: 'rain',
        hours: []
      } as DailyForecastWithHours
    ] as DailyForecastWithHours[],
    alerts: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    forecastCacheService.clearAll();
  });

  it('should return HourlyForecastResponse with location metadata', async () => {
    const callback = jest.fn().mockResolvedValue(mockForecast);

    const result = await getHourlyForecastForLocation(
      mockLocation,
      callback,
      'test-endpoint'
    );

    expect(result.location.name).toBe('test_location');
    expect(result.days).toHaveLength(2);
    expect(result.totalHours).toBe(1);
    expect(callback).toHaveBeenCalledWith(mockLocation);
  });

  it('should filter by date range', async () => {
    const callback = jest.fn().mockResolvedValue({
      ...mockForecast,
      days: [
        {
          datetime: '2026-01-10',
          hours: [],
          tempmax: 50,
          tempmin: 40,
          precip: 0,
          precipprob: 0,
          precipcover: 0,
          cloudCover: 0,
          sunrise: '07:00:00',
          sunset: '17:00:00',
          moonphase: 0.5,
          conditions: 'Clear',
          description: 'Clear day',
          icon: 'clear-day'
        },
        {
          datetime: '2026-01-11',
          hours: [],
          tempmax: 50,
          tempmin: 40,
          precip: 0,
          precipprob: 0,
          precipcover: 0,
          cloudCover: 0,
          sunrise: '07:00:00',
          sunset: '17:00:00',
          moonphase: 0.5,
          conditions: 'Clear',
          description: 'Clear day',
          icon: 'clear-day'
        },
        {
          datetime: '2026-01-12',
          hours: [],
          tempmax: 50,
          tempmin: 40,
          precip: 0,
          precipprob: 0,
          precipcover: 0,
          cloudCover: 0,
          sunrise: '07:00:00',
          sunset: '17:00:00',
          moonphase: 0.5,
          conditions: 'Clear',
          description: 'Clear day',
          icon: 'clear-day'
        },
        {
          datetime: '2026-01-13',
          hours: [],
          tempmax: 50,
          tempmin: 40,
          precip: 0,
          precipprob: 0,
          precipcover: 0,
          cloudCover: 0,
          sunrise: '07:00:00',
          sunset: '17:00:00',
          moonphase: 0.5,
          conditions: 'Clear',
          description: 'Clear day',
          icon: 'clear-day'
        }
      ]
    });

    const result = await getHourlyForecastForLocation(
      mockLocation,
      callback,
      'test-endpoint',
      { startDate: '2026-01-11', endDate: '2026-01-12' }
    );

    expect(result.days).toHaveLength(2);
    expect(result.requestedDates).toEqual(['2026-01-11', '2026-01-12']);
    expect(result.days[0].datetime).toBe('2026-01-11');
    expect(result.days[1].datetime).toBe('2026-01-12');
  });

  it('should calculate total hours correctly', async () => {
    const callback = jest.fn().mockResolvedValue(mockForecast);

    const result = await getHourlyForecastForLocation(
      mockLocation,
      callback,
      'test-endpoint'
    );

    expect(result.totalHours).toBe(1); // One hour in first day
  });

  it('should throw error if callback returns null', async () => {
    const callback = jest.fn().mockResolvedValue(null);

    await expect(
      getHourlyForecastForLocation(mockLocation, callback, 'test-endpoint')
    ).rejects.toThrow('Failed to fetch forecast for location: test_location');
  });

  it('should handle empty hours arrays', async () => {
    const callback = jest.fn().mockResolvedValue({
      ...mockForecast,
      days: [
        {
          datetime: '2026-01-11',
          hours: [],
          tempmax: 50,
          tempmin: 40,
          precip: 0,
          precipprob: 0,
          precipcover: 0,
          cloudCover: 0,
          sunrise: '07:00:00',
          sunset: '17:00:00',
          moonphase: 0.5,
          conditions: 'Clear',
          description: 'Clear day',
          icon: 'clear-day'
        },
        {
          datetime: '2026-01-12',
          tempmax: 50,
          tempmin: 40,
          precip: 0,
          precipprob: 0,
          precipcover: 0,
          cloudCover: 0,
          sunrise: '07:00:00',
          sunset: '17:00:00',
          moonphase: 0.5,
          conditions: 'Clear',
          description: 'Clear day',
          icon: 'clear-day'
        }
      ]
    });

    const result = await getHourlyForecastForLocation(
      mockLocation,
      callback,
      'test-endpoint'
    );

    expect(result.totalHours).toBe(0);
  });

  it('should read hourly data from daily cache', async () => {
    // Pre-populate cache with daily forecast (using 'mock' endpoint key)
    forecastCacheService.set(mockLocation, mockForecast, 'mock');

    // Mock callback should not be called since data is cached
    const callback = jest.fn().mockResolvedValue(mockForecast);

    // Call hourly endpoint with 'mock' endpoint key (daily cache)
    const result = await getHourlyForecastForLocation(
      mockLocation,
      callback,
      'mock'
    );

    // Verify callback was not called (cache hit)
    expect(callback).not.toHaveBeenCalled();

    // Verify result has data
    expect(result.location.name).toBe('test_location');
    expect(result.days.length).toBeGreaterThan(0);
  });

  it('should call API on cache miss and store in daily cache', async () => {
    // Clear cache to ensure miss
    forecastCacheService.clearAll();

    const callback = jest.fn().mockResolvedValue(mockForecast);

    // Call hourly endpoint with 'real' endpoint key
    const result = await getHourlyForecastForLocation(
      mockLocation,
      callback,
      'real'
    );

    // Verify callback was called (cache miss)
    expect(callback).toHaveBeenCalledWith(mockLocation);

    // Verify result has data
    expect(result.location.name).toBe('test_location');

    // Verify data is now in cache with 'real' key
    const cached = forecastCacheService.get(mockLocation, 'real');
    expect(cached).toBeDefined();
    expect(cached?.days.length).toBe(2);
  });
});
