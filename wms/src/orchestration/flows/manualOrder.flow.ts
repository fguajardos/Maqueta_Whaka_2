import { shopifyClient } from '../../integrations/shopify/shopify.client';
import { OrderFlow } from './order.flow';
import { audit } from '../../utils/audit';
import { logger } from '../../utils/logger';

/**
 * Flujo 4: Pedido Manual desde Panel Admin
 * (tabla 15 del spec)
 *
 * 1. Ejecutivo selecciona cliente
 * 2. Orquestador ejecuta validaciones comerciales
 * 3. Ejecutivo selecciona productos
 * 4. POST /api/orders/manual
 * 5. Orquestador crea orden en Shopify
 * 6. Shopify dispara webhook → Flujo 2 continúa
 */
export class ManualOrderFlow {
    static async execute(
        orderData: {
            clientId: string;
            items: Array<{ sku: string; quantity: number; price: number }>;
            fechaDespacho: string;
            notas?: string;
        },
        actor: string
    ) {
        logger.info(`📝 Creando pedido manual para cliente ${orderData.clientId}`);

        // Paso 2: Validaciones comerciales
        const total = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const validation = await OrderFlow.validateBusinessRules(orderData.clientId, {
            total,
            comuna: null, // Se obtendría del perfil del cliente
        });

        if (!validation.valid) {
            throw new Error(`Validación fallida: ${validation.errors.join('; ')}`);
        }

        // Paso 5: Crear orden en Shopify
        const shopifyOrder = {
            line_items: orderData.items.map((item) => ({
                sku: item.sku,
                quantity: item.quantity,
                price: item.price.toString(),
            })),
            note: orderData.notas || `Pedido manual creado por ${actor}`,
            tags: 'manual,whakachile',
            financial_status: 'pending',
            note_attributes: [
                { name: 'fecha_despacho', value: orderData.fechaDespacho },
                { name: 'created_by', value: actor },
            ],
        };

        const result = await shopifyClient.createOrder(shopifyOrder);

        await audit({
            action: 'manual_order_created',
            actor,
            entityType: 'pedido',
            entityId: result?.order?.id?.toString() || 'unknown',
            sourceSystem: 'panel_admin',
            requestPayload: orderData,
            responseSummary: { shopifyOrderId: result?.order?.id },
        });

        logger.info(`✅ Pedido manual creado en Shopify (webhook disparará Flujo 2)`);
        return result;
    }
}
