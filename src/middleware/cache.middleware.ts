import { Request, Response, NextFunction } from 'express';
import { cache } from '../lib/redis';
import logger from '../utils/logger';

interface CacheOptions {
    ttl?: number; // Time to live in seconds
    keyGenerator?: (req: Request) => string;
}

const defaultKeyGenerator = (req: Request): string => {
    const queryString = JSON.stringify(req.query);
    return `cache:${req.method}:${req.originalUrl}:${queryString}`;
};

export const cacheMiddleware = (options: CacheOptions = {}) => {
    const { ttl = 300, keyGenerator = defaultKeyGenerator } = options;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            next();
            return;
        }

        const cacheKey = keyGenerator(req);

        try {
            // Try to get from cache
            const cachedData = await cache.get<{ body: unknown; statusCode: number }>(cacheKey);

            if (cachedData) {
                logger.debug(`Cache hit: ${cacheKey}`);
                res.status(cachedData.statusCode).json(cachedData.body);
                return;
            }

            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to cache the response
            res.json = (body: unknown): Response => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache.set(cacheKey, { body, statusCode: res.statusCode }, ttl).catch((err) => {
                        logger.error('Failed to cache response:', err);
                    });
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error);
            next();
        }
    };
};

// Utility to invalidate cache by pattern
export const invalidateCache = async (pattern: string): Promise<void> => {
    await cache.delPattern(pattern);
    logger.debug(`Cache invalidated: ${pattern}`);
};
