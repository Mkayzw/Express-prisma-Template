import { z } from 'zod';
import { emailSchema } from '../../lib/validation';

export const emailJobSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const cleanupJobSchema = z.object({
  olderThanDays: z.number().int().positive(),
  type: z.string().optional(),
});

export const jobParamsSchema = z.object({
  queue: z.string().min(1),
  jobId: z.string().min(1),
});

export const queueParamsSchema = z.object({
  queue: z.string().min(1),
});
