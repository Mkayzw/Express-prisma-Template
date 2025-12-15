import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import config from '../config';
import logger from '../utils/logger';

// Redis connection options from config
const connection = {
    host: new URL(config.redisUrl).hostname,
    port: parseInt(new URL(config.redisUrl).port || '6379', 10),
};

// Default job options
const defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000,
    },
    removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 1000,    // Keep last 1000 completed jobs
    },
    removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
};

// Queue registry for management
const queues: Map<string, Queue> = new Map();

export const createQueue = (name: string, options?: Partial<QueueOptions>): Queue => {
    if (queues.has(name)) {
        return queues.get(name)!;
    }

    const queue = new Queue(name, {
        connection,
        defaultJobOptions,
        ...options,
    });

    // Queue event listeners
    queue.on('error', (error) => {
        logger.error(`Queue ${name} error:`, error);
    });

    queues.set(name, queue);
    logger.info(`Queue "${name}" created`);

    return queue;
};

export const getQueue = (name: string): Queue | undefined => {
    return queues.get(name);
};

export const closeAllQueues = async (): Promise<void> => {
    const closePromises = Array.from(queues.values()).map((queue) => queue.close());
    await Promise.all(closePromises);
    queues.clear();
    logger.info('All queues closed');
};

// Pre-defined queues
export const emailQueue = createQueue('email');
export const cleanupQueue = createQueue('cleanup');
export const notificationQueue = createQueue('notification');

export { connection };
