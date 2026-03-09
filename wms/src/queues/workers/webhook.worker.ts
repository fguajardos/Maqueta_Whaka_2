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
 * Inicializa el worker de webhooks solo si se llama explícitamente.
 * No se auto-conecta a Redis al importar el módulo.
 */
export function startWebhookWorker(): Worker | null {
    if (worker) return worker;

    try {
        worker = new Worker(
            'webhook-processing',
            async (job) => {
                const { source, eventType } = job.data;
                logger.info(`Processing webhook: ${source}/${eventType}`, { jobId: job.id });

                switch (source) {
                    case 'shopify':
                        // Handle Shopify events
                        break;
                    case 'bsale':
                        // Handle BSale events
                        break;
                    case 'syncmanager':
                        // Handle SyncManager events
                        break;
                }
            },
            {
                connection: CONNECTION,
                concurrency: 5,
                limiter: { max: 10, duration: 1000 },
            }
        );

        worker.on('completed', (job) => {
            logger.debug(`Webhook job completed: ${job.id}`);
        });

        worker.on('failed', (job, err) => {
            logger.error(`Webhook job failed: ${job?.id}`, { error: err.message });
        });

        logger.info('🔌 Webhook worker started');
        return worker;
    } catch (err: any) {
        logger.warn(`Webhook worker could not start: ${err.message}`);
        return null;
    }
}
