# Testing

Testing strategies and patterns for the API.

## What You'll Learn

- Test setup and configuration
- Running tests
- Unit testing patterns
- Integration testing
- Mocking patterns
- CI/CD configuration

## Test Setup

### Dependencies

The project uses:

- **Vitest** - Fast unit test runner
- **Supertest** - HTTP integration testing
- **Prisma Test Utils** - Database testing helpers

Install test dependencies:

```bash
pnpm install -D vitest supertest @types/supertest
```

### Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
```

### Test Setup File

Create `tests/setup.ts`:

```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/db/client';

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database between tests (optional)
  // await prisma.user.deleteMany();
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific file
pnpm test auth.test.ts

# Run specific test
pnpm test -t "should register user"
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Unit Tests

### Testing Services

```typescript
// tests/unit/auth.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/db/client';
import * as authService from '../../src/modules/auth/auth.service';
import { hash } from 'bcrypt';

vi.mock('../../src/db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await hash('password123', 12);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER',
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw for invalid password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: await hash('different', 12),
        role: 'USER',
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Testing Validators

```typescript
// tests/unit/auth.dto.test.ts
import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../src/modules/auth/auth.dto';

describe('Auth DTOs', () => {
  describe('registerSchema', () => {
    it('should validate correct data', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '123',
      });

      expect(result.success).toBe(false);
    });
  });
});
```

## Integration Tests

### Testing API Endpoints

```typescript
// tests/integration/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('Auth API', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'integration@test.com' } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'integration@test.com',
          password: 'password123',
          firstName: 'Test',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('integration@test.com');
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'integration@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });
  });
});
```

### Testing Protected Routes

```typescript
// tests/integration/users.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Users API', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'adminpass',
      });

    accessToken = response.body.data.tokens.accessToken;
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBeDefined();
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile');

      expect(response.status).toBe(401);
    });
  });
});
```

## Mocking Patterns

### Mocking Prisma

```typescript
vi.mock('../../src/db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));
```

### Mocking Redis

```typescript
vi.mock('../../src/lib/redis', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
  },
}));
```

### Mocking External Services

```typescript
vi.mock('../../src/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));
```

## Test Database

### Using Test Database

Set up a separate test database:

```env
# .env.test
DATABASE_URL="postgresql://postgres:password@localhost:5432/express_test_db"
```

### Reset Between Tests

```typescript
// tests/helpers/db.ts
import { prisma } from '../../src/db/client';

export const resetDatabase = async () => {
  await prisma.$transaction([
    prisma.user.deleteMany(),
    // Add other models
  ]);
};
```

## CI/CD Configuration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Generate Prisma client
        run: pnpm run generate

      - name: Run migrations
        run: pnpm run migrate:deploy
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/test_db

      - name: Run tests
        run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

1. **Test isolation** - Each test should be independent
2. **Clear naming** - Use descriptive test names
3. **AAA pattern** - Arrange, Act, Assert
4. **Mock external services** - Don't call real APIs in tests
5. **Test edge cases** - Invalid inputs, errors, limits
6. **Keep tests fast** - Mock slow operations
7. **CI integration** - Run tests on every PR
