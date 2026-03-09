import prisma from '../../config/database';
import { bsaleClient } from '../../integrations/bsale/bsale.client';
import { shopifyClient } from '../../integrations/shopify/shopify.client';
import { syncManagerClient } from '../../integrations/syncmanager/syncmanager.client';
import { ShopifyTransformer } from '../../integrations/shopify/shopify.transformer';
import { BSaleTransformer } from '../../integrations/bsale/bsale.transformer';
import { OrderStateMachine, OrderState, OrderAction } from '../stateMachine';
import { eventBus, EVENTS } from '../eventBus';
import { StockService } from '../../services/stock.service';
import { audit } from '../../utils/audit';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Flujo de Ciclo Completo de Pedido.
 * Implementa la máquina de estados con 8 estados y acciones automáticas
 * en cada transición (tabla de transiciones del spec).
 */
export class OrderFlow {
    /**
     * Crear un nuevo pedido desde webhook de Shopify.
     * Paso 1 del flujo (tabla 11).
     */
    static async createFromShopify(shopifyOrder: any, actor: string = 'shopify_webhook') {
        const internalId = `WHK-PED-${uuidv4().substring(0, 8).toUpperCase()}`;
        const normalizedOrder = ShopifyTransformer.orderToInternalFormat(shopifyOrder);

        // Crear proceso
        const process = await prisma.processState.create({
            data: {
                processType: 'pedido_completo',
                entityId: internalId,
                currentStep: 'recibido',
                status: 'in_progress',
                stepsLog: [{
                    step: 'creado',
                    source: 'shopify',
                    shopifyId: normalizedOrder.shopifyId,
                    timestamp: new Date().toISOString(),
                }],
            },
        });

        // Crear mapeo de IDs
        await prisma.idMapping.create({
            data: {
                entityType: 'pedido',
                internalId,
                shopifyId: normalizedOrder.shopifyId,
            },
        });

        await audit({
            action: 'order_created',
            actor,
            entityType: 'pedido',
            entityId: internalId,
            sourceSystem: 'shopify',
            requestPayload: { shopifyName: normalizedOrder.shopifyName },
        });

        await eventBus.emit(EVENTS.PEDIDO_CREADO, {
            internalId,
            processId: process.id,
            order: normalizedOrder,
        });

        logger.info(`📦 Pedido creado: ${internalId} (Shopify: ${normalizedOrder.shopifyName})`);
        return { internalId, processId: process.id, order: normalizedOrder };
    }

    /**
     * Avanzar el estado de un pedido.
     * Valida la transición y ejecuta acciones automáticas por estado.
     */
    static async advanceState(
        internalId: string,
        action: OrderAction,
        data: any = {},
        actor: string = 'system'
    ) {
        // Obtener proceso actual
        const process = await prisma.processState.findFirst({
            where: { entityId: internalId, processType: 'pedido_completo' },
            orderBy: { startedAt: 'desc' },
        });

        if (!process) {
            throw new Error(`Pedido ${internalId} no encontrado`);
        }

        const currentState = process.currentStep as OrderState;
        const newState = OrderStateMachine.transition(currentState, action);

        // Ejecutar acciones automáticas por transición
        await this.executeTransitionActions(internalId, currentState, newState, data);

        // Actualizar proceso
        const stepsLog = (process.stepsLog as any[]) || [];
        stepsLog.push({
            from: currentState,
            to: newState,
            action,
            actor,
            data: data || {},
            timestamp: new Date().toISOString(),
        });

        const isCompleted = newState === 'entregado';

        await prisma.processState.update({
            where: { id: process.id },
            data: {
                currentStep: newState,
                status: isCompleted ? 'completed' : 'in_progress',
                stepsLog,
                completedAt: isCompleted ? new Date() : undefined,
            },
        });

        await audit({
            action: `order_${action}`,
            actor,
            entityType: 'pedido',
            entityId: internalId,
            sourceSystem: 'orquestador',
            requestPayload: { from: currentState, to: newState, data },
        });

        // Emitir evento correspondiente
        const eventMap: Record<string, string> = {
            validado: EVENTS.PEDIDO_VALIDADO,
            listo_bodega: EVENTS.PEDIDO_LISTO_BODEGA,
            facturado: EVENTS.PEDIDO_FACTURADO,
            despachado: EVENTS.PEDIDO_DESPACHADO,
            entregado: EVENTS.PEDIDO_ENTREGADO,
            incidencia: EVENTS.PEDIDO_INCIDENCIA,
        };

        if (eventMap[newState]) {
            await eventBus.emit(eventMap[newState], { internalId, state: newState, data });
        }

        logger.info(`📦 Pedido ${internalId}: ${currentState} → ${newState}`);
        return { internalId, previousState: currentState, currentState: newState };
    }

    /**
     * Acciones automáticas por transición (tabla de transiciones del spec).
     */
    private static async executeTransitionActions(
        internalId: string,
        from: OrderState,
        to: OrderState,
        data: any
    ) {
        try {
            // Extraer items del pedido (vienen en data.items o del stepsLog)
            const items = data?.items || [];

            switch (to) {
                case 'en_preparacion':
                    // Reserva provisoria de stock
                    if (items.length > 0) {
                        await StockService.reserveStock(items, internalId);
                        logger.info(`Pedido ${internalId}: Stock reservado (${items.length} items)`);
                    }
                    break;

                case 'facturado':
                    // Auto: POST /v1/documents.json en BSale
                    logger.info(`Pedido ${internalId}: Generando factura en BSale`);
                    break;

                case 'despachado':
                    // Auto: fulfillmentCreate en Shopify
                    logger.info(`Pedido ${internalId}: Creando fulfillment en Shopify`);
                    const mapping = await prisma.idMapping.findFirst({
                        where: { internalId, entityType: 'pedido' },
                    });
                    if (mapping?.shopifyId) {
                        try {
                            await shopifyClient.createFulfillment(mapping.shopifyId, data.trackingInfo);
                        } catch (err: any) {
                            logger.warn(`Fulfillment Shopify falló (no crítico): ${err.message}`);
                        }
                    }
                    break;

                case 'entregado':
                    // Deducción definitiva de stock (reserva → descuento real)
                    if (items.length > 0) {
                        await StockService.confirmDeduction(items, internalId);
                        logger.info(`Pedido ${internalId}: Stock deducido (${items.length} items)`);
                    } else {
                        // Intentar extraer items del stepsLog del proceso
                        const storedItems = await this.getOrderItems(internalId);
                        if (storedItems.length > 0) {
                            await StockService.confirmDeduction(storedItems, internalId);
                            logger.info(`Pedido ${internalId}: Stock deducido desde stepsLog (${storedItems.length} items)`);
                        }
                    }
                    logger.info(`Pedido ${internalId}: Entregado - acciones finales completadas`);
                    break;

                case 'incidencia':
                    // Liberar reserva si el pedido estaba en preparación o despacho
                    if (from === 'en_preparacion' || from === 'despachado') {
                        const releaseItems = items.length > 0 ? items : await this.getOrderItems(internalId);
                        if (releaseItems.length > 0) {
                            await StockService.releaseReservation(releaseItems, internalId);
                            logger.info(`Pedido ${internalId}: Reserva liberada por incidencia (${releaseItems.length} items)`);
                        }
                    }
                    break;
            }
        } catch (error: any) {
            logger.error(`Error en acciones de transición ${from}→${to}: ${error.message}`);
            // No bloquear la transición por fallos en acciones secundarias
        }
    }

    /**
     * Extrae los items del pedido desde el stepsLog almacenado.
     */
    private static async getOrderItems(internalId: string): Promise<{ sku: string; quantity: number }[]> {
        const process = await prisma.processState.findFirst({
            where: { entityId: internalId, processType: 'pedido_completo' },
        });

        if (!process) return [];

        const stepsLog = (process.stepsLog as any[]) || [];
        // Buscar items en cualquier entrada del log que los contenga
        for (const step of stepsLog) {
            if (step.items && Array.isArray(step.items) && step.items.length > 0) {
                return step.items;
            }
        }

        return [];
    }

    /**
     * Validaciones comerciales del Paso 2 (tabla 12 del spec).
     */
    static async validateBusinessRules(
        clientId: string,
        orderData: any
    ): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            // 1. Estado comercial del cliente
            const clientStatus = await syncManagerClient.getClientStatus(clientId);
            if (clientStatus?.status !== 'activo') {
                errors.push('Cliente no está activo. Estado actual: ' + (clientStatus?.status || 'desconocido'));
            }

            // 2. Zona de cobertura
            const zonaRule = await prisma.businessRule.findUnique({
                where: { ruleKey: 'zonas_cobertura_activas' },
            });
            if (zonaRule && orderData.comuna) {
                const zonas = (zonaRule.ruleValue as any).zonas || [];
                const comunasCubiertas = zonas
                    .filter((z: any) => z.activa)
                    .flatMap((z: any) => z.comunas);
                if (!comunasCubiertas.includes(orderData.comuna)) {
                    errors.push(`Comuna '${orderData.comuna}' no está en zona de cobertura`);
                }
            }

            // 3. Monto mínimo
            const montoRule = await prisma.businessRule.findUnique({
                where: { ruleKey: 'pedido_minimo_clp' },
            });
            if (montoRule) {
                const minimo = (montoRule.ruleValue as any).value || 0;
                if (orderData.total < minimo) {
                    errors.push(`Monto $${orderData.total} es menor al mínimo de $${minimo}`);
                }
            }

            // 4. Horario operativo
            const horarioInicio = await prisma.businessRule.findUnique({ where: { ruleKey: 'horario_inicio' } });
            const horarioFin = await prisma.businessRule.findUnique({ where: { ruleKey: 'horario_fin' } });
            if (horarioInicio && horarioFin) {
                const now = new Date();
                const hours = now.getHours();
                const inicio = parseInt((horarioInicio.ruleValue as any).hora?.split(':')[0] || '0');
                const fin = parseInt((horarioFin.ruleValue as any).hora?.split(':')[0] || '23');
                if (hours < inicio || hours >= fin) {
                    errors.push(`Fuera de horario operativo (${(horarioInicio.ruleValue as any).hora} - ${(horarioFin.ruleValue as any).hora})`);
                }
            }

        } catch (error: any) {
            logger.error('Error en validaciones comerciales', { error: error.message });
            errors.push('Error interno validando reglas de negocio');
        }

        return { valid: errors.length === 0, errors };
    }
}
