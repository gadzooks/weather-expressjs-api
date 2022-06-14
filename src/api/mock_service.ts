import path from "path";
import fs from 'fs';
import Forecast from "../interfaces/Forecast";

export function mockVisualCrossingForecast(location: string): Forecast|null{
    const fileName = location.replace(/\s+/g, '');
    const filePath = `../mock_service/data/vc-${fileName}.json`;
    console.log(`reading from ${filePath}`);
    let fcst: Forecast|null = null;

    try {
        const doc = (fs.readFileSync(path.resolve(__dirname, filePath), 'utf8'));
        const docAny = doc as any;
        const parsedData = JSON.parse(docAny);

        fcst = parsedData as Forecast;
    } catch (error) {
        console.error(error);
        // expected output: ReferenceError: nonExistentFunction is not defined
        // Note - error messages will vary depending on browser
    }

    return fcst;
};