import { Location } from "../geo/Location";
import { Region } from "../geo/Region";
import DailyForecast from "./DailyForecast";
import Forecast from "./Forecast";

export interface ForecastResponse {
    dates: string[];
    regions: RegionsById;
    locations: LocationsById;
    forecasts: ForecastsById;
}

export interface RegionsById {
    byId: RegionById;
    allIds: string[];
}

export interface RegionById {
    [key: string]: Region;
}

export interface LocationsById {
    byId: LocationById;
    allIds: string[];
}

export interface LocationById {
    [key: string]: Location;
}

export interface ForecastsById {
    byId: ForecastById;
}

export interface ForecastById {
    [key: string]: DailyForecast[];
}

// dates: [
//     "2021-04-17T07:00:00.000+00:00",
//     "2021-04-18T07:00:00.000+00:00",
//     "2021-04-19T07:00:00.000+00:00",
//     "2021-04-20T07:00:00.000+00:00",
// ],
// regions: {
//     byId: {
//     central_cascades: {
//         id: "central_cascades",
//         description: "Central Cascades",
//         regionId: "central_cascades",
//         locations: ["renton", "yakima"],
//     },
//     western_wa: {
//         id: "western_wa",
//         description: "Western WA",
//         regionId: "western_wa",
//         locations: ["seattle", "bellevue"],
//     },
//     },
//     allIds: ["central_cascades", "western_wa"],
// },
// locations: {
//     byId: {
//     renton: {
//         id: "renton",
//         description: "Renton",
//         regionId: "central_cascades",
//     },
//     yakima: {
//         id: "yakima",
//         description: "Yakima",
//         regionId: "central_cascades",
//     },
// forecasts: {
//     byId: {
//       renton: [
//         {
//           time: "2021-04-17T07:00:00.000+00:00",
//           summary: "Clear conditions throughout the day.",
//           icon: "day-hail",
//           precipProbability: 0.0,
//           temperature: 60.9,
//           apparentTemperature: 60.9,
//           dewPoint: 40.1,
//           visibility: 120,
//           cloudCover: 1,
//           temperatureHigh: 74.9,
//           temperatureLow: 47.3,
//           sunsetTime: 1618714951,
//           sunriseTime: 1618665359,
//           precipAmount: 0.0,
//         },