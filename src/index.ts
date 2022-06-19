import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';

import forecasts from './routes/forecasts';

dotenv.config();

const PORT = process.env.PORT || 4000;
const app: Express = express();

app.use(cors())
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>Hello from the TypeScript world! : </h1>`);
});

app.use('/forecasts', forecasts);

app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
