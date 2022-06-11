import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sum from './test-ts';

import forecasts from './routes/forecasts';
import loadRegions from './models/region';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
loadRegions('regions.yml');

app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>Hello from the TypeScript world! : ${sum(3,4)}</h1>`);
});

app.use('/forecasts', forecasts);

app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
