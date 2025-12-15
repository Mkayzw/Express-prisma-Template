import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import { prisma } from '../../db/client';
import { cache } from '../../lib/redis';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../lib/errors';
import {
  LoginInput,
  RegisterInput,
  AuthResponse,
  ChangePasswordInput,
  TokenPair,
  AccessTokenPayload,
  RefreshTokenPayload,
} from './auth.types';

// Token expiry parsing helper
const parseExpiry = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // Default 1 hour

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 3600;
  }
};

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const USER_SESSIONS_PREFIX = 'user_sessions:';

// Generate access token (short-lived)
export const signAccessToken = (userId: string): string => {
  const payload: AccessTokenPayload = { id: userId, type: 'access' };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.accessTokenExpiresIn,
  } as jwt.SignOptions);
};

// Generate refresh token (long-lived, stored in Redis)
export const signRefreshToken = async (userId: string): Promise<string> => {
  const tokenId = uuidv4();
  const payload: RefreshTokenPayload = { userId, tokenId, type: 'refresh' };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.refreshTokenExpiresIn,
  } as jwt.SignOptions);

  // Store in Redis with expiry
  const ttl = parseExpiry(config.refreshTokenExpiresIn);
  await cache.set(`${REFRESH_TOKEN_PREFIX}${tokenId}`, { userId, createdAt: Date.now() }, ttl);

  // Track user sessions
  const sessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
  const sessions = await cache.get<string[]>(sessionsKey) || [];
  sessions.push(tokenId);
  await cache.set(sessionsKey, sessions, ttl);

  return token;
};

// Generate token pair
export const generateTokens = async (userId: string): Promise<TokenPair> => {
  const accessToken = signAccessToken(userId);
  const refreshToken = await signRefreshToken(userId);
  return { accessToken, refreshToken };
};

// Backward compatibility
export const signToken = signAccessToken;

export const login = async (loginData: LoginInput): Promise<AuthResponse> => {
  const { email, password } = loginData;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const tokens = await generateTokens(user.id);
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
};

export const register = async (registerData: RegisterInput): Promise<AuthResponse> => {
  const { email, password, firstName, lastName } = registerData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
  });

  const tokens = await generateTokens(user.id);
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
};

export const changePassword = async (userId: string, passwordData: ChangePasswordInput): Promise<void> => {
  const { currentPassword, newPassword } = passwordData;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Invalidate all sessions on password change
  await logoutAll(userId);
};

export const refreshAccessToken = async (refreshToken: string): Promise<TokenPair> => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Check if refresh token exists in Redis
    const stored = await cache.get<{ userId: string }>(`${REFRESH_TOKEN_PREFIX}${decoded.tokenId}`);

    if (!stored || stored.userId !== decoded.userId) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Rotate refresh token (invalidate old, create new)
    await cache.del(`${REFRESH_TOKEN_PREFIX}${decoded.tokenId}`);

    // Generate new token pair
    return generateTokens(decoded.userId);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
};

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as RefreshTokenPayload;
    await cache.del(`${REFRESH_TOKEN_PREFIX}${decoded.tokenId}`);

    // Remove from user sessions
    const sessionsKey = `${USER_SESSIONS_PREFIX}${decoded.userId}`;
    const sessions = await cache.get<string[]>(sessionsKey) || [];
    const filtered = sessions.filter((id) => id !== decoded.tokenId);
    if (filtered.length > 0) {
      await cache.set(sessionsKey, filtered);
    } else {
      await cache.del(sessionsKey);
    }
  } catch {
    // Token already invalid, no action needed
  }
};

export const logoutAll = async (userId: string): Promise<void> => {
  const sessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
  const sessions = await cache.get<string[]>(sessionsKey) || [];

  // Delete all refresh tokens
  await Promise.all(
    sessions.map((tokenId) => cache.del(`${REFRESH_TOKEN_PREFIX}${tokenId}`))
  );

  // Clear sessions list
  await cache.del(sessionsKey);
};

export const verifyAccessToken = async (token: string): Promise<{ id: string; email: string; role: string } | null> => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AccessTokenPayload;

    if (decoded.type !== 'access') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch {
    return null;
  }
};

// Backward compatibility alias
export const verifyToken = verifyAccessToken;