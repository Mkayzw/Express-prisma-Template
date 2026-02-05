import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authGuard';
import { validateRequest } from '../../middleware/validateRequest';
import { emailJobSchema, cleanupJobSchema, jobParamsSchema, queueParamsSchema } from './jobs.schema';
import {
    addEmailJob,
    addCleanupJob,
    getJobStatus,
    getQueueStats,
} from './jobs.controller';

const router: Router = Router();

// All job routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Add jobs
router.post('/email', validateRequest({ body: emailJobSchema }), addEmailJob);
router.post('/cleanup', validateRequest({ body: cleanupJobSchema }), addCleanupJob);

// Job status
router.get('/:queue/:jobId', validateRequest({ params: jobParamsSchema }), getJobStatus);

// Queue stats
router.get('/:queue/stats', validateRequest({ params: queueParamsSchema }), getQueueStats);

export default router;
