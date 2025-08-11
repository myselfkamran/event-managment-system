import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Create Redis client
const redis = new Redis(redisConfig);

// Handle Redis connection events
redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (error) => {
  console.error("❌ Redis connection error:", error);
});

redis.on("close", () => {
  console.log("🔌 Redis connection closed");
});

// Cache utility functions
export const cacheUtils = {
  // Set cache with expiration
  async set(key: string, value: any, expireSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (expireSeconds) {
        await redis.setex(key, expireSeconds, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },

  // Get cache value
  async get(key: string): Promise<any> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  // Delete cache key
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  },

  // Delete cache keys matching a pattern
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🗑️ Deleted ${keys.length} cache keys matching pattern: ${pattern}`
        );
      }
    } catch (error) {
      console.error("Cache pattern delete error:", error);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  },

  // Set multiple cache keys
  async mset(
    keyValuePairs: Record<string, any>,
    expireSeconds?: number
  ): Promise<void> {
    try {
      const serializedPairs: Record<string, string> = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = JSON.stringify(value);
      }

      if (expireSeconds) {
        const pipeline = redis.pipeline();
        for (const [key, value] of Object.entries(serializedPairs)) {
          pipeline.setex(key, expireSeconds, value);
        }
        await pipeline.exec();
      } else {
        await redis.mset(serializedPairs);
      }
    } catch (error) {
      console.error("Cache mset error:", error);
    }
  },

  // Get multiple cache keys
  async mget(keys: string[]): Promise<any[]> {
    try {
      const values = await redis.mget(keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      console.error("Cache mget error:", error);
      return keys.map(() => null);
    }
  },

  // Clear all cache
  async flushAll(): Promise<void> {
    try {
      await redis.flushall();
    } catch (error) {
      console.error("Cache flush error:", error);
    }
  },
};

// Cache keys constants
export const CACHE_KEYS = {
  // Event caching
  POPULAR_EVENTS: "popular_events",
  EVENT_DETAILS: (eventId: number) => `event:${eventId}`,
  EVENT_LIST: (page: number, limit: number) =>
    `events:page:${page}:limit:${limit}`,

  // User session caching
  USER_SESSION: (userId: number) => `session:${userId}`,
  USER_PROFILE: (userId: number) => `user:${userId}`,

  // General caching
  API_RATE_LIMIT: (ip: string) => `rate_limit:${ip}`,
};

// Cache expiration times (in seconds)
export const CACHE_EXPIRY = {
  POPULAR_EVENTS: 300, // 5 minutes
  EVENT_DETAILS: 600, // 10 minutes
  EVENT_LIST: 300, // 5 minutes
  USER_SESSION: 3600, // 1 hour
  USER_PROFILE: 1800, // 30 minutes
  API_RATE_LIMIT: 60, // 1 minute
};

export default redis;
