import path from 'path';
import fs from 'fs';
import Forecast from '../../interfaces/forecast/Forecast';
import { Location } from '../../interfaces/geo/Location';

export function mockVisualCrossingForecast(
  location: Location
): Promise<Forecast | null> {
  const fileName = location.name.replace(/\s+/g, '');
  // Use path that works in both test (src/) and production (dist/) environments
  // In tests: __dirname = src/api/mock, so ../../../tests/mock_service_data/data
  // In prod: __dirname = dist/api/mock, so ../../../dist/mock_service_data/data
  const testPath = path.join(
    __dirname,
    '../../../tests/mock_service_data/data',
    `vc-${fileName}.json`
  );
  const prodPath = path.join(
    __dirname,
    '../../../dist/mock_service_data/data',
    `vc-${fileName}.json`
  );
  const filePath = fs.existsSync(testPath) ? testPath : prodPath;
  let fcst: Forecast | null = null;

  try {
    const doc = fs.readFileSync(filePath, 'utf8');
    const docAny = doc as string;
    const parsedData = JSON.parse(docAny);

    fcst = parsedData as Forecast;
    return new Promise((resolve) => {
      resolve(fcst);
    });
  } catch (error) {
    console.error(error);
    // expected output: ReferenceError: nonExistentFunction is not defined
    // Note - error messages will vary depending on browser

    return new Promise((resolve, reject) => {
      reject(error);
    });
  }
}
