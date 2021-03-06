function mockWeatherForecastNormalized() {
  return {
    dates: [
      '2021-04-17T07:00:00.000+00:00',
      '2021-04-18T07:00:00.000+00:00',
      '2021-04-19T07:00:00.000+00:00',
      '2021-04-20T07:00:00.000+00:00'
    ],
    regions: {
      byId: {
        central_cascades: {
          id: 'central_cascades',
          description: 'Central Cascades',
          regionId: 'central_cascades',
          locations: ['renton', 'yakima']
        },
        western_wa: {
          id: 'western_wa',
          description: 'Western WA',
          regionId: 'western_wa',
          locations: ['seattle', 'bellevue']
        }
      },
      allIds: ['central_cascades', 'western_wa']
    },
    locations: {
      byId: {
        renton: {
          id: 'renton',
          description: 'Renton',
          regionId: 'central_cascades'
        },
        yakima: {
          id: 'yakima',
          description: 'Yakima',
          regionId: 'central_cascades'
        },
        seattle: {
          id: 'seattle',
          description: 'Seattle',
          regionId: 'western_wa'
        },
        bellevue: {
          id: 'bellevue',
          description: 'Bellevue',
          regionId: 'western_wa'
        }
      },
      allIds: ['renton', 'yakima', 'seattle', 'bellevue']
    },
    forecasts: {
      byId: {
        renton: [
          {
            time: '2021-04-17T07:00:00.000+00:00',
            summary: 'Clear conditions throughout the day.',
            icon: 'day-hail',
            precipProbability: 0.0,
            temperature: 60.9,
            apparentTemperature: 60.9,
            dewPoint: 40.1,
            visibility: 120,
            cloudCover: 1,
            temperatureHigh: 74.9,
            temperatureLow: 47.3,
            sunsetTime: 1618714951,
            sunriseTime: 1618665359,
            precipAmount: 0.0
          },
          {
            time: '2021-04-18T07:00:00.000+00:00',
            summary: 'Clear conditions throughout the day.',
            icon: 'day-sunny',
            precipProbability: 0.0,
            temperature: 62.1,
            apparentTemperature: 62.1,
            dewPoint: 41.4,
            visibility: 150,
            cloudCover: 14,
            temperatureHigh: 72.9,
            temperatureLow: 52.1,
            sunsetTime: 1618801436,
            sunriseTime: 1618751647,
            precipAmount: 0.0
          },
          {
            time: '2021-04-19T07:00:00.000+00:00',
            summary: 'Clear conditions throughout the day.',
            icon: 'day-storm-showers',
            precipProbability: 0.0,
            temperature: 60.4,
            apparentTemperature: 60.4,
            dewPoint: 39.9,
            visibility: 150,
            cloudCover: 18,
            temperatureHigh: 70.1,
            temperatureLow: 52.1,
            sunsetTime: 1618887921,
            sunriseTime: 1618837937,
            precipAmount: 0.0
          },
          {
            time: '2021-04-20T07:00:00.000+00:00',
            summary: 'Partly cloudy throughout the day.',
            icon: 'hot',
            precipProbability: 19.0,
            temperature: 58.1,
            apparentTemperature: 58.1,
            dewPoint: 44.4,
            visibility: 140,
            cloudCover: 33,
            temperatureHigh: 65.9,
            temperatureLow: 51.0,
            sunsetTime: 1618974405,
            sunriseTime: 1618924228,
            precipAmount: 0.0
          }
        ],
        seattle: [
          {
            time: '2021-04-17T07:00:00.000+00:00',
            summary: 'Clear conditions throughout the day.',
            icon: 'day-windy',
            precipProbability: 0.0,
            temperature: 60.9,
            apparentTemperature: 60.9,
            dewPoint: 40.1,
            visibility: 120,
            cloudCover: 1,
            temperatureHigh: 74.9,
            temperatureLow: 47.3,
            sunsetTime: 1618714951,
            sunriseTime: 1618665359,
            precipAmount: 0.0
          },
          {
            time: '2021-04-18T07:00:00.000+00:00',
            summary: 'Clear conditions throughout the day.',
            icon: 'day-windy',
            precipProbability: 0.0,
            temperature: 62.1,
            apparentTemperature: 62.1,
            dewPoint: 41.4,
            visibility: 150,
            cloudCover: 14,
            temperatureHigh: 72.9,
            temperatureLow: 52.1,
            sunsetTime: 1618801436,
            sunriseTime: 1618751647,
            precipAmount: 0.0
          },
          {
            time: '2021-04-19T07:00:00.000+00:00',
            summary: 'Clear conditions throughout the day.',
            icon: 'day-storm-showers',
            precipProbability: 0.0,
            temperature: 60.4,
            apparentTemperature: 60.4,
            dewPoint: 39.9,
            visibility: 150,
            cloudCover: 18,
            temperatureHigh: 70.1,
            temperatureLow: 52.1,
            sunsetTime: 1618887921,
            sunriseTime: 1618837937,
            precipAmount: 0.0
          },
          {
            time: '2021-04-20T07:00:00.000+00:00',
            summary: 'Partly cloudy throughout the day.',
            icon: 'hot',
            precipProbability: 19.0,
            temperature: 58.1,
            apparentTemperature: 58.1,
            dewPoint: 44.4,
            visibility: 140,
            cloudCover: 33,
            temperatureHigh: 65.9,
            temperatureLow: 51.0,
            sunsetTime: 1618974405,
            sunriseTime: 1618924228,
            precipAmount: 0.0
          }
        ]
      }
    }
  };
}

export default mockWeatherForecastNormalized;
