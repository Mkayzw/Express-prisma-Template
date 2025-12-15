import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validation middleware factory
export const validate = <T extends z.ZodType>(schema: T, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const parsed = schema.parse(data);

            if (source === 'body') {
                req.body = parsed;
            } else if (source === 'query') {
                req.query = parsed as typeof req.query;
            } else {
                req.params = parsed as typeof req.params;
            }

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};

// Common schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Password validation (min 8 chars, at least one letter and number)
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
