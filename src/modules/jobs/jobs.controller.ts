import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authGuard';
import * as jobsService from './jobs.service';
import { EmailJobData, CleanupJobData } from './jobs.types';

export const addEmailJob = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data: EmailJobData = req.body;
        const jobId = await jobsService.addEmailJob(data);

        res.status(201).json({
            success: true,
            data: { jobId },
        });
    } catch (error) {
        next(error);
    }
};

export const addCleanupJob = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data: CleanupJobData = req.body;
        const jobId = await jobsService.addCleanupJob(data);

        res.status(201).json({
            success: true,
            data: { jobId },
        });
    } catch (error) {
        next(error);
    }
};

export const getJobStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { queue, jobId } = req.params;
        const job = await jobsService.getJobStatus(queue, jobId);

        if (!job) {
            res.status(404).json({
                success: false,
                error: 'Job not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: job,
        });
    } catch (error) {
        next(error);
    }
};

export const getQueueStats = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { queue } = req.params;
        const stats = await jobsService.getQueueStats(queue);

        if (!stats) {
            res.status(404).json({
                success: false,
                error: 'Queue not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};
