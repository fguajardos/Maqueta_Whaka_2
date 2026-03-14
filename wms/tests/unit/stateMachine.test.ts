/**
 * Tests Unitarios — OrderStateMachine
 * Verifica todas las transiciones válidas e inválidas del ciclo de vida del pedido.
 * No requiere DB ni Redis.
 */
import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../../src/orchestration/stateMachine';
import type { OrderState, OrderAction } from '../../src/orchestration/stateMachine';

describe('OrderStateMachine.canTransition()', () => {
    it('recibido → validate → true', () => {
        expect(OrderStateMachine.canTransition('recibido', 'validate')).toBe(true);
    });

    it('recibido → report_incident → true', () => {
        expect(OrderStateMachine.canTransition('recibido', 'report_incident')).toBe(true);
    });

    it('validado → send_to_warehouse → true', () => {
        expect(OrderStateMachine.canTransition('validado', 'send_to_warehouse')).toBe(true);
    });

    it('en_preparacion → confirm_picking → true', () => {
        expect(OrderStateMachine.canTransition('en_preparacion', 'confirm_picking')).toBe(true);
    });

    it('en_preparacion → report_incident → true', () => {
        expect(OrderStateMachine.canTransition('en_preparacion', 'report_incident')).toBe(true);
    });

    it('listo_bodega → generate_invoice → true', () => {
        expect(OrderStateMachine.canTransition('listo_bodega', 'generate_invoice')).toBe(true);
    });

    it('facturado → dispatch → true', () => {
        expect(OrderStateMachine.canTransition('facturado', 'dispatch')).toBe(true);
    });

    it('despachado → deliver → true', () => {
        expect(OrderStateMachine.canTransition('despachado', 'deliver')).toBe(true);
    });

    it('despachado → report_incident → true', () => {
        expect(OrderStateMachine.canTransition('despachado', 'report_incident')).toBe(true);
    });

    it('incidencia → resolve_incident → true', () => {
        expect(OrderStateMachine.canTransition('incidencia', 'resolve_incident')).toBe(true);
    });

    // Transiciones inválidas
    it('recibido → dispatch → false', () => {
        expect(OrderStateMachine.canTransition('recibido', 'dispatch')).toBe(false);
    });

    it('entregado → validate → false (estado terminal)', () => {
        expect(OrderStateMachine.canTransition('entregado', 'validate')).toBe(false);
    });

    it('validado → deliver → false (saltar etapas)', () => {
        expect(OrderStateMachine.canTransition('validado', 'deliver')).toBe(false);
    });

    it('incidencia → validate → false', () => {
        expect(OrderStateMachine.canTransition('incidencia', 'validate')).toBe(false);
    });

    it('listo_bodega → dispatch → false (falta facturar)', () => {
        expect(OrderStateMachine.canTransition('listo_bodega', 'dispatch')).toBe(false);
    });
});

describe('OrderStateMachine.transition()', () => {
    it('retorna el nuevo estado correcto en transición válida', () => {
        expect(OrderStateMachine.transition('recibido', 'validate')).toBe('validado');
        expect(OrderStateMachine.transition('validado', 'send_to_warehouse')).toBe('en_preparacion');
        expect(OrderStateMachine.transition('en_preparacion', 'confirm_picking')).toBe('listo_bodega');
        expect(OrderStateMachine.transition('listo_bodega', 'generate_invoice')).toBe('facturado');
        expect(OrderStateMachine.transition('facturado', 'dispatch')).toBe('despachado');
        expect(OrderStateMachine.transition('despachado', 'deliver')).toBe('entregado');
    });

    it('recibido → report_incident → incidencia', () => {
        expect(OrderStateMachine.transition('recibido', 'report_incident')).toBe('incidencia');
    });

    it('en_preparacion → report_incident → incidencia', () => {
        expect(OrderStateMachine.transition('en_preparacion', 'report_incident')).toBe('incidencia');
    });

    it('despachado → report_incident → incidencia', () => {
        expect(OrderStateMachine.transition('despachado', 'report_incident')).toBe('incidencia');
    });

    it('incidencia → resolve_incident → validado (reintegra al flujo)', () => {
        expect(OrderStateMachine.transition('incidencia', 'resolve_incident')).toBe('validado');
    });

    it('lanza error en transición inválida', () => {
        expect(() => OrderStateMachine.transition('recibido', 'dispatch')).toThrow();
    });

    it('lanza error al intentar avanzar desde entregado (estado terminal)', () => {
        expect(() => OrderStateMachine.transition('entregado', 'validate')).toThrow();
    });

    it('mensaje de error describe la transición fallida', () => {
        expect(() => OrderStateMachine.transition('validado', 'deliver')).toThrowError(/deliver/);
    });
});

describe('OrderStateMachine.getAvailableActions()', () => {
    it('recibido tiene 2 acciones disponibles', () => {
        const actions = OrderStateMachine.getAvailableActions('recibido');
        expect(actions).toHaveLength(2);
        expect(actions).toContain('validate');
        expect(actions).toContain('report_incident');
    });

    it('validado tiene 1 acción disponible', () => {
        const actions = OrderStateMachine.getAvailableActions('validado');
        expect(actions).toHaveLength(1);
        expect(actions).toContain('send_to_warehouse');
    });

    it('en_preparacion tiene 2 acciones (confirm_picking + report_incident)', () => {
        const actions = OrderStateMachine.getAvailableActions('en_preparacion');
        expect(actions).toHaveLength(2);
        expect(actions).toContain('confirm_picking');
        expect(actions).toContain('report_incident');
    });

    it('entregado no tiene acciones disponibles (estado terminal)', () => {
        const actions = OrderStateMachine.getAvailableActions('entregado');
        expect(actions).toHaveLength(0);
    });

    it('despachado tiene deliver y report_incident', () => {
        const actions = OrderStateMachine.getAvailableActions('despachado');
        expect(actions).toContain('deliver');
        expect(actions).toContain('report_incident');
    });

    it('incidencia solo tiene resolve_incident', () => {
        const actions = OrderStateMachine.getAvailableActions('incidencia');
        expect(actions).toHaveLength(1);
        expect(actions).toContain('resolve_incident');
    });
});

describe('OrderStateMachine.getAllStates()', () => {
    it('retorna array con los 8 estados del sistema', () => {
        const states = OrderStateMachine.getAllStates();
        expect(states).toHaveLength(8);
    });

    it('contiene todos los estados definidos en el spec', () => {
        const states = OrderStateMachine.getAllStates();
        const expected: OrderState[] = [
            'recibido', 'validado', 'en_preparacion', 'listo_bodega',
            'facturado', 'despachado', 'entregado', 'incidencia',
        ];
        for (const state of expected) {
            expect(states).toContain(state);
        }
    });
});

describe('Flujo completo del pedido (happy path)', () => {
    it('sigue el camino recibido → entregado sin errores', () => {
        let state: OrderState = 'recibido';

        state = OrderStateMachine.transition(state, 'validate');
        expect(state).toBe('validado');

        state = OrderStateMachine.transition(state, 'send_to_warehouse');
        expect(state).toBe('en_preparacion');

        state = OrderStateMachine.transition(state, 'confirm_picking');
        expect(state).toBe('listo_bodega');

        state = OrderStateMachine.transition(state, 'generate_invoice');
        expect(state).toBe('facturado');

        state = OrderStateMachine.transition(state, 'dispatch');
        expect(state).toBe('despachado');

        state = OrderStateMachine.transition(state, 'deliver');
        expect(state).toBe('entregado');
    });

    it('flujo con incidencia y resolución vuelve a validado', () => {
        let state: OrderState = 'recibido';

        state = OrderStateMachine.transition(state, 'validate');
        expect(state).toBe('validado');

        state = OrderStateMachine.transition(state, 'send_to_warehouse');
        state = OrderStateMachine.transition(state, 'report_incident');
        expect(state).toBe('incidencia');

        state = OrderStateMachine.transition(state, 'resolve_incident');
        expect(state).toBe('validado');

        // Retoma el flujo normal desde validado
        state = OrderStateMachine.transition(state, 'send_to_warehouse');
        expect(state).toBe('en_preparacion');
    });
});
