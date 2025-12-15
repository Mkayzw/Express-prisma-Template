import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authGuard';
import {
    addEmailJob,
    addCleanupJob,
    getJobStatus,
    getQueueStats,
} from './jobs.controller';

const router = Router();

// All job routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Add jobs
router.post('/email', addEmailJob);
router.post('/cleanup', addCleanupJob);

// Job status
router.get('/:queue/:jobId', getJobStatus);

// Queue stats
router.get('/:queue/stats', getQueueStats);

export default router;
