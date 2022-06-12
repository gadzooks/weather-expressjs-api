// https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/issaquah?include=fcst%2Cobs%2Chistfcst%2Cstats%2Cdays%2Calerts%2Cevents&key=YDKUXZYV597WYAK9ANSG35DWK&options=beta&contentType=json

import { load } from "js-yaml";
import path from "path";
import fs from 'fs';
import Forecast from "../parser/Forecast";
import {mockVisualCrossingForecast} from './mock_service';import { RegionHash } from "../utils/configParser";
import { ForecastResponse, ForecastsById, LocationById, LocationsById, RegionsById } from "../response/ForecastResponse";
import { Region } from "../models/Region";
import { Location } from "../models/Location";
;

// API_KEY = ENV["VISUAL_CROSSING_API_KEY"]
// # https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.96972,-77.38519?key=YOUR_KEY&include=obs,fcst
// BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
// EXCLUDE_BLOCK = "?key=#{API_KEY}&include=obs,fcst,alerts&alertLevel=detail"

const axios = require('axios').default;

export async function makeGetRequest() {

  let res = await axios.get('https://dummy.restapiexample.com/api/v1/employees');

  let data = res.data;
  // console.log(data);
  console.log(data.message);
};

export function getForecastForAllRegions(regionHash: RegionHash): ForecastResponse{
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

  const fcstResponse : ForecastResponse = {
    dates: new Array(),
    locations: locationsById,
    regions: regionsById,
    forecasts: forecastsById,
  };

  for(const regionKey in regionHash) {
    const region = regionHash[regionKey];
    const locations = region.locations;
    locations.map((location) => {
      const response:Forecast|null = mockVisualCrossingForecast(location.name);
      if(response) {
        insertIntoRegionsById(fcstResponse, regionKey, region);
        insertIntoLocationsById(fcstResponse, location.name, location);
        insertIntoForecastsById(fcstResponse, location, response);
        insertIntoDays(fcstResponse, response);
      }
    })
  }

  return fcstResponse;
};

function insertIntoRegionsById(fcstResponse: ForecastResponse, regionKey: string, region: Region) {
  let regionObject: Region = fcstResponse.regions.byId[regionKey];
  if (!regionObject) {
    regionObject = { ...region };
  }
  fcstResponse.regions.byId[regionKey] = regionObject;

  const allIds: string[] = fcstResponse.regions.allIds;
  if(!allIds.includes(regionKey)) {
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
  if(!allIds.includes(locationKey)) {
    allIds.push(locationKey);
  }
}

function insertIntoForecastsById(fcstResponse: ForecastResponse, location: Location, response: Forecast) {
  fcstResponse.forecasts.byId[location.name] = response.days;
}

function insertIntoDays(fcstResponse: ForecastResponse, response: Forecast) {
  if(fcstResponse.dates.length === 0) {
    fcstResponse.dates = response.days.map((dailyForecast) => {
      return dailyForecast.datetime;
    })
  }
}

