import { Location } from "../interfaces/Location";

// API_KEY = ENV["VISUAL_CROSSING_API_KEY"]
// # https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.96972,-77.38519?key=YOUR_KEY&include=obs,fcst
// BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
// EXCLUDE_BLOCK = "?key=#{API_KEY}&include=obs,fcst,alerts&alertLevel=detail"

import axios, { AxiosResponse } from "axios";
import Forecast from "../interfaces/Forecast";

const VC_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
const OPTIONS = '&include=obs,fcst,alerts&alertLevel=detail';
const VC_API_KEY = 'YDKUXZYV597WYAK9ANSG35DWK';

const instance = axios.create({
  baseURL: VC_URL,
  timeout: 1_000,
});

const responseBody = (response: AxiosResponse) => response.data;

const requests = {
  get: (urlParams: string) => instance.get(urlParams).then(responseBody),
}

export const VisualCrossingApi = {

// export function mockVisualCrossingForecast(location: Location): Promise<Forecast|null>{
  getForecast: (location: Location): Promise<Forecast|null> => {
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