import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
    // Zod validation errors
    if (err instanceof ZodError) {
        logger.warn('Validation error', { errors: err.errors });
        return res.status(400).json({
            error: 'Error de validación',
            details: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Error interno del servidor' : err.message;

    if (statusCode === 500) {
        logger.error('Unhandled error:', { message: err.message, stack: err.stack });
    }

    return res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

export function createError(statusCode: number, message: string): AppError {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    return error;
}
