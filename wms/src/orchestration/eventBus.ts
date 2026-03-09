import { logger } from '../utils/logger';

type EventHandler = (payload: any) => Promise<void>;

/**
 * Event Bus interno (pub/sub en memoria).
 * Coordina eventos entre pipelines del orquestador.
 */
class EventBus {
    private handlers: Map<string, EventHandler[]> = new Map();

    on(event: string, handler: EventHandler): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event)!.push(handler);
        logger.debug(`EventBus: handler registrado para '${event}'`);
    }

    async emit(event: string, payload: any): Promise<void> {
        const handlers = this.handlers.get(event) || [];
        logger.info(`EventBus: emitiendo '${event}' (${handlers.length} handlers)`, {
            event,
            payloadKeys: Object.keys(payload || {}),
        });

        for (const handler of handlers) {
            try {
                await handler(payload);
            } catch (error: any) {
                logger.error(`EventBus: error en handler de '${event}'`, {
                    error: error.message,
                });
            }
        }
    }

    off(event: string): void {
        this.handlers.delete(event);
    }
}

export const eventBus = new EventBus();

// =============================================
// Catálogo de eventos del orquestador
// (basado en la tabla de eventos del spec)
// =============================================
export const EVENTS = {
    // Pedidos
    PEDIDO_CREADO: 'pedido.creado',
    PEDIDO_VALIDADO: 'pedido.validado',
    PEDIDO_LISTO_BODEGA: 'pedido.listo_bodega',
    PEDIDO_FACTURADO: 'pedido.facturado',
    PEDIDO_DESPACHADO: 'pedido.despachado',
    PEDIDO_ENTREGADO: 'pedido.entregado',
    PEDIDO_INCIDENCIA: 'pedido.incidencia',
    PEDIDO_CANCELADO: 'pedido.cancelado',

    // Productos
    PRODUCTO_CREADO: 'producto.creado',
    PRODUCTO_ACTUALIZADO: 'producto.actualizado',
    PRODUCTO_DESACTIVADO: 'producto.desactivado',

    // Stock
    STOCK_BAJO: 'stock.bajo',
    STOCK_AJUSTADO: 'stock.ajustado',

    // Clientes
    CLIENTE_CREADO: 'cliente.creado',
    CLIENTE_BLOQUEADO: 'cliente.bloqueado',

    // Logística
    RUTA_INICIADA: 'ruta.iniciada',
    RUTA_COMPLETADA: 'ruta.completada',
} as const;
