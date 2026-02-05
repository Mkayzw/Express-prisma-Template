import { z } from 'zod';
import { emailJobSchema, cleanupJobSchema } from './jobs.schema';

export type EmailJobData = z.infer<typeof emailJobSchema>;
export type CleanupJobData = z.infer<typeof cleanupJobSchema>;

export interface NotificationJobData {
    userId: string;
    type: string;
    payload?: any;
}

export interface JobInfo {
    id: string;
    name: string;
    data: any;
    status: string;
    progress: number;
    attemptsMade: number;
    failedReason?: string;
    createdAt: Date;
    processedAt?: Date;
    finishedAt?: Date;
}
