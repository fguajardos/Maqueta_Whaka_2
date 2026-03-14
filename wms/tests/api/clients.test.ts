/**
 * Tests — Clients (Clientes) API
 * Verifica listado, detalle, métricas y acciones sobre clientes activos.
 */
import { describe, it, expect } from 'vitest';
import { apiFetch, getBodegaToken, getRepartidorToken } from '../helpers';

describe('Clientes', () => {
    describe('GET /api/clients', () => {
        it('retorna lista paginada de clientes', async () => {
            const { status, data } = await apiFetch('/api/clients');

            expect(status).toBe(200);
            expect(data).toHaveProperty('data');
            expect(data).toHaveProperty('pagination');
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('paginación contiene total, page y limit', async () => {
            const { data } = await apiFetch('/api/clients');

            expect(typeof data.pagination.total).toBe('number');
            expect(typeof data.pagination.page).toBe('number');
            expect(typeof data.pagination.limit).toBe('number');
        });

        it('cada cliente tiene campos de identificación', async () => {
            const { data } = await apiFetch('/api/clients');

            if (data.data.length > 0) {
                const client = data.data[0];
                expect(client).toHaveProperty('id');
                expect(client).toHaveProperty('nombre');
                expect(client).toHaveProperty('estado');
            }
        });

        it('soporta paginación con page y limit', async () => {
            const { status, data } = await apiFetch('/api/clients?page=1&limit=3');

            expect(status).toBe(200);
            expect(data.pagination.page).toBe(1);
            expect(data.pagination.limit).toBe(3);
            expect(data.data.length).toBeLessThanOrEqual(3);
        });

        it('soporta filtro por estado', async () => {
            const { status } = await apiFetch('/api/clients?estado=activo');
            expect(status).toBe(200);
        });

        it('soporta búsqueda por texto', async () => {
            const { status } = await apiFetch('/api/clients?search=empresa');
            expect(status).toBe(200);
        });

        it('rol operario_bodega no tiene acceso (403)', async () => {
            const { status } = await apiFetch('/api/clients', { token: getBodegaToken() });
            expect(status).toBe(403);
        });

        it('rol repartidor no tiene acceso (403)', async () => {
            const { status } = await apiFetch('/api/clients', { token: getRepartidorToken() });
            expect(status).toBe(403);
        });
    });

    describe('GET /api/clients/:id', () => {
        it('retorna error (>=400) para cualquier ID (SyncManager externo no configurado)', async () => {
            // El servicio llama a SyncManager que tiene el circuit breaker ABIERTO → 500
            const { status } = await apiFetch('/api/clients/cliente-no-existe-xyz');
            expect(status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('GET /api/clients/:id/orders', () => {
        it('retorna historial paginado de pedidos (busca en ProcessState)', async () => {
            // El endpoint busca pedidos en la base de datos local (no en SyncManager)
            const { status, data } = await apiFetch('/api/clients/cualquier-id/orders');

            expect(status).toBe(200);
            expect(data).toHaveProperty('data');
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('acepta parámetro de paginación', async () => {
            const { status } = await apiFetch('/api/clients/cualquier-id/orders?page=1&limit=5');
            expect(status).toBe(200);
        });
    });

    describe('GET /api/clients/:id/metrics', () => {
        it('retorna métricas del cliente (período 30d por defecto)', async () => {
            const { status, data } = await apiFetch('/api/clients/cualquier-id/metrics');

            expect(status).toBe(200);
            expect(data).toBeDefined();
        });

        it('acepta parámetro de período personalizado', async () => {
            const { status } = await apiFetch('/api/clients/cualquier-id/metrics?period=7d');
            expect(status).toBe(200);
        });
    });

    describe('POST /api/clients/:id/block', () => {
        it('requiere rol admin (bodega no puede bloquear)', async () => {
            const { data: listData } = await apiFetch('/api/clients?limit=1');

            if (listData.data.length > 0) {
                const clientId = listData.data[0].id;
                const { status } = await apiFetch(`/api/clients/${clientId}/block`, {
                    method: 'POST',
                    body: { motivo: 'Deuda pendiente' },
                    token: getBodegaToken(),
                });

                expect(status).toBe(403);
            }
        });

        it('retorna error si no se proporciona motivo', async () => {
            const { data: listData } = await apiFetch('/api/clients?limit=1');

            if (listData.data.length > 0) {
                const clientId = listData.data[0].id;
                const { status } = await apiFetch(`/api/clients/${clientId}/block`, {
                    method: 'POST',
                    body: {},
                });

                expect(status).toBe(400);
            }
        });
    });

    describe('POST /api/clients/:id/unblock', () => {
        it('requiere rol admin (bodega no puede desbloquear)', async () => {
            const { data: listData } = await apiFetch('/api/clients?limit=1');

            if (listData.data.length > 0) {
                const clientId = listData.data[0].id;
                const { status } = await apiFetch(`/api/clients/${clientId}/unblock`, {
                    method: 'POST',
                    token: getBodegaToken(),
                });

                expect(status).toBe(403);
            }
        });
    });
});
