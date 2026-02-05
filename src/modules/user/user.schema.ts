import { z } from 'zod';
import { emailSchema, passwordSchema, paginationSchema } from '../../lib/validation';

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export const userQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});
