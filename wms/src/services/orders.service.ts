import prisma from '../config/database';
import { OrderFlow } from '../orchestration/flows/order.flow';
import { ManualOrderFlow } from '../orchestration/flows/manualOrder.flow';
import { OrderStateMachine, OrderState } from '../orchestration/stateMachine';
import { audit } from '../utils/audit';
import { paginate, getPrismaSkipTake } from '../utils/pagination';

export class OrdersService {
    /**
     * GET /api/orders (tabla 20)
     */
    static async list(filters: {
        status?: string;
        client?: string;
        canal?: string;
        page: number;
        limit: number;
    }) {
        const where: any = { processType: 'pedido_completo' };
        if (filters.status) where.currentStep = filters.status;

        const { skip, take } = getPrismaSkipTake(filters.page, filters.limit);
        const [orders, total] = await Promise.all([
            prisma.processState.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                skip,
                take,
            }),
            prisma.processState.count({ where }),
        ]);

        const enrichedOrders = await Promise.all(
            orders.map(async (o) => {
                const mapping = await prisma.idMapping.findFirst({
                    where: { internalId: o.entityId, entityType: 'pedido' },
                });
                return {
                    id: o.id,
                    internalId: o.entityId,
                    estado: o.currentStep,
                    status: o.status,
                    shopifyId: mapping?.shopifyId,
                    stepsLog: o.stepsLog,
                    fechaCreacion: o.startedAt,
                    fechaCompletado: o.completedAt,
                    accionesDisponibles: OrderStateMachine.getAvailableActions(o.currentStep as OrderState),
                };
            })
        );

        return paginate(enrichedOrders, total, filters.page, filters.limit);
    }

    /**
     * GET /api/orders/:id
     */
    static async getById(id: string) {
        const order = await prisma.processState.findFirst({
            where: {
                OR: [{ id }, { entityId: id }],
                processType: 'pedido_completo',
            },
        });

        if (!order) throw Object.assign(new Error('Pedido no encontrado'), { statusCode: 404 });

        const mapping = await prisma.idMapping.findFirst({
            where: { internalId: order.entityId, entityType: 'pedido' },
        });

        return {
            id: order.id,
            internalId: order.entityId,
            estado: order.currentStep,
            status: order.status,
            shopifyId: mapping?.shopifyId,
            bsaleId: mapping?.bsaleId,
            stepsLog: order.stepsLog,
            errorDetails: order.errorDetails,
            retryCount: order.retryCount,
            fechaCreacion: order.startedAt,
            fechaCompletado: order.completedAt,
            accionesDisponibles: OrderStateMachine.getAvailableActions(order.currentStep as OrderState),
            todosLosEstados: OrderStateMachine.getAllStates(),
        };
    }

    /**
     * GET /api/orders/pipeline
     */
    static async getPipeline() {
        const states = OrderStateMachine.getAllStates();
        const pipeline: Record<string, number> = {};

        for (const state of states) {
            pipeline[state] = await prisma.processState.count({
                where: { processType: 'pedido_completo', currentStep: state },
            });
        }

        return pipeline;
    }

    /**
     * POST /api/orders/manual (Flujo 4)
     */
    static async createManual(data: any, actor: string) {
        return ManualOrderFlow.execute(data, actor);
    }

    /**
     * POST /api/orders/:id/advance
     */
    static async advance(id: string, action: string, data: any, actor: string) {
        return OrderFlow.advanceState(id, action as any, data, actor);
    }

    /**
     * POST /api/orders/:id/incident
     */
    static async reportIncident(id: string, data: any, actor: string) {
        return OrderFlow.advanceState(id, 'report_incident', data, actor);
    }

    /**
     * POST /api/orders/:id/resolve-incident
     */
    static async resolveIncident(id: string, data: any, actor: string) {
        return OrderFlow.advanceState(id, 'resolve_incident', data, actor);
    }
}
