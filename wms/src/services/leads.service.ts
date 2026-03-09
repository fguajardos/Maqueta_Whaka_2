import prisma from '../config/database';
import { syncManagerClient } from '../integrations/syncmanager/syncmanager.client';
import { SyncManagerTransformer } from '../integrations/syncmanager/syncmanager.transformer';
import { OnboardingFlow } from '../orchestration/flows/onboarding.flow';
import { audit } from '../utils/audit';
import { getPrismaSkipTake, paginate } from '../utils/pagination';

export class LeadsService {
    /**
     * GET /api/leads (tabla 18)
     */
    static async list(filters: {
        status?: string;
        search?: string;
        page: number;
        limit: number;
    }) {
        try {
            const smLeads = await syncManagerClient.getLeads({
                status: filters.status,
                page: filters.page,
                limit: filters.limit,
            });

            const leads = (smLeads?.data || smLeads?.contacts || []).map(
                SyncManagerTransformer.leadToInternalFormat
            );

            return paginate(leads, smLeads?.total || leads.length, filters.page, filters.limit);
        } catch {
            // Graceful degradation: return empty
            return paginate([], 0, filters.page, filters.limit);
        }
    }

    /**
     * GET /api/leads/:id
     */
    static async getById(id: string) {
        const smLead = await syncManagerClient.getLead(id);
        return SyncManagerTransformer.leadToInternalFormat(smLead);
    }

    /**
     * POST /api/leads/:id/approve - Dispara Flujo 1 de onboarding
     */
    static async approve(
        id: string,
        data: {
            listaPreciosId: string;
            condicionPago: string;
            limiteCredito: number;
            pedidoMinimo: number;
        },
        actor: string
    ) {
        return OnboardingFlow.execute(id, data, actor);
    }

    /**
     * POST /api/leads/:id/reject
     */
    static async reject(id: string, motivo: string, actor: string) {
        const smData = SyncManagerTransformer.rejectionToExternalFormat(motivo);
        await syncManagerClient.updateLead(id, smData);

        await audit({
            action: 'lead_rejected',
            actor,
            entityType: 'lead',
            entityId: id,
            sourceSystem: 'panel_admin',
            requestPayload: { motivo },
        });

        return { success: true };
    }

    /**
     * POST /api/leads/:id/observe
     */
    static async observe(id: string, observacion: string, actor: string) {
        await syncManagerClient.updateLead(id, { status: 'observado', observacion });

        await audit({
            action: 'lead_observed',
            actor,
            entityType: 'lead',
            entityId: id,
            sourceSystem: 'panel_admin',
            requestPayload: { observacion },
        });

        return { success: true };
    }

    /**
     * PUT /api/leads/:id
     */
    static async update(id: string, data: any, actor: string) {
        await syncManagerClient.updateLead(id, data);

        await audit({
            action: 'lead_updated',
            actor,
            entityType: 'lead',
            entityId: id,
            sourceSystem: 'panel_admin',
            requestPayload: data,
        });

        return { success: true };
    }

    /**
     * POST /api/leads/:id/notes
     */
    static async addNote(id: string, texto: string, actor: string) {
        await syncManagerClient.addNote(id, texto);
        return { success: true };
    }
}
