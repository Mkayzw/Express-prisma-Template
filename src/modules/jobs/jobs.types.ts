export interface EmailJobData {
    to: string;
    subject: string;
    body: string;
    template?: string;
    context?: Record<string, unknown>;
}

export interface CleanupJobData {
    type: 'expired_sessions' | 'old_logs' | 'orphaned_data';
    olderThanDays?: number;
}

export interface NotificationJobData {
    userId: string;
    type: 'email' | 'push' | 'sms';
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

export interface JobInfo {
    id: string;
    name: string;
    data: unknown;
    status: string;
    progress: number;
    attemptsMade: number;
    failedReason?: string;
    createdAt: Date;
    processedAt?: Date;
    finishedAt?: Date;
}
