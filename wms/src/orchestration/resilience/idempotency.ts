import prisma from '../../config/database';
import { logger } from '../../utils/logger';

/**
 * Idempotencia: si ya ejecutamos esta operación con la misma key, retornamos el resultado previo.
 * Evita duplicación en creación de órdenes, facturas, clientes.
 */
export async function withIdempotency<T>(
    key: string,
    fn: () => Promise<T>
): Promise<T> {
    // Buscar si ya existe un proceso completado con esta key
    const existing = await prisma.processState.findFirst({
        where: {
            entityId: key,
            status: 'completed',
        },
    });

    if (existing && existing.stepsLog) {
        logger.info(`Idempotency hit: operación '${key}' ya fue completada`);
        const log = existing.stepsLog as any;
        if (Array.isArray(log) && log.length > 0) {
            const lastStep = log[log.length - 1];
            return lastStep.result as T;
        }
    }

    return fn();
}
