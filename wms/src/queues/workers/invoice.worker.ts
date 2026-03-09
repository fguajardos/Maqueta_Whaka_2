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
 * Inicializa el worker de facturación solo si se llama explícitamente.
 */
export function startInvoiceWorker(): Worker | null {
    if (worker) return worker;

    try {
        worker = new Worker(
            'invoice-generation',
            async (job) => {
                const { orderId, documentData } = job.data;
                logger.info(`Generating invoice for order: ${orderId}`, { jobId: job.id });

                try {
                    const { bsaleClient } = await import('../../integrations/bsale/bsale.client');
                    const result = await bsaleClient.createDocument(documentData);
                    logger.info(`Invoice created: ${result?.id}`, { orderId });
                    return result;
                } catch (err: any) {
                    logger.error(`Invoice generation failed: ${err.message}`, { orderId });
                    throw err;
                }
            },
            {
                connection: CONNECTION,
                concurrency: 2,
                limiter: { max: 5, duration: 1000 },
            }
        );

        worker.on('failed', (job, err) => {
            logger.error(`Invoice job failed: ${job?.id}`, { error: err.message });
        });

        logger.info('🔌 Invoice worker started');
        return worker;
    } catch (err: any) {
        logger.warn(`Invoice worker could not start: ${err.message}`);
        return null;
    }
}
