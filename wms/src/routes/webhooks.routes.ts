import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { OrderFlow } from '../orchestration/flows/order.flow';
import { validateShopifyWebhook, validateBsaleWebhook, validateSyncManagerWebhook } from '../middleware/webhookValidator';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /webhooks/shopify (tabla 26)
 * Eventos: orders/create, orders/updated, orders/cancelled, products/update, inventory_levels/update
 */
router.post('/shopify', validateShopifyWebhook, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const topic = req.headers['x-shopify-topic'] as string;
        const shopifyId = req.headers['x-shopify-shop-domain'] as string;

        // Registrar evento (idempotencia)
        const eventId = req.headers['x-shopify-webhook-id'] as string;
        if (eventId) {
            const existing = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
            if (existing?.processed) {
                logger.info(`Webhook Shopify duplicado ignorado: ${eventId}`);
                return res.status(200).json({ status: 'already_processed' });
            }
        }

        const event = await prisma.webhookEvent.create({
            data: {
                id: eventId || undefined,
                source: 'shopify',
                eventType: topic || 'unknown',
                payload: req.body,
            },
        });

        // Procesar según tipo de evento
        switch (topic) {
            case 'orders/create':
                await OrderFlow.createFromShopify(req.body);
                break;
            case 'orders/updated':
                logger.info('Shopify order updated', { orderId: req.body.id });
                break;
            case 'orders/cancelled':
                logger.info('Shopify order cancelled', { orderId: req.body.id });
                break;
            case 'products/update':
                logger.info('Shopify product updated', { productId: req.body.id });
                break;
            case 'inventory_levels/update':
                logger.info('Shopify inventory updated', { inventoryItemId: req.body.inventory_item_id });
                break;
        }

        await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { processed: true, processedAt: new Date() },
        });

        res.status(200).json({ status: 'ok' });
    } catch (err: any) {
        logger.error('Webhook Shopify error:', { error: err.message });
        next(err);
    }
});

/**
 * POST /webhooks/bsale (tabla 26)
 * Eventos: document/created, stock/updated, payment/confirmed
 */
router.post('/bsale', validateBsaleWebhook, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventType = req.body.event || req.body.type || 'unknown';

        const event = await prisma.webhookEvent.create({
            data: { source: 'bsale', eventType, payload: req.body },
        });

        logger.info(`BSale webhook: ${eventType}`);

        await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { processed: true, processedAt: new Date() },
        });

        res.status(200).json({ status: 'ok' });
    } catch (err: any) {
        logger.error('Webhook BSale error:', { error: err.message });
        next(err);
    }
});

/**
 * POST /webhooks/syncmanager (tabla 26)
 * Eventos: lead/created, lead/updated, client/status_changed, conversation/escalated
 */
router.post('/syncmanager', validateSyncManagerWebhook, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventType = req.body.event || req.body.type || 'unknown';

        const event = await prisma.webhookEvent.create({
            data: { source: 'syncmanager', eventType, payload: req.body },
        });

        logger.info(`SyncManager webhook: ${eventType}`);

        await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { processed: true, processedAt: new Date() },
        });

        res.status(200).json({ status: 'ok' });
    } catch (err: any) {
        logger.error('Webhook SyncManager error:', { error: err.message });
        next(err);
    }
});

export default router;
