import prisma from '../config/database';
import { logger } from '../utils/logger';

export class ClientsWhatsAppService {
  static async createFromLead(leadId: string) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        return { success: false, error: 'Lead no encontrado' };
      }

      if (lead.status !== 'aprobado') {
        return {
          success: false,
          error: `Lead debe estar aprobado. Estado actual: ${lead.status}`,
        };
      }

      const cliente = await prisma.cliente?.create({
        data: {
          rut: lead.rut,
          razonSocial: lead.razonSocial,
          tipoCliente: lead.tipoCliente,
          tipoNegocio: lead.tipoNegocio,
          phone: lead.phone,
          email: lead.email,
          contactName: lead.contactName,
          direccion: lead.direccion,
          comuna: lead.comuna,
          region: lead.region,
          estado: 'activo',
          leadId: leadId,
        },
      });

      const updated = await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'cliente_creado',
          clientId: cliente?.id,
        },
      });

      logger.info(`[ClientsWhatsApp] Cliente creado desde Lead: ${cliente?.id}`);

      return {
        success: true,
        clientId: cliente?.id,
        cliente,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        logger.warn('[ClientsWhatsApp] Cliente ya existe (RUT duplicado)');
        return {
          success: false,
          error: 'El cliente ya está registrado',
        };
      }
      logger.error('[ClientsWhatsApp] Error creating client:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async getByRut(rut: string) {
    try {
      const cliente = await prisma.cliente?.findUnique({
        where: { rut },
      });

      if (!cliente) {
        return {
          success: false,
          error: 'Cliente no encontrado',
        };
      }

      return {
        success: true,
        cliente,
      };
    } catch (error: any) {
      logger.error('[ClientsWhatsApp] Error getting client:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async getById(clientId: string) {
    try {
      const cliente = await prisma.cliente?.findUnique({
        where: { id: clientId },
      });

      if (!cliente) {
        return {
          success: false,
          error: 'Cliente no encontrado',
        };
      }

      return {
        success: true,
        cliente,
      };
    } catch (error: any) {
      logger.error('[ClientsWhatsApp] Error getting client by ID:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async updateClientInfo(
    clientId: string,
    data: {
      condicionPago?: string;
      listaPreciosId?: string;
      limiteCredito?: number;
      pedidoMinimo?: number;
    },
  ) {
    try {
      const updated = await prisma.cliente?.update({
        where: { id: clientId },
        data,
      });

      logger.info(`[ClientsWhatsApp] Client info actualizada: ${clientId}`);

      return {
        success: true,
        cliente: updated,
      };
    } catch (error: any) {
      logger.error('[ClientsWhatsApp] Error updating client:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
