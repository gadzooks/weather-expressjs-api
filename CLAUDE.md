# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Index

- **[CI/CD Pipeline](docs/CI-CD.md)** - Automated testing and deployment workflows via GitHub Actions
- **[Dependabot](docs/DEPENDABOT.md)** - Automated dependency updates with auto-merge
- **[README.md](README.md)** - Quick start guide and common commands

## Project Overview

Weather REST API built with Express.js and TypeScript that fetches weather forecasts from the Visual Crossing API. The application is organized around geographic regions and locations, with forecast data normalized into a Redux-like structure (byId/allIds pattern).

## Environment Setup

Required environment variables in `.env`:
```
VC_API_KEY=your-visual-crossing-api-key
CACHE_TTL_HOURS=3  # Optional: Forecast cache duration in hours (default: 3)
```

## Common Commands

### Development
```bash
yarn start                  # Build and run dev server with hot reload (watches TypeScript files)
yarn production             # Run production build from dist/
```

Server runs on port 3000 by default (configurable via PORT env var).

### Build
```bash
yarn build                  # Full build (clean + TypeScript + static files)
yarn build:clean            # Remove dist directory
yarn build:typescript       # Compile TypeScript only
yarn build:static           # Copy YAML/JSON config files to dist
```

Note: The build process must copy YAML config files from `src/config/` to `dist/config/` because the runtime code reads them using relative paths from the compiled location.

### Testing
```bash
yarn test                      # Run all tests with Jest (5 second timeout)
yarn test:coverage             # Run tests with coverage report
yarn watch                     # Run tests in watch mode
yarn test src/utils/forecast/configParser.test.ts  # Run specific test file
```

### Code Quality
```bash
yarn lint                   # Run ESLint with auto-fix (includes security checks)
yarn prettier-format        # Format code with Prettier (single quotes, 80 char width, semicolons)
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
   - Daily forecasts now include hourly data (`hours?: HourlyForecast[]` array with 24 hourly entries per day)
   - `parseResponse()` normalizes each API response into the Redux-style ForecastResponse structure
   - Handles errors gracefully (logs but continues processing other locations)
   - Cache stores forecasts with endpoint keys (`mock`, `real`) - unified cache for both daily and hourly data

3. **API Routes** (`src/routes/forecasts.ts`)
   - `GET /forecasts/mock` - Returns mock data with embedded hourly forecasts
   - `GET /forecasts/real` - Fetches live data from Visual Crossing API with embedded hourly forecasts
   - `GET /forecasts/hourly/mock` - Extracts hourly data from cached daily forecasts (no separate API call)
   - `GET /forecasts/hourly/real` - Extracts hourly data from cached daily forecasts (no separate API call)
   - All routes share the same unified cache, reducing API calls by 50%

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
- URL format: `{latitude},{longitude}?key={API_KEY}&include=obs,fcst,alerts,hours&alertLevel=detail`
- Uses axios with 1-second timeout
- Returns raw `Forecast` objects (containing `days: DailyForecastWithHours[]` with hourly data and optional `alerts: Alert[]`)

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

### S3 Storage and Cost Optimization

Deployment artifacts are stored in a custom S3 bucket with aggressive cost optimization:

**Bucket:** `gadzooks-sam-artifacts` (managed independently, not part of CloudFormation stack)

**Structure:**
```
gadzooks-sam-artifacts/
├── weather-expressjs/
│   ├── dev/
│   ├── qa/
│   └── prod/
└── <future-projects>/
```

**Cost Optimization Features:**
- **Versioning disabled** - Only 1 version stored per environment (new deploys overwrite old artifacts)
- **1-day lifecycle policy** - Auto-deletes objects older than 1 day
- **Estimated cost:** < $0.01/month for all environments
- **Public access blocked** - All security best practices enabled

**Important:** The S3 bucket is managed **independently** via the creation script, NOT as part of the CloudFormation stack. This ensures the bucket persists across stack deletions and can be shared by multiple projects.

**Initial Setup (One-time):**
```bash
# Create the S3 bucket with lifecycle policies
bash scripts/create-s3-bucket.sh

# Verify bucket exists and configuration
aws s3 ls s3://gadzooks-sam-artifacts --profile claudia
aws s3api get-bucket-lifecycle-configuration --bucket gadzooks-sam-artifacts --profile claudia
```

**Monitoring Storage:**
```bash
# Check bucket size and object count
aws s3 ls s3://gadzooks-sam-artifacts --recursive --summarize --profile claudia

# Expected: 3-6 objects total (one deployment package per environment)
```

**Rollback Strategy:**
Since only 1 version is retained, rollback requires redeploying from git history:
```bash
git checkout <previous-commit>
yarn sam:deploy         # or sam:deploy:qa, sam:deploy:dev
git checkout master
```

### Prerequisites

1. Install AWS SAM CLI: `brew install aws-sam-cli`

2. Configure AWS credentials using the `claudia` profile:

   ```bash
   aws configure --profile claudia
   # Enter your AWS Access Key ID, Secret Access Key, and default region (us-west-1)
   ```

   Or set profile-specific environment variables:

   ```bash
   export AWS_PROFILE=claudia
   ```

3. Ensure the IAM user has these managed policies:

   - AWSCloudFormationFullAccess
   - AWSLambda_FullAccess
   - AmazonAPIGatewayAdministrator
   - IAMFullAccess
   - S3 Full Access (for `gadzooks-sam-artifacts` bucket)

### Multiple Environments

SAM supports multiple environments through the `samconfig.toml` file:

- **prod**: Production environment (`weather-expressjs-prod` stack)
- **qa**: QA environment (`weather-expressjs-qa` stack)
- **dev**: Development environment (`weather-expressjs-dev` stack)

Each environment creates a separate CloudFormation stack with its own Lambda function and API Gateway.

### Environment-Specific Cache Configuration

The forecast cache duration is configurable per environment via the `CACHE_TTL_HOURS` environment variable:

- **dev**: 24 hours - Longer cache to reduce API calls during development
- **qa**: 12 hours - Extended cache for testing stability
- **prod**: 3 hours - Fresher data for production users

This is configured in three places:

1. **template.yaml**: Defines the `CacheTTLHours` parameter (default: 3)
2. **package.json**: Deployment scripts pass environment-specific values via `--parameter-overrides`
3. **samconfig.toml**: Each environment section includes the `CacheTTLHours` parameter

The cache is managed by:

- **cacheManager.ts**: NodeCache instance with `stdTTL` set from `CACHE_TTL_HOURS` env var
- **forecastCacheService.ts**: Per-location forecast caching with `expiresAt` timestamps

For local development, set `CACHE_TTL_HOURS=3` in your `.env` file (or any value in hours).

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
