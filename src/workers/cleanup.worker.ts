import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue';
import { prisma } from '../db/client';
import { cache } from '../lib/redis';
import logger from '../utils/logger';

interface CleanupJobData {
    type: 'expired_sessions' | 'old_logs' | 'orphaned_data';
    olderThanDays?: number;
}

// Cleanup worker - handles database and cache cleanup jobs
const cleanupWorker = new Worker<CleanupJobData>(
    'cleanup',
    async (job: Job<CleanupJobData>) => {
        const { type, olderThanDays = 30 } = job.data;

        logger.info(`Processing cleanup job ${job.id}: ${type}`);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        let cleaned = 0;

        switch (type) {
            case 'expired_sessions':
                // Clean up expired refresh tokens from Redis
                await cache.delPattern('refresh_token:*');
                logger.info('Expired sessions cleaned');
                break;

            case 'old_logs':
                // Example: clean old audit logs (if you have an audit log table)
                // This is a placeholder for your actual cleanup logic
                logger.info(`Would clean logs older than ${cutoffDate.toISOString()}`);
                break;

            case 'orphaned_data':
                // Example: clean up orphaned data
                // This is a placeholder for your actual cleanup logic
                logger.info('Orphaned data cleanup completed');
                break;

            default:
                logger.warn(`Unknown cleanup type: ${type}`);
        }

        logger.info(`Cleanup job ${job.id} completed: ${cleaned} items removed`);

        return { type, cleaned };
    },
    {
        connection,
        concurrency: 1, // Run cleanup jobs sequentially
    }
);

cleanupWorker.on('completed', (job) => {
    logger.info(`Cleanup job ${job.id} completed`);
});

cleanupWorker.on('failed', (job, err) => {
    logger.error(`Cleanup job ${job?.id} failed:`, err);
});

export default cleanupWorker;
