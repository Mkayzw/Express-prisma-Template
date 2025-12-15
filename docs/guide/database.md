# Database

Prisma ORM with PostgreSQL for type-safe database access.

## What You'll Learn

- Prisma schema and model definitions
- Running migrations and seeding
- Using the Prisma client
- Base CRUD service for common operations
- Adding new models step-by-step

## Overview

The database layer uses:

- **Prisma ORM** - Type-safe database queries
- **PostgreSQL** - Production-ready relational database
- **Migrations** - Version-controlled schema changes
- **Seeding** - Initial data population

## Schema

The schema is defined in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?  // Soft delete

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

# Create a new migration
pnpm run migrate

# Deploy migrations (production)
pnpm run migrate:deploy

# Reset database (development only!)
pnpm run db:reset

# Seed the database
pnpm run seed

# Open Prisma Studio (GUI)
pnpm run studio
```

## Using the Prisma Client

Import from the centralized client:

```typescript
import { prisma } from '../db/client';
```

### Basic Queries

```typescript
// Find all users
const users = await prisma.user.findMany();

// Find by ID
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// Find with filters
const admins = await prisma.user.findMany({
  where: { 
    role: 'ADMIN',
    deletedAt: null,  // Exclude soft-deleted
  },
});

// Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: hashedPassword,
    firstName: 'John',
  },
});

// Update a user
await prisma.user.update({
  where: { id: userId },
  data: { firstName: 'Jane' },
});

// Soft delete
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});

// Hard delete
await prisma.user.delete({
  where: { id: userId },
});
```

### Selecting Fields

```typescript
// Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    // password excluded
  },
});
```

### Pagination

```typescript
const users = await prisma.user.findMany({
  skip: 0,     // Offset
  take: 10,    // Limit
  orderBy: { createdAt: 'desc' },
});
```

## Base CRUD Service

Use the `createCrudService` factory for common operations with built-in pagination, search, and soft delete:

```typescript
import { createCrudService } from '../lib/baseCrud';

const userService = createCrudService({
  model: 'user',
  defaultSelect: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    createdAt: true,
  },
  searchFields: ['email', 'firstName', 'lastName'],
  softDelete: true,  // Use deletedAt column
});

// Paginated list with search
const { data, pagination } = await userService.findAll({
  page: 1,
  limit: 10,
  search: 'john',
  filter: { role: 'USER' },
});

// Get by ID
const user = await userService.findById(userId);

// Create
const newUser = await userService.create({
  email: 'user@example.com',
  password: hashedPassword,
});

// Update
const updated = await userService.update(userId, {
  firstName: 'Jane',
});

// Soft delete
await userService.delete(userId);

// Hard delete
await userService.hardDelete(userId);
```

## Relationships

### One-to-Many

```prisma
model User {
  id    String @id @default(cuid())
  posts Post[]
}

model Post {
  id       String @id @default(cuid())
  title    String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

Query with relations:

```typescript
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: true },
});
```

### Many-to-Many

```prisma
model Post {
  id       String     @id @default(cuid())
  title    String
  tags     PostTag[]
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  posts PostTag[]
}

model PostTag {
  postId String
  tagId  String
  post   Post   @relation(fields: [postId], references: [id])
  tag    Tag    @relation(fields: [tagId], references: [id])
  
  @@id([postId, tagId])
}
```

## Adding a New Model

### Step 1: Define the Model

Add to `prisma/schema.prisma`:

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@map("posts")
}
```

### Step 2: Create Migration

```bash
pnpm run migrate
# Enter migration name: "add_posts_table"
```

### Step 3: Generate Client

```bash
pnpm run generate
```

### Step 4: Create Module

```
src/modules/posts/
├── posts.controller.ts
├── posts.service.ts
├── posts.dto.ts
└── posts.routes.ts
```

### Step 5: Register Routes

In `src/app.ts`:

```typescript
import postsRoutes from './modules/posts/posts.routes';

app.use('/api/v1/posts', postsRoutes);
```

## Database Seeding

Define seed data in `prisma/seed.ts`:

```typescript
import { prisma } from '../src/db/client';
import { hash } from 'bcrypt';

async function main() {
  const password = await hash('password123', 12);
  
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password,
      firstName: 'Admin',
      role: 'ADMIN',
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:

```bash
pnpm run seed
```

## Best Practices

1. **Always use soft delete** for user-facing data
2. **Select only needed fields** to reduce data transfer
3. **Use transactions** for related operations:
   ```typescript
   await prisma.$transaction([
     prisma.user.update({ ... }),
     prisma.auditLog.create({ ... }),
   ]);
   ```
4. **Index frequently queried columns** in your schema:
   ```prisma
   model Post {
     authorId String
     @@index([authorId])
   }
   ```
