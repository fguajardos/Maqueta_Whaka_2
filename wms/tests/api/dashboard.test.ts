/**
 * Tests — Dashboard KPIs y Alertas
 * Verifica los endpoints del dashboard WMS.
 */
import { describe, it, expect } from 'vitest';
import { apiFetch } from '../helpers';

describe('Dashboard', () => {
    describe('GET /api/dashboard/kpis', () => {
        it('retorna estructura de KPIs esperada', async () => {
            const { status, data } = await apiFetch('/api/dashboard/kpis');

            expect(status).toBe(200);
            expect(data).toHaveProperty('pedidosHoy');
            expect(data).toHaveProperty('ventasMes');
            expect(data).toHaveProperty('clientesActivos');
            expect(data).toHaveProperty('otvPromedio');
        });

        it('pedidosHoy tiene value y variacion', async () => {
            const { data } = await apiFetch('/api/dashboard/kpis');

            expect(data.pedidosHoy).toHaveProperty('value');
            expect(data.pedidosHoy).toHaveProperty('variacion');
            expect(typeof data.pedidosHoy.value).toBe('number');
        });

        it('ventasMes tiene currency CLP', async () => {
            const { data } = await apiFetch('/api/dashboard/kpis');

            expect(data.ventasMes).toHaveProperty('currency');
            expect(data.ventasMes.currency).toBe('CLP');
        });
    });

    describe('GET /api/dashboard/alerts', () => {
        it('retorna estructura de alertas esperada', async () => {
            const { status, data } = await apiFetch('/api/dashboard/alerts');

            expect(status).toBe(200);
            expect(data).toHaveProperty('pedidosIncidencia');
            expect(data).toHaveProperty('procesosFallidos');
            expect(data).toHaveProperty('stockBajo');
            expect(data).toHaveProperty('clientesDeuda');
        });

        it('todos los contadores son números >= 0', async () => {
            const { data } = await apiFetch('/api/dashboard/alerts');

            expect(data.pedidosIncidencia).toBeGreaterThanOrEqual(0);
            expect(data.procesosFallidos).toBeGreaterThanOrEqual(0);
            expect(data.stockBajo).toBeGreaterThanOrEqual(0);
            expect(data.clientesDeuda).toBeGreaterThanOrEqual(0);
        });
    });
});
