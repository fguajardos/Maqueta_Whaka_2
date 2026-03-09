import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

type RoleName = 'admin' | 'ejecutivo_comercial' | 'operario_bodega' | 'repartidor';

/**
 * Middleware que restringe acceso a roles específicos.
 * Uso: requireRole('admin', 'ejecutivo_comercial')
 */
export function requireRole(...allowedRoles: RoleName[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(createError(401, 'No autenticado'));
        }

        if (!allowedRoles.includes(req.user.role as RoleName)) {
            return next(createError(403, 'No tienes permisos para acceder a este recurso'));
        }

        next();
    };
}
