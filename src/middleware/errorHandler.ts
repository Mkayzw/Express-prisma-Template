import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import logger from '../utils/logger';
import config from '../config';

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with correlation ID if available
  const correlationId = (req as any).correlationId;
  logger.error({
    correlationId,
    error: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: 'A record with this value already exists',
          code: 'CONFLICT',
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: 'Record not found',
          code: 'NOT_FOUND',
        });
        return;
      default:
        res.status(400).json({
          success: false,
          error: 'Database operation failed',
          code: 'DATABASE_ERROR',
        });
        return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
}