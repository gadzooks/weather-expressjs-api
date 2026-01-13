# Weather REST API with ExpressJS

Weather forecast REST API built with Express.js and TypeScript, deployed to AWS Lambda using SAM (Serverless Application Model).

## Quick Start

```sh
# Install dependencies
yarn

# Set up environment variables
echo VC_API_KEY='your-visual-crossing-api-key' >> .env
echo CACHE_TTL_HOURS=3 >> .env  # Optional: Cache duration in hours (default: 3)

# Run locally with
yarn start
```

## Documentation

- **[CI/CD Pipeline](docs/CI-CD.md)** - GitHub Actions workflows, deployment process, and setup instructions
- **[CLAUDE.md](CLAUDE.md)** - Comprehensive project documentation (architecture, deployment, testing)

## Available Commands

```sh
# Development
yarn start              # Build and run with hot reload
yarn production         # Run production build

# Testing
yarn test               # Run tests
yarn test:coverage      # Run tests with coverage
yarn watch              # Run tests in watch mode

# Code Quality
yarn lint               # Run ESLint with auto-fix
yarn prettier-format    # Format code with Prettier
# Note: Pre-commit hooks automatically run lint and format on staged files

# Build
yarn build              # Full build (TypeScript + copy configs)

# Deployment
yarn sam:deploy:dev     # Deploy to dev environment
yarn sam:deploy:qa      # Deploy to QA environment
yarn sam:deploy         # Deploy to production
```

## Environments

- **Dev**: Auto-deploys on every pull request
- **QA**: Auto-deploys on merge to master
- **Prod**: Manual approval required after QA deployment

See [CI/CD Documentation](docs/CI-CD.md) for details on the automated deployment pipeline.

## Blogs : 
- https://overreacted.io/
- https://kentcdodds.com/blog?q=react


## TODO :
- cacheing
- using cookies (customize views)
- cleaner error handling 
  - https://blog.logrocket.com/async-await-in-typescript/
  - https://www.toptal.com/express-js/routes-js-promises-error-handling
- morgan module
- REST endpoints 
    - /regions /regions/:regionId
    - /locations /locations/:locationId
    - /regions/:regionId/locations
    - tests
- REST forecast endpoint
    - /forecasts/regions/:all
    - /forecasts/regions/:regionId
    - tests
- use interfaces for API call
```javascript
interface StringValidator {
  isAcceptable(s: string): boolean;
}
let lettersRegexp = /^[A-Za-z]+$/;
let numberRegexp = /^[0-9]+$/;
class LettersOnlyValidator implements StringValidator {
  isAcceptable(s: string) {
    return lettersRegexp.test(s);
  }
}
class ZipCodeValidator implements StringValidator {
  isAcceptable(s: string) {
    return s.length === 5 && numberRegexp.test(s);
  }
}
```
- DOTENV : https://www.npmjs.com/package/dotenv

## TODO - later
- compbine react and express and deploy via : https://nx.dev/getting-started/intro


## Look into these articles : 
- boiler plate code - https://javascript.plainenglish.io/skeleton-for-node-js-apps-written-in-typescript-444fa1695b30
- https://github.com/santoshshinde2012/node-boilerplate
- advanced test setup : https://javascript.plainenglish.io/beginners-guide-to-testing-jest-with-node-typescript-1f46a1b87dad
- monorepo plus deployment tool : https://nx.dev/getting-started/intro
- async / awai - https://zellwk.com/blog/async-await-in-loops/

