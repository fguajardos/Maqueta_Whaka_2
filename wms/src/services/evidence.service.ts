import crypto from 'crypto';
import path from 'path';
import prisma from '../config/database';
import { audit } from '../utils/audit';
import { logger } from '../utils/logger';

/**
 * Evidence Service — Gestión de evidencia de recepción y tokens de tracking.
 * Tokens permiten acceso público (sin auth) para que clientes confirmen 
 * recepción o reporten discrepancias.
 */

interface EvidenceEntry {
    type: 'reception_confirmed' | 'discrepancy_reported' | 'evidence_uploaded';
    timestamp: string;
    receptorNombre?: string;
    notas?: string;
    discrepancyType?: string;
    discrepancyDescription?: string;
    filePath?: string;
    fileName?: string;
    actor: string;
}

export class EvidenceService {
    /**
     * Genera un token único asociado a un pedido.
     * El token se almacena en el stepsLog del pedido para validación posterior.
     */
    static async generateEvidenceToken(orderId: string, actor: string): Promise<{ token: string; url: string }> {
        const token = crypto.randomBytes(24).toString('hex');

        const order = await prisma.processState.findFirst({
            where: {
                OR: [{ id: orderId }, { entityId: orderId }],
                processType: 'pedido_completo',
            },
        });

        if (!order) {
            throw Object.assign(new Error('Pedido no encontrado'), { statusCode: 404 });
        }

        const currentLog = Array.isArray(order.stepsLog) ? order.stepsLog : [];

        await prisma.processState.update({
            where: { id: order.id },
            data: {
                stepsLog: [
                    ...currentLog as any[],
                    {
                        step: 'tracking_token_generated',
                        token,
                        timestamp: new Date().toISOString(),
                        actor,
                    },
                ],
            },
        });

        await audit({
            action: 'tracking_token_generated',
            actor,
            entityType: 'pedido',
            entityId: order.entityId,
            sourceSystem: 'panel_admin',
            requestPayload: { token: token.substring(0, 8) + '...' },
        });

        const url = `/tracking?token=${token}`;
        return { token, url };
    }

    /**
     * Valida un token y retorna los datos del pedido para tracking público.
     */
    static async validateToken(token: string): Promise<{
        orderId: string;
        internalId: string;
        estado: string;
        timeline: any[];
        evidence: EvidenceEntry[];
    }> {
        if (!token || token.length < 10) {
            throw Object.assign(new Error('Token inválido'), { statusCode: 400 });
        }

        // Buscar el pedido que contiene el token en su stepsLog
        const orders = await prisma.processState.findMany({
            where: { processType: 'pedido_completo' },
        });

        const order = orders.find((o) => {
            const log = Array.isArray(o.stepsLog) ? o.stepsLog : [];
            return (log as any[]).some(
                (entry: any) => entry.step === 'tracking_token_generated' && entry.token === token
            );
        });

        if (!order) {
            throw Object.assign(new Error('Token inválido o expirado'), { statusCode: 404 });
        }

        const stepsLog = Array.isArray(order.stepsLog) ? order.stepsLog as any[] : [];

        // Construir timeline del pedido (sin tokens, para seguridad)
        const timeline = stepsLog
            .filter((entry: any) => entry.step !== 'tracking_token_generated')
            .map((entry: any) => ({
                step: entry.step || entry.action || 'transición',
                from: entry.from,
                to: entry.to,
                timestamp: entry.timestamp,
                action: entry.action,
            }));

        // Extraer evidencia existente
        const evidence = stepsLog
            .filter((entry: any) =>
                entry.step === 'reception_confirmed' ||
                entry.step === 'discrepancy_reported' ||
                entry.step === 'evidence_uploaded'
            )
            .map((entry: any) => ({
                type: entry.step as EvidenceEntry['type'],
                timestamp: entry.timestamp,
                receptorNombre: entry.receptorNombre,
                notas: entry.notas,
                discrepancyType: entry.discrepancyType,
                discrepancyDescription: entry.discrepancyDescription,
                filePath: entry.filePath,
                fileName: entry.fileName,
                actor: entry.actor,
            }));

        return {
            orderId: order.id,
            internalId: order.entityId,
            estado: order.currentStep,
            timeline,
            evidence,
        };
    }

    /**
     * Cliente confirma recepción del pedido con foto y datos del receptor.
     */
    static async confirmReception(
        token: string,
        file: Express.Multer.File | undefined,
        metadata: { receptorNombre: string; notas?: string }
    ): Promise<{ success: boolean; message: string }> {
        if (!metadata.receptorNombre) {
            throw Object.assign(new Error('El nombre del receptor es obligatorio'), { statusCode: 400 });
        }

        const orderData = await EvidenceService.validateToken(token);

        const order = await prisma.processState.findFirst({
            where: { id: orderData.orderId },
        });

        if (!order) {
            throw Object.assign(new Error('Pedido no encontrado'), { statusCode: 404 });
        }

        const currentLog = Array.isArray(order.stepsLog) ? order.stepsLog as any[] : [];

        const evidenceEntry: any = {
            step: 'reception_confirmed',
            timestamp: new Date().toISOString(),
            receptorNombre: metadata.receptorNombre,
            notas: metadata.notas || '',
            actor: `cliente:${metadata.receptorNombre}`,
        };

        if (file) {
            evidenceEntry.filePath = `/uploads/evidence/${file.filename}`;
            evidenceEntry.fileName = file.originalname;
        }

        await prisma.processState.update({
            where: { id: order.id },
            data: {
                stepsLog: [...currentLog, evidenceEntry],
            },
        });

        await audit({
            action: 'reception_confirmed',
            actor: `cliente:${metadata.receptorNombre}`,
            entityType: 'pedido',
            entityId: order.entityId,
            sourceSystem: 'portal_cliente',
            requestPayload: {
                receptorNombre: metadata.receptorNombre,
                hasPhoto: !!file,
            },
        });

        logger.info(`Recepción confirmada para pedido ${order.entityId} por ${metadata.receptorNombre}`);

        return { success: true, message: 'Recepción confirmada exitosamente' };
    }

    /**
     * Cliente reporta una discrepancia en la entrega.
     */
    static async reportDiscrepancy(
        token: string,
        data: { type: string; description: string },
        file?: Express.Multer.File
    ): Promise<{ success: boolean; message: string }> {
        if (!data.type || !data.description) {
            throw Object.assign(
                new Error('El tipo y descripción de la discrepancia son obligatorios'),
                { statusCode: 400 }
            );
        }

        const orderData = await EvidenceService.validateToken(token);

        const order = await prisma.processState.findFirst({
            where: { id: orderData.orderId },
        });

        if (!order) {
            throw Object.assign(new Error('Pedido no encontrado'), { statusCode: 404 });
        }

        const currentLog = Array.isArray(order.stepsLog) ? order.stepsLog as any[] : [];

        const discrepancyEntry: any = {
            step: 'discrepancy_reported',
            timestamp: new Date().toISOString(),
            discrepancyType: data.type,
            discrepancyDescription: data.description,
            actor: 'cliente',
        };

        if (file) {
            discrepancyEntry.filePath = `/uploads/evidence/${file.filename}`;
            discrepancyEntry.fileName = file.originalname;
        }

        await prisma.processState.update({
            where: { id: order.id },
            data: {
                stepsLog: [...currentLog, discrepancyEntry],
            },
        });

        await audit({
            action: 'discrepancy_reported',
            actor: 'cliente',
            entityType: 'pedido',
            entityId: order.entityId,
            sourceSystem: 'portal_cliente',
            requestPayload: {
                discrepancyType: data.type,
                hasPhoto: !!file,
            },
        });

        logger.info(`Discrepancia reportada para pedido ${order.entityId}: ${data.type}`);

        return { success: true, message: 'Discrepancia registrada exitosamente' };
    }

    /**
     * Retorna toda la evidencia asociada a un pedido (para vista interna del admin).
     */
    static async getEvidenceByOrder(orderId: string): Promise<EvidenceEntry[]> {
        const order = await prisma.processState.findFirst({
            where: {
                OR: [{ id: orderId }, { entityId: orderId }],
                processType: 'pedido_completo',
            },
        });

        if (!order) {
            throw Object.assign(new Error('Pedido no encontrado'), { statusCode: 404 });
        }

        const stepsLog = Array.isArray(order.stepsLog) ? order.stepsLog as any[] : [];

        return stepsLog
            .filter(
                (entry: any) =>
                    entry.step === 'reception_confirmed' ||
                    entry.step === 'discrepancy_reported' ||
                    entry.step === 'evidence_uploaded'
            )
            .map((entry: any) => ({
                type: entry.step as EvidenceEntry['type'],
                timestamp: entry.timestamp,
                receptorNombre: entry.receptorNombre,
                notas: entry.notas,
                discrepancyType: entry.discrepancyType,
                discrepancyDescription: entry.discrepancyDescription,
                filePath: entry.filePath,
                fileName: entry.fileName,
                actor: entry.actor,
            }));
    }
}
