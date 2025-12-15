import { Worker, Job } from 'bullmq';
import { connection } from '../lib/queue';
import logger from '../utils/logger';

interface EmailJobData {
    to: string;
    subject: string;
    body: string;
    template?: string;
    context?: Record<string, unknown>;
}

// Email worker - handles email sending jobs
const emailWorker = new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
        const { to, subject, body, template } = job.data;

        logger.info(`Processing email job ${job.id}: ${subject} -> ${to}`);

        // TODO: Integrate with actual email service (SendGrid, SES, etc.)
        // For now, just simulate sending
        await new Promise((resolve) => setTimeout(resolve, 1000));

        logger.info(`Email sent successfully: ${job.id}`);

        return { sent: true, to, subject };
    },
    {
        connection,
        concurrency: 5,
    }
);

emailWorker.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed:`, err);
});

export default emailWorker;
