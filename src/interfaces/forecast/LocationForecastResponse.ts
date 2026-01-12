import { Location } from '../geo/Location';
import { Region } from '../geo/Region';
import Alert from './Alert';
import DailyForecast from './DailyForecast';

export interface LocationForecastResponse {
  location: Location;
  forecast: DailyForecast[];
  alerts: Alert[];
  region: Region;
  metadata: {
    cached: boolean;
    endpoint: string;
    expiresAt?: number;
  };
}
