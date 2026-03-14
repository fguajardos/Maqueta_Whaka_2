/**
 * Tests — Reports API
 * Verifica los 4 tipos de reportes y el endpoint de exportación.
 * Campos verificados contra la respuesta real de la API.
 */
import { describe, it, expect } from 'vitest';
import { apiFetch, getBodegaToken, getRepartidorToken } from '../helpers';

describe('Reportes', () => {
    describe('Control de acceso', () => {
        it('operario_bodega no puede acceder a reportes (403)', async () => {
            const { status } = await apiFetch('/api/reports/sales', { token: getBodegaToken() });
            expect(status).toBe(403);
        });

        it('repartidor no puede acceder a reportes (403)', async () => {
            const { status } = await apiFetch('/api/reports/sales', { token: getRepartidorToken() });
            expect(status).toBe(403);
        });

        it('sin token retorna 401', async () => {
            const res = await fetch('http://localhost:3000/api/reports/sales');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/reports/sales', () => {
        it('retorna reporte de ventas con período 30d por defecto', async () => {
            const { status, data } = await apiFetch('/api/reports/sales');

            expect(status).toBe(200);
            expect(data).toBeDefined();
        });

        it('contiene campos de resumen de ventas', async () => {
            const { data } = await apiFetch('/api/reports/sales');

            // Campos reales de la API
            expect(data).toHaveProperty('period');
            expect(data).toHaveProperty('totalVentas');
            expect(data).toHaveProperty('otvPromedio');
        });

        it('acepta diferentes períodos (7d, 30d, 90d)', async () => {
            for (const period of ['7d', '30d', '90d']) {
                const { status } = await apiFetch(`/api/reports/sales?period=${period}`);
                expect(status).toBe(200);
            }
        });

        it('totalVentas es un número >= 0', async () => {
            const { data } = await apiFetch('/api/reports/sales');
            expect(typeof data.totalVentas).toBe('number');
            expect(data.totalVentas).toBeGreaterThanOrEqual(0);
        });

        it('otvPromedio es un número >= 0', async () => {
            const { data } = await apiFetch('/api/reports/sales');
            expect(typeof data.otvPromedio).toBe('number');
            expect(data.otvPromedio).toBeGreaterThanOrEqual(0);
        });

        it('ventasPorDia es un array', async () => {
            const { data } = await apiFetch('/api/reports/sales');
            expect(Array.isArray(data.ventasPorDia)).toBe(true);
        });
    });

    describe('GET /api/reports/clients', () => {
        it('retorna reporte de clientes', async () => {
            const { status, data } = await apiFetch('/api/reports/clients');

            expect(status).toBe(200);
            expect(data).toBeDefined();
        });

        it('contiene métricas de clientes', async () => {
            const { data } = await apiFetch('/api/reports/clients');

            // Campos reales de la API
            expect(data).toHaveProperty('period');
            expect(data).toHaveProperty('activos');
            expect(data).toHaveProperty('inactivos');
        });

        it('activos e inactivos son números >= 0', async () => {
            const { data } = await apiFetch('/api/reports/clients');
            expect(data.activos).toBeGreaterThanOrEqual(0);
            expect(data.inactivos).toBeGreaterThanOrEqual(0);
        });

        it('acepta parámetro de período', async () => {
            const { status } = await apiFetch('/api/reports/clients?period=7d');
            expect(status).toBe(200);
        });

        it('tasaConversionLeads está presente', async () => {
            const { data } = await apiFetch('/api/reports/clients');
            expect(data).toHaveProperty('tasaConversionLeads');
        });
    });

    describe('GET /api/reports/operations', () => {
        it('retorna reporte de operaciones', async () => {
            const { status, data } = await apiFetch('/api/reports/operations');

            expect(status).toBe(200);
            expect(data).toBeDefined();
        });

        it('contiene métricas operacionales', async () => {
            const { data } = await apiFetch('/api/reports/operations');

            // Campos reales de la API
            expect(data).toHaveProperty('period');
            expect(data).toHaveProperty('pedidosCompletados');
            expect(data).toHaveProperty('tiempoCicloPromedio');
            expect(data).toHaveProperty('cumplimientoDespacho');
        });

        it('pedidosCompletados es un número >= 0', async () => {
            const { data } = await apiFetch('/api/reports/operations');
            expect(data.pedidosCompletados).toBeGreaterThanOrEqual(0);
        });

        it('cumplimientoDespacho es un número entre 0 y 100', async () => {
            const { data } = await apiFetch('/api/reports/operations');
            expect(data.cumplimientoDespacho).toBeGreaterThanOrEqual(0);
            expect(data.cumplimientoDespacho).toBeLessThanOrEqual(100);
        });
    });

    describe('GET /api/reports/products', () => {
        it('retorna reporte de productos más vendidos', async () => {
            const { status, data } = await apiFetch('/api/reports/products');

            expect(status).toBe(200);
            expect(data).toBeDefined();
        });

        it('contiene rankings de productos', async () => {
            const { data } = await apiFetch('/api/reports/products');

            // Campos reales de la API
            expect(data).toHaveProperty('period');
            expect(data).toHaveProperty('rankingPorVolumen');
            expect(data).toHaveProperty('rankingPorFacturacion');
            expect(Array.isArray(data.rankingPorVolumen)).toBe(true);
            expect(Array.isArray(data.rankingPorFacturacion)).toBe(true);
        });
    });

    describe('GET /api/reports/export', () => {
        it('exporta reporte de ventas en formato xlsx por defecto', async () => {
            const { status, data } = await apiFetch('/api/reports/export');

            expect(status).toBe(200);
            expect(data).toBeDefined();
        });

        it('acepta type=sales', async () => {
            const { status } = await apiFetch('/api/reports/export?type=sales&format=xlsx');
            expect(status).toBe(200);
        });

        it('acepta type=clients', async () => {
            const { status } = await apiFetch('/api/reports/export?type=clients');
            expect(status).toBe(200);
        });

        it('acepta type=operations', async () => {
            const { status } = await apiFetch('/api/reports/export?type=operations');
            expect(status).toBe(200);
        });

        it('la respuesta de exportación retorna metadata', async () => {
            const { data } = await apiFetch('/api/reports/export?type=sales');
            expect(data).toBeDefined();
        });
    });
});
