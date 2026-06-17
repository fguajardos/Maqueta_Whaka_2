import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import prisma from '../../config/database';
import { logger } from '../../utils/logger';
import { NotificationsService } from '../../services/notifications.service';

/**
 * Lead Expiration Worker
 * Cron job que se ejecuta cada 6 horas
 * Cancela leads que han estado pendientes por más de 72 horas
 * Acciones:
 * 1. Buscar leads pendientes > 72h
 * 2. Cambiar estado a 'cancelado'
 * 3. Enviar notificaciones
 */

interface LeadExpirationJob {
  expirationHours?: number; // Default: 72
}

const leadExpirationWorker = new Worker<LeadExpirationJob>(
  'leadExpiration',
  async (job: Job<LeadExpirationJob>) => {
    const expirationHours = job.data.expirationHours || 72;
    const cutoffDate = new Date(Date.now() - expirationHours * 60 * 60 * 1000);

    logger.info(
      `[LeadExpirationWorker] Buscando leads pendientes más antiguos que ${expirationHours}h (${cutoffDate.toISOString()})`
    );

    try {
      // 1. Buscar leads pendientes expirados
      const expiredLeads = await prisma.lead.findMany({
        where: {
          status: 'pendiente',
          createdAt: { lt: cutoffDate },
        },
      });

      if (expiredLeads.length === 0) {
        logger.info('[LeadExpirationWorker] No hay leads expirados');
        return { success: true, expiredCount: 0 };
      }

      logger.info(`[LeadExpirationWorker] Encontrados ${expiredLeads.length} leads expirados`);

      // 2. Procesar cada lead expirado
      let processedCount = 0;
      for (const lead of expiredLeads) {
        try {
          // Cambiar status a cancelado
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: 'cancelado',
              adminNotes: `Cancelado automáticamente por expiración (${expirationHours}h sin acción)`,
            },
          });

          // Notificar al cliente
          await NotificationsService.create({
            type: 'lead_expirado',
            title: 'Tu solicitud ha expirado',
            message: `Tu solicitud de registro no fue procesada en el tiempo requerido. Contacta con ventas para reintentar.`,
            entityType: 'Lead',
            entityId: lead.id,
            recipientEmail: lead.email || 'admin@whakachile.com',
            recipientPhone: lead.phone || undefined,
          });

          // Notificar al admin
          await NotificationsService.create({
            type: 'lead_expirado_admin',
            title: `Lead expirado: ${lead.razonSocial}`,
            message: `El lead RUT ${lead.rut} fue cancelado por expiración. Creado hace ${expirationHours}h.`,
            entityType: 'Lead',
            entityId: lead.id,
            recipientEmail: 'ventas@whakachile.com',
          });

          processedCount++;
          logger.info(`[LeadExpirationWorker] Lead cancelado: ${lead.id}`);
        } catch (error: any) {
          logger.error(
            `[LeadExpirationWorker] Error procesando lead ${lead.id}:`,
            error.message
          );
        }
      }

      logger.info(`[LeadExpirationWorker] Proceso completado: ${processedCount} leads cancelados`);

      return {
        success: true,
        expiredCount: expiredLeads.length,
        processedCount,
      };
    } catch (error: any) {
      logger.error('[LeadExpirationWorker] Error:', error.message);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1, // Un solo worker para este job
  }
);

leadExpirationWorker.on('completed', (job) => {
  logger.info(`[LeadExpirationWorker] Job completado: ${job.id}`);
});

leadExpirationWorker.on('failed', (job, error) => {
  logger.error(`[LeadExpirationWorker] Job falló: ${job?.id} - ${error.message}`);
});

export default leadExpirationWorker;
