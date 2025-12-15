# Database

This boilerplate uses **Prisma ORM** with **PostgreSQL**.

## Schema

The schema is defined in `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum Role {
  USER
  ADMIN
}
```

## Commands

```bash
# Generate Prisma client after schema changes
pnpm run generate

# Create and run migrations
pnpm run migrate

# Deploy migrations in production
pnpm run migrate:deploy

# Seed the database
pnpm run seed
```

## Using the Client

```typescript
import { prisma } from './db/client';

// Find all users
const users = await prisma.user.findMany();

// Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: hashedPassword,
  },
});

// Update a user
await prisma.user.update({
  where: { id: userId },
  data: { firstName: 'John' },
});
```

## Base CRUD Service

Use the `createCrudService` factory for common operations:

```typescript
import { createCrudService } from './lib/baseCrud';

const postService = createCrudService({
  model: 'post',
  defaultSelect: { id: true, title: true, createdAt: true },
  searchFields: ['title', 'content'],
  softDelete: true,
});

// Paginated list
const { data, pagination } = await postService.findAll({
  page: 1,
  limit: 10,
  search: 'hello',
});
```

## Adding New Models

1. Add the model to `prisma/schema.prisma`
2. Run `pnpm run migrate` to create migration
3. Run `pnpm run generate` to update the client
4. Create a new module in `src/modules/`
