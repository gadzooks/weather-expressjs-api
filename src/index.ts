import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';

import forecasts from './routes/forecasts';
// import ExpressCache from 'express-cache-middleware';
// import cacheManager from 'cache-manager';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();

// const cacheMiddleware = new ExpressCache(
//   cacheManager.caching({
//     store: 'memory', max: 10000, ttl: 3600
//   })
// )

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// // Attach the routes to be cached
// app.all('/forecasts', (req, res) => {
//   // ... do something expensive like a fetch() here ...
//   res.send('response')
// })

app.get('/', (req: Request, res: Response) => {
  res.send(`<h1>Hello from the TypeScript world! : </h1>`);
});

// Layer the caching in front of the other routes
// cacheMiddleware.attach(app)
app.use('/forecasts', forecasts);

// disable listen and add module.exports
// https://claudiajs.com/tutorials/serverless-express.html
// app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
module.exports = app; 