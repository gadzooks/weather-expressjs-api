// index.ts

import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cors from 'cors';
import actuator from 'express-actuator';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

import forecasts from './routes/forecasts';
import geo from './routes/geo';
import wta from './routes/wta';
import { corsOptions } from './config/corsConfig';
import { checkAllDependencies } from './utils/health/healthChecks';
import {
  globalRateLimiter,
  forecastRateLimiter
} from './middleware/rateLimiter';
import { compressionMiddleware } from './middleware/compression';

dotenv.config();

const app: Express = express();

app.use(cors(corsOptions));
app.use(helmet());
app.use(compressionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apply global rate limiting to all routes
app.use(globalRateLimiter);

// Swagger API documentation (non-prod only)
const envType =
  process.env.ENVIRONMENT_TYPE || process.env.NODE_ENV || 'development';
const isProduction = envType === 'prod' || envType === 'production';

if (!isProduction) {
  // Dynamic import to avoid requiring swagger-ui-express in production
  import('swagger-ui-express')
    .then((swaggerUi) => {
      try {
        const swaggerPath = path.join(__dirname, 'config', 'swagger.yml');
        const swaggerDocument = yaml.load(
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          fs.readFileSync(swaggerPath, 'utf8')
        ) as object;

        // Serve the OpenAPI spec as JSON at /api-docs.json
        app.get('/api-docs.json', (_req: Request, res: Response) => {
          res.setHeader('Content-Type', 'application/json');
          res.send(swaggerDocument);
        });

        // Serve Swagger UI
        app.use('/api-docs', swaggerUi.default.serve);
        app.get(
          '/api-docs',
          swaggerUi.default.setup(swaggerDocument, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Weather API Documentation',
            swaggerOptions: {
              url: '/api-docs.json',
              persistAuthorization: true
            }
          })
        );

        console.log(
          `Swagger UI available at /api-docs (environment: ${envType})`
        );
      } catch (error) {
        console.error('Failed to load Swagger documentation:', error);
      }
    })
    .catch(() => {
      console.log(
        'Swagger UI not available (swagger-ui-express not installed)'
      );
    });
} else {
  console.log('Swagger UI disabled in production environment');
}

// Actuator endpoints for health monitoring
app.use(
  actuator({
    infoGitMode: 'full', // Include full git information in /info endpoint
    customEndpoints: [
      {
        id: 'dependencies', // Creates /dependencies endpoint
        controller: async (_req: Request, res: Response) => {
          try {
            const healthStatus = await checkAllDependencies();
            res
              .status(healthStatus.status === 'UP' ? 200 : 503)
              .json(healthStatus);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            res.status(503).json({
              status: 'DOWN',
              error: errorMessage
            });
          }
        }
      }
    ]
  })
);

app.get('/', (_req: Request, res: Response) => {
  res.send(`<h1>Hello from the TypeScript world! : </h1>`);
});

// Apply forecast-specific rate limiting (stricter than global)
app.use('/forecasts', forecastRateLimiter, forecasts);
app.use('/geo', geo);
app.use('/api/wta', wta);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === 'development') {
  app.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
}

module.exports = app;
