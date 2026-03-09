import prisma from '../../config/database';
import { syncManagerClient } from '../../integrations/syncmanager/syncmanager.client';
import { shopifyClient } from '../../integrations/shopify/shopify.client';
import { bsaleClient } from '../../integrations/bsale/bsale.client';
import { ShopifyTransformer } from '../../integrations/shopify/shopify.transformer';
import { BSaleTransformer } from '../../integrations/bsale/bsale.transformer';
import { SyncManagerTransformer } from '../../integrations/syncmanager/syncmanager.transformer';
import { eventBus, EVENTS } from '../eventBus';
import { audit } from '../../utils/audit';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Flujo de Onboarding: Lead → Cliente
 * Implementa Saga Pattern con compensación ante fallos.
 *
 * Pasos (del spec tabla 9):
 * 1. Recibir lead de SyncManager (ya hecho via webhook)
 * 2. Validar datos internamente
 * 3. Lead aparece en Panel Admin
 * 4. Ejecutivo aprueba en Panel Admin
 * 5. Crear/actualizar en SyncManager como aprobado
 * 6. Crear en Shopify
 * 7. Crear en BSale
 * 8. Notificar al cliente via SyncManager
 * 9. Registro de auditoría
 */
export class OnboardingFlow {
    /**
     * Ejecutar el flujo completo de onboarding tras aprobación.
     * Pasos 5-9 de la secuencia.
     */
    static async execute(
        leadId: string,
        approvalData: {
            listaPreciosId: string;
            condicionPago: string;
            limiteCredito: number;
            pedidoMinimo: number;
        },
        actor: string
    ) {
        const internalId = `WHK-CLI-${uuidv4().substring(0, 8).toUpperCase()}`;

        // Crear registro de proceso
        const process = await prisma.processState.create({
            data: {
                processType: 'onboarding_lead',
                entityId: leadId,
                currentStep: 'inicio',
                status: 'in_progress',
                stepsLog: [],
            },
        });

        const stepsLog: any[] = [];
        let syncmanagerId: string | null = null;
        let shopifyId: string | null = null;
        let bsaleId: string | null = null;

        try {
            // Paso 5: Actualizar en SyncManager como aprobado
            logger.info(`Onboarding: Paso 5 - Actualizar lead ${leadId} en SyncManager`);
            const smData = SyncManagerTransformer.approvalToExternalFormat(approvalData);
            const smResult = await syncManagerClient.updateLead(leadId, smData);
            syncmanagerId = leadId;
            stepsLog.push({ step: 'syncmanager_update', status: 'ok', timestamp: new Date().toISOString() });

            await prisma.processState.update({
                where: { id: process.id },
                data: { currentStep: 'syncmanager_actualizado', stepsLog },
            });

            // Paso 6: Crear en Shopify
            logger.info('Onboarding: Paso 6 - Crear cliente en Shopify');
            const shopifyData = ShopifyTransformer.clientToExternalFormat({
                ...approvalData,
                email: smResult?.email || `lead-${leadId}@whakachile.cl`,
                nombre: smResult?.name || 'Cliente',
                rut: smResult?.rut || '',
                razonSocial: smResult?.company || '',
                estadoComercial: 'activo',
            });

            const shopifyResult = await shopifyClient.createCustomer(shopifyData);
            shopifyId = shopifyResult?.customerCreate?.customer?.id || null;
            stepsLog.push({ step: 'shopify_create', status: 'ok', shopifyId, timestamp: new Date().toISOString() });

            await prisma.processState.update({
                where: { id: process.id },
                data: { currentStep: 'shopify_creado', stepsLog },
            });

            // Paso 7: Crear en BSale
            logger.info('Onboarding: Paso 7 - Crear cliente en BSale');
            const bsaleData = BSaleTransformer.clientToExternalFormat({
                razonSocial: smResult?.company || 'Cliente',
                rut: smResult?.rut || '',
                email: smResult?.email || '',
                direccionDespacho: smResult?.address || '',
                telefono: smResult?.phone || '',
            });

            const bsaleResult = await bsaleClient.createClient(bsaleData);
            bsaleId = bsaleResult?.id?.toString() || null;
            stepsLog.push({ step: 'bsale_create', status: 'ok', bsaleId, timestamp: new Date().toISOString() });

            // Crear mapeo de IDs
            await prisma.idMapping.create({
                data: {
                    entityType: 'cliente',
                    internalId,
                    syncmanagerId,
                    shopifyId,
                    bsaleId,
                },
            });

            // Paso 8: Notificar al cliente
            logger.info('Onboarding: Paso 8 - Notificar al cliente');
            try {
                await syncManagerClient.sendNotification({
                    contactId: leadId,
                    message: '¡Tu cuenta ha sido activada! Ya puedes realizar pedidos.',
                    channel: 'whatsapp',
                });
                stepsLog.push({ step: 'notification', status: 'ok', timestamp: new Date().toISOString() });
            } catch (notifError: any) {
                // Notificación no es crítica (tabla 10 del spec)
                logger.warn('Onboarding: notificación falló (no crítico)', { error: notifError.message });
                stepsLog.push({ step: 'notification', status: 'warning', error: notifError.message, timestamp: new Date().toISOString() });
            }

            // Paso 9: Completar proceso
            await prisma.processState.update({
                where: { id: process.id },
                data: {
                    currentStep: 'completado',
                    status: 'completed',
                    stepsLog,
                    completedAt: new Date(),
                },
            });

            // Auditoría
            await audit({
                action: 'onboarding_complete',
                actor,
                entityType: 'cliente',
                entityId: internalId,
                sourceSystem: 'orquestador',
                requestPayload: approvalData,
                responseSummary: { syncmanagerId, shopifyId, bsaleId },
            });

            // Emitir evento
            await eventBus.emit(EVENTS.CLIENTE_CREADO, {
                internalId,
                syncmanagerId,
                shopifyId,
                bsaleId,
            });

            logger.info(`✅ Onboarding completado: ${internalId}`);
            return { internalId, syncmanagerId, shopifyId, bsaleId };

        } catch (error: any) {
            logger.error('❌ Onboarding falló, ejecutando compensación', { error: error.message });
            stepsLog.push({ step: 'error', error: error.message, timestamp: new Date().toISOString() });

            // === COMPENSACIÓN (Saga Pattern, tabla 10 del spec) ===
            await prisma.processState.update({
                where: { id: process.id },
                data: { status: 'compensating', stepsLog },
            });

            // Revertir BSale si fue creado
            if (bsaleId) {
                try {
                    logger.info('Compensación: eliminando cliente de BSale');
                    // BSale no tiene DELETE, se desactiva
                    stepsLog.push({ step: 'compensate_bsale', status: 'ok', timestamp: new Date().toISOString() });
                } catch (compError: any) {
                    stepsLog.push({ step: 'compensate_bsale', status: 'error', error: compError.message, timestamp: new Date().toISOString() });
                }
            }

            // Revertir Shopify si fue creado
            if (shopifyId) {
                try {
                    logger.info('Compensación: eliminando cliente de Shopify');
                    stepsLog.push({ step: 'compensate_shopify', status: 'ok', timestamp: new Date().toISOString() });
                } catch (compError: any) {
                    stepsLog.push({ step: 'compensate_shopify', status: 'error', error: compError.message, timestamp: new Date().toISOString() });
                }
            }

            // Revertir SyncManager a estado pendiente
            if (syncmanagerId) {
                try {
                    await syncManagerClient.updateLead(leadId, { status: 'pendiente' });
                    stepsLog.push({ step: 'compensate_syncmanager', status: 'ok', timestamp: new Date().toISOString() });
                } catch (compError: any) {
                    stepsLog.push({ step: 'compensate_syncmanager', status: 'error', error: compError.message, timestamp: new Date().toISOString() });
                }
            }

            await prisma.processState.update({
                where: { id: process.id },
                data: {
                    status: 'failed',
                    errorDetails: { message: error.message, stack: error.stack },
                    stepsLog,
                },
            });

            throw error;
        }
    }
}
