# Project Structure

Understanding how the codebase is organized.

## What You'll Learn

- Root directory layout and key files
- Source code organization in `src/`
- Module anatomy (controller, service, dto, routes)
- Where to add new features

## Overview

The boilerplate follows a modular, layered architecture that separates concerns and promotes maintainability. The structure scales from simple APIs to complex applications.

## Root Directory

```
Express-prisma-Template/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Prisma schema definition
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Database seeding
├── src/                    # Application source code
├── docs/                   # VitePress documentation
├── nginx/                  # NGINX configuration
├── docker-compose.yml      # Docker services
├── Dockerfile              # Container build
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── .env.example            # Environment template
```

## Source Code Structure

The `src/` directory contains all application code:

```
src/
├── app.ts                  # Express app setup
├── server.ts               # HTTP server entry point
├── worker.ts               # Background worker entry point
├── config/                 # Configuration module
│   └── index.ts            # Environment variables
├── db/                     # Database client
│   └── client.ts           # Prisma client instance
├── lib/                    # Shared utilities
│   ├── baseCrud.ts         # Generic CRUD factory
│   ├── errors.ts           # Custom error classes
│   ├── metrics.ts          # Prometheus metrics
│   ├── queue.ts            # BullMQ connection
│   ├── redis.ts            # Redis client & cache
│   └── validation.ts       # Zod utilities
├── middleware/             # Express middleware
│   ├── authGuard.ts        # JWT authentication
│   ├── cache.middleware.ts # Response caching
│   ├── errorHandler.ts     # Global error handling
│   └── tracing.middleware.ts # Request correlation
├── modules/                # Feature modules
│   ├── auth/               # Authentication
│   ├── user/               # User management
│   └── jobs/               # Job queue management
├── utils/                  # Utility functions
│   └── logger.ts           # Winston logger
└── workers/                # Background job processors
    ├── index.ts            # Worker registration
    ├── email.worker.ts     # Email processing
    └── cleanup.worker.ts   # Cleanup tasks
```

## Module Anatomy

Each feature module follows a consistent structure:

```
modules/auth/
├── auth.controller.ts      # HTTP request handlers
├── auth.service.ts         # Business logic
├── auth.dto.ts             # Zod schemas (validation)
└── auth.routes.ts          # Route definitions
```

### Controller
Handles HTTP requests and responses:

```typescript
// auth.controller.ts
export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  
  const tokens = await authService.login(result.data);
  res.json({ success: true, data: tokens });
};
```

### Service
Contains business logic, separated from HTTP layer:

```typescript
// auth.service.ts
export const login = async (data: LoginDto) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });
  
  if (!user || !await verifyPassword(data.password, user.password)) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  return generateTokens(user);
};
```

### DTO (Data Transfer Object)
Zod schemas for request validation:

```typescript
// auth.dto.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginDto = z.infer<typeof loginSchema>;
```

### Routes
Express router configuration:

```typescript
// auth.routes.ts
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

export default router;
```

## Lib Directory

Shared utilities used across modules:

| File | Purpose |
|------|---------|
| `baseCrud.ts` | Generic CRUD service factory |
| `errors.ts` | Custom error classes (ValidationError, NotFoundError, etc.) |
| `metrics.ts` | Prometheus metrics registry and helpers |
| `queue.ts` | BullMQ queue connection and helpers |
| `redis.ts` | Redis client with caching utilities |
| `validation.ts` | Zod validation helpers |

## Middleware Directory

Express middleware for cross-cutting concerns:

| File | Purpose |
|------|---------|
| `authGuard.ts` | JWT authentication and role authorization |
| `cache.middleware.ts` | Response caching with Redis |
| `errorHandler.ts` | Global error handling and formatting |
| `tracing.middleware.ts` | Request correlation IDs |

## Adding a New Feature

1. **Create module directory**
   ```bash
   mkdir src/modules/posts
   ```

2. **Create the files**
   ```
   src/modules/posts/
   ├── posts.controller.ts
   ├── posts.service.ts
   ├── posts.dto.ts
   └── posts.routes.ts
   ```

3. **Add Prisma model** (if needed)
   ```prisma
   // prisma/schema.prisma
   model Post {
     id        String   @id @default(cuid())
     title     String
     content   String
     authorId  String
     author    User     @relation(fields: [authorId], references: [id])
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

4. **Run migration**
   ```bash
   pnpm run migrate
   ```

5. **Register routes** in `app.ts`
   ```typescript
   import postsRoutes from './modules/posts/posts.routes';
   app.use('/api/v1/posts', postsRoutes);
   ```

## Design Principles

### Single Responsibility
Each file has one job: controllers handle HTTP, services handle logic, DTOs handle validation.

### Separation of Concerns
Business logic is isolated in services, making it testable and reusable.

### Modularity
Features are self-contained modules that can be added or removed independently.

### Type Safety
TypeScript and Zod provide compile-time and runtime type checking throughout.
