// WTA Trip Report interfaces

export interface TripReportAuthor {
  name: string;
  profileUrl: string;
}

export interface TripReport {
  id: string;
  title: string;
  date: string;
  trailName: string;
  region: string;
  subregion: string;
  author: TripReportAuthor;
  photoCount: number;
  thumbnailUrl: string | null;
  conditions: string[];
  helpfulCount: number;
  body: string;
  reportUrl: string;
}

export interface TripReportResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  reports: TripReport[];
}

export interface WtaQueryParams {
  region: string;
  subregion?: string;
  page?: number;
}
