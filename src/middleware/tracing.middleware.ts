import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

declare global {
    namespace Express {
        interface Request {
            correlationId: string;
        }
    }
}

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Get or generate correlation ID
    const correlationId = (req.headers['x-request-id'] as string) ||
        (req.headers['x-correlation-id'] as string) ||
        uuidv4();

    // Attach to request
    req.correlationId = correlationId;

    // Set response header
    res.setHeader('X-Request-ID', correlationId);
    res.setHeader('X-Correlation-ID', correlationId);

    // Log request with correlation ID
    logger.info({
        correlationId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        message: 'Incoming request',
    });

    // Track response time
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info({
            correlationId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            message: 'Request completed',
        });
    });

    next();
};
