// wta_service.test.ts
// Unit tests for WTA Trip Report Service

import axios from 'axios';
import * as cacheManager from '../../utils/cache/cacheManager';
import { getTripReports, clearWtaCache } from './wta_service';
import { WtaQueryParams } from '../../interfaces/wta/TripReport';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock cache manager
jest.mock('../../utils/cache/cacheManager');
const mockedCache = cacheManager as jest.Mocked<typeof cacheManager>;

describe('WTA Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTripReports', () => {
    const mockHtml = `
      <html>
        <body>
          <div id="count-data">1,234</div>
          <div id="trip-reports">
            <div class="item">
              <div class="listitem-title">
                <a href="https://www.wta.org/go-hiking/trip-reports/trip_report-2026-01-09.164604937407">
                  Mount Si - Old Trail — Jan. 9, 2026
                </a>
              </div>
              <div class="region">
                <span class="region">Central Cascades > Snoqualmie Region</span>
              </div>
              <div class="wta-ratio-figure__image" src="https://example.com/thumb.jpg"></div>
              <div class="media-indicator">3 photos</div>
              <div class="wta-icon-headline" href="https://www.wta.org/user/johndoe">
                <span class="wta-icon-headline__text">John Doe</span>
              </div>
              <div class="trail-issues">Beware of: Snow, Ice</div>
              <div class="UpvoteCount">5</div>
              <div class="trip-report-full-text">Great hike with beautiful views!</div>
            </div>
            <div class="item">
              <div class="listitem-title">
                <a href="https://www.wta.org/go-hiking/trip-reports/trip_report-2026-01-08.123456789">
                  Rattlesnake Ledge — Jan. 8, 2026
                </a>
              </div>
              <div class="region">
                <span class="region">Central Cascades > Snoqualmie Region</span>
              </div>
              <div class="wta-ratio-figure__image"></div>
              <div class="media-indicator">1 photo</div>
              <div class="wta-icon-headline" href="https://www.wta.org/user/janedoe">
                <span class="wta-icon-headline__text">Jane Doe</span>
              </div>
              <div class="trail-issues"></div>
              <div class="UpvoteCount">2</div>
              <div class="trip-report-full-text">Easy trail, family friendly.</div>
            </div>
          </div>
        </body>
      </html>
    `;

    it('should fetch and parse trip reports successfully', async () => {
      const params: WtaQueryParams = {
        region: 'central-cascades',
        subregion: 'snoqualmie-region',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      const result = await getTripReports(params);

      expect(result.totalCount).toBe(1234);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
      expect(result.reports).toHaveLength(2);

      // Check first report
      const report1 = result.reports[0];
      expect(report1.id).toBe('trip_report-2026-01-09.164604937407');
      expect(report1.title).toBe('Mount Si - Old Trail — Jan. 9, 2026');
      expect(report1.date).toBe('Jan. 9, 2026');
      expect(report1.trailName).toBe('Mount Si - Old Trail');
      expect(report1.region).toBe('Central Cascades');
      expect(report1.subregion).toBe('Snoqualmie Region');
      expect(report1.author.name).toBe('John Doe');
      expect(report1.author.profileUrl).toBe(
        'https://www.wta.org/user/johndoe'
      );
      expect(report1.photoCount).toBe(3);
      expect(report1.thumbnailUrl).toBe('https://example.com/thumb.jpg');
      expect(report1.conditions).toEqual(['Snow', 'Ice']);
      expect(report1.helpfulCount).toBe(5);
      expect(report1.body).toBe('Great hike with beautiful views!');
      expect(report1.reportUrl).toBe(
        'https://www.wta.org/go-hiking/trip-reports/trip_report-2026-01-09.164604937407'
      );

      // Check second report
      const report2 = result.reports[1];
      expect(report2.id).toBe('trip_report-2026-01-08.123456789');
      expect(report2.title).toBe('Rattlesnake Ledge — Jan. 8, 2026');
      expect(report2.photoCount).toBe(1);
      expect(report2.thumbnailUrl).toBeNull();
      expect(report2.conditions).toEqual([]);
      expect(report2.helpfulCount).toBe(2);
    });

    it('should return cached data when available', async () => {
      const params: WtaQueryParams = {
        region: 'central-cascades',
        page: 1
      };

      const cachedData = {
        totalCount: 100,
        page: 1,
        pageSize: 50,
        reports: []
      };

      mockedCache.get.mockReturnValue(cachedData);

      const result = await getTripReports(params);

      expect(result).toBe(cachedData);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should cache the result after fetching', async () => {
      const params: WtaQueryParams = {
        region: 'central-cascades',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      await getTripReports(params);

      expect(mockedCache.set).toHaveBeenCalledWith(
        'wta:central-cascades:all:1',
        expect.objectContaining({
          totalCount: 1234,
          page: 1,
          pageSize: 50
        })
      );
    });

    it('should build correct URL with region only', async () => {
      const params: WtaQueryParams = {
        region: 'mt-rainier',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      await getTripReports(params);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('region=mt-rainier'),
        expect.any(Object)
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('b_size=50'),
        expect.any(Object)
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.not.stringContaining('b_start'),
        expect.any(Object)
      );
    });

    it('should build correct URL with subregion', async () => {
      const params: WtaQueryParams = {
        region: 'central-cascades',
        subregion: 'snoqualmie',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      await getTripReports(params);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('subregion=snoqualmie'),
        expect.any(Object)
      );
    });

    it('should build correct URL with pagination', async () => {
      const params: WtaQueryParams = {
        region: 'central-cascades',
        page: 3
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      await getTripReports(params);

      // Page 3 should have b_start = (3-1) * 50 = 100
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('b_start%3Aint=100'),
        expect.any(Object)
      );
    });

    it('should handle empty results', async () => {
      const emptyHtml = `
        <html>
          <body>
            <div id="count-data">0</div>
            <div id="trip-reports"></div>
          </body>
        </html>
      `;

      const params: WtaQueryParams = {
        region: 'central-cascades',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: emptyHtml });

      const result = await getTripReports(params);

      expect(result.totalCount).toBe(0);
      expect(result.reports).toHaveLength(0);
    });

    it('should propagate axios errors', async () => {
      const params: WtaQueryParams = {
        region: 'central-cascades',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(getTripReports(params)).rejects.toThrow('Network error');
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHtml = '<html><body>Invalid HTML</body></html>';

      const params: WtaQueryParams = {
        region: 'central-cascades',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: malformedHtml });

      const result = await getTripReports(params);

      expect(result.totalCount).toBe(0);
      expect(result.reports).toHaveLength(0);
    });
  });

  describe('clearWtaCache', () => {
    it('should clear all WTA cache keys', () => {
      const mockKeys = [
        'wta:central-cascades:all:1',
        'wta:mt-rainier:wonderland:2',
        'other:key:123'
      ];

      mockedCache.getKeys.mockReturnValue(mockKeys);
      mockedCache.del.mockImplementation(() => 1);

      const result = clearWtaCache();

      expect(result).toBe(2);
      expect(mockedCache.del).toHaveBeenCalledTimes(2);
      expect(mockedCache.del).toHaveBeenCalledWith(
        'wta:central-cascades:all:1'
      );
      expect(mockedCache.del).toHaveBeenCalledWith(
        'wta:mt-rainier:wonderland:2'
      );
      expect(mockedCache.del).not.toHaveBeenCalledWith('other:key:123');
    });

    it('should return 0 when no WTA keys exist', () => {
      mockedCache.getKeys.mockReturnValue(['other:key:1', 'other:key:2']);

      const result = clearWtaCache();

      expect(result).toBe(0);
      expect(mockedCache.del).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle reports with missing optional fields', async () => {
      const minimalHtml = `
        <html>
          <body>
            <div id="count-data">1</div>
            <div id="trip-reports">
              <div class="item">
                <div class="listitem-title">
                  <a href="https://www.wta.org/go-hiking/trip-reports/trip_report-123">
                    Trail Name — Jan. 1, 2026
                  </a>
                </div>
                <div class="region">
                  <span class="region">Test Region</span>
                </div>
                <div class="wta-icon-headline">
                  <span class="wta-icon-headline__text">Anonymous</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      const params: WtaQueryParams = {
        region: 'test',
        page: 1
      };

      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: minimalHtml });

      const result = await getTripReports(params);

      expect(result.reports).toHaveLength(1);
      const report = result.reports[0];
      expect(report.photoCount).toBe(0);
      expect(report.thumbnailUrl).toBeNull();
      expect(report.conditions).toEqual([]);
      expect(report.helpfulCount).toBe(0);
      expect(report.subregion).toBe('');
    });

    it('should parse photo count variations', async () => {
      const photoVariationsHtml = `
        <html>
          <body>
            <div id="count-data">3</div>
            <div id="trip-reports">
              <div class="item">
                <div class="listitem-title">
                  <a href="https://www.wta.org/report1">Test 1 — Jan. 1, 2026</a>
                </div>
                <div class="region"><span class="region">Test</span></div>
                <div class="wta-icon-headline"><span class="wta-icon-headline__text">User</span></div>
                <div class="media-indicator">1 photo</div>
              </div>
              <div class="item">
                <div class="listitem-title">
                  <a href="https://www.wta.org/report2">Test 2 — Jan. 2, 2026</a>
                </div>
                <div class="region"><span class="region">Test</span></div>
                <div class="wta-icon-headline"><span class="wta-icon-headline__text">User</span></div>
                <div class="media-indicator">10 Photos</div>
              </div>
              <div class="item">
                <div class="listitem-title">
                  <a href="https://www.wta.org/report3">Test 3 — Jan. 3, 2026</a>
                </div>
                <div class="region"><span class="region">Test</span></div>
                <div class="wta-icon-headline"><span class="wta-icon-headline__text">User</span></div>
                <div class="media-indicator">No photos</div>
              </div>
            </div>
          </body>
        </html>
      `;

      const params: WtaQueryParams = { region: 'test', page: 1 };
      mockedCache.get.mockReturnValue(null);
      mockedAxios.get.mockResolvedValue({ data: photoVariationsHtml });

      const result = await getTripReports(params);

      expect(result.reports[0].photoCount).toBe(1);
      expect(result.reports[1].photoCount).toBe(10);
      expect(result.reports[2].photoCount).toBe(0);
    });
  });
});
