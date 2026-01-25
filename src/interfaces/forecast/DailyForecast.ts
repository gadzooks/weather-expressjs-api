interface DailyForecast {
  datetime: string;
  tempmax: number;
  tempmin: number;
  precip: number;
  precipprob: number;
  precipcover: number;
  cloudCover: number;
  sunrise: string;
  sunset: string;
  moonphase: number;
  conditions: string;
  description: string;
  icon: string;
  source?: string;
  pm2p5?: number;
  aqius?: number;
}

export default DailyForecast;
