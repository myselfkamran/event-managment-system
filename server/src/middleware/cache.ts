import { Request, Response, NextFunction } from "express";
import { cacheUtils, CACHE_EXPIRY } from "../config/redis.js";
import { AuthenticatedRequest } from "../types/index.js";

interface CacheOptions {
  key?: string;
  expireSeconds?: number;
  condition?: (req: Request, res: Response) => boolean;
}

// Cache middleware for API responses
export const cacheMiddleware = (options: CacheOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate cache key
      const cacheKey = options.key || `${req.method}:${req.originalUrl}`;

      // Check if we should skip caching based on condition
      if (options.condition && !options.condition(req, res)) {
        return next();
      }

      // Try to get cached response
      const cachedResponse = await cacheUtils.get(cacheKey);

      if (cachedResponse) {
        console.log(`📦 Cache hit for key: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      // Store original send method
      const originalSend = res.json;

      // Override res.json to cache the response
      res.json = function (data: any) {
        // Cache the response
        const expireTime = options.expireSeconds || CACHE_EXPIRY.EVENT_LIST;
        cacheUtils
          .set(cacheKey, data, expireTime)
          .then(() => console.log(`💾 Cached response for key: ${cacheKey}`))
          .catch((err) => console.error("Cache set error:", err));

        // Call original send method
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (keys: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Invalidate cache keys
      for (const key of keys) {
        await cacheUtils.del(key);
        console.log(`🗑️  Invalidated cache key: ${key}`);
      }
      next();
    } catch (error) {
      console.error("Cache invalidation error:", error);
      next();
    }
  };
};

// User session cache middleware
export const sessionCache = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next();
    }

    const sessionKey = `session:${req.user.id}`;
    const cachedSession = await cacheUtils.get(sessionKey);

    if (cachedSession) {
      // Extend session cache
      await cacheUtils.set(
        sessionKey,
        cachedSession,
        CACHE_EXPIRY.USER_SESSION
      );
    }

    next();
  } catch (error) {
    console.error("Session cache error:", error);
    next();
  }
};
