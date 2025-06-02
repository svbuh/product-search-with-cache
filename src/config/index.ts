import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  node: z.object({
    env: z.enum(['development', 'production', 'test']),
    port: z.number(),
  }),
  opensearch: z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
  }),
  redis: z.object({
    host: z.string(),
    port: z.number(),
    password: z.string().optional(),
  }),
  gemini: z.object({
    apiKey: z.string(),
  }),
  cache: z.object({
    ttl: z.number(),
    maxSize: z.number(),
  }),
  search: z.object({
    maxResults: z.number(),
    timeoutMs: z.number(),
  }),
});

export const config = configSchema.parse({
  node: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
  },
  opensearch: {
    host: process.env.OPENSEARCH_HOST || 'localhost',
    port: parseInt(process.env.OPENSEARCH_PORT || '9201', 10),
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
  },
  search: {
    maxResults: parseInt(process.env.MAX_SEARCH_RESULTS || '50', 10),
    timeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS || '5000', 10),
  },
});