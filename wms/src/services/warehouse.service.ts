import prisma from '../config/database';
import { audit } from '../utils/audit';
import { paginate } from '../utils/pagination';

export class WarehouseService {
    /**
     * GET /api/warehouse/picking (tabla 21)
     * Vista Kanban: pendiente | en_preparacion | listo
     */
    static async getPickingOrders(status?: string) {
        const where: any = { processType: 'pedido_completo' };

        if (status === 'pendiente') where.currentStep = 'validado';
        else if (status === 'en_preparacion') where.currentStep = 'en_preparacion';
        else if (status === 'listo') where.currentStep = 'listo_bodega';
        else {
            where.currentStep = { in: ['validado', 'en_preparacion', 'listo_bodega'] };
        }

        const orders = await prisma.processState.findMany({
            where,
            orderBy: { startedAt: 'asc' },
        });

        // Agrupar para vista kanban
        return {
            pendiente: orders.filter((o) => o.currentStep === 'validado'),
            en_preparacion: orders.filter((o) => o.currentStep === 'en_preparacion'),
            listo: orders.filter((o) => o.currentStep === 'listo_bodega'),
        };
    }

    /**
     * POST /api/warehouse/picking/:orderId/start
     */
    static async startPicking(orderId: string, actor: string) {
        const { OrderFlow } = await import('../orchestration/flows/order.flow');
        const result = await OrderFlow.advanceState(orderId, 'send_to_warehouse', {}, actor);

        await audit({
            action: 'picking_started',
            actor,
            entityType: 'pedido',
            entityId: orderId,
            sourceSystem: 'panel_admin',
        });

        return result;
    }

    /**
     * POST /api/warehouse/picking/:orderId/complete
     */
    static async completePicking(orderId: string, itemsChecked: string[], actor: string) {
        const { OrderFlow } = await import('../orchestration/flows/order.flow');
        const result = await OrderFlow.advanceState(orderId, 'confirm_picking', { itemsChecked }, actor);

        await audit({
            action: 'picking_completed',
            actor,
            entityType: 'pedido',
            entityId: orderId,
            sourceSystem: 'panel_admin',
            requestPayload: { itemsChecked },
        });

        return result;
    }

    /**
     * POST /api/warehouse/picking/:orderId/shortage
     */
    static async reportShortage(orderId: string, data: any, actor: string) {
        const { OrderFlow } = await import('../orchestration/flows/order.flow');
        const result = await OrderFlow.advanceState(orderId, 'report_incident', {
            tipo: 'faltante',
            ...data,
        }, actor);

        await audit({
            action: 'shortage_reported',
            actor,
            entityType: 'pedido',
            entityId: orderId,
            sourceSystem: 'panel_admin',
            requestPayload: data,
        });

        return result;
    }
}
