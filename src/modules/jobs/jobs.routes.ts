import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authGuard';
import { validateRequest } from '../../middleware/validate';
import { emailJobSchema, cleanupJobSchema } from './jobs.schema';
import {
    addEmailJob,
    addCleanupJob,
    getJobStatus,
    getQueueStats,
} from './jobs.controller';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Background job management
 */

// All job routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /jobs/email:
 *   post:
 *     summary: Add email job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - body
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               template:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       201:
 *         description: Job added
 */
router.post('/email', validateRequest(emailJobSchema), addEmailJob);

/**
 * @swagger
 * /jobs/cleanup:
 *   post:
 *     summary: Add cleanup job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [expired_sessions, old_logs, orphaned_data]
 *               olderThanDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Job added
 */
router.post('/cleanup', validateRequest(cleanupJobSchema), addCleanupJob);

/**
 * @swagger
 * /jobs/{queue}/{jobId}:
 *   get:
 *     summary: Get job status
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queue
 *         required: true
 *         schema:
 *           type: string
 *           enum: [email, cleanup, notification]
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status
 *       404:
 *         description: Job not found
 */
router.get('/:queue/:jobId', getJobStatus);

/**
 * @swagger
 * /jobs/{queue}/stats:
 *   get:
 *     summary: Get queue stats
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queue
 *         required: true
 *         schema:
 *           type: string
 *           enum: [email, cleanup, notification]
 *     responses:
 *       200:
 *         description: Queue stats
 */
router.get('/:queue/stats', getQueueStats);

export default router;
