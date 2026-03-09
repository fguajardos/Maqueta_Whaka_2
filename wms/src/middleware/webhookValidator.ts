import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Valida firma HMAC-SHA256 de webhooks de Shopify
 */
export function validateShopifyWebhook(req: Request, _res: Response, next: NextFunction) {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;

    if (!hmacHeader) {
        logger.warn('Shopify webhook sin firma HMAC');
        return next(createError(401, 'Firma HMAC requerida'));
    }

    const body = (req as any).rawBody;
    if (!body) {
        return next(createError(400, 'Body requerido para validación HMAC'));
    }

    const hash = crypto
        .createHmac('sha256', env.SHOPIFY_WEBHOOK_SECRET)
        .update(body, 'utf8')
        .digest('base64');

    if (hash !== hmacHeader) {
        logger.warn('Shopify webhook: firma HMAC inválida');
        return next(createError(401, 'Firma HMAC inválida'));
    }

    next();
}

/**
 * Valida token secreto en header de webhooks de BSale
 */
export function validateBsaleWebhook(req: Request, _res: Response, next: NextFunction) {
    const token = req.headers['x-bsale-token'] as string;

    if (!token || token !== env.BSALE_ACCESS_TOKEN) {
        logger.warn('BSale webhook: token inválido');
        return next(createError(401, 'Token de webhook inválido'));
    }

    next();
}

/**
 * Valida token/firma de webhooks de SyncManager
 */
export function validateSyncManagerWebhook(req: Request, _res: Response, next: NextFunction) {
    const token = req.headers['x-syncmanager-token'] as string;

    if (!token || token !== env.SYNCMANAGER_API_KEY) {
        logger.warn('SyncManager webhook: token inválido');
        return next(createError(401, 'Token de webhook inválido'));
    }

    next();
}
