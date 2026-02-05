import { z } from 'zod';

export const emailJobSchema = z.object({
  body: z.object({
    to: z.string().email({ message: 'Invalid email address' }),
    subject: z.string().min(1, { message: 'Subject is required' }),
    body: z.string().min(1, { message: 'Body is required' }),
    template: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const cleanupJobSchema = z.object({
  body: z.object({
    type: z.enum(['expired_sessions', 'old_logs', 'orphaned_data'], {
      message: 'Invalid cleanup type',
    }),
    olderThanDays: z.number().int().positive().optional(),
  }),
});
