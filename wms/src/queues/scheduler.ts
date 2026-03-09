import cron from 'node-cron';
import { initializeQueues, getStockSyncQueue } from './queue.config';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Scheduler: configura cron jobs periódicos.
 * Solo arranca si Redis está disponible para las colas.
 */
export async function startScheduler(): Promise<void> {
    const redisAvailable = await initializeQueues();

    if (!redisAvailable) {
        logger.warn('⏰ Scheduler no iniciado — Redis no disponible');
        return;
    }

    const interval = env.STOCK_SYNC_INTERVAL;

    // Sync stock BSale → Shopify cada N minutos (configurable)
    cron.schedule(`*/${interval} * * * *`, async () => {
        const queue = getStockSyncQueue();
        if (!queue) {
            logger.warn('⏰ Cron: stockSyncQueue no disponible, saltando sincronización');
            return;
        }

        logger.info(`⏰ Cron: Encolando sincronización de stock (cada ${interval} min)`);
        try {
            await queue.add('periodic-sync', {
                triggeredBy: 'scheduler',
                timestamp: new Date().toISOString(),
            });
        } catch (err: any) {
            logger.error('Cron stock sync failed to enqueue', { error: err.message });
        }
    });

    logger.info(`⏰ Scheduler started: stock sync every ${interval} min`);
}
