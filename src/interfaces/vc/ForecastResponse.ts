    // "queryCost": 1,
    // "latitude": 47.5301,
    // "longitude": -122.034,
    // "resolvedAddress": "Issaquah, WA, United States",
    // "address": "issaquah",
    // "timezone": "America/Los_Angeles",
    // "tzoffset": -7.0,
    // "description": "Warming up with a chance of rain tomorrow.",
    // "days": [
    //   {
    //     "datetime": "2022-06-17",
    //     "datetimeEpoch": 1655449200,
    //     "tempmax": 58.5,
    //     "tempmin": 53.5,
    //     "temp": 56.1,
    //     "feelslikemax": 58.5,
    //     "feelslikemin": 53.5,
    //     "feelslike": 56.1,
    //     "dew": 50.4,
    //     "humidity": 81.5,
    //     "precip": 0.09,
    //     "precipprob": 57.1,
    //     "precipcover": 16.67,
    //     "preciptype": [
    //       "rain"
    //     ],
    //     "snow": 0.0,
    //     "snowdepth": 0.0,
    //     "windgust": 17.9,
    //     "windspeed": 9.4,
    //     "winddir": 205.1,
    //     "pressure": 1010.3,
    //     "cloudcover": 83.5,
    //     "visibility": 9.2,
    //     "solarradiation": 53.2,
    //     "solarenergy": 4.6,
    //     "uvindex": 3.0,
    //     "severerisk": 10.0,
    //     "sunrise": "05:10:16",
    //     "sunriseEpoch": 1655467816,
    //     "sunset": "21:08:12",
    //     "sunsetEpoch": 1655525292,
    //     "moonphase": 0.57,
    //     "conditions": "Rain, Partially cloudy",
    //     "description": "Partly cloudy throughout the day with late afternoon rain.",
    //     "icon": "rain",
    //     "stations": [
    //       "KSEA",
    //       "KBFI",
    //       "KRNT",
    //       "F9074"
    //     ],
    //     "source": "comb",
    //   },
    //   ,

import Alert from "../Alert";
import DailyForecast from "../DailyForecast";

export namespace VisualCrossing {
    export interface TimeLineResponse {
        latitude: number;
        longitude: number;
        description: string;
        days: DailyForecast[];
        alerts: Alert[];
    }
}