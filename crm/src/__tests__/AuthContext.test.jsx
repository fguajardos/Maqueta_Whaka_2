/**
 * Tests — AuthContext (CRM)
 * Verifica el manejo de estado de autenticación en el frontend.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider, useAuth } from '../app2-admin/AuthContext';

// Componente auxiliar para exponer el contexto en los tests
function AuthConsumer() {
    const { user, isAuthenticated, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="is-auth">{String(isAuthenticated)}</span>
            <span data-testid="user-email">{user?.email ?? 'sin-usuario'}</span>
            <span data-testid="user-role">{user?.role ?? 'sin-rol'}</span>
            <button onClick={() => login({ email: 'admin@whakachile.cl', role: 'admin', nombre: 'Admin' })}>
                login
            </button>
            <button onClick={logout}>logout</button>
        </div>
    );
}

describe('AuthProvider', () => {
    it('estado inicial: usuario null y no autenticado', () => {
        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('is-auth').textContent).toBe('false');
        expect(screen.getByTestId('user-email').textContent).toBe('sin-usuario');
    });

    it('login() establece el usuario y marca isAuthenticated=true', async () => {
        const user = userEvent.setup();
        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        await user.click(screen.getByText('login'));

        expect(screen.getByTestId('is-auth').textContent).toBe('true');
        expect(screen.getByTestId('user-email').textContent).toBe('admin@whakachile.cl');
        expect(screen.getByTestId('user-role').textContent).toBe('admin');
    });

    it('logout() resetea el usuario a null', async () => {
        const user = userEvent.setup();
        render(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        await user.click(screen.getByText('login'));
        expect(screen.getByTestId('is-auth').textContent).toBe('true');

        await user.click(screen.getByText('logout'));
        expect(screen.getByTestId('is-auth').textContent).toBe('false');
        expect(screen.getByTestId('user-email').textContent).toBe('sin-usuario');
    });

    it('múltiples login() consecutivos actualizan el usuario', async () => {
        function MultiLoginConsumer() {
            const { user, login } = useAuth();
            return (
                <div>
                    <span data-testid="role">{user?.role ?? ''}</span>
                    <button onClick={() => login({ email: 'a@a.cl', role: 'admin' })}>admin</button>
                    <button onClick={() => login({ email: 'b@b.cl', role: 'operario_bodega' })}>bodega</button>
                </div>
            );
        }

        const user = userEvent.setup();
        render(<AuthProvider><MultiLoginConsumer /></AuthProvider>);

        await user.click(screen.getByText('admin'));
        expect(screen.getByTestId('role').textContent).toBe('admin');

        await user.click(screen.getByText('bodega'));
        expect(screen.getByTestId('role').textContent).toBe('operario_bodega');
    });

    it('provee el contexto a componentes anidados', () => {
        function DeepChild() {
            const { isAuthenticated } = useAuth();
            return <span data-testid="deep">{String(isAuthenticated)}</span>;
        }
        function Wrapper() {
            return <div><div><DeepChild /></div></div>;
        }

        render(<AuthProvider><Wrapper /></AuthProvider>);
        expect(screen.getByTestId('deep').textContent).toBe('false');
    });
});

describe('useAuth — fuera de AuthProvider', () => {
    it('lanza error si se usa fuera del provider', () => {
        // Suprimir el error de consola de React durante este test
        const consoleError = console.error;
        console.error = () => {};

        function BadConsumer() {
            useAuth();
            return null;
        }

        expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within AuthProvider');

        console.error = consoleError;
    });
});
