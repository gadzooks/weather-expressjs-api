# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Index

- **[CI/CD Pipeline](docs/CI-CD.md)** - Automated testing and deployment workflows via GitHub Actions
- **[README.md](README.md)** - Quick start guide and common commands

## Project Overview

Weather REST API built with Express.js and TypeScript that fetches weather forecasts from the Visual Crossing API. The application is organized around geographic regions and locations, with forecast data normalized into a Redux-like structure (byId/allIds pattern).

## Environment Setup

Required environment variable in `.env`:
```
VC_API_KEY=your-visual-crossing-api-key
```

## Common Commands

### Development
```bash
npm start                    # Build and run dev server with hot reload (watches TypeScript files)
npm run production          # Run production build from dist/
```

Server runs on port 3000 by default (configurable via PORT env var).

### Build
```bash
npm run build               # Full build (clean + TypeScript + static files)
npm run build:clean         # Remove dist directory
npm run build:typescript    # Compile TypeScript only
npm run build:static        # Copy YAML/JSON config files to dist
```

Note: The build process must copy YAML config files from `src/config/` to `dist/config/` because the runtime code reads them using relative paths from the compiled location.

### Testing
```bash
npm test                       # Run all tests with Jest (5 second timeout)
npm run test:coverage          # Run tests with coverage report
npm run watch                  # Run tests in watch mode
npm test -- src/utils/forecast/configParser.test.ts  # Run specific test file
```

### Code Quality
```bash
npm run lint                # Run ESLint with auto-fix
npm run prettier-format     # Format code with Prettier (single quotes, 80 char width, semicolons)
```

## Architecture

### Data Flow

1. **Configuration Loading** (`src/utils/forecast/configParser.ts`)
   - At server startup, `loadRegions()` is called in the forecasts router
   - Loads YAML configs from `src/config/regions.yml` (8 regions) and `src/config/locations.yml` (40+ locations)
   - Builds a `RegionHash` structure: `{ [regionName]: Region }` where each Region contains an array of Location objects
   - Each Location has `name`, `latitude`, `longitude`, `region`, optional `sub_region`, and optional `alertIds`

2. **Weather Service** (`src/api/weather/weather_service.ts`)
   - `getForecastForAllRegions(regionHash, callback)` iterates through all regions and their locations
   - Calls the provided callback (either real Visual Crossing API or mock service) for each location
   - `parseResponse()` normalizes each API response into the Redux-style ForecastResponse structure
   - Handles errors gracefully (logs but continues processing other locations)

3. **API Routes** (`src/routes/forecasts.ts`)
   - `GET /forecasts/mock` - Returns mock data for testing without hitting the API
   - `GET /forecasts/real` - Fetches live data from Visual Crossing API
   - Both routes return the same normalized `ForecastResponse` structure

### Data Normalization Pattern

The `ForecastResponse` structure (defined in `src/interfaces/forecast/ForecastResponse.ts`) uses a normalized Redux pattern:
```typescript
{
  dates: string[],
  locations: { byId: {...}, allIds: [...] },
  regions: { byId: {...}, allIds: [...] },
  forecasts: { byId: {...} },
  alertsById: {...},
  allAlertIds: [...]
}
```

This pattern:
- Eliminates data duplication
- Makes lookups efficient
- Mirrors Redux best practices for state management
- Locations store `alertIds` arrays that reference the `alertsById` hash

### Visual Crossing API Integration

The `VisualCrossingApi` (`src/api/weather/visual_crossing.ts`):
- Constructs URLs using coordinates (latitude/longitude) from Location objects
- URL format: `{latitude},{longitude}?key={API_KEY}&include=obs,fcst,alerts&alertLevel=detail`
- Uses axios with 1-second timeout
- Returns raw `Forecast` objects (containing `days: DailyForecast[]` and optional `alerts: Alert[]`)

### Weather Alerts Flow

Alerts are handled through a denormalized relationship:
1. API returns `alerts` array in the Forecast response
2. `insertIntoAlerts()` in weather_service.ts:
   - Stores each alert in `ForecastResponse.alertsById` (keyed by alert.id)
   - Adds alert IDs to the `Location.alertIds` array
   - Maintains `ForecastResponse.allAlertIds` as a deduplicated array
3. Frontend can look up alerts via location.alertIds → alertsById[id]

### Configuration Files

- `src/config/regions.yml` - Defines 8 regions (e.g., central_cascades, mt_rainier, olympic_np) with search_keys and descriptions
- `src/config/locations.yml` - Defines 40+ locations with lat/long, descriptions, region associations, and optional sub_region IDs
- CRITICAL: Both files must be copied to `dist/config/` during build (via `build:static` script) because `configParser.ts` uses `__dirname` relative paths

### TypeScript Configuration

- `tsconfig.json` - Base config: strict mode, ES2016 target, CommonJS modules, rootDir: ./src, outDir: dist
- `tsconfig.build.json` - Extends base, excludes test files (`*.spec.ts`, `*.test.ts`) from compilation

### Testing

- Jest with ts-jest preset, Node test environment
- Tests use `.test.ts` extension (currently: configParser.test.ts, weather_service.test.ts)
- Environment variables loaded via dotenv in jest.config.js setup
- 5 second default timeout for tests

## Deployment (AWS Lambda)

This project is deployed to AWS Lambda using AWS SAM (Serverless Application Model) with API Gateway.

### Current Deployment Configuration

The `template.yaml` file contains the SAM template defining:
- Lambda function: `weather-expressjs-prod` (production), `weather-expressjs-qa` (QA), `weather-expressjs-dev` (development)
- Runtime: Node.js 24.x
- Region: us-west-1
- API Gateway with CORS enabled
- Environment variables managed via SAM parameters

### Deployment Commands

```bash
# Deploy to production
yarn sam:deploy          # Build and deploy to prod environment

# Deploy to QA
yarn sam:deploy:qa       # Build and deploy to QA environment

# Deploy to development
yarn sam:deploy:dev      # Build and deploy to dev environment

# Build only (no deployment)
yarn sam:build           # Compile TypeScript and build SAM application

# Validate SAM template
yarn sam:validate        # Validate template syntax

# Test locally (requires Docker)
yarn sam:local           # Start local API server at http://localhost:3000
```

### How Deployment Works

1. TypeScript compiles `src/` to `dist/`
2. The `lambda.js` file (in project root) acts as the Lambda handler
3. `lambda.js` uses `@vendia/serverless-express` to wrap the Express app from `dist/index`
4. SAM packages the application and uploads it to S3
5. CloudFormation creates/updates the Lambda function and API Gateway
6. Environment variables are injected via SAM parameters

### Prerequisites

1. Install AWS SAM CLI: `brew install aws-sam-cli`
2. Configure AWS credentials with the `claudia` profile
3. Ensure the IAM user has these managed policies:
   - AWSCloudFormationFullAccess
   - AWSLambda_FullAccess
   - AmazonAPIGatewayAdministrator
   - IAMFullAccess
   - S3 permissions for `aws-sam-cli-managed-*` buckets

### Multiple Environments

SAM supports multiple environments through the `samconfig.toml` file:
- **prod**: Production environment (`weather-expressjs-prod` stack)
- **qa**: QA environment (`weather-expressjs-qa` stack)
- **dev**: Development environment (`weather-expressjs-dev` stack)

Each environment creates a separate CloudFormation stack with its own Lambda function and API Gateway.

### Important Notes

- The `lambda.js` handler uses an async function (required for Node.js 24.x)
- Environment variables like `VC_API_KEY` are passed via `--parameter-overrides` in deployment scripts
- The Express app's `app.listen()` is only called in local development (Lambda doesn't need it)
- SAM local testing requires Docker to be running
- The old Claudia.js commands are still available as `yarn claudia:deploy`, `yarn claudia:create`, etc.

### Migration from Claudia.js

If you were previously using Claudia.js:
1. The old `claudia.json` configuration is no longer used
2. Old Claudia commands are renamed with `claudia:` prefix
3. SAM provides better multi-environment support and is actively maintained
4. Node.js 24.x requires async Lambda handlers (callback-based handlers are deprecated)
