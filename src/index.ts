import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';

import forecasts from './routes/forecasts';
import {loadRegions} from './utils/configParser';

import makeGetRequest from './api/visual_crossing';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
loadRegions();

// makeGetRequest();

app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>Hello from the TypeScript world! : </h1>`);
});

app.use('/forecasts', forecasts);

app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
