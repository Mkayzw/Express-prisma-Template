# Caching

Redis-powered caching layer for high-performance API responses.

## What You'll Learn

- How the caching architecture works
- Using the Redis cache client
- Response caching middleware
- Cache invalidation strategies
- Best practices

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Express   │────▶│  PostgreSQL │
│   Request   │     │     API     │     │   Database  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                   ┌──────▼──────┐
                   │    Redis    │
                   │   (Cache)   │
                   └─────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
       ┌──────▼──────┐         ┌──────▼──────┐
       │  Response   │         │   Session   │
       │   Cache     │         │   Storage   │
       └─────────────┘         └─────────────┘
```

## Redis Client

Direct cache operations using the Redis client:

```typescript
import { cache } from '../lib/redis';

// Set with TTL (seconds)
await cache.set('user:123', userData, 3600);  // 1 hour

// Get (returns null if not found)
const user = await cache.get<User>('user:123');

// Delete single key
await cache.del('user:123');

// Delete by pattern
await cache.delPattern('user:*');  // All user cache
await cache.delPattern('cache:GET:/api/v1/users/*');  // Response cache

// Check existence
const exists = await cache.exists('user:123');

// Set multiple
await cache.mset({
  'user:1': user1,
  'user:2': user2,
}, 3600);
```

## Response Caching Middleware

Automatically cache entire API responses:

```typescript
import { cacheMiddleware } from '../middleware/cache.middleware';

// Cache for 5 minutes (default)
router.get('/posts', cacheMiddleware(), getPosts);

// Custom TTL (in seconds)
router.get('/stats', cacheMiddleware({ ttl: 60 }), getStats);

// Custom cache key
router.get('/user/:id', cacheMiddleware({
  ttl: 300,
  keyGenerator: (req) => `user:${req.params.id}`,
}), getUser);

// Skip caching for authenticated users
router.get('/feed', cacheMiddleware({
  ttl: 60,
  condition: (req) => !req.user,  // Only cache for guests
}), getFeed);
```

### How It Works

1. Middleware checks Redis for cached response
2. If found, returns cached data (skips handler)
3. If not found, executes handler
4. Stores response in Redis with TTL
5. Subsequent requests get cached response

### Cache Key Format

Default format: `cache:{METHOD}:{URL}`

Example: `cache:GET:/api/v1/posts?page=1&limit=10`

## Cache Invalidation

### Manual Invalidation

```typescript
import { invalidateCache } from '../middleware/cache.middleware';

// After creating/updating a post
await invalidateCache('cache:GET:/api/v1/posts*');

// After updating a user
await invalidateCache(`cache:GET:/api/v1/users/${userId}`);
await invalidateCache('cache:GET:/api/v1/users*');
```

### Service-Level Invalidation

Integrate with your service layer:

```typescript
// posts.service.ts
export const createPost = async (data: CreatePostDto) => {
  const post = await prisma.post.create({ data });
  
  // Invalidate list caches
  await cache.delPattern('cache:GET:/api/v1/posts*');
  
  return post;
};

export const updatePost = async (id: string, data: UpdatePostDto) => {
  const post = await prisma.post.update({ where: { id }, data });
  
  // Invalidate specific and list caches
  await cache.del(`cache:GET:/api/v1/posts/${id}`);
  await cache.delPattern('cache:GET:/api/v1/posts*');
  
  return post;
};
```

## Caching Strategies

### Cache-Aside (Lazy Loading)

```typescript
const getUser = async (id: string) => {
  // Try cache first
  const cached = await cache.get<User>(`user:${id}`);
  if (cached) return cached;
  
  // Fetch from database
  const user = await prisma.user.findUnique({ where: { id } });
  
  // Store in cache
  if (user) {
    await cache.set(`user:${id}`, user, 3600);
  }
  
  return user;
};
```

### Write-Through

```typescript
const updateUser = async (id: string, data: UpdateUserDto) => {
  // Update database
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  
  // Update cache immediately
  await cache.set(`user:${id}`, user, 3600);
  
  return user;
};
```

## Health Check

```typescript
import RedisClient from '../lib/redis';

const isHealthy = await RedisClient.isHealthy();
// Returns true if Redis is connected
```

## Configuration

```env
REDIS_URL="redis://localhost:6379"

# With authentication
REDIS_URL="redis://:password@localhost:6379"

# With database number
REDIS_URL="redis://localhost:6379/1"
```

## Best Practices

1. **Use appropriate TTLs**
   - Frequently changing data: 1-5 minutes
   - Semi-static data: 1-24 hours
   - Static data: days or longer

2. **Cache at the right level**
   - Response caching for read-heavy endpoints
   - Object caching for frequently accessed entities
   - Query caching for expensive database queries

3. **Implement cache warming**
   - Pre-populate cache on startup for critical data
   - Use background jobs to refresh cache before expiry

4. **Monitor cache performance**
   - Track hit/miss ratios
   - Alert on high miss rates
   - Monitor Redis memory usage

5. **Handle cache failures gracefully**
   - Fall back to database on cache errors
   - Don't let cache issues crash your app
