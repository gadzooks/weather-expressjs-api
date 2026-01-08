import path from 'path';
import fs from 'fs';
import Forecast from '../../interfaces/forecast/Forecast';
import { Location } from '../../interfaces/geo/Location';

export function mockVisualCrossingForecast(
  location: Location
): Promise<Forecast | null> {
  const fileName = location.name.replace(/\s+/g, '');
  const dataDirectory = 'tests/mock_service_data/data';
  const filePath = `${dataDirectory}/vc-${fileName}.json`;
  let fcst: Forecast | null = null;

  try {
    const doc = fs.readFileSync(path.resolve(filePath), 'utf8');
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
