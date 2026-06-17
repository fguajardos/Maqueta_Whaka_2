import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import redis from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Job Orchestrator
 * Crea y mantiene las colas de BullMQ
 * Coordina la ejecución de jobs cuando ocurren eventos
 */

// Crear colas
export const leadApprovalQueue = new Queue('leadApproval', { connection: redis });
export const leadRejectionQueue = new Queue('leadRejection', { connection: redis });
export const leadExpirationQueue = new Queue('leadExpiration', { connection: redis });

// ¿Hay Redis disponible? Se determina al iniciar (initializeJobOrchestrator).
// Si es false, los dispatch retornan de inmediato sin tocar Redis (no bloquean).
let queuesEnabled = false;
export function areQueuesEnabled() {
  return queuesEnabled;
}

/**
 * Disparar job de aprobación de lead
 */
export async function dispatchLeadApproval(leadId: string, approvedBy: string) {
  if (!queuesEnabled) return null;
  try {
    const job = await leadApprovalQueue.add(
      'approve-lead',
      { leadId, approvedBy },
      {
        delay: 1000, // Esperar 1s antes de procesar
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      }
    );

    logger.info(`[JobOrchestrator] Lead approval job creado: ${job.id} para lead ${leadId}`);
    return job;
  } catch (error: any) {
    logger.warn(`[JobOrchestrator] No se pudo crear lead approval job:`, error.message);
    return null;
  }
}

/**
 * Disparar job de rechazo de lead
 */
export async function dispatchLeadRejection(
  leadId: string,
  rejectedBy: string,
  reason?: string
) {
  if (!queuesEnabled) return null;
  try {
    const job = await leadRejectionQueue.add(
      'reject-lead',
      { leadId, rejectedBy, reason },
      {
        delay: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      }
    );

    logger.info(`[JobOrchestrator] Lead rejection job creado: ${job.id} para lead ${leadId}`);
    return job;
  } catch (error: any) {
    logger.warn(`[JobOrchestrator] No se pudo crear lead rejection job:`, error.message);
    return null;
  }
}

/**
 * Disparar job de expiración (cron job)
 * Se ejecuta cada 6 horas
 */
export async function dispatchLeadExpiration(expirationHours: number = 72) {
  if (!queuesEnabled) return null;
  try {
    const job = await leadExpirationQueue.add(
      'expire-leads',
      { expirationHours },
      {
        repeat: {
          pattern: '0 */6 * * *', // Cada 6 horas
        },
        removeOnComplete: true,
      }
    );

    logger.info(`[JobOrchestrator] Lead expiration cron job configurado: ${job.id}`);
    return job;
  } catch (error: any) {
    logger.error(`[JobOrchestrator] Error configurando lead expiration cron:`, error.message);
    throw error;
  }
}

/**
 * Inicializar todos los workers y listeners
 */
export async function initializeJobOrchestrator() {
  // Probe rápido: ¿responde Redis? (timeout corto para no bloquear el arranque)
  const probe = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    connectTimeout: 1500,
  });
  probe.on('error', () => { /* silencio: el catch decide */ });

  try {
    await probe.connect();
    await probe.ping();
    queuesEnabled = true;
  } catch {
    queuesEnabled = false;
  } finally {
    probe.disconnect();
  }

  if (!queuesEnabled) {
    logger.warn('[JobOrchestrator] Redis no disponible — colas BullMQ desactivadas. La aprobación/rechazo de leads se procesa de forma síncrona (sin bloquear).');
    return false;
  }

  // Redis OK: activar listeners y el cron de expiración
  leadApprovalQueue.on('error', (error) => logger.error('[JobOrchestrator] Lead approval queue error:', error));
  leadRejectionQueue.on('error', (error) => logger.error('[JobOrchestrator] Lead rejection queue error:', error));
  leadExpirationQueue.on('error', (error) => logger.error('[JobOrchestrator] Lead expiration queue error:', error));

  await dispatchLeadExpiration(72);

  logger.info('[JobOrchestrator] Inicializado con colas BullMQ activas');
  return true;
}

/**
 * Limpiar y desconectar colas
 */
export async function closeJobOrchestrator() {
  try {
    await leadApprovalQueue.close();
    await leadRejectionQueue.close();
    await leadExpirationQueue.close();

    logger.info('[JobOrchestrator] Cerrado correctamente');
  } catch (error: any) {
    logger.error('[JobOrchestrator] Error cerrando orchestrator:', error.message);
    throw error;
  }
}

export default {
  initializeJobOrchestrator,
  closeJobOrchestrator,
  dispatchLeadApproval,
  dispatchLeadRejection,
  dispatchLeadExpiration,
};
