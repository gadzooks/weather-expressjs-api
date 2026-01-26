import DailyForecast from './DailyForecast';
import HourlyForecast from './HourlyForecast';

interface DailyForecastWithHours extends DailyForecast {
  hours?: HourlyForecast[];
  pm2p5?: number;
  aqius?: number;
}

export default DailyForecastWithHours;
