import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CacheEntry } from '../types';

export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD || undefined,
      db: config.REDIS_DB,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(this.getKey(key));
      if (!data) return null;

      const entry: CacheEntry<T> = JSON.parse(data);
      
      // Check if cache entry has expired
      if (Date.now() > entry.timestamp + entry.ttl * 1000) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const actualTtl = ttl || config.REDIS_CACHE_TTL;
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: actualTtl,
      };

      await this.client.setex(
        this.getKey(key),
        actualTtl,
        JSON.stringify(entry)
      );
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      logger.error('Redis delete error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      const keys = await this.client.keys(`${config.CACHE_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Redis flush error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.client.incrby(this.getKey(key), by);
    } catch (error) {
      logger.error('Redis increment error:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(this.getKey(key), seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
    }
  }

  private getKey(key: string): string {
    return `${config.CACHE_KEY_PREFIX}${key}`;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}