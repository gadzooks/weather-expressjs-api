import { Location } from "../interfaces/Location";

// # https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.96972,-77.38519?key=YOUR_KEY&include=obs,fcst
// BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
// EXCLUDE_BLOCK = "?key=#{API_KEY}&include=obs,fcst,alerts&alertLevel=detail"

import axios, { AxiosResponse } from "axios";
import Forecast from "../interfaces/Forecast";

const VC_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
const OPTIONS = '&include=obs,fcst,alerts&alertLevel=detail';
const VC_API_KEY = process.env.VC_API_KEY;

const instance = axios.create({
  baseURL: VC_URL,
  timeout: 1_000,
});

const responseBody = (response: AxiosResponse) => response.data;

const requests = {
  get: (urlParams: string) => instance.get(urlParams).then(responseBody),
}

export const VisualCrossingApi = {

  getForecast: (location: Location): Promise<Forecast|null> => {
    const urlParams = location.latitude + ',' + location.longitude + `?key=${VC_API_KEY}` + OPTIONS;
    return requests.get(urlParams);
  }
}