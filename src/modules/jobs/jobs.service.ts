import { emailQueue, cleanupQueue, notificationQueue } from '../../lib/queue';
import { EmailJobData, CleanupJobData, NotificationJobData, JobInfo } from './jobs.types';
import logger from '../../utils/logger';

export const addEmailJob = async (data: EmailJobData, options?: { delay?: number; priority?: number }): Promise<string> => {
    const job = await emailQueue.add('send-email', data, {
        delay: options?.delay,
        priority: options?.priority,
    });
    logger.info(`Email job ${job.id} added: ${data.subject} -> ${data.to}`);
    return job.id!;
};

export const addCleanupJob = async (data: CleanupJobData, options?: { delay?: number }): Promise<string> => {
    const job = await cleanupQueue.add('cleanup', data, {
        delay: options?.delay,
    });
    logger.info(`Cleanup job ${job.id} added: ${data.type}`);
    return job.id!;
};

export const addNotificationJob = async (data: NotificationJobData): Promise<string> => {
    const job = await notificationQueue.add('notify', data, {
        priority: 1, // High priority
    });
    logger.info(`Notification job ${job.id} added: ${data.type} for user ${data.userId}`);
    return job.id!;
};

export const getJobStatus = async (queueName: string, jobId: string): Promise<JobInfo | null> => {
    let queue;
    switch (queueName) {
        case 'email':
            queue = emailQueue;
            break;
        case 'cleanup':
            queue = cleanupQueue;
            break;
        case 'notification':
            queue = notificationQueue;
            break;
        default:
            return null;
    }

    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();

    return {
        id: job.id!,
        name: job.name,
        data: job.data,
        status: state,
        progress: job.progress as number,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };
};

export const getQueueStats = async (queueName: string) => {
    let queue;
    switch (queueName) {
        case 'email':
            queue = emailQueue;
            break;
        case 'cleanup':
            queue = cleanupQueue;
            break;
        case 'notification':
            queue = notificationQueue;
            break;
        default:
            return null;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
    ]);

    return {
        name: queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
    };
};

// Schedule recurring cleanup (call this on startup if needed)
export const scheduleCleanupJobs = async (): Promise<void> => {
    // Clean expired sessions daily
    await cleanupQueue.add(
        'daily-cleanup',
        { type: 'expired_sessions', olderThanDays: 7 },
        {
            repeat: {
                pattern: '0 0 * * *', // Every day at midnight
            },
        }
    );
    logger.info('Scheduled daily cleanup job');
};
