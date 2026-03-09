/**
 * Tests — Health Check y Autenticación
 * Verifica que el servidor responde y la auth funciona correctamente.
 */
import { describe, it, expect } from 'vitest';
import { BASE_URL, apiFetch, getAdminToken } from '../helpers';

describe('Health Check', () => {
    it('GET /health responde con status y checks', async () => {
        const res = await fetch(`${BASE_URL}/health`);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('checks');
        expect(data.checks).toHaveProperty('database');
    });

    it('GET /health incluye estado de integraciones', async () => {
        const res = await fetch(`${BASE_URL}/health`);
        const data = await res.json();

        expect(data.checks).toHaveProperty('bsale');
        expect(data.checks).toHaveProperty('shopify');
        expect(data.checks).toHaveProperty('syncmanager');
    });
});

describe('Autenticación', () => {
    it('POST /api/auth/login con credenciales válidas retorna token', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@whakachile.cl', password: 'Admin123!' }),
        });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('user');
        expect(data.user.email).toBe('admin@whakachile.cl');
        expect(data.user.role).toBe('admin');
        expect(data.user).toHaveProperty('nombre');
    });

    it('POST /api/auth/login con password incorrecta retorna 401', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@whakachile.cl', password: 'wrong-password' }),
        });

        expect(res.status).toBe(401);
    });

    it('POST /api/auth/login con email inexistente retorna 401', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'noexiste@whakachile.cl', password: 'Admin123!' }),
        });

        expect(res.status).toBe(401);
    });

    it('Endpoint protegido sin token retorna 401', async () => {
        const res = await fetch(`${BASE_URL}/api/orders`);

        expect(res.status).toBe(401);
    });

    it('Endpoint protegido con token inválido retorna 401', async () => {
        const res = await fetch(`${BASE_URL}/api/orders`, {
            headers: { 'Authorization': 'Bearer token-invalido-123' },
        });

        expect(res.status).toBe(401);
    });

    it('Endpoint protegido con token válido retorna 200', async () => {
        const { status } = await apiFetch('/api/orders');

        expect(status).toBe(200);
    });
});
