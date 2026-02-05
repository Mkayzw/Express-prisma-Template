import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
});
