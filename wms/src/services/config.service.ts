import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { bsaleClient } from '../integrations/bsale/bsale.client';
import { shopifyClient } from '../integrations/shopify/shopify.client';
import { syncManagerClient } from '../integrations/syncmanager/syncmanager.client';
import { audit } from '../utils/audit';

export class ConfigService {
    /**
     * GET /api/config/business-rules (tabla 25)
     */
    static async getBusinessRules() {
        return prisma.businessRule.findMany({ orderBy: { ruleKey: 'asc' } });
    }

    /**
     * PUT /api/config/business-rules/:key
     */
    static async updateBusinessRule(key: string, data: { value: any; description?: string }, actor: string) {
        const rule = await prisma.businessRule.update({
            where: { ruleKey: key },
            data: {
                ruleValue: data.value,
                description: data.description || undefined,
                updatedBy: actor,
            },
        });

        await audit({
            action: 'business_rule_updated',
            actor,
            entityType: 'business_rule',
            entityId: key,
            sourceSystem: 'panel_admin',
            requestPayload: data,
        });

        return rule;
    }

    /**
     * GET /api/config/coverage-zones
     */
    static async getCoverageZones() {
        const rule = await prisma.businessRule.findUnique({
            where: { ruleKey: 'zonas_cobertura_activas' },
        });
        return (rule?.ruleValue as any)?.zonas || [];
    }

    /**
     * PUT /api/config/coverage-zones/:id
     */
    static async updateCoverageZone(zoneId: string, data: { activa: boolean }, actor: string) {
        const rule = await prisma.businessRule.findUnique({
            where: { ruleKey: 'zonas_cobertura_activas' },
        });

        if (!rule) throw Object.assign(new Error('Regla de zonas no encontrada'), { statusCode: 404 });

        const zonas = (rule.ruleValue as any).zonas || [];
        const updatedZonas = zonas.map((z: any) =>
            z.id === zoneId ? { ...z, activa: data.activa } : z
        );

        await prisma.businessRule.update({
            where: { ruleKey: 'zonas_cobertura_activas' },
            data: { ruleValue: { zonas: updatedZonas }, updatedBy: actor },
        });

        return { success: true };
    }

    /**
     * GET /api/config/users
     */
    static async getUsers() {
        return prisma.user.findMany({
            select: { id: true, email: true, nombre: true, role: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * POST /api/config/users
     */
    static async createUser(data: { nombre: string; email: string; role: string; password: string }, actor: string) {
        const passwordHash = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                nombre: data.nombre,
                role: data.role as any,
                passwordHash,
            },
            select: { id: true, email: true, nombre: true, role: true },
        });

        await audit({
            action: 'user_created',
            actor,
            entityType: 'user',
            entityId: user.id,
            sourceSystem: 'panel_admin',
        });

        return user;
    }

    /**
     * PUT /api/config/users/:id
     */
    static async updateUser(id: string, data: any, actor: string) {
        const user = await prisma.user.update({
            where: { id },
            data: {
                role: data.role,
                isActive: data.isActive,
                nombre: data.nombre,
            },
            select: { id: true, email: true, nombre: true, role: true, isActive: true },
        });

        await audit({
            action: 'user_updated',
            actor,
            entityType: 'user',
            entityId: id,
            sourceSystem: 'panel_admin',
            requestPayload: data,
        });

        return user;
    }

    /**
     * DELETE /api/config/users/:id (desactivar)
     */
    static async deactivateUser(id: string, actor: string) {
        await prisma.user.update({ where: { id }, data: { isActive: false } });

        await audit({
            action: 'user_deactivated',
            actor,
            entityType: 'user',
            entityId: id,
            sourceSystem: 'panel_admin',
        });

        return { success: true };
    }

    /**
     * GET /api/config/integrations (tabla 29)
     */
    static async getIntegrationsStatus() {
        const [syncManager, shopify, bsale] = await Promise.allSettled([
            syncManagerClient.healthCheck(),
            shopifyClient.healthCheck(),
            bsaleClient.healthCheck(),
        ]);

        const lastWebhooks = await prisma.webhookEvent.findMany({
            orderBy: { receivedAt: 'desc' },
            take: 3,
            distinct: ['source'],
        });

        return {
            syncmanager: {
                connected: syncManager.status === 'fulfilled' && syncManager.value,
                circuitState: syncManagerClient.getCircuitState(),
                lastWebhook: lastWebhooks.find((w) => w.source === 'syncmanager')?.receivedAt || null,
            },
            shopify: {
                connected: shopify.status === 'fulfilled' && shopify.value,
                circuitState: shopifyClient.getCircuitState(),
                lastWebhook: lastWebhooks.find((w) => w.source === 'shopify')?.receivedAt || null,
            },
            bsale: {
                connected: bsale.status === 'fulfilled' && bsale.value,
                circuitState: bsaleClient.getCircuitState(),
                lastWebhook: lastWebhooks.find((w) => w.source === 'bsale')?.receivedAt || null,
            },
        };
    }
}
