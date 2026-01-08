import Alert from '../forecast/Alert';

export interface Location {
  name: string;
  region: string;
  description: string;
  latitude: number;
  longitude: number;
  sub_region?: string;
  alertIds?: Alert['id'][]; //array of alertIds
}
