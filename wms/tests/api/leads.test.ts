/**
 * Tests — Leads API
 * Verifica listado, detalle y acciones sobre leads (prospectos).
 */
import { describe, it, expect } from 'vitest';
import { apiFetch, getBodegaToken, getRepartidorToken } from '../helpers';

describe('Leads', () => {
    describe('GET /api/leads', () => {
        it('retorna lista paginada de leads', async () => {
            const { status, data } = await apiFetch('/api/leads');

            expect(status).toBe(200);
            expect(data).toHaveProperty('data');
            expect(data).toHaveProperty('pagination');
            expect(Array.isArray(data.data)).toBe(true);
        });

        it('paginación tiene los campos requeridos', async () => {
            const { data } = await apiFetch('/api/leads');

            expect(data.pagination).toHaveProperty('total');
            expect(data.pagination).toHaveProperty('page');
            expect(data.pagination).toHaveProperty('limit');
            expect(typeof data.pagination.total).toBe('number');
        });

        it('cada lead tiene los campos esperados', async () => {
            const { data } = await apiFetch('/api/leads');

            if (data.data.length > 0) {
                const lead = data.data[0];
                expect(lead).toHaveProperty('id');
                expect(lead).toHaveProperty('status');
                expect(lead).toHaveProperty('contacto');
                expect(lead).toHaveProperty('empresa');
            }
        });

        it('soporta paginación con page y limit', async () => {
            const { status, data } = await apiFetch('/api/leads?page=1&limit=5');

            expect(status).toBe(200);
            expect(data.pagination.page).toBe(1);
            expect(data.pagination.limit).toBe(5);
            expect(data.data.length).toBeLessThanOrEqual(5);
        });

        it('soporta filtro por status', async () => {
            const { status } = await apiFetch('/api/leads?status=nuevo');
            expect(status).toBe(200);
        });

        it('soporta búsqueda por texto', async () => {
            const { status } = await apiFetch('/api/leads?search=WhakaChile');
            expect(status).toBe(200);
        });

        it('rol operario_bodega no tiene acceso (403)', async () => {
            const { status } = await apiFetch('/api/leads', { token: getBodegaToken() });
            expect(status).toBe(403);
        });

        it('rol repartidor no tiene acceso (403)', async () => {
            const { status } = await apiFetch('/api/leads', { token: getRepartidorToken() });
            expect(status).toBe(403);
        });
    });

    describe('GET /api/leads/:id', () => {
        it('retorna error (>=400) para lead inexistente', async () => {
            const { status } = await apiFetch('/api/leads/lead-que-no-existe-xyz');
            // El servicio intenta buscar en SyncManager (externo), falla con circuito abierto
            expect(status).toBeGreaterThanOrEqual(400);
        });

        it('retorna detalle de lead si existe', async () => {
            const { data: listData } = await apiFetch('/api/leads?limit=1');

            if (listData.data.length > 0) {
                const leadId = listData.data[0].id;
                const { status, data } = await apiFetch(`/api/leads/${leadId}`);

                expect(status).toBe(200);
                expect(data).toHaveProperty('id');
                expect(data.id).toBe(leadId);
            }
        });
    });

    describe('POST /api/leads/:id/approve', () => {
        it('retorna error al aprobar lead inexistente', async () => {
            const { status } = await apiFetch('/api/leads/lead-no-existe/approve', {
                method: 'POST',
                body: {
                    listaPreciosId: 'lista-1',
                    condicionPago: 'credito_30',
                    limiteCredito: 500000,
                    pedidoMinimo: 50000,
                },
            });

            expect(status).toBeGreaterThanOrEqual(400);
        });

        it('retorna 400 si faltan campos requeridos en approve', async () => {
            const { data: listData } = await apiFetch('/api/leads?limit=1');

            if (listData.data.length > 0) {
                const leadId = listData.data[0].id;
                const { status } = await apiFetch(`/api/leads/${leadId}/approve`, {
                    method: 'POST',
                    body: {}, // Sin campos requeridos
                });

                expect(status).toBe(400);
            }
        });
    });

    describe('POST /api/leads/:id/reject', () => {
        it('retorna error al rechazar lead inexistente', async () => {
            const { status } = await apiFetch('/api/leads/lead-no-existe/reject', {
                method: 'POST',
                body: { motivo: 'No cumple requisitos' },
            });

            expect(status).toBeGreaterThanOrEqual(400);
        });

        it('retorna 400 si no se proporciona motivo', async () => {
            const { data: listData } = await apiFetch('/api/leads?limit=1');

            if (listData.data.length > 0) {
                const leadId = listData.data[0].id;
                const { status } = await apiFetch(`/api/leads/${leadId}/reject`, {
                    method: 'POST',
                    body: {},
                });

                expect(status).toBe(400);
            }
        });
    });

    describe('POST /api/leads/:id/observe', () => {
        it('retorna error al observar lead inexistente', async () => {
            const { status } = await apiFetch('/api/leads/lead-no-existe/observe', {
                method: 'POST',
                body: { observacion: 'Falta documentación' },
            });

            expect(status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /api/leads/:id/notes', () => {
        it('agrega nota a lead existente', async () => {
            const { data: listData } = await apiFetch('/api/leads?limit=1');

            if (listData.data.length > 0) {
                const leadId = listData.data[0].id;
                const { status } = await apiFetch(`/api/leads/${leadId}/notes`, {
                    method: 'POST',
                    body: { texto: 'Nota de prueba desde tests automatizados' },
                });

                expect(status).toBe(200);
            }
        });

        it('retorna 400 si el texto está vacío', async () => {
            const { data: listData } = await apiFetch('/api/leads?limit=1');

            if (listData.data.length > 0) {
                const leadId = listData.data[0].id;
                const { status } = await apiFetch(`/api/leads/${leadId}/notes`, {
                    method: 'POST',
                    body: { texto: '' },
                });

                expect(status).toBe(400);
            }
        });
    });
});
