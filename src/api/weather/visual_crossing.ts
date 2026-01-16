import Forecast from '../../interfaces/forecast/Forecast';
import { Location } from '../../interfaces/geo/Location';

// # https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/38.96972,-77.38519?key=YOUR_KEY&include=obs,fcst
// BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"
// EXCLUDE_BLOCK = "?key=#{API_KEY}&include=obs,fcst,alerts&alertLevel=detail"

const VC_URL =
  'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';
const OPTIONS = '&include=obs,fcst,alerts,hours&alertLevel=detail';
const VC_API_KEY = process.env.VC_API_KEY || 'USE_VC_API_KEY';

if (VC_API_KEY !== 'USE_VC_API_KEY') {
  console.log('VC_API_KEY has been set to some value other than the default');
}

const requests = {
  get: async (urlParams: string): Promise<Forecast> => {
    const url = `${VC_URL}${urlParams}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1_000)
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }
};

export const VisualCrossingApi = {
  getForecast: (location: Location): Promise<Forecast | null> => {
    const urlParams =
      location.latitude +
      ',' +
      location.longitude +
      `?key=${VC_API_KEY}` +
      OPTIONS;
    console.log(
      `calling : ${VC_URL}${urlParams.replace(VC_API_KEY, 'VC_API_KEY')}`
    );
    return requests.get(urlParams);
  }
};
