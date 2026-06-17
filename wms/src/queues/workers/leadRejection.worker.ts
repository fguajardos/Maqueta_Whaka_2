import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import prisma from '../../config/database';
import { logger } from '../../utils/logger';
import { NotificationsService } from '../../services/notifications.service';

/**
 * Lead Rejection Worker
 * Se ejecuta cuando un admin rechaza un lead
 * Acciones:
 * 1. Enviar notificación de rechazo
 * 2. Crear tarea manual para ejecutivo comercial
 * 3. Registrar en Notifications
 */

interface LeadRejectionJob {
  leadId: string;
  rejectedBy: string;
  reason?: string;
}

const leadRejectionWorker = new Worker<LeadRejectionJob>(
  'leadRejection',
  async (job: Job<LeadRejectionJob>) => {
    const { leadId, rejectedBy, reason } = job.data;

    logger.info(`[LeadRejectionWorker] Procesando rechazo del lead: ${leadId}`);

    try {
      // 1. Obtener lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        logger.error(`[LeadRejectionWorker] Lead no encontrado: ${leadId}`);
        throw new Error('Lead no encontrado');
      }

      if (lead.status !== 'rechazado') {
        logger.warn(
          `[LeadRejectionWorker] Lead no en estado rechazado: ${leadId} (estado: ${lead.status})`
        );
        return { success: false, message: 'Lead no en estado rechazado' };
      }

      // 2. Enviar notificación WhatsApp al cliente
      await NotificationsService.create({
        type: 'lead_rechazado',
        title: 'Tu solicitud está siendo revisada',
        message: 'Un ejecutivo comercial se contactará contigo en breve para brindarte más opciones.',
        entityType: 'Lead',
        entityId: leadId,
        recipientEmail: lead.email || 'admin@whakachile.com',
        recipientPhone: lead.phone || undefined,
      });

      logger.info(`[LeadRejectionWorker] Notificación de rechazo enviada para lead: ${leadId}`);

      // 3. Crear notificación para admin (tarea manual)
      await NotificationsService.create({
        type: 'lead_rechazado_manual',
        title: `⚠️ Seguimiento manual requerido: ${lead.razonSocial}`,
        message: `Lead rechazado el ${new Date().toLocaleDateString('es-CL')}. Motivo: ${reason || 'No especificado'}. RUT: ${lead.rut}`,
        entityType: 'Lead',
        entityId: leadId,
        recipientEmail: 'ventas@whakachile.com', // Email del equipo de ventas
      });

      logger.info(`[LeadRejectionWorker] Tarea manual creada para admin`);

      // 4. Actualizar lead con nota de auditoría
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          adminNotes: `Rechazado por ${rejectedBy}. Motivo: ${reason || 'No especificado'}. Requiere seguimiento manual.`,
        },
      });

      logger.info(`[LeadRejectionWorker] Lead procesado exitosamente: ${leadId}`);

      return {
        success: true,
        leadId,
        message: 'Lead rechazado y tarea manual creada para ejecutivo',
      };
    } catch (error: any) {
      logger.error(`[LeadRejectionWorker] Error procesando lead ${leadId}:`, error.message);

      // Registrar error
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          adminNotes: `Error en rechazo: ${error.message}`,
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

leadRejectionWorker.on('completed', (job) => {
  logger.info(`[LeadRejectionWorker] Job completado: ${job.id}`);
});

leadRejectionWorker.on('failed', (job, error) => {
  logger.error(`[LeadRejectionWorker] Job falló: ${job?.id} - ${error.message}`);
});

export default leadRejectionWorker;
