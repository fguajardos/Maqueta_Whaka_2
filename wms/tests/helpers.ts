/**
 * Test Helpers — Utilidades compartidas entre tests.
 * Genera tokens JWT y facilita peticiones HTTP al servidor.
 */
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

export interface TestUser {
    userId: string;
    email: string;
    role: string;
}

/**
 * Genera un token JWT válido para testing.
 * No requiere login real — usa directamente el secret.
 */
export function generateTestToken(user: TestUser): string {
    return jwt.sign(
        { userId: user.userId, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

/** Token de admin por defecto para la mayoría de tests */
export function getAdminToken(): string {
    return generateTestToken({
        userId: 'test-admin-id',
        email: 'admin@whakachile.cl',
        role: 'admin',
    });
}

/** Token de operario de bodega */
export function getBodegaToken(): string {
    return generateTestToken({
        userId: 'test-bodega-id',
        email: 'bodega@whakachile.cl',
        role: 'operario_bodega',
    });
}

/** Token de repartidor */
export function getRepartidorToken(): string {
    return generateTestToken({
        userId: 'test-repartidor-id',
        email: 'repartidor@whakachile.cl',
        role: 'repartidor',
    });
}

/**
 * URL base del servidor. Usa port 3000 por defecto.
 */
export const BASE_URL = `http://localhost:${env.PORT}`;

/**
 * Helper para hacer fetch autenticado.
 */
export async function apiFetch(
    path: string,
    options: {
        method?: string;
        body?: any;
        token?: string;
    } = {}
) {
    const { method = 'GET', body, token = getAdminToken() } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const fetchOptions: RequestInit = { method, headers };
    if (body) {
        fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, fetchOptions);
    const data = await response.json().catch(() => null);

    return { status: response.status, data, ok: response.ok };
}
