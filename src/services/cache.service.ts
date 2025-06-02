import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import crypto from 'crypto';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

class CacheService {
  private client: RedisClientType;
  private connected = false;

  constructor() {
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  private generateKey(prefix: string, params: any): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  async get<T>(prefix: string, params: any): Promise<T | null> {
    await this.connect();
    
    const key = this.generateKey(prefix, params);
    const cached = await this.client.get(key);
    
    if (!cached) {
      return null;
    }

    try {
      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Update hit count
      entry.hits++;
      await this.client.set(key, JSON.stringify(entry), {
        EX: config.cache.ttl,
      });
      
      return entry.data;
    } catch (error) {
      console.error('Error parsing cached data:', error);
      await this.client.del(key);
      return null;
    }
  }

  async set<T>(prefix: string, params: any, data: T): Promise<void> {
    await this.connect();
    
    const key = this.generateKey(prefix, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
    };

    await this.client.set(key, JSON.stringify(entry), {
      EX: config.cache.ttl,
    });
  }

  async invalidate(prefix: string, params?: any): Promise<void> {
    await this.connect();
    
    if (params) {
      // Invalidate specific cache entry
      const key = this.generateKey(prefix, params);
      await this.client.del(key);
    } else {
      // Invalidate all entries with prefix
      const keys = await this.client.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    }
  }

  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    topKeys: Array<{ key: string; hits: number }>;
  }> {
    await this.connect();
    
    const keys = await this.client.keys('*');
    const info = await this.client.info('memory');
    
    // Get top keys by hits
    const keyStats: Array<{ key: string; hits: number }> = [];
    
    for (const key of keys.slice(0, 100)) { // Sample first 100 keys
      try {
        const value = await this.client.get(key);
        if (value) {
          const entry = JSON.parse(value);
          if (entry.hits !== undefined) {
            keyStats.push({ key, hits: entry.hits });
          }
        }
      } catch (error) {
        // Skip invalid entries
      }
    }
    
    keyStats.sort((a, b) => b.hits - a.hits);
    
    return {
      totalKeys: keys.length,
      memoryUsage: info.match(/used_memory_human:(.+)/)?.[1] || 'unknown',
      topKeys: keyStats.slice(0, 10),
    };
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
}

export const cacheService = new CacheService();