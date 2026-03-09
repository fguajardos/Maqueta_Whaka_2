import prisma from '../config/database';
import { audit } from '../utils/audit';
import { paginate, getPrismaSkipTake } from '../utils/pagination';

export class LogisticsService {
    /**
     * GET /api/logistics/available-orders (tabla 22)
     */
    static async getAvailableOrders(fecha?: string, zona?: string) {
        const orders = await prisma.processState.findMany({
            where: {
                processType: 'pedido_completo',
                currentStep: { in: ['listo_bodega', 'facturado'] },
            },
            orderBy: { startedAt: 'asc' },
        });

        return orders.map((o) => ({
            id: o.id,
            internalId: o.entityId,
            estado: o.currentStep,
            fechaCreacion: o.startedAt,
        }));
    }

    /**
     * POST /api/logistics/routes
     */
    static async createRoute(data: any, actor: string) {
        const process = await prisma.processState.create({
            data: {
                processType: 'despacho',
                entityId: `WHK-RUT-${Date.now()}`,
                currentStep: 'planificada',
                status: 'in_progress',
                stepsLog: [{
                    step: 'ruta_creada',
                    fecha: data.fecha,
                    zona: data.zona,
                    pedidos: data.pedidosIds,
                    vehiculo: data.vehiculo,
                    repartidorId: data.repartidorId,
                    timestamp: new Date().toISOString(),
                }],
            },
        });

        await audit({
            action: 'route_created',
            actor,
            entityType: 'ruta',
            entityId: process.entityId,
            sourceSystem: 'panel_admin',
            requestPayload: data,
        });

        return { id: process.id, internalId: process.entityId };
    }

    /**
     * GET /api/logistics/routes
     */
    static async listRoutes(fecha?: string) {
        const routes = await prisma.processState.findMany({
            where: { processType: 'despacho' },
            orderBy: { startedAt: 'desc' },
        });

        return routes.map((r) => ({
            id: r.id,
            internalId: r.entityId,
            estado: r.currentStep,
            status: r.status,
            stepsLog: r.stepsLog,
            fechaCreacion: r.startedAt,
        }));
    }

    /**
     * GET /api/logistics/routes/:id
     */
    static async getRoute(id: string) {
        const route = await prisma.processState.findFirst({
            where: { OR: [{ id }, { entityId: id }], processType: 'despacho' },
        });

        if (!route) throw Object.assign(new Error('Ruta no encontrada'), { statusCode: 404 });
        return route;
    }

    /**
     * POST /api/logistics/routes/:routeId/orders/:orderId/deliver
     */
    static async deliverOrder(routeId: string, orderId: string, data: any, actor: string) {
        const { OrderFlow } = await import('../orchestration/flows/order.flow');
        const result = await OrderFlow.advanceState(orderId, 'deliver', {
            receptorNombre: data.receptorNombre,
            foto: data.foto,
            notas: data.notas,
            routeId,
        }, actor);

        await audit({
            action: 'delivery_confirmed',
            actor,
            entityType: 'pedido',
            entityId: orderId,
            sourceSystem: 'panel_admin',
            requestPayload: { routeId, receptorNombre: data.receptorNombre },
        });

        return result;
    }

    /**
     * POST /api/logistics/routes/:routeId/orders/:orderId/incident
     */
    static async reportDeliveryIncident(routeId: string, orderId: string, data: any, actor: string) {
        const { OrderFlow } = await import('../orchestration/flows/order.flow');
        return OrderFlow.advanceState(orderId, 'report_incident', { ...data, routeId }, actor);
    }
}
