# Background Jobs

BullMQ-powered job queues for async processing with Redis.

## What You'll Learn

- Job queue architecture and workflow
- Starting the worker process
- Adding jobs to queues
- Creating custom workers
- Retry handling and error recovery
- Monitoring job status

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   API Server │────▶│    Redis     │◀────│   Worker     │
│  (Producer)  │     │   (Queue)    │     │  (Consumer)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │ addJob()           │                     │ process()
       └────────────────────┴─────────────────────┘
```

**Flow:**
1. API adds job to Redis queue
2. Worker picks up job from queue
3. Worker processes job
4. Job marked complete (or retried on failure)

## Starting the Worker

The worker runs as a separate process:

```bash
# Development (with hot reload)
pnpm run dev:worker

# Production
pnpm run start:worker
```

::: warning Important
Always run the worker alongside your API server. Jobs won't process without a running worker!
:::

## Pre-defined Queues

| Queue | Purpose | Example Jobs |
|-------|---------|--------------|
| `email` | Email notifications | Welcome emails, password resets |
| `cleanup` | Maintenance tasks | Expired session cleanup |
| `notification` | User notifications | Push notifications |

## Adding Jobs

### Email Jobs

```typescript
import { addEmailJob } from '../modules/jobs/jobs.service';

// Basic email
await addEmailJob({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up.',
});

// With delay (5 minutes)
await addEmailJob(data, { delay: 5 * 60 * 1000 });

// With priority (1 = highest)
await addEmailJob(data, { priority: 1 });
```

### Cleanup Jobs

```typescript
import { addCleanupJob } from '../modules/jobs/jobs.service';

await addCleanupJob({ type: 'expired_sessions' });
await addCleanupJob({ type: 'old_logs', daysOld: 30 });
```

### Generic Jobs

```typescript
import { addJob } from '../lib/queue';

await addJob('my-queue', { 
  type: 'process-image',
  imageUrl: 'https://...',
}, {
  delay: 1000,           // 1 second delay
  attempts: 3,           // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 1000,         // 1s, 2s, 4s...
  },
});
```

## Creating Custom Workers

### Step 1: Create Worker File

```typescript
// src/workers/image.worker.ts
import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue';
import logger from '../utils/logger';

interface ImageJobData {
  type: 'resize' | 'compress';
  imageUrl: string;
  width?: number;
  height?: number;
}

const imageWorker = new Worker<ImageJobData>(
  'image-processing',
  async (job: Job<ImageJobData>) => {
    logger.info(`Processing image job ${job.id}`, job.data);
    
    switch (job.data.type) {
      case 'resize':
        // Resize logic
        break;
      case 'compress':
        // Compress logic
        break;
    }
    
    return { success: true, processedAt: new Date() };
  },
  { 
    connection,
    concurrency: 5,  // Process 5 jobs simultaneously
  }
);

// Event handlers
imageWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

imageWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, err);
});

export default imageWorker;
```

### Step 2: Register Worker

```typescript
// src/workers/index.ts
import emailWorker from './email.worker';
import cleanupWorker from './cleanup.worker';
import imageWorker from './image.worker';

export const workers = [
  emailWorker,
  cleanupWorker,
  imageWorker,
];

// Graceful shutdown
export const shutdownWorkers = async () => {
  await Promise.all(workers.map(w => w.close()));
};
```

### Step 3: Add Queue Service

```typescript
// src/modules/jobs/jobs.service.ts
import { addJob } from '../../lib/queue';

export const addImageJob = async (
  data: ImageJobData,
  options?: JobOptions
) => {
  return addJob('image-processing', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    ...options,
  });
};
```

## Retry Handling

### Automatic Retries

```typescript
await addJob('my-queue', data, {
  attempts: 5,
  backoff: {
    type: 'exponential',  // or 'fixed'
    delay: 1000,          // Base delay in ms
  },
});
```

**Exponential backoff:** 1s → 2s → 4s → 8s → 16s

### Manual Retry Logic

```typescript
const worker = new Worker('my-queue', async (job) => {
  try {
    await processJob(job.data);
  } catch (error) {
    if (job.attemptsMade < job.opts.attempts!) {
      throw error;  // Will trigger retry
    }
    // Max retries reached, handle failure
    await handleJobFailure(job.id, error);
  }
});
```

## Job Status API

Admin-only endpoints for monitoring:

### Get Job Status

```http
GET /api/v1/jobs/:queue/:jobId
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "id": "123",
  "state": "completed",
  "progress": 100,
  "data": { ... },
  "returnvalue": { "success": true },
  "attemptsMade": 1,
  "failedReason": null
}
```

### Get Queue Stats

```http
GET /api/v1/jobs/:queue/stats
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "waiting": 5,
  "active": 2,
  "completed": 150,
  "failed": 3,
  "delayed": 10
}
```

## Scheduled Jobs

### Delayed Jobs

```typescript
// Process in 1 hour
await addJob('reminder', data, {
  delay: 60 * 60 * 1000,
});
```

### Repeating Jobs (Cron)

```typescript
import { Queue } from 'bullmq';
import { connection } from '../lib/queue';

const queue = new Queue('scheduled', { connection });

// Every day at midnight
await queue.add('daily-cleanup', {}, {
  repeat: {
    cron: '0 0 * * *',
  },
});

// Every 5 minutes
await queue.add('health-check', {}, {
  repeat: {
    every: 5 * 60 * 1000,
  },
});
```

## Best Practices

1. **Idempotency** - Jobs should be safe to retry
2. **Small payloads** - Store IDs, not full objects
3. **Timeouts** - Set reasonable job timeouts
4. **Logging** - Log job start, progress, and completion
5. **Error handling** - Always handle failures gracefully
6. **Monitoring** - Track queue depth and processing times

```typescript
// Example: Idempotent job
const worker = new Worker('email', async (job) => {
  // Check if already sent (idempotency)
  const sent = await cache.get(`email:sent:${job.id}`);
  if (sent) return { skipped: true };
  
  await sendEmail(job.data);
  
  // Mark as sent
  await cache.set(`email:sent:${job.id}`, true, 86400);
  
  return { success: true };
});
```
