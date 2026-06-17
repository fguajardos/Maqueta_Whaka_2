import prisma from '../config/database';
import { logger } from '../utils/logger';

export class LeadWhatsAppService {
  static async validateRut(rut: string) {
    try {
      const cliente = await prisma.cliente?.findUnique({ where: { rut } });
      if (cliente) {
        return {
          success: true,
          exists: true,
          clientId: cliente.id,
          flowType: 'existing_client',
        };
      }

      const lead = await prisma.lead.findUnique({ where: { rut } });
      if (lead && lead.status === 'cliente_creado') {
        return {
          success: true,
          exists: true,
          clientId: lead.clientId,
          flowType: 'existing_client',
        };
      }

      if (lead && lead.status === 'pendiente') {
        return {
          success: true,
          exists: false,
          flowType: 'pending_lead',
          leadId: lead.id,
          message: 'Tu solicitud está siendo revisada',
        };
      }

      if (lead && lead.status === 'rechazado') {
        return {
          success: true,
          exists: false,
          flowType: 'rejected_lead',
          message: 'Tu solicitud fue rechazada. Contacta al equipo de ventas.',
        };
      }

      return {
        success: true,
        exists: false,
        flowType: 'new_lead',
      };
    } catch (error: any) {
      logger.error('[LeadWhatsApp] Error validating RUT:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async createLead(data: {
    rut: string;
    razonSocial: string;
    tipoNegocio: string;
    tipoCliente: string;
    phone: string;
    email?: string;
    contactName?: string;
    direccion?: string;
    comuna?: string;
    region?: string;
  }) {
    try {
      const lead = await prisma.lead.create({
        data: {
          rut: data.rut,
          razonSocial: data.razonSocial,
          tipoNegocio: data.tipoNegocio,
          tipoCliente: data.tipoCliente,
          phone: data.phone,
          email: data.email,
          contactName: data.contactName,
          direccion: data.direccion,
          comuna: data.comuna,
          region: data.region,
          status: 'pendiente',
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          formData: data as any,
        },
      });

      logger.info(`[LeadWhatsApp] Lead creado: ${lead.id} (RUT: ${lead.rut})`);

      return {
        success: true,
        leadId: lead.id,
        lead,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        logger.warn(`[LeadWhatsApp] RUT duplicado: ${data.rut}`);
        return {
          success: false,
          error: 'El RUT ya está registrado',
        };
      }
      logger.error('[LeadWhatsApp] Error creating lead:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async getLeadStatus(leadId: string) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        return {
          success: false,
          error: 'Lead no encontrado',
        };
      }

      return {
        success: true,
        status: lead.status,
        clientId: lead.clientId,
        lead,
      };
    } catch (error: any) {
      logger.error('[LeadWhatsApp] Error getting lead status:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async approveLead(leadId: string, approvedBy: string) {
    try {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return { success: false, error: 'Lead no encontrado' };
      }

      const updated = await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'aprobado',
          approvedBy,
          approvedAt: new Date(),
        },
      });

      logger.info(`[LeadWhatsApp] Lead aprobado: ${leadId}`);

      return {
        success: true,
        lead: updated,
      };
    } catch (error: any) {
      logger.error('[LeadWhatsApp] Error approving lead:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async rejectLead(leadId: string, rejectedBy: string, reason?: string) {
    try {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return { success: false, error: 'Lead no encontrado' };
      }

      const updated = await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'rechazado',
          rejectedBy,
          rejectedAt: new Date(),
          adminNotes: reason,
        },
      });

      logger.info(`[LeadWhatsApp] Lead rechazado: ${leadId}`);

      return {
        success: true,
        lead: updated,
      };
    } catch (error: any) {
      logger.error('[LeadWhatsApp] Error rejecting lead:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async notifyLeadStatusChange(
    leadId: string,
    status: 'aprobado' | 'rechazado',
  ) {
    try {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) return { success: false, error: 'Lead no encontrado' };

      const title =
        status === 'aprobado'
          ? '¡Tu registro fue aprobado!'
          : 'Tu solicitud está en revisión';
      const message =
        status === 'aprobado'
          ? 'Aquí está el catálogo de productos disponibles'
          : 'Un ejecutivo se contactará contigo pronto';

      await prisma.notification.create({
        data: {
          type: status === 'aprobado' ? 'lead_aprobado' : 'lead_rechazado',
          title,
          message,
          entityType: 'Lead',
          entityId: leadId,
          recipientEmail: lead.email || 'admin@whakachile.com',
          recipientPhone: lead.phone,
        },
      });

      logger.info(`[LeadWhatsApp] Notification creada: ${status} para ${leadId}`);

      return { success: true };
    } catch (error: any) {
      logger.error('[LeadWhatsApp] Error notifying lead:', error.message);
      return { success: false, error: error.message };
    }
  }
}
