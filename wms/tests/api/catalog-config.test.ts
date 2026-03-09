/**
 * Tests — Catálogo (Stock) y Config APIs
 * Verifica productos, categorías y reglas de negocio.
 */
import { describe, it, expect } from 'vitest';
import { apiFetch } from '../helpers';

describe('Catálogo (Stock)', () => {
    describe('GET /api/catalog/products', () => {
        it('retorna lista paginada de productos', async () => {
            const { status, data } = await apiFetch('/api/catalog/products');

            expect(status).toBe(200);
            expect(data).toHaveProperty('data');
            expect(data).toHaveProperty('pagination');
            expect(data.pagination).toHaveProperty('total');
            expect(data.pagination).toHaveProperty('page');
            expect(data.pagination).toHaveProperty('limit');
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('soporta paginación', async () => {
            const { status, data } = await apiFetch('/api/catalog/products?page=1&limit=10');

            expect(status).toBe(200);
            expect(data.pagination.page).toBe(1);
            expect(data.pagination.limit).toBe(10);
        });
    });

    describe('GET /api/catalog/categories', () => {
        it('retorna array de categorías', async () => {
            const { status, data } = await apiFetch('/api/catalog/categories');

            expect(status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe('GET /api/catalog/price-lists', () => {
        it('retorna array de listas de precios', async () => {
            const { status, data } = await apiFetch('/api/catalog/price-lists');

            expect(status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });
    });
});

describe('Configuración', () => {
    describe('GET /api/config/business-rules', () => {
        it('retorna array de reglas de negocio', async () => {
            const { status, data } = await apiFetch('/api/config/business-rules');

            expect(status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });

        it('reglas del seed están presentes', async () => {
            const { data } = await apiFetch('/api/config/business-rules');

            const ruleKeys = data.map((r: any) => r.ruleKey);

            expect(ruleKeys).toContain('pedido_minimo_clp');
            expect(ruleKeys).toContain('horario_inicio');
            expect(ruleKeys).toContain('horario_fin');
            expect(ruleKeys).toContain('stock_sync_interval_min');
            expect(ruleKeys).toContain('zonas_cobertura_activas');
        });

        it('cada regla tiene estructura completa', async () => {
            const { data } = await apiFetch('/api/config/business-rules');

            if (data.length > 0) {
                const rule = data[0];
                expect(rule).toHaveProperty('ruleKey');
                expect(rule).toHaveProperty('ruleValue');
                expect(rule).toHaveProperty('description');
                expect(typeof rule.ruleKey).toBe('string');
                expect(typeof rule.description).toBe('string');
            }
        });
    });

    describe('GET /api/config/integrations', () => {
        it('retorna estado de integraciones', async () => {
            const { status, data } = await apiFetch('/api/config/integrations');

            expect(status).toBe(200);
            expect(data).toHaveProperty('bsale');
            expect(data).toHaveProperty('shopify');
            expect(data).toHaveProperty('syncmanager');
        });
    });
});

describe('Auditoría', () => {
    describe('GET /api/audit', () => {
        it('retorna datos de auditoría paginados', async () => {
            const { status, data } = await apiFetch('/api/audit');

            expect(status).toBe(200);
            expect(data).toHaveProperty('data');
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('registros de auditoría tienen estructura esperada', async () => {
            const { data } = await apiFetch('/api/audit');

            if (data.data.length > 0) {
                const entry = data.data[0];
                expect(entry).toHaveProperty('timestamp');
                expect(entry).toHaveProperty('action');
                expect(entry).toHaveProperty('actor');
                expect(entry).toHaveProperty('entityType');
                expect(entry).toHaveProperty('entityId');
            }
        });
    });
});
