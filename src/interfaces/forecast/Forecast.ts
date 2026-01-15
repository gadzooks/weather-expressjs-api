import Alert from './Alert';
import DailyForecastWithHours from './DailyForecastWithHours';

interface Forecast {
  latitude: number;
  longitude: number;
  description: string;
  days: DailyForecastWithHours[];
  alerts: Alert[];
}

export default Forecast;
