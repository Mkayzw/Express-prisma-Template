import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';

class RedisClient {
    private static instance: Redis | null = null;
    private static isConnected = false;

    static getInstance(): Redis {
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis(config.redisUrl, {
                maxRetriesPerRequest: 3,
                lazyConnect: true,
            });

            RedisClient.instance.on('connect', () => {
                RedisClient.isConnected = true;
                logger.info('Redis connected');
            });

            RedisClient.instance.on('error', (err) => {
                RedisClient.isConnected = false;
                logger.error('Redis error:', err);
            });

            RedisClient.instance.on('close', () => {
                RedisClient.isConnected = false;
                logger.warn('Redis connection closed');
            });
        }

        return RedisClient.instance;
    }

    static async connect(): Promise<void> {
        const client = RedisClient.getInstance();
        if (!RedisClient.isConnected) {
            await client.connect();
        }
    }

    static async disconnect(): Promise<void> {
        if (RedisClient.instance) {
            await RedisClient.instance.quit();
            RedisClient.instance = null;
            RedisClient.isConnected = false;
            logger.info('Redis disconnected');
        }
    }

    static async isHealthy(): Promise<boolean> {
        try {
            const client = RedisClient.getInstance();
            const result = await client.ping();
            return result === 'PONG';
        } catch {
            return false;
        }
    }
}

// Cache utilities
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        const client = RedisClient.getInstance();
        const value = await client.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    },

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const client = RedisClient.getInstance();
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            await client.setex(key, ttlSeconds, serialized);
        } else {
            await client.set(key, serialized);
        }
    },

    async del(key: string): Promise<void> {
        const client = RedisClient.getInstance();
        await client.del(key);
    },

    async delPattern(pattern: string): Promise<void> {
        const client = RedisClient.getInstance();
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
        }
    },

    async exists(key: string): Promise<boolean> {
        const client = RedisClient.getInstance();
        const result = await client.exists(key);
        return result === 1;
    },

    async ttl(key: string): Promise<number> {
        const client = RedisClient.getInstance();
        return client.ttl(key);
    },
};

export const redis = RedisClient.getInstance();
export default RedisClient;
