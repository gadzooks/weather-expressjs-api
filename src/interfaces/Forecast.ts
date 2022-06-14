import Alert from './Alert';
import DailyForecast from './DailyForecast';

interface Forecast {
    latitude: number;
    longitude: number;
    description: string;
    days: DailyForecast[];
    alerts: Alert[];
}

export default Forecast;