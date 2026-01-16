#!/usr/bin/env ts-node

/**
 * Generate hourly forecast data for mock JSON files that lack it.
 *
 * This script reads all vc-*.json files from tests/mock_service_data/data/,
 * and for each day without an hours array, generates 24 hourly forecasts
 * by interpolating from the daily forecast data.
 */

import * as fs from 'fs';
import * as path from 'path';

interface DailyForecast {
  datetime: string;
  datetimeEpoch: number;
  tempmax: number;
  tempmin: number;
  temp: number;
  feelslikemax: number;
  feelslikemin: number;
  feelslike: number;
  dew: number;
  humidity: number;
  precip: number;
  precipprob: number;
  precipcover?: number | null;
  preciptype?: string[] | null;
  snow: number;
  snowdepth: number;
  windgust: number;
  windspeed: number;
  winddir: number;
  pressure: number;
  cloudcover: number;
  visibility: number;
  solarradiation: number;
  solarenergy: number;
  uvindex: number;
  severerisk: number;
  sunrise: string;
  sunriseEpoch: number;
  sunset: string;
  sunsetEpoch: number;
  moonphase: number;
  conditions: string;
  description: string;
  icon: string;
  stations?: string[] | null;
  source: string;
  hours?: HourlyForecast[];
}

interface HourlyForecast {
  datetime: string;
  datetimeEpoch: number;
  temp: number;
  feelslike: number;
  humidity: number;
  dew: number;
  precip: number;
  precipprob: number;
  preciptype?: string[] | null;
  snow: number;
  snowdepth: number;
  windgust: number;
  windspeed: number;
  winddir: number;
  pressure: number;
  visibility: number;
  cloudcover: number;
  solarradiation: number;
  solarenergy: number;
  uvindex: number;
  severerisk: number;
  conditions: string;
  icon: string;
  stations?: string[] | null;
  source?: string;
}

interface MockData {
  days: DailyForecast[];
  [key: string]: unknown;
}

/**
 * Interpolate temperature using a sine curve to simulate daily temperature variation.
 * Temperature peaks at 2 PM (14:00) and troughs at 4 AM.
 */
function interpolateTemp(
  tempmin: number,
  tempmax: number,
  hour: number
): number {
  // Sine wave with period of 24 hours
  // Phase shift so minimum is at hour 4 (4 AM) and maximum at hour 14 (2 PM)
  const phase = ((hour - 4) / 24) * 2 * Math.PI;
  const amplitude = (tempmax - tempmin) / 2;
  const midpoint = (tempmax + tempmin) / 2;
  const temp = midpoint + amplitude * Math.sin(phase);
  return Math.round(temp * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate humidity based on temperature (inverse relationship).
 * Cooler hours have higher humidity.
 */
function interpolateHumidity(
  baseHumidity: number,
  temp: number,
  avgTemp: number,
  tempRange: number
): number {
  // As temp increases, humidity decreases
  const tempDiff = temp - avgTemp;
  const humidityAdjust = -(tempDiff / tempRange) * 20; // Max 20% variation
  const humidity = baseHumidity + humidityAdjust;
  return Math.round(Math.max(20, Math.min(100, humidity)));
}

/**
 * Calculate dew point (simplified approximation).
 */
function calculateDew(temp: number, humidity: number): number {
  // Simplified Magnus formula approximation
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
  const dew = (b * alpha) / (a - alpha);
  return Math.round(dew * 10) / 10;
}

/**
 * Distribute daily precipitation across hours.
 * More precip during daylight hours (6 AM - 6 PM).
 */
function distributePrecip(dailyPrecip: number, hour: number): number {
  if (dailyPrecip === 0) return 0;

  // Weight precipitation toward daylight hours
  const isDaylight = hour >= 6 && hour < 18;
  const weight = isDaylight ? 1.5 : 0.5;

  // Simple distribution: divide by 24 and apply weight
  const basePrecip = dailyPrecip / 24;
  const hourlyPrecip = basePrecip * weight;

  return Math.round(hourlyPrecip * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate solar radiation based on time of day.
 * Peak at solar noon (12:00), zero at night.
 */
function calculateSolarRadiation(
  maxSolarRadiation: number,
  hour: number,
  sunriseHour: number,
  sunsetHour: number
): number {
  if (hour < sunriseHour || hour >= sunsetHour) {
    return 0;
  }

  // Sine curve from sunrise to sunset
  const dayLength = sunsetHour - sunriseHour;
  const hoursSinceSunrise = hour - sunriseHour;
  const phase = (hoursSinceSunrise / dayLength) * Math.PI;
  const radiation = maxSolarRadiation * Math.sin(phase);

  return Math.round(radiation * 10) / 10;
}

/**
 * Calculate solar energy from solar radiation.
 */
function calculateSolarEnergy(solarRadiation: number): number {
  // Energy is radiation accumulated over the hour (W/m² → Wh/m² → kWh/m²)
  const energy = solarRadiation / 1000; // Convert to kWh/m²
  return Math.round(energy * 100) / 100;
}

/**
 * Calculate UV index based on solar radiation.
 */
function calculateUVIndex(solarRadiation: number, maxUVIndex: number): number {
  if (solarRadiation === 0) return 0;

  // UV index roughly correlates with solar radiation
  // Peak UV index occurs when solar radiation is highest
  const uvIndex = Math.round((solarRadiation / 400) * maxUVIndex);
  return Math.max(0, Math.min(maxUVIndex, uvIndex));
}

/**
 * Determine conditions string based on precipitation and cloud cover.
 */
function determineConditions(
  precip: number,
  cloudcover: number,
  preciptype?: string[] | null
): string {
  if (precip > 0) {
    if (preciptype && preciptype.includes('snow')) {
      return cloudcover > 80 ? 'Snow, Overcast' : 'Snow, Partially cloudy';
    }
    return cloudcover > 80 ? 'Rain, Overcast' : 'Rain, Partially cloudy';
  }

  if (cloudcover > 80) return 'Overcast';
  if (cloudcover > 50) return 'Partially cloudy';
  return 'Clear';
}

/**
 * Determine weather icon based on time of day and conditions.
 */
function determineIcon(
  conditions: string,
  hour: number,
  sunriseHour: number,
  sunsetHour: number
): string {
  const isNight = hour < sunriseHour || hour >= sunsetHour;

  if (conditions.includes('Snow')) return 'snow';
  if (conditions.includes('Rain')) return 'rain';
  if (conditions.includes('Overcast')) return 'cloudy';
  if (conditions.includes('Partially cloudy')) {
    return isNight ? 'partly-cloudy-night' : 'partly-cloudy-day';
  }
  return isNight ? 'clear-night' : 'clear-day';
}

/**
 * Parse time string (HH:MM:SS) to hour number.
 */
function parseTimeToHour(timeString: string): number {
  const parts = timeString.split(':');
  return parseInt(parts[0], 10);
}

/**
 * Generate 24 hourly forecasts from a daily forecast.
 */
function generateHourlyForecasts(day: DailyForecast): HourlyForecast[] {
  const hours: HourlyForecast[] = [];
  const sunriseHour = parseTimeToHour(day.sunrise);
  const sunsetHour = parseTimeToHour(day.sunset);
  const tempRange = day.tempmax - day.tempmin;

  for (let hour = 0; hour < 24; hour++) {
    const temp = interpolateTemp(day.tempmin, day.tempmax, hour);
    const humidity = interpolateHumidity(
      day.humidity,
      temp,
      day.temp,
      tempRange
    );
    const dew = calculateDew(temp, humidity);
    const precip = distributePrecip(day.precip, hour);
    const solarRadiation = calculateSolarRadiation(
      day.solarradiation,
      hour,
      sunriseHour,
      sunsetHour
    );
    const solarEnergy = calculateSolarEnergy(solarRadiation);
    const uvindex = calculateUVIndex(solarRadiation, day.uvindex);
    const conditions = determineConditions(
      precip,
      day.cloudcover,
      day.preciptype
    );
    const icon = determineIcon(conditions, hour, sunriseHour, sunsetHour);

    // Add some variation to wind (±20%)
    const windVariation = 0.8 + Math.random() * 0.4;
    const windspeed = Math.round(day.windspeed * windVariation * 10) / 10;
    const windgust = Math.round(day.windgust * windVariation * 10) / 10;
    const winddir = day.winddir + Math.round((Math.random() - 0.5) * 30); // ±15 degrees

    const hourlyForecast: HourlyForecast = {
      datetime: `${hour.toString().padStart(2, '0')}:00:00`,
      datetimeEpoch: day.datetimeEpoch + hour * 3600,
      temp,
      feelslike: Math.round((temp - 2) * 10) / 10, // Simple approximation
      humidity,
      dew,
      precip,
      precipprob: day.precipprob,
      preciptype: day.preciptype,
      snow: distributePrecip(day.snow, hour),
      snowdepth: day.snowdepth,
      windgust,
      windspeed,
      winddir: winddir < 0 ? winddir + 360 : winddir % 360,
      pressure: day.pressure,
      visibility: day.visibility,
      cloudcover: day.cloudcover,
      solarradiation: solarRadiation,
      solarenergy: solarEnergy,
      uvindex,
      severerisk: day.severerisk,
      conditions,
      icon,
      stations: day.stations,
      source: 'fcst'
    };

    hours.push(hourlyForecast);
  }

  return hours;
}

/**
 * Process a single mock data file.
 */
function processFile(filePath: string): boolean {
  console.log(`Processing: ${path.basename(filePath)}`);

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(filePath, 'utf8');
    const data: MockData = JSON.parse(content);

    let modified = false;

    // Check each day and generate hours if missing or incomplete
    for (const day of data.days) {
      if (!day.hours || day.hours.length !== 24) {
        day.hours = generateHourlyForecasts(day);
        modified = true;
      }
    }

    if (modified) {
      // Write back with pretty formatting
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  ✓ Generated hourly data for ${data.days.length} days`);
      return true;
    } else {
      console.log(`  - Already has hourly data, skipping`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Error processing file:`, error);
    return false;
  }
}

/**
 * Main execution function.
 */
function main() {
  const dataDir = path.join(
    __dirname,
    '..',
    'tests',
    'mock_service_data',
    'data'
  );

  console.log(`\nGenerating hourly forecast data for mock files...\n`);
  console.log(`Data directory: ${dataDir}\n`);

  // Get all vc-*.json files
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.startsWith('vc-') && f.endsWith('.json'))
    .map((f) => path.join(dataDir, f));

  console.log(`Found ${files.length} mock files\n`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    if (processFile(file)) {
      processedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary:`);
  console.log(`  Total files: ${files.length}`);
  console.log(`  Modified: ${processedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log(`${'='.repeat(60)}\n`);

  if (processedCount > 0) {
    console.log(
      `✓ Successfully generated hourly data for ${processedCount} files`
    );
  } else {
    console.log(`All files already have hourly data`);
  }
}

// Run the script
main();
