/**
 * Tests — Warehouse (Bodega) API
 * Verifica picking, preparación y operaciones de bodega.
 */
import { describe, it, expect } from 'vitest';
import { apiFetch, getBodegaToken } from '../helpers';

describe('Warehouse (Bodega)', () => {
    describe('GET /api/warehouse/picking', () => {
        it('retorna estructura Kanban con 3 columnas', async () => {
            const { status, data } = await apiFetch('/api/warehouse/picking');

            expect(status).toBe(200);
            expect(data).toHaveProperty('pendiente');
            expect(data).toHaveProperty('en_preparacion');
            expect(data).toHaveProperty('listo');
            expect(Array.isArray(data.pendiente)).toBe(true);
            expect(Array.isArray(data.en_preparacion)).toBe(true);
            expect(Array.isArray(data.listo)).toBe(true);
        });

        it('soporta filtro por status pendiente', async () => {
            const { status, data } = await apiFetch('/api/warehouse/picking?status=pendiente');

            expect(status).toBe(200);
            expect(data).toHaveProperty('pendiente');
        });

        it('soporta filtro por status en_preparacion', async () => {
            const { status } = await apiFetch('/api/warehouse/picking?status=en_preparacion');

            expect(status).toBe(200);
        });

        it('soporta filtro por status listo', async () => {
            const { status } = await apiFetch('/api/warehouse/picking?status=listo');

            expect(status).toBe(200);
        });

        it('es accesible con token de operario de bodega', async () => {
            const { status } = await apiFetch('/api/warehouse/picking', {
                token: getBodegaToken(),
            });

            expect(status).toBe(200);
        });
    });

    describe('POST /api/warehouse/picking/:orderId/start', () => {
        it('retorna error para pedido inexistente', async () => {
            const { status } = await apiFetch('/api/warehouse/picking/pedido-no-existe/start', {
                method: 'POST',
            });

            expect(status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /api/warehouse/picking/:orderId/complete', () => {
        it('retorna error para pedido inexistente', async () => {
            const { status } = await apiFetch('/api/warehouse/picking/pedido-no-existe/complete', {
                method: 'POST',
                body: { items_checked: ['item-1', 'item-2'] },
            });

            expect(status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /api/warehouse/picking/:orderId/shortage', () => {
        it('retorna error para pedido inexistente', async () => {
            const { status } = await apiFetch('/api/warehouse/picking/pedido-no-existe/shortage', {
                method: 'POST',
                body: { descripcion: 'Falta producto X', cantidad_faltante: 2 },
            });

            expect(status).toBeGreaterThanOrEqual(400);
        });
    });
});
