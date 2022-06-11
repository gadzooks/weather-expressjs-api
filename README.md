# Weather REST API with ExpressJS

```sh
# set up skeleton files with 
npx express-generator

# to run locally
DEBUG=weather-expressjs:* npm start
```

## TODO :
- read region / location data from yaml
- endpoints 
    - /regions /regions/:regionId
    - /locations /locations/:locationId
    - /regions/:regionId/locations
- forecast endpoint
    - /forecasts/regions/:all
    - /forecasts/regions/:regionId