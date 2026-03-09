import { Queue } from 'bullmq';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ============================================
// Conexión Redis compartida para BullMQ
// Creación de colas es lazy: solo se instancian
// cuando Redis está disponible.
// ============================================

const REDIS_CONNECTION = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 500, 3000);
    },
};

let webhookQueue: Queue | null = null;
let invoiceQueue: Queue | null = null;
let stockSyncQueue: Queue | null = null;
let queuesInitialized = false;

/**
 * Inicializa las colas BullMQ solo si Redis está accesible.
 * Retorna true si se logró conectar, false si no.
 */
export async function initializeQueues(): Promise<boolean> {
    if (queuesInitialized) return true;

    try {
        // Prueba rápida de conectividad antes de crear colas
        const IORedis = (await import('ioredis')).default;
        const testConnection = new IORedis({
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
            connectTimeout: 3000,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null, // No retry en test
        });

        // Suprimir log de ioredis "Unhandled error event"
        testConnection.on('error', () => { });

        await testConnection.ping();
        await testConnection.quit();

        // Redis accesible — crear colas
        webhookQueue = new Queue('webhook-processing', { connection: REDIS_CONNECTION });
        invoiceQueue = new Queue('invoice-generation', { connection: REDIS_CONNECTION });
        stockSyncQueue = new Queue('stock-sync', { connection: REDIS_CONNECTION });

        queuesInitialized = true;
        logger.info('📨 BullMQ queues initialized');
        return true;
    } catch {
        logger.warn('⚠️ Redis no disponible — BullMQ queues desactivadas');
        return false;
    }
}

export function getWebhookQueue(): Queue | null {
    return webhookQueue;
}

export function getInvoiceQueue(): Queue | null {
    return invoiceQueue;
}

export function getStockSyncQueue(): Queue | null {
    return stockSyncQueue;
}
