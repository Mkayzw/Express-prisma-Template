import { z } from 'zod';
import { loginSchema, registerSchema, changePasswordSchema } from './auth.schema';

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
  };
  tokens: TokenPair;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

export interface AccessTokenPayload {
  id: string;
  type: 'access';
}
