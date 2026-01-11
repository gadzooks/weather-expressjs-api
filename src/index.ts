// index.ts

import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';

import forecasts from './routes/forecasts';
import geo from './routes/geo';
import wta from './routes/wta';
import { corsOptions } from './config/corsConfig';

dotenv.config();

const app: Express = express();


app.use(cors(corsOptions));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.send(`<h1>Hello from the TypeScript world! : </h1>`);
});

app.use('/forecasts', forecasts);
app.use('/geo', geo);
app.use('/api/wta', wta);


const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === 'development') {
  app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
}

module.exports = app;
