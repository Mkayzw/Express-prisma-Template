import { z } from 'zod';
import { createUserSchema, updateUserSchema, userQuerySchema } from './user.schema';

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryParams = z.infer<typeof userQuerySchema>;
