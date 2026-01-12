import { Location } from '../geo/Location';
import DailyForecastWithHours from './DailyForecastWithHours';
import Alert from './Alert';

export interface HourlyForecastResponse {
  location: Location;
  days: DailyForecastWithHours[];
  alerts: Alert[];
  totalHours: number;
  requestedDates?: string[];
}

export default HourlyForecastResponse;
