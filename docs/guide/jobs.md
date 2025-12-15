# Background Jobs

BullMQ-powered job queues for async processing.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   API Server │────▶│    Redis     │◀────│   Workers    │
│  (adds jobs) │     │   (queue)    │     │ (processes)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Starting the Worker

```bash
# Development
pnpm run dev:worker

# Production
pnpm run start:worker
```

## Pre-defined Queues

- `email` - Email sending
- `cleanup` - Database/cache maintenance
- `notification` - User notifications

## Adding Jobs

```typescript
import { addEmailJob, addCleanupJob } from './modules/jobs/jobs.service';

// Add email job
await addEmailJob({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up.',
});

// Add with delay (5 minutes)
await addEmailJob(data, { delay: 5 * 60 * 1000 });

// Add cleanup job
await addCleanupJob({ type: 'expired_sessions' });
```

## Creating Custom Workers

1. Create a worker file in `src/workers/`:

```typescript
// src/workers/myworker.worker.ts
import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue';

const myWorker = new Worker(
  'my-queue',
  async (job: Job) => {
    console.log(`Processing ${job.id}`);
    // Your logic here
    return { success: true };
  },
  { connection, concurrency: 5 }
);

export default myWorker;
```

2. Register in `src/workers/index.ts`:

```typescript
import myWorker from './myworker.worker';

const workers = [emailWorker, cleanupWorker, myWorker];
```

## Job Status API

Admin-only endpoints:

```http
GET /api/v1/jobs/:queue/:jobId
Authorization: Bearer <admin_token>
```

```http
GET /api/v1/jobs/:queue/stats
Authorization: Bearer <admin_token>
```
