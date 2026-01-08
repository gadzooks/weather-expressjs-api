# Weather API Bruno Collection

This collection provides interactive API testing for the Weather Express.js API.

## Environments

- **local**: http://localhost:3000 (development server)
- **ci**: http://localhost:3001 (CI/CD testing)

## Usage

### Interactive Testing (Bruno Desktop)

1. Install Bruno Desktop: https://www.usebruno.com/
2. Open Bruno and select "Open Collection"
3. Navigate to `bruno-collections/weather-api`
4. Select environment from dropdown (local or ci)
5. Run requests individually or run entire collection

### CLI Testing

```bash
# Run against local development server
yarn test:bruno:local

# Run against CI environment (port 3001)
yarn test:bruno
```

## Request Organization

### forecasts/
- **Get Mock Forecasts.bru** - Fetch mock forecast data for all regions
- **Clear Cache (GET).bru** - Clear forecast cache via GET request
- **Clear Cache (POST).bru** - Clear forecast cache via POST request

### geo/
- **Get All Regions.bru** - Fetch all regions and their locations
- **Get Region by ID (cities).bru** - Fetch cities region only
- **Get Region by ID (central_cascades).bru** - Fetch Central Cascades region only

### health/
- **Health Check.bru** - Basic health check endpoint

## Adding New Requests

1. Create a new `.bru` file in the appropriate folder
2. Add meta information (name, type, seq)
3. Define the HTTP method and URL using `{{baseURL}}`
4. Add headers if needed (e.g., `Accept: application/json`)
5. Add tests in the `tests` block using chai assertions
6. Update this README with a description

## Example Request Structure

```
meta {
  name: Your Request Name
  type: http
  seq: 1
}

get {
  url: {{baseURL}}/your-endpoint
}

headers {
  Accept: application/json
}

tests {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });

  test("Response has expected property", function() {
    expect(res.body).to.have.property('data');
  });
}
```

## Notes

- All mock endpoints work without requiring an API key
- Tests use chai assertion library
- Response time tests default to 5 second maximum
- Bruno CLI is part of the CI/CD pipeline
