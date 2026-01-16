// WTA Trip Report Service
// Fetches and parses trip reports from wta.org

import * as cheerio from 'cheerio';
import * as cacheManager from '../../utils/cache/cacheManager';
import {
  TripReport,
  TripReportResponse,
  WtaQueryParams
} from '../../interfaces/wta/TripReport';

const WTA_BASE_URL = 'https://www.wta.org/@@search_tripreport_listing';
const PAGE_SIZE = 50;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioSelection = ReturnType<ReturnType<typeof cheerio.load>>;

function buildWtaUrl(params: WtaQueryParams): string {
  const { region, subregion, page = 1 } = params;
  const bStart = (page - 1) * PAGE_SIZE;

  const queryParams = new URLSearchParams({
    b_size: String(PAGE_SIZE),
    format: 'list',
    region
  });

  if (subregion) {
    queryParams.append('subregion', subregion);
  }

  if (bStart > 0) {
    queryParams.append('b_start:int', String(bStart));
  }

  return `${WTA_BASE_URL}?${queryParams.toString()}`;
}

function parsePhotoCount(text: string): number {
  const match = text.match(/(\d+)\s*photos?/i);
  return match ? parseInt(match[1], 10) : 0;
}

function parseHelpfulCount($item: CheerioSelection): number {
  const upvoteText = $item.find('.UpvoteCount').text().trim();
  return upvoteText ? parseInt(upvoteText, 10) : 0;
}

function parseConditions($item: CheerioSelection): string[] {
  const issuesText = $item.find('.trail-issues').text();
  const match = issuesText.match(/Beware of:\s*(.+)/i);
  if (match) {
    return match[1]
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return [];
}

function parseRegionSubregion(regionText: string): {
  region: string;
  subregion: string;
} {
  const parts = regionText.split('>').map((s) => s.trim());
  return {
    region: parts[0] || '',
    subregion: parts[1] || ''
  };
}

function extractIdFromUrl(url: string): string {
  // URL format: https://www.wta.org/go-hiking/trip-reports/trip_report-2026-01-09.164604937407
  const match = url.match(/trip_report[^/]+$/);
  return match ? match[0] : url;
}

function parseTripReports(html: string): {
  reports: TripReport[];
  totalCount: number;
} {
  const $ = cheerio.load(html);
  const reports: TripReport[] = [];

  // Get total count from #count-data
  const countText = $('#count-data').text().replace(/,/g, '');
  const totalCount = parseInt(countText, 10) || 0;

  // Parse each trip report item
  $('#trip-reports .item').each((_, element) => {
    const $item = $(element);

    // Title and URL
    const $titleLink = $item.find('.listitem-title a');
    const reportUrl = $titleLink.attr('href') || '';
    const titleText = $titleLink.text().trim();

    // Parse title and date from "Mount Si - Old Trail — Jan. 9, 2026"
    const titleParts = titleText.split('—').map((s) => s.trim());
    const trailName = titleParts[0] || '';
    const date = titleParts[1] || '';

    // Region and subregion
    const regionText = $item.find('.region span.region').text().trim();
    const { region, subregion } = parseRegionSubregion(regionText);

    // Thumbnail
    const thumbnailUrl =
      $item.find('.wta-ratio-figure__image').attr('src') || null;

    // Photo count
    const mediaText = $item.find('.media-indicator').text().trim();
    const photoCount = parsePhotoCount(mediaText);

    // Author
    const $authorLink = $item.find('.wta-icon-headline');
    const authorName = $item.find('.wta-icon-headline__text').text().trim();
    const authorProfileUrl = $authorLink.attr('href') || '';

    // Conditions
    const conditions = parseConditions($item);

    // Helpful count
    const helpfulCount = parseHelpfulCount($item);

    // Full report text
    const body = $item.find('.trip-report-full-text').text().trim();

    // Generate ID from URL
    const id = extractIdFromUrl(reportUrl);

    reports.push({
      id,
      title: titleText,
      date,
      trailName,
      region,
      subregion,
      author: {
        name: authorName,
        profileUrl: authorProfileUrl
      },
      photoCount,
      thumbnailUrl,
      conditions,
      helpfulCount,
      body,
      reportUrl
    });
  });

  return { reports, totalCount };
}

function getCacheKey(params: WtaQueryParams): string {
  const { region, subregion, page = 1 } = params;
  return `wta:${region}:${subregion || 'all'}:${page}`;
}

export async function getTripReports(
  params: WtaQueryParams
): Promise<TripReportResponse> {
  const cacheKey = getCacheKey(params);

  // Check cache first
  const cached = cacheManager.get<TripReportResponse>(cacheKey);
  if (cached) {
    console.log(`WTA cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`WTA cache miss: ${cacheKey}, fetching from WTA...`);

  const url = buildWtaUrl(params);

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'text/html'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const { reports, totalCount } = parseTripReports(html);

  const result: TripReportResponse = {
    totalCount,
    page: params.page || 1,
    pageSize: PAGE_SIZE,
    reports
  };

  // Cache the result with custom TTL (30 minutes)
  cacheManager.set(cacheKey, result);

  return result;
}

export function clearWtaCache(): number {
  const keys = cacheManager.getKeys().filter((k) => k.startsWith('wta:'));
  keys.forEach((key) => cacheManager.del(key));
  console.log(`WTA cache cleared: ${keys.length} keys removed`);
  return keys.length;
}
