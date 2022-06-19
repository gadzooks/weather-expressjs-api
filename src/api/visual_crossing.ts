import axios, { AxiosResponse } from 'axios';
import Forecast from "../interfaces/Forecast";
import { RegionHash } from "../utils/configParser";
import { ForecastResponse, ForecastsById, LocationsById, RegionsById } from "../interfaces/ForecastResponse";
import { Region } from "../interfaces/Region";
import { Location } from "../interfaces/Location";

// API_KEY = ENV["VISUAL_CROSSING_API_KEY"]
// # https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.96972,-77.38519?key=YOUR_KEY&include=obs,fcst
// BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
// EXCLUDE_BLOCK = "?key=#{API_KEY}&include=obs,fcst,alerts&alertLevel=detail"

const VC_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
const OPTIONS = '&include=obs,fcst,alerts&alertLevel=detail';
const VC_API_KEY = 'YDKUXZYV597WYAK9ANSG35DWK';

const instance = axios.create({
  baseURL: VC_URL,
  timeout: 15000,
});

const responseBody = (response: AxiosResponse) => response.data;

const requests = {
  get: (urlParams: string) => instance.get(urlParams).then(responseBody),
}

export const VisualCrossingApi = {
  getForecast: (location: Location): Promise<Forecast> => {
    const urlParams = location.latitude + ',' + location.longitude + `?key=${VC_API_KEY}` + OPTIONS;
    console.log(`urlParams is : ${urlParams}`)
    return requests.get(urlParams);
  }
}


// const data = res.data as VisualCrossing.TimeLineResponse;
// console.log(data);

// let response:Forecast = {
//   latitude: data.latitude,
//   longitude: data.longitude,
//   description: data.description,
//   days: data.days.map((day) => {
//     return day as DailyForecast;
//   }),
//   alerts: data.alerts.map((alert) => {
//     return alert as Alert;
//   }),
// }

// return response;


// const axios = require('axios').default;

// export async function makeGetRequest() {

//   let res = await axios.get('https://dummy.restapiexample.com/api/v1/employees');
//   let data = res.data;
//   // console.log(data);
//   console.log(data.message);
// };

export async function getForecastForAllRegions(regionHash: RegionHash, callback: (location: Location) => Promise<Forecast | null>): Promise<ForecastResponse> {
// export function getForecastForAllRegions(regionHash: RegionHash, callback: (location: Location) => Forecast|null): ForecastResponse {
  const locationsById: LocationsById = {
    byId: {},
    allIds: new Array(),
  }

  const regionsById: RegionsById = {
    byId: {},
    allIds: new Array(),
  }

  const forecastsById: ForecastsById = {
    byId: {},
  }

  let fcstResponse: ForecastResponse = {
    dates: new Array(),
    locations: locationsById,
    regions: regionsById,
    forecasts: forecastsById,
  };

  let forecasts: any = [];

  for (const regionKey in regionHash) {
    const region = regionHash[regionKey];
    const locations = region.locations;
    console.log(`locations : ${locations}`);
    for(const i in locations ) {
      const location = locations[i];
      try {
        const response = await callback(location);
        if (response !== null) {
          // locations.map(async (location) => {
          console.log('111111111111');
          console.log('2222222222');
          console.log(response?.description);
          if (response !== null) {
            console.log('aaaaaaaaaa');
            console.log(location.name);
            console.log(response?.description);
            insertIntoRegionsById(fcstResponse, region.name, region);
            insertIntoLocationsById(fcstResponse, location.name, location);
            insertIntoForecastsById(fcstResponse, location, response);
            insertIntoDays(fcstResponse, response);
            console.log('44444444444444');
            console.log(fcstResponse.dates[0]);
            // return fcstResponse;
          }
        }
      } catch(error) {
        console.error(error);
      }
    }
    // break;
  }

  // Promise.all(promises);
  console.log('000000000000000000000000000');
  console.log(fcstResponse.dates[0]);
  return fcstResponse;
};

function insertIntoRegionsById(fcstResponse: ForecastResponse, regionKey: string, region: Region) {
  let regionObject: Region = fcstResponse.regions.byId[regionKey];
  if (!regionObject) {
    regionObject = { ...region };
  }
  fcstResponse.regions.byId[regionKey] = regionObject;

  const allIds: string[] = fcstResponse.regions.allIds;
  if (!allIds.includes(regionKey)) {
    allIds.push(regionKey);
  }
}

function insertIntoLocationsById(fcstResponse: ForecastResponse, locationKey: string, location: Location) {
  let locationObject: Location = fcstResponse.locations.byId[locationKey];
  if (!locationObject) {
    locationObject = { ...location };
  }
  fcstResponse.locations.byId[locationKey] = locationObject;

  const allIds: string[] = fcstResponse.locations.allIds;
  if (!allIds.includes(locationKey)) {
    allIds.push(locationKey);
  }
}

function insertIntoForecastsById(fcstResponse: ForecastResponse, location: Location, response: Forecast) {
  fcstResponse.forecasts.byId[location.name] = response.days;
}

function insertIntoDays(fcstResponse: ForecastResponse, response: Forecast) {
  if (fcstResponse.dates.length === 0) {
    fcstResponse.dates = response.days.map((dailyForecast) => {
      return dailyForecast.datetime;
    })
  }
}

