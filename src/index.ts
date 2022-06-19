import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';

import forecasts from './routes/forecasts';
import {loadRegions, RegionHash} from './utils/configParser';
import { mockVisualCrossingForecast } from './api/mock_service';
import { getForecastForAllRegions } from './api/visual_crossing';

dotenv.config();

const PORT = process.env.PORT || 4000;
const app: Express = express();

app.use(cors())
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const regionHash:RegionHash = loadRegions();

// const res = getForecastForAllRegions(regionHash);
// console.log(res);

// makeGetRequest();

app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>Hello from the TypeScript world! : </h1>`);
});

  const results = getForecastForAllRegions(regionHash, mockVisualCrossingForecast);

app.use('/forecasts', forecasts);

app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
