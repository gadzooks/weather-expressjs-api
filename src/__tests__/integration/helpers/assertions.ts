/**
 * Custom assertion helpers for integration tests
 */

export function expectValidForecastResponse(data: any): void {
  expect(data).toHaveProperty('dates');
  expect(data.dates).toBeInstanceOf(Array);
  expect(data.dates.length).toBe(15);

  expect(data).toHaveProperty('locations');
  expect(data.locations).toHaveProperty('byId');
  expect(data.locations).toHaveProperty('allIds');
  expect(data.locations.allIds).toBeInstanceOf(Array);
  expect(data.locations.allIds.length).toBeGreaterThan(0);

  expect(data).toHaveProperty('regions');
  expect(data.regions).toHaveProperty('byId');
  expect(data.regions).toHaveProperty('allIds');
  expect(data.regions.allIds).toBeInstanceOf(Array);
  expect(data.regions.allIds.length).toBeGreaterThanOrEqual(8);

  expect(data).toHaveProperty('forecasts');
  expect(data.forecasts).toHaveProperty('byId');
  expect(typeof data.forecasts.byId).toBe('object');

  expect(data).toHaveProperty('alertsById');
  expect(data).toHaveProperty('allAlertIds');
  expect(data.allAlertIds).toBeInstanceOf(Array);

  data.locations.allIds.forEach((locationId: string) => {
    const location = data.locations.byId[locationId];
    expect(location).toBeDefined();
    expect(location).toHaveProperty('name');
    expect(location).toHaveProperty('latitude');
    expect(location).toHaveProperty('longitude');
    expect(location).toHaveProperty('region');

    // Check that forecasts exist for this location (keyed by location name only)
    const locationForecasts = data.forecasts.byId[locationId];
    expect(locationForecasts).toBeDefined();
    expect(locationForecasts).toBeInstanceOf(Array);
    expect(locationForecasts.length).toBe(15); // 15 days of forecasts
  });
}

export function expectValidRegionHash(data: any): void {
  expect(typeof data).toBe('object');

  const regionNames = Object.keys(data);
  expect(regionNames.length).toBeGreaterThanOrEqual(8);

  regionNames.forEach((regionName) => {
    const region = data[regionName];
    expect(region).toHaveProperty('locations');
    expect(region.locations).toBeInstanceOf(Array);
    expect(region.locations.length).toBeGreaterThan(0);

    region.locations.forEach((location: any) => {
      expect(location).toHaveProperty('name');
      expect(location).toHaveProperty('latitude');
      expect(location).toHaveProperty('longitude');
      expect(location).toHaveProperty('region');
      expect(location.region).toBe(regionName);
    });
  });
}

export function expectValidCacheHeaders(headers: any): void {
  expect(headers).toHaveProperty('cache-control');
  expect(headers).toHaveProperty('vary');
}

export function expectValidDailyForecast(forecast: any): void {
  expect(forecast).toHaveProperty('datetime');
  expect(forecast).toHaveProperty('tempmax');
  expect(forecast).toHaveProperty('tempmin');
  expect(forecast).toHaveProperty('temp');
  expect(forecast).toHaveProperty('humidity');
  expect(forecast).toHaveProperty('precip');
  expect(forecast).toHaveProperty('precipprob');
  expect(forecast).toHaveProperty('windspeed');
  expect(forecast).toHaveProperty('conditions');
  expect(forecast).toHaveProperty('description');
  expect(forecast).toHaveProperty('icon');
}

export function expectValidCacheClearResponse(data: any): void {
  expect(data).toHaveProperty('success');
  expect(data.success).toBe(true);
  expect(data).toHaveProperty('stats');
  expect(data.stats).toHaveProperty('keysCleared');
  expect(typeof data.stats.keysCleared).toBe('number');
  expect(data.stats).toHaveProperty('timestamp');
}
