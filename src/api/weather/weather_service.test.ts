import { initializeForecastResponse, parseResponse } from './weather_service'
import { loadRegions } from '../../utils/forecast/configParser'
import { mockVisualCrossingForecast } from '../mock/mock_vc_service'
import { ForecastResponse } from '../../interfaces/forecast/ForecastResponse'

const REGIONS = loadRegions()
let results: ForecastResponse

beforeEach(() => {
  results = initializeForecastResponse()
})

describe("parse forecast response", () => {
  it('should handle null forecast', () => {
    const region = REGIONS['cities']
    expect(() => parseResponse(null, results, region, region.locations[0])).not.toThrowError()
  })

  it('should parse forecast for a region correctly', async () => {
    const region = REGIONS['cities']
    const location = region.locations[1]
    console.log(__dirname)
    const apiResponse = await mockVisualCrossingForecast(location)

    parseResponse(apiResponse, results, region, location)

    expect(results.dates.length).toEqual(15)
    expect(results.locations.byId[location.name]).toBeDefined()
    expect(results.locations.allIds).toContain(location.name)
    expect(results.locations.allIds.length).toEqual(1)

    const resultsRegions = results.regions.byId[region.name]
    expect(resultsRegions.name).toEqual(region.name)
    expect(results.regions.allIds.length).toEqual(1)
    expect(results.regions.allIds).toContain(region.name)

    const resultsForecast = results.forecasts.byId[location.name]
    expect(resultsForecast.length).toEqual(15)

    const dailyForecast = resultsForecast[0]
    expect(dailyForecast.datetime).toBeTruthy()
    expect(dailyForecast.tempmax).toBeTruthy()
    expect(dailyForecast.tempmin).toBeTruthy()
    // TODO expect(dailyForecast.cloudCover).toBeTruthy()
    expect(dailyForecast.sunrise).toBeTruthy()
    expect(dailyForecast.sunset).toBeTruthy()
    expect(dailyForecast.moonphase).toBeTruthy()
    expect(dailyForecast.description).toBeTruthy()
    expect(dailyForecast.icon).toBeTruthy()

  })

  it('should parse forecast alerts for a region correctly', async () => {
    const region = REGIONS['mt_rainier']
    const location = region.locations[3]
    const apiResponse = await mockVisualCrossingForecast(location)

    parseResponse(apiResponse, results, region, location)

  })


})