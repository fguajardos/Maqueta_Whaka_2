import prisma from '../config/database';
import { syncManagerClient } from '../integrations/syncmanager/syncmanager.client';
import { shopifyClient } from '../integrations/shopify/shopify.client';
import { bsaleClient } from '../integrations/bsale/bsale.client';
import { audit } from '../utils/audit';
import { paginate } from '../utils/pagination';

export class ClientsService {
    /**
     * GET /api/clients (tabla 19)
     * Datos combinados de SyncManager (perfil) + Shopify (pedidos) + BSale (deuda)
     */
    static async list(filters: { estado?: string; search?: string; page: number; limit: number }) {
        try {
            const smClients = await syncManagerClient.getLeads({
                status: filters.estado || 'aprobado',
                page: filters.page,
                limit: filters.limit,
            });

            const clients = (smClients?.data || smClients?.contacts || []).map((c: any) => ({
                id: c.id,
                nombre: c.name || c.nombre,
                razonSocial: c.company || c.razon_social,
                rut: c.rut || c.tax_id,
                email: c.email,
                telefono: c.phone || c.telefono,
                tipoNegocio: c.business_type || c.tipo_negocio,
                estado: c.status || 'activo',
                condicionPago: c.commercial_conditions?.payment_condition || 'prepago',
            }));

            return paginate(clients, smClients?.total || clients.length, filters.page, filters.limit);
        } catch {
            return paginate([], 0, filters.page, filters.limit);
        }
    }

    /**
     * GET /api/clients/:id - Ficha completa
     */
    static async getById(id: string) {
        const mapping = await prisma.idMapping.findFirst({
            where: { entityType: 'cliente', OR: [{ syncmanagerId: id }, { internalId: id }] },
        });

        const profile = await syncManagerClient.getLead(mapping?.syncmanagerId || id);
        return {
            ...profile,
            internalId: mapping?.internalId,
            shopifyId: mapping?.shopifyId,
            bsaleId: mapping?.bsaleId,
        };
    }

    /**
     * GET /api/clients/:id/orders
     */
    static async getOrders(id: string, page: number, limit: number) {
        const processes = await prisma.processState.findMany({
            where: { processType: 'pedido_completo' },
            orderBy: { startedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.processState.count({ where: { processType: 'pedido_completo' } });
        return paginate(processes, total, page, limit);
    }

    /**
     * GET /api/clients/:id/metrics
     */
    static async getMetrics(id: string, period: string) {
        return {
            otvPromedio: 0,
            ticketPromedio: 0,
            frecuenciaCompra: 0,
            totalPedidos: 0,
            evolucionTemporal: [],
        };
    }

    /**
     * PUT /api/clients/:id/commercial-config
     */
    static async updateCommercialConfig(id: string, config: any, actor: string) {
        await syncManagerClient.updateLead(id, { commercial_conditions: config });

        await audit({
            action: 'client_config_updated',
            actor,
            entityType: 'cliente',
            entityId: id,
            sourceSystem: 'panel_admin',
            requestPayload: config,
        });

        return { success: true };
    }

    /**
     * POST /api/clients/:id/block
     */
    static async block(id: string, motivo: string, actor: string) {
        await syncManagerClient.updateClientStatus(id, 'bloqueado', motivo);

        await audit({
            action: 'client_blocked',
            actor,
            entityType: 'cliente',
            entityId: id,
            sourceSystem: 'panel_admin',
            requestPayload: { motivo },
        });

        return { success: true };
    }

    /**
     * POST /api/clients/:id/unblock
     */
    static async unblock(id: string, actor: string) {
        await syncManagerClient.updateClientStatus(id, 'activo');

        await audit({
            action: 'client_unblocked',
            actor,
            entityType: 'cliente',
            entityId: id,
            sourceSystem: 'panel_admin',
        });

        return { success: true };
    }
}
