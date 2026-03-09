/**
 * Tests — Pedidos (Orders) API
 * Verifica listado, pipeline, detalle y acciones sobre pedidos.
 */
import { describe, it, expect } from 'vitest';
import { apiFetch } from '../helpers';

describe('Pedidos (Orders)', () => {
    describe('GET /api/orders', () => {
        it('retorna lista paginada de pedidos', async () => {
            const { status, data } = await apiFetch('/api/orders');

            expect(status).toBe(200);
            expect(data).toHaveProperty('data');
            expect(data).toHaveProperty('pagination');
            expect(data.pagination).toHaveProperty('total');
            expect(data.pagination).toHaveProperty('page');
            expect(data.pagination).toHaveProperty('limit');
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('cada pedido tiene los campos esperados', async () => {
            const { data } = await apiFetch('/api/orders');

            if (data.data.length > 0) {
                const order = data.data[0];
                expect(order).toHaveProperty('id');
                expect(order).toHaveProperty('internalId');
                expect(order).toHaveProperty('estado');
                expect(order).toHaveProperty('status');
                expect(order).toHaveProperty('fechaCreacion');
                expect(order).toHaveProperty('accionesDisponibles');
                expect(Array.isArray(order.accionesDisponibles)).toBe(true);
            }
        });

        it('soporta paginación con page y limit', async () => {
            const { status, data } = await apiFetch('/api/orders?page=1&limit=5');

            expect(status).toBe(200);
            expect(data.pagination.page).toBe(1);
            expect(data.pagination.limit).toBe(5);
            expect(data.data.length).toBeLessThanOrEqual(5);
        });

        it('soporta filtro por status', async () => {
            const { status } = await apiFetch('/api/orders?status=nuevo');

            expect(status).toBe(200);
        });
    });

    describe('GET /api/orders/pipeline', () => {
        it('retorna pipeline con estados y conteos', async () => {
            const { status, data } = await apiFetch('/api/orders/pipeline');

            expect(status).toBe(200);
            expect(typeof data).toBe('object');

            // Pipeline debe tener al menos algunos estados del flujo de pedidos
            const expectedStates = ['recibido', 'validado', 'en_preparacion', 'listo_bodega'];
            for (const state of expectedStates) {
                expect(data).toHaveProperty(state);
                expect(typeof data[state]).toBe('number');
                expect(data[state]).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('GET /api/orders/:id', () => {
        it('retorna 404 para ID inexistente', async () => {
            const { status } = await apiFetch('/api/orders/id-que-no-existe');

            expect(status).toBe(404);
        });

        it('retorna detalle de pedido si existe', async () => {
            const { data: listData } = await apiFetch('/api/orders?limit=1');

            if (listData.data.length > 0) {
                const orderId = listData.data[0].id;
                const { status, data } = await apiFetch(`/api/orders/${orderId}`);

                expect(status).toBe(200);
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('internalId');
                expect(data).toHaveProperty('estado');
                expect(data).toHaveProperty('stepsLog');
                expect(data).toHaveProperty('accionesDisponibles');
                expect(data).toHaveProperty('todosLosEstados');
            }
        });
    });

    describe('POST /api/orders/:id/incident', () => {
        it('retorna error para pedido inexistente', async () => {
            const { status } = await apiFetch('/api/orders/id-no-existe/incident', {
                method: 'POST',
                body: { tipo: 'faltante', descripcion: 'Falta un producto' },
            });

            // Debería dar error porque el pedido no existe
            expect(status).toBeGreaterThanOrEqual(400);
        });
    });
});
