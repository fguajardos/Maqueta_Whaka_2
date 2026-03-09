import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redis: Redis | null = null;
let connectionFailed = false;

export function getRedis(): Redis | null {
    if (redis) return redis;
    if (connectionFailed) return null;

    try {
        redis = new Redis({
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
            maxRetriesPerRequest: null,
            lazyConnect: true,
            enableOfflineQueue: false,
            retryStrategy: (times: number) => {
                if (times > 2) {
                    logger.warn('Redis no disponible — funcionalidades de cola desactivadas');
                    connectionFailed = true;
                    return null;
                }
                return Math.min(times * 500, 3000);
            },
        });

        redis.on('connect', () => logger.info('✅ Redis connected'));
        redis.on('error', () => { /* silencio — ya logueado en retryStrategy */ });

        return redis;
    } catch {
        logger.warn('Redis no disponible — el servidor funcionará sin colas');
        connectionFailed = true;
        return null;
    }
}

export default getRedis();
