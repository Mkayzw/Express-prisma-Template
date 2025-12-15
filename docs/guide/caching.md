# Caching

Redis-powered caching layer for performance.

## Redis Client

```typescript
import { cache } from './lib/redis';

// Set a value (with optional TTL in seconds)
await cache.set('user:123', userData, 3600);

// Get a value
const user = await cache.get<User>('user:123');

// Delete a key
await cache.del('user:123');

// Delete by pattern
await cache.delPattern('user:*');

// Check existence
const exists = await cache.exists('user:123');
```

## Response Caching Middleware

Cache entire API responses:

```typescript
import { cacheMiddleware } from './middleware/cache.middleware';

// Cache for 5 minutes (default)
router.get('/posts', cacheMiddleware(), getPosts);

// Custom TTL (in seconds)
router.get('/stats', cacheMiddleware({ ttl: 60 }), getStats);

// Custom key generator
router.get('/user/:id', cacheMiddleware({
  ttl: 300,
  keyGenerator: (req) => `user:${req.params.id}`,
}), getUser);
```

## Cache Invalidation

```typescript
import { invalidateCache } from './middleware/cache.middleware';

// After updating a user
await invalidateCache('cache:GET:/api/v1/users/*');
```

## Health Check

```typescript
import RedisClient from './lib/redis';

const isHealthy = await RedisClient.isHealthy();
```

## Configuration

Set `REDIS_URL` in your environment:

```env
REDIS_URL="redis://localhost:6379"
# Or with auth
REDIS_URL="redis://:password@localhost:6379"
```
