import prisma from '../config/database';
import { logger } from '../utils/logger';
import { audit } from '../utils/audit';

// ============================================
// Tipo de variante con soporte para reserva
// ============================================
export interface ProductVariant {
    title: string;
    sku: string;
    inventoryQuantity: number;
    reservedQuantity: number;
    price: string;
}

export interface MockProduct {
    id: string;
    title: string;
    sku: string;
    status: string;
    totalInventory: number;
    totalReserved: number;
    variants: ProductVariant[];
}

interface StockMovementItem {
    sku: string;
    quantity: number;
}

// ============================================
// Productos mock mutables
// ============================================
const products: MockProduct[] = [
    {
        id: 'WHK-PROD-001',
        title: 'Cerveza Artesanal IPA Valdiviana',
        sku: 'WHK-IPA-330',
        status: 'active',
        totalInventory: 48,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-IPA-330', inventoryQuantity: 30, reservedQuantity: 0, price: '3500' },
            { title: 'Lata 473ml', sku: 'WHK-IPA-473', inventoryQuantity: 18, reservedQuantity: 0, price: '4200' },
        ],
    },
    {
        id: 'WHK-PROD-002',
        title: 'Cerveza Stout Patagónica',
        sku: 'WHK-STT-330',
        status: 'active',
        totalInventory: 72,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-STT-330', inventoryQuantity: 42, reservedQuantity: 0, price: '3800' },
            { title: 'Botella 500ml', sku: 'WHK-STT-500', inventoryQuantity: 30, reservedQuantity: 0, price: '5200' },
        ],
    },
    {
        id: 'WHK-PROD-003',
        title: 'Cerveza Amber Ale Costanera',
        sku: 'WHK-AMB-330',
        status: 'active',
        totalInventory: 15,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-AMB-330', inventoryQuantity: 10, reservedQuantity: 0, price: '3200' },
            { title: 'Lata 473ml', sku: 'WHK-AMB-473', inventoryQuantity: 5, reservedQuantity: 0, price: '3900' },
        ],
    },
    {
        id: 'WHK-PROD-004',
        title: 'Cerveza Golden Ale Desierto',
        sku: 'WHK-GLD-330',
        status: 'active',
        totalInventory: 120,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-GLD-330', inventoryQuantity: 80, reservedQuantity: 0, price: '2900' },
            { title: 'Lata 473ml', sku: 'WHK-GLD-473', inventoryQuantity: 40, reservedQuantity: 0, price: '3500' },
        ],
    },
    {
        id: 'WHK-PROD-005',
        title: 'Cerveza Porter Volcánica',
        sku: 'WHK-PRT-500',
        status: 'active',
        totalInventory: 3,
        totalReserved: 0,
        variants: [
            { title: 'Botella 500ml', sku: 'WHK-PRT-500', inventoryQuantity: 3, reservedQuantity: 0, price: '4800' },
        ],
    },
    {
        id: 'WHK-PROD-006',
        title: 'Cerveza Pale Ale Mapocho',
        sku: 'WHK-PLA-330',
        status: 'active',
        totalInventory: 0,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-PLA-330', inventoryQuantity: 0, reservedQuantity: 0, price: '3400' },
            { title: 'Lata 473ml', sku: 'WHK-PLA-473', inventoryQuantity: 0, reservedQuantity: 0, price: '4100' },
        ],
    },
    {
        id: 'WHK-PROD-007',
        title: 'Cerveza Wheat Beer Austral',
        sku: 'WHK-WHT-330',
        status: 'active',
        totalInventory: 36,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-WHT-330', inventoryQuantity: 24, reservedQuantity: 0, price: '3300' },
            { title: 'Growler 1L', sku: 'WHK-WHT-1000', inventoryQuantity: 12, reservedQuantity: 0, price: '8500' },
        ],
    },
    {
        id: 'WHK-PROD-008',
        title: 'Cerveza Red Ale Sureña',
        sku: 'WHK-RED-330',
        status: 'active',
        totalInventory: 8,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-RED-330', inventoryQuantity: 8, reservedQuantity: 0, price: '3600' },
        ],
    },
    {
        id: 'WHK-PROD-009',
        title: 'Cerveza Belgian Blonde Andina',
        sku: 'WHK-BLG-500',
        status: 'active',
        totalInventory: 55,
        totalReserved: 0,
        variants: [
            { title: 'Botella 500ml', sku: 'WHK-BLG-500', inventoryQuantity: 35, reservedQuantity: 0, price: '5500' },
            { title: 'Botella 750ml', sku: 'WHK-BLG-750', inventoryQuantity: 20, reservedQuantity: 0, price: '7800' },
        ],
    },
    {
        id: 'WHK-PROD-010',
        title: 'Cerveza Session IPA Pacífico',
        sku: 'WHK-SES-330',
        status: 'active',
        totalInventory: 0,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-SES-330', inventoryQuantity: 0, reservedQuantity: 0, price: '3100' },
        ],
    },
    {
        id: 'WHK-PROD-011',
        title: 'Cerveza Lager Premium Atacama',
        sku: 'WHK-LGR-330',
        status: 'inactive',
        totalInventory: 90,
        totalReserved: 0,
        variants: [
            { title: 'Botella 330ml', sku: 'WHK-LGR-330', inventoryQuantity: 50, reservedQuantity: 0, price: '2800' },
            { title: 'Lata 355ml', sku: 'WHK-LGR-355', inventoryQuantity: 40, reservedQuantity: 0, price: '2600' },
        ],
    },
    {
        id: 'WHK-PROD-012',
        title: 'Cerveza Saison Chilota',
        sku: 'WHK-SAI-500',
        status: 'active',
        totalInventory: 18,
        totalReserved: 0,
        variants: [
            { title: 'Botella 500ml', sku: 'WHK-SAI-500', inventoryQuantity: 12, reservedQuantity: 0, price: '5000' },
            { title: 'Botella 750ml Edición Limitada', sku: 'WHK-SAI-750', inventoryQuantity: 6, reservedQuantity: 0, price: '8900' },
        ],
    },
];

/**
 * Busca una variante por SKU dentro de todos los productos.
 * Retorna la variante y el producto padre, o null si no existe.
 */
function findVariantBySku(sku: string): { product: MockProduct; variant: ProductVariant } | null {
    for (const product of products) {
        const variant = product.variants.find((v) => v.sku === sku);
        if (variant) return { product, variant };
    }
    return null;
}

/**
 * Recalcula los totales de un producto a partir de sus variantes.
 */
function recalcProductTotals(product: MockProduct): void {
    product.totalInventory = product.variants.reduce((sum, v) => sum + v.inventoryQuantity, 0);
    product.totalReserved = product.variants.reduce((sum, v) => sum + v.reservedQuantity, 0);
}

// ============================================
// Servicio de Stock (gestión de inventario)
// ============================================
export class StockService {
    /**
     * Retorna todos los productos (referencia mutable).
     */
    static getProducts(): MockProduct[] {
        return products;
    }

    /**
     * Filtra productos por texto de búsqueda (título o SKU).
     */
    static findBySearch(search?: string): MockProduct[] {
        if (!search) return products;

        const query = search.toLowerCase();
        return products.filter(
            (p) =>
                p.title.toLowerCase().includes(query) ||
                p.sku.toLowerCase().includes(query),
        );
    }

    /**
     * Busca un producto por ID.
     */
    static findById(id: string): MockProduct | undefined {
        return products.find((p) => p.id === id);
    }

    /**
     * Reserva provisoria de stock.
     * Se ejecuta cuando un pedido entra en preparación (en_preparacion).
     * No descuenta inventario real, solo marca como reservado.
     */
    static async reserveStock(items: StockMovementItem[], orderId: string): Promise<void> {
        for (const item of items) {
            const found = findVariantBySku(item.sku);
            if (!found) {
                logger.warn(`Stock reserva: SKU ${item.sku} no encontrado (pedido ${orderId})`);
                continue;
            }

            const available = found.variant.inventoryQuantity - found.variant.reservedQuantity;
            if (available < item.quantity) {
                logger.warn(
                    `Stock reserva: SKU ${item.sku} — disponible ${available}, solicitado ${item.quantity} (pedido ${orderId})`,
                );
            }

            found.variant.reservedQuantity += item.quantity;
            recalcProductTotals(found.product);

            logger.info(
                `📦 Stock reservado: ${item.sku} x${item.quantity} → reserva=${found.variant.reservedQuantity} (pedido ${orderId})`,
            );
        }

        await audit({
            action: 'stock_reserved',
            actor: 'system',
            entityType: 'stock',
            entityId: orderId,
            sourceSystem: 'orquestador',
            requestPayload: { items },
        });
    }

    /**
     * Deducción definitiva de stock.
     * Se ejecuta al confirmar entrega (entregado).
     * Descuenta inventario real y libera la reserva.
     */
    static async confirmDeduction(items: StockMovementItem[], orderId: string): Promise<void> {
        for (const item of items) {
            const found = findVariantBySku(item.sku);
            if (!found) {
                logger.warn(`Stock deducción: SKU ${item.sku} no encontrado (pedido ${orderId})`);
                continue;
            }

            found.variant.inventoryQuantity = Math.max(0, found.variant.inventoryQuantity - item.quantity);
            found.variant.reservedQuantity = Math.max(0, found.variant.reservedQuantity - item.quantity);
            recalcProductTotals(found.product);

            logger.info(
                `✅ Stock deducido: ${item.sku} x${item.quantity} → inv=${found.variant.inventoryQuantity}, res=${found.variant.reservedQuantity} (pedido ${orderId})`,
            );
        }

        await audit({
            action: 'stock_deducted',
            actor: 'system',
            entityType: 'stock',
            entityId: orderId,
            sourceSystem: 'orquestador',
            requestPayload: { items },
        });
    }

    /**
     * Libera reserva sin descontar inventario.
     * Se ejecuta cuando un pedido cae en incidencia.
     */
    static async releaseReservation(items: StockMovementItem[], orderId: string): Promise<void> {
        for (const item of items) {
            const found = findVariantBySku(item.sku);
            if (!found) {
                logger.warn(`Stock liberación: SKU ${item.sku} no encontrado (pedido ${orderId})`);
                continue;
            }

            found.variant.reservedQuantity = Math.max(0, found.variant.reservedQuantity - item.quantity);
            recalcProductTotals(found.product);

            logger.info(
                `🔓 Reserva liberada: ${item.sku} x${item.quantity} → reserva=${found.variant.reservedQuantity} (pedido ${orderId})`,
            );
        }

        await audit({
            action: 'stock_reservation_released',
            actor: 'system',
            entityType: 'stock',
            entityId: orderId,
            sourceSystem: 'orquestador',
            requestPayload: { items },
        });
    }

    /**
     * Sincroniza reservas desde la base de datos al arrancar el servidor.
     * Escanea pedidos en estados intermedios (en_preparacion → despachado)
     * y aplica las reservas correspondientes al stock en memoria.
     */
    static async syncReservationsFromDatabase(): Promise<void> {
        const reservableStates = ['en_preparacion', 'listo_bodega', 'facturado', 'despachado'];

        try {
            const inFlightOrders = await prisma.processState.findMany({
                where: {
                    processType: 'pedido_completo',
                    currentStep: { in: reservableStates },
                },
            });

            if (inFlightOrders.length === 0) {
                logger.info('📦 Stock sync: no hay pedidos en vuelo para reservar');
                return;
            }

            let totalReserved = 0;

            for (const order of inFlightOrders) {
                const stepsLog = (order.stepsLog as any[]) || [];

                // Buscar items en el stepsLog del pedido
                let items: StockMovementItem[] = [];
                for (const step of stepsLog) {
                    if (step.items && Array.isArray(step.items) && step.items.length > 0) {
                        items = step.items;
                        break;
                    }
                }

                if (items.length === 0) continue;

                // Aplicar reserva sin auditoría (es reconstrucción de estado)
                for (const item of items) {
                    const found = findVariantBySku(item.sku);
                    if (!found) continue;

                    found.variant.reservedQuantity += item.quantity;
                    recalcProductTotals(found.product);
                    totalReserved++;
                }

                logger.info(
                    `📦 Stock sync: reserva aplicada para pedido ${order.entityId} (${items.length} items, estado: ${order.currentStep})`,
                );
            }

            logger.info(`📦 Stock sync completado: ${inFlightOrders.length} pedidos, ${totalReserved} reservas aplicadas`);
        } catch (error: any) {
            logger.error(`Error sincronizando reservas de stock: ${error.message}`);
        }
    }
}
