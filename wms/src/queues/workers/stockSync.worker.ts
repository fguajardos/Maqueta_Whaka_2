import { Worker } from 'bullmq';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

const CONNECTION = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
};

let worker: Worker | null = null;

/**
 * Inicializa el worker de stock sync solo si se llama explícitamente.
 */
export function startStockSyncWorker(): Worker | null {
    if (worker) return worker;

    try {
        worker = new Worker(
            'stock-sync',
            async (job) => {
                logger.info('Stock sync job started', { jobId: job.id });

                try {
                    const { StockSyncFlow } = await import('../../orchestration/flows/stockSync.flow');
                    const result = await StockSyncFlow.execute();
                    return result;
                } catch (err: any) {
                    logger.error(`Stock sync job failed: ${err.message}`);
                    throw err;
                }
            },
            {
                connection: CONNECTION,
                concurrency: 1,
            }
        );

        worker.on('completed', (job, result) => {
            logger.info('Stock sync completed', { result });
        });

        worker.on('failed', (job, err) => {
            logger.error(`Stock sync failed: ${err.message}`);
        });

        logger.info('🔌 Stock sync worker started');
        return worker;
    } catch (err: any) {
        logger.warn(`Stock sync worker could not start: ${err.message}`);
        return null;
    }
}
