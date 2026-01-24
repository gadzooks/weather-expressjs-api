import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-1'
});
const BUCKET = process.env.S3_CACHE_BUCKET || 'gadzooks-sam-artifacts';
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
const CACHE_PREFIX = `weather-cache/${ENVIRONMENT}/`;

export interface CachedData<T> {
  data: T;
  expiresAt: number;
  cachedAt: number;
}

/**
 * Retrieves cached data from S3
 * @param key - Cache key (e.g., 'forecasts-real')
 * @returns Cached data if valid and not expired, null otherwise
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `${CACHE_PREFIX}${key}.json`
      })
    );

    const body = await response.Body?.transformToString();
    if (!body) {
      return null;
    }

    const cached: CachedData<T> = JSON.parse(body);

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      console.log(`Cache expired for key: ${key}`);
      return null;
    }

    console.log(`Cache hit for key: ${key}`);
    return cached.data;
  } catch (error) {
    // NoSuchKey error is expected for cache misses
    if (error instanceof Error && error.name === 'NoSuchKey') {
      console.log(`Cache miss for key: ${key}`);
      return null;
    }

    // Log unexpected errors but don't throw - degrade gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`S3 cache read error for key ${key}:`, errorMessage);
    return null;
  }
}

/**
 * Stores data in S3 cache with TTL
 * @param key - Cache key (e.g., 'forecasts-real')
 * @param data - Data to cache
 * @param ttlHours - Time to live in hours
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttlHours: number
): Promise<void> {
  const cached: CachedData<typeof data> = {
    data,
    expiresAt: Date.now() + ttlHours * 60 * 60 * 1000,
    cachedAt: Date.now()
  };

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${CACHE_PREFIX}${key}.json`,
        Body: JSON.stringify(cached),
        ContentType: 'application/json',
        Metadata: {
          environment: ENVIRONMENT,
          cacheKey: key,
          ttlHours: ttlHours.toString()
        }
      })
    );

    console.log(`Cache set for key: ${key} (TTL: ${ttlHours}h)`);
  } catch (error) {
    // Log error but don't throw - allow application to continue without cache
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`S3 cache write error for key ${key}:`, errorMessage);
  }
}

/**
 * Gets the S3 cache key path for the current environment
 * Useful for debugging and testing
 */
export function getCacheKeyPath(key: string): string {
  return `s3://${BUCKET}/${CACHE_PREFIX}${key}.json`;
}
