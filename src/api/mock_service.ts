import path from "path";
import fs from 'fs';
import Forecast from "../parser/Forecast";

export function mockVisualCrossingForecast(location: string): Forecast|null{
    const fileName = location.replace(/\s+/g, '');
    const filePath = `../mock_service/data/vc-${fileName}.json`;
    console.log(`reading from ${filePath}`);
    let fcst: Forecast|null = null;

    try {
        const doc = (fs.readFileSync(path.resolve(__dirname, filePath), 'utf8'));
        const docAny = doc as any;
        console.log('=---------------')
        // console.log(doc['days'][0]);

        // const jsonData = require(fs.readFileSync(path.resolve(__dirname, filePath), 'utf8'));
        const parsedData = JSON.parse(docAny);
        // console.log(jsonData['days'][0]);
        console.log(parsedData.days[0]);

        fcst = parsedData as Forecast;
    } catch (error) {
        console.error(error);
        // expected output: ReferenceError: nonExistentFunction is not defined
        // Note - error messages will vary depending on browser
    }

    return fcst;
};