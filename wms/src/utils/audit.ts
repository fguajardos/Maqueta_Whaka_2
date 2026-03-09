import prisma from '../config/database';
import { logger } from './logger';

interface AuditEntry {
    action: string;
    actor: string;
    entityType: string;
    entityId: string;
    sourceSystem: string;
    requestPayload?: any;
    responseSummary?: any;
    status?: string;
}

export async function audit(entry: AuditEntry): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: entry.action,
                actor: entry.actor,
                entityType: entry.entityType,
                entityId: entry.entityId,
                sourceSystem: entry.sourceSystem,
                requestPayload: entry.requestPayload || null,
                responseSummary: entry.responseSummary || null,
                status: entry.status || 'success',
            },
        });
    } catch (err) {
        logger.error('Failed to write audit log', { error: err, entry });
    }
}
