import { Request } from 'express';

/**
 * Helper para obtener el email del usuario autenticado de forma type-safe.
 */
export function getUserEmail(req: Request): string {
    return (req as any).user?.email || 'unknown';
}

/**
 * Helper para obtener el userId del usuario autenticado.
 */
export function getUserId(req: Request): string {
    return (req as any).user?.userId || 'unknown';
}

/**
 * Helper para obtener el rol del usuario autenticado.
 */
export function getUserRole(req: Request): string {
    return (req as any).user?.role || 'unknown';
}

/**
 * Helper para obtener query param como string.
 */
export function queryString(value: any): string | undefined {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value[0];
    return undefined;
}
