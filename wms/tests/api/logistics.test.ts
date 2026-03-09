/**
 * Tests — Logistics (Despacho) API
 * Verifica rutas de despacho, creación, listado y confirmación de entrega.
 */
import { describe, it, expect } from 'vitest';
import { apiFetch } from '../helpers';

describe('Logistics (Despacho)', () => {
    describe('GET /api/logistics/routes', () => {
        it('retorna array de rutas', async () => {
            const { status, data } = await apiFetch('/api/logistics/routes');

            expect(status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });

        it('cada ruta tiene estructura esperada', async () => {
            const { data } = await apiFetch('/api/logistics/routes');

            if (data.length > 0) {
                const route = data[0];
                expect(route).toHaveProperty('id');
                expect(route).toHaveProperty('internalId');
                expect(route).toHaveProperty('estado');
                expect(route).toHaveProperty('status');
                expect(route).toHaveProperty('stepsLog');
                expect(route).toHaveProperty('fechaCreacion');
            }
        });
    });

    describe('POST /api/logistics/routes', () => {
        it('crea una nueva ruta de despacho', async () => {
            const { status, data } = await apiFetch('/api/logistics/routes', {
                method: 'POST',
                body: {
                    fecha: '2026-03-02',
                    zona: 'santiago-centro',
                    pedidosIds: ['WHK-TEST-001', 'WHK-TEST-002'],
                    vehiculo: 'Furgón #3',
                    repartidorId: 'test-repartidor-id',
                },
            });

            expect(status).toBe(200);
            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('internalId');
            expect(data.internalId).toContain('WHK-RUT-');
        });

        it('la ruta creada aparece en el listado', async () => {
            const { data: routes } = await apiFetch('/api/logistics/routes');

            // Debería haber al menos 1 ruta (la que acabamos de crear)
            expect(routes.length).toBeGreaterThanOrEqual(1);

            const lastRoute = routes[0]; // Ordenadas por fecha desc
            expect(lastRoute.estado).toBe('planificada');
        });
    });

    describe('GET /api/logistics/routes/:id', () => {
        it('retorna detalle de ruta existente', async () => {
            const { data: routes } = await apiFetch('/api/logistics/routes');

            if (routes.length > 0) {
                const routeId = routes[0].id;
                const { status, data } = await apiFetch(`/api/logistics/routes/${routeId}`);

                expect(status).toBe(200);
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('entityId');
                expect(data).toHaveProperty('currentStep');
                expect(data).toHaveProperty('stepsLog');
            }
        });

        it('retorna 404 para ruta inexistente', async () => {
            const { status } = await apiFetch('/api/logistics/routes/ruta-no-existe');

            expect(status).toBe(404);
        });
    });

    describe('GET /api/logistics/available-orders', () => {
        it('retorna array de pedidos disponibles para despacho', async () => {
            const { status, data } = await apiFetch('/api/logistics/available-orders');

            expect(status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
        });

        it('cada orden disponible tiene estructura esperada', async () => {
            const { data } = await apiFetch('/api/logistics/available-orders');

            if (data.length > 0) {
                const order = data[0];
                expect(order).toHaveProperty('id');
                expect(order).toHaveProperty('internalId');
                expect(order).toHaveProperty('estado');
                expect(order).toHaveProperty('fechaCreacion');
            }
        });
    });

    describe('POST /api/logistics/routes/:routeId/orders/:orderId/deliver', () => {
        it('retorna error al confirmar entrega de pedido inexistente', async () => {
            const { data: routes } = await apiFetch('/api/logistics/routes');

            if (routes.length > 0) {
                const routeId = routes[0].id;

                const { status } = await apiFetch(
                    `/api/logistics/routes/${routeId}/orders/pedido-no-existe/deliver`,
                    {
                        method: 'POST',
                        body: {
                            receptorNombre: 'Juan Pérez',
                            notas: 'Entrega de prueba',
                        },
                    }
                );

                // El pedido no existe en ProcessState, debería fallar
                expect(status).toBeGreaterThanOrEqual(400);
            }
        });
    });

    describe('POST /api/logistics/routes/:routeId/orders/:orderId/incident', () => {
        it('retorna error al reportar incidencia en pedido inexistente', async () => {
            const { status } = await apiFetch(
                '/api/logistics/routes/ruta-test/orders/pedido-no-existe/incident',
                {
                    method: 'POST',
                    body: {
                        tipo: 'no_encontrado',
                        descripcion: 'No se encontró al cliente en la dirección',
                    },
                }
            );

            expect(status).toBeGreaterThanOrEqual(400);
        });
    });
});
