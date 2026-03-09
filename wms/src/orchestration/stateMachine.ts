import { logger } from '../utils/logger';

/**
 * State Machine para el ciclo de vida del pedido.
 * 8 estados definidos en el spec con transiciones válidas.
 */

export type OrderState =
    | 'recibido'
    | 'validado'
    | 'en_preparacion'
    | 'listo_bodega'
    | 'facturado'
    | 'despachado'
    | 'entregado'
    | 'incidencia';

export type OrderAction =
    | 'validate'
    | 'send_to_warehouse'
    | 'confirm_picking'
    | 'generate_invoice'
    | 'dispatch'
    | 'deliver'
    | 'report_incident'
    | 'resolve_incident';

interface Transition {
    from: OrderState;
    to: OrderState;
    action: OrderAction;
}

const validTransitions: Transition[] = [
    { from: 'recibido', action: 'validate', to: 'validado' },
    { from: 'recibido', action: 'report_incident', to: 'incidencia' },
    { from: 'validado', action: 'send_to_warehouse', to: 'en_preparacion' },
    { from: 'en_preparacion', action: 'confirm_picking', to: 'listo_bodega' },
    { from: 'en_preparacion', action: 'report_incident', to: 'incidencia' },
    { from: 'listo_bodega', action: 'generate_invoice', to: 'facturado' },
    { from: 'facturado', action: 'dispatch', to: 'despachado' },
    { from: 'despachado', action: 'deliver', to: 'entregado' },
    { from: 'despachado', action: 'report_incident', to: 'incidencia' },
    { from: 'incidencia', action: 'resolve_incident', to: 'validado' },
];

export class OrderStateMachine {
    /**
     * Valida si una transición es permitida.
     */
    static canTransition(currentState: OrderState, action: OrderAction): boolean {
        return validTransitions.some(
            (t) => t.from === currentState && t.action === action
        );
    }

    /**
     * Ejecuta una transición y retorna el nuevo estado.
     * Lanza error si la transición no es válida.
     */
    static transition(currentState: OrderState, action: OrderAction): OrderState {
        const transition = validTransitions.find(
            (t) => t.from === currentState && t.action === action
        );

        if (!transition) {
            const msg = `Transición inválida: no se puede ejecutar '${action}' desde estado '${currentState}'`;
            logger.warn(msg);
            throw new Error(msg);
        }

        logger.info(`Order state machine: ${currentState} → ${transition.to} (acción: ${action})`);
        return transition.to;
    }

    /**
     * Obtiene las acciones disponibles para un estado dado.
     */
    static getAvailableActions(currentState: OrderState): OrderAction[] {
        return validTransitions
            .filter((t) => t.from === currentState)
            .map((t) => t.action);
    }

    /**
     * Retorna todas las transiciones posibles para frontend step indicators.
     */
    static getAllStates(): OrderState[] {
        return [
            'recibido',
            'validado',
            'en_preparacion',
            'listo_bodega',
            'facturado',
            'despachado',
            'entregado',
            'incidencia',
        ];
    }
}
