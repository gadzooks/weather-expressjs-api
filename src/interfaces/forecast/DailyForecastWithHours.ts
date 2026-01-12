import DailyForecast from './DailyForecast';
import HourlyForecast from './HourlyForecast';

interface DailyForecastWithHours extends DailyForecast {
  hours?: HourlyForecast[];
}

export default DailyForecastWithHours;
