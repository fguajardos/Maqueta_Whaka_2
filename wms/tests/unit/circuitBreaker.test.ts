/**
 * Tests Unitarios — CircuitBreaker
 * Verifica el patrón de resiliencia: estados CLOSED, OPEN y HALF_OPEN.
 * No requiere DB ni Redis.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../../src/orchestration/resilience/circuitBreaker';

describe('CircuitBreaker — Estado CLOSED (comportamiento normal)', () => {
    it('comienza en estado CLOSED', () => {
        const cb = new CircuitBreaker('test-service');
        expect(cb.getState()).toBe('CLOSED');
    });

    it('ejecuta la función exitosamente y retorna el resultado', async () => {
        const cb = new CircuitBreaker('test-service');
        const result = await cb.execute(async () => 'ok');
        expect(result).toBe('ok');
    });

    it('pasa el valor de retorno de la función', async () => {
        const cb = new CircuitBreaker('test-service');
        const result = await cb.execute(async () => ({ data: 42 }));
        expect(result).toEqual({ data: 42 });
    });

    it('isAvailable() retorna true cuando está CLOSED', () => {
        const cb = new CircuitBreaker('test-service');
        expect(cb.isAvailable()).toBe(true);
    });

    it('un fallo que no llega al threshold no abre el circuito', async () => {
        const cb = new CircuitBreaker('test-service', 3);
        const failing = async () => { throw new Error('fallo'); };

        await expect(cb.execute(failing)).rejects.toThrow();
        await expect(cb.execute(failing)).rejects.toThrow();
        // Solo 2 fallos, threshold=3, debe seguir CLOSED
        expect(cb.getState()).toBe('CLOSED');
    });
});

describe('CircuitBreaker — Transición a OPEN', () => {
    it('abre el circuito tras alcanzar el threshold de fallos', async () => {
        const cb = new CircuitBreaker('test-service', 3);
        const failing = async () => { throw new Error('fallo'); };

        await expect(cb.execute(failing)).rejects.toThrow();
        await expect(cb.execute(failing)).rejects.toThrow();
        await expect(cb.execute(failing)).rejects.toThrow();

        expect(cb.getState()).toBe('OPEN');
    });

    it('con threshold=1, un solo fallo abre el circuito', async () => {
        const cb = new CircuitBreaker('test-service', 1);
        await expect(cb.execute(async () => { throw new Error('fallo'); })).rejects.toThrow();
        expect(cb.getState()).toBe('OPEN');
    });

    it('en estado OPEN rechaza sin ejecutar la función', async () => {
        const cb = new CircuitBreaker('test-service', 1, 60000);
        const fn = vi.fn().mockRejectedValue(new Error('fallo'));

        await expect(cb.execute(fn)).rejects.toThrow(); // fallo 1 → OPEN

        const fn2 = vi.fn().mockResolvedValue('ok');
        await expect(cb.execute(fn2)).rejects.toThrow(/ABIERTO/);
        expect(fn2).not.toHaveBeenCalled(); // nunca se llamó
    });

    it('isAvailable() retorna false cuando está OPEN y no expiró timeout', async () => {
        const cb = new CircuitBreaker('test-service', 1, 60000);
        await expect(cb.execute(async () => { throw new Error(); })).rejects.toThrow();
        expect(cb.getState()).toBe('OPEN');
        expect(cb.isAvailable()).toBe(false);
    });
});

describe('CircuitBreaker — Estado HALF_OPEN y recuperación', () => {
    it('después del timeout pasa a HALF_OPEN y permite una prueba', async () => {
        // timeout=-1 garantiza que Date.now() - lastFailureTime > -1 siempre
        const cb = new CircuitBreaker('test-service', 1, -1);
        await expect(cb.execute(async () => { throw new Error('fallo'); })).rejects.toThrow();
        expect(cb.getState()).toBe('OPEN');

        // El timeout ya expiró, una ejecución exitosa debe cerrarlo
        const result = await cb.execute(async () => 'recuperado');
        expect(result).toBe('recuperado');
        expect(cb.getState()).toBe('CLOSED');
    });

    it('isAvailable() retorna true cuando OPEN pero expiró el timeout', async () => {
        const cb = new CircuitBreaker('test-service', 1, -1);
        await expect(cb.execute(async () => { throw new Error(); })).rejects.toThrow();
        // timeout=-1, ya expiró inmediatamente
        expect(cb.isAvailable()).toBe(true);
    });

    it('fallo en HALF_OPEN vuelve a OPEN', async () => {
        const cb = new CircuitBreaker('test-service', 1, -1);
        await expect(cb.execute(async () => { throw new Error(); })).rejects.toThrow();

        // Timeout expirado → HALF_OPEN, pero falla de nuevo
        await expect(cb.execute(async () => { throw new Error('fallo again'); })).rejects.toThrow();
        expect(cb.getState()).toBe('OPEN');
    });
});

describe('CircuitBreaker — Reseteo tras éxito', () => {
    it('un éxito en CLOSED resetea el contador de fallos', async () => {
        const cb = new CircuitBreaker('test-service', 3);
        const failing = async () => { throw new Error('fallo'); };

        // 2 fallos
        await expect(cb.execute(failing)).rejects.toThrow();
        await expect(cb.execute(failing)).rejects.toThrow();

        // 1 éxito → resetea contador
        await cb.execute(async () => 'ok');
        expect(cb.getState()).toBe('CLOSED');

        // Ahora necesitamos 3 nuevos fallos para abrir
        await expect(cb.execute(failing)).rejects.toThrow();
        await expect(cb.execute(failing)).rejects.toThrow();
        expect(cb.getState()).toBe('CLOSED'); // Solo 2, aún no abre
    });
});

describe('CircuitBreaker — Configuración personalizada', () => {
    it('respeta el nombre en el mensaje de error al estar OPEN', async () => {
        const cb = new CircuitBreaker('mi-api-externa', 1, 60000);
        await expect(cb.execute(async () => { throw new Error(); })).rejects.toThrow();
        await expect(cb.execute(async () => 'ok')).rejects.toThrow(/mi-api-externa/);
    });
});
