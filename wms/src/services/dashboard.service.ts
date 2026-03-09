import prisma from '../config/database';
import { syncManagerClient } from '../integrations/syncmanager/syncmanager.client';
import { shopifyClient } from '../integrations/shopify/shopify.client';
import { bsaleClient } from '../integrations/bsale/bsale.client';

export class DashboardService {
    /**
     * GET /api/dashboard/kpis
     * KPIs principales: pedidos_hoy, ventas_mes, clientes_activos, otv_promedio
     */
    static async getKpis() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Pedidos hoy y del mes (de process_states)
        const pedidosHoy = await prisma.processState.count({
            where: {
                processType: 'pedido_completo',
                startedAt: { gte: today },
            },
        });

        const pedidosMes = await prisma.processState.count({
            where: {
                processType: 'pedido_completo',
                startedAt: { gte: firstDayOfMonth },
            },
        });

        const clientesActivos = await prisma.idMapping.count({
            where: { entityType: 'cliente' },
        });

        return {
            pedidosHoy: { value: pedidosHoy, variacion: 0 },
            ventasMes: { value: 0, currency: 'CLP', variacion: 0 }, // Requires Shopify data
            clientesActivos: { value: clientesActivos, variacion: 0 },
            otvPromedio: { value: 0, currency: 'CLP', variacion: 0 }, // Requires calculation
        };
    }

    /**
     * GET /api/dashboard/charts?period=7d|30d|90d
     */
    static async getCharts(period: string) {
        return {
            ventasMensual: { labels: [], data: [] },
            distribucionClientes: { labels: ['Activos', 'Inactivos', 'Bloqueados'], data: [0, 0, 0] },
            topProductos: { labels: [], data: [] },
            estadosPedidos: { labels: [], data: [] },
        };
    }

    /**
     * GET /api/dashboard/alerts
     */
    static async getAlerts() {
        const incidencias = await prisma.processState.count({
            where: { processType: 'pedido_completo', currentStep: 'incidencia' },
        });

        const procesosFallidos = await prisma.processState.count({
            where: { status: 'failed' },
        });

        return {
            pedidosIncidencia: incidencias,
            procesosFallidos,
            stockBajo: 0, // Requires BSale data
            clientesDeuda: 0, // Requires SyncManager data
        };
    }

    /**
     * GET /api/dashboard/recent-leads?limit=5
     */
    static async getRecentLeads(limit: number = 5) {
        // In production, fetches from SyncManager
        return [];
    }
}
