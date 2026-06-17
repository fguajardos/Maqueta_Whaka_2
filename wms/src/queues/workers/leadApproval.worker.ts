import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import prisma from '../../config/database';
import { logger } from '../../utils/logger';
import { NotificationsService } from '../../services/notifications.service';
import { LeadWhatsAppService } from '../../services/leadWhatsApp.service';

/**
 * Lead Approval Worker
 * Se ejecuta cuando un admin aprueba un lead
 * Acciones:
 * 1. Confirmar creación de cliente
 * 2. Enviar notificación WhatsApp
 * 3. Registrar en Notifications
 */

interface LeadApprovalJob {
  leadId: string;
  approvedBy: string;
}

const leadApprovalWorker = new Worker<LeadApprovalJob>(
  'leadApproval',
  async (job: Job<LeadApprovalJob>) => {
    const { leadId, approvedBy } = job.data;

    logger.info(`[LeadApprovalWorker] Procesando aprobación del lead: ${leadId}`);

    try {
      // 1. Obtener lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        logger.error(`[LeadApprovalWorker] Lead no encontrado: ${leadId}`);
        throw new Error('Lead no encontrado');
      }

      if (lead.status !== 'aprobado') {
        logger.warn(
          `[LeadApprovalWorker] Lead no en estado aprobado: ${leadId} (estado: ${lead.status})`
        );
        return { success: false, message: 'Lead no en estado aprobado' };
      }

      // 2. Verificar que cliente fue creado
      if (!lead.clientId) {
        logger.error(`[LeadApprovalWorker] Lead no tiene clientId asignado: ${leadId}`);
        throw new Error('Cliente no fue creado correctamente');
      }

      // 3. Enviar notificación WhatsApp
      await NotificationsService.create({
        type: 'lead_aprobado',
        title: '¡Tu registro fue aprobado! 🎉',
        message: 'Aquí está nuestro catálogo de productos. ¿Cuál necesitas?',
        entityType: 'Lead',
        entityId: leadId,
        recipientEmail: lead.email || 'admin@whakachile.com',
        recipientPhone: lead.phone || undefined,
      });

      logger.info(`[LeadApprovalWorker] Notificación enviada para lead: ${leadId}`);

      // 4. Actualizar estado de lead a cliente_creado
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'cliente_creado',
        },
      });

      logger.info(`[LeadApprovalWorker] Lead procesado exitosamente: ${leadId}`);

      return {
        success: true,
        leadId,
        clientId: lead.clientId,
        message: 'Lead aprobado y cliente notificado',
      };
    } catch (error: any) {
      logger.error(`[LeadApprovalWorker] Error procesando lead ${leadId}:`, error.message);

      // Registrar error
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          adminNotes: `Error en aprobación: ${error.message}`,
        },
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

leadApprovalWorker.on('completed', (job) => {
  logger.info(`[LeadApprovalWorker] Job completado: ${job.id}`);
});

leadApprovalWorker.on('failed', (job, error) => {
  logger.error(`[LeadApprovalWorker] Job falló: ${job?.id} - ${error.message}`);
});

export default leadApprovalWorker;
