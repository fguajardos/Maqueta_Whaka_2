/**
 * Tests Unitarios — StockService
 * Verifica reserva, deducción y liberación de stock en memoria.
 * Mock de audit para evitar escritura a DB.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock de audit antes de importar el servicio
vi.mock('../../src/utils/audit', () => ({
    audit: vi.fn().mockResolvedValue(undefined),
}));

// Mock de prisma (usado solo en syncReservationsFromDatabase)
vi.mock('../../src/config/database', () => ({
    default: {
        $connect: vi.fn(),
        $disconnect: vi.fn(),
        processState: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        auditLog: {
            create: vi.fn().mockResolvedValue({}),
        },
    },
}));

import { StockService } from '../../src/services/stock.service';

describe('StockService.getProducts()', () => {
    it('retorna todos los productos (12 en total)', () => {
        const products = StockService.getProducts();
        expect(products.length).toBe(12);
    });

    it('cada producto tiene los campos requeridos', () => {
        const products = StockService.getProducts();
        for (const p of products) {
            expect(p).toHaveProperty('id');
            expect(p).toHaveProperty('title');
            expect(p).toHaveProperty('sku');
            expect(p).toHaveProperty('status');
            expect(p).toHaveProperty('totalInventory');
            expect(p).toHaveProperty('totalReserved');
            expect(p).toHaveProperty('variants');
            expect(Array.isArray(p.variants)).toBe(true);
        }
    });

    it('incluye productos activos e inactivos', () => {
        const products = StockService.getProducts();
        const activos = products.filter(p => p.status === 'active');
        const inactivos = products.filter(p => p.status === 'inactive');
        expect(activos.length).toBeGreaterThan(0);
        expect(inactivos.length).toBeGreaterThan(0);
    });

    it('WHK-PROD-001 existe con variantes', () => {
        const products = StockService.getProducts();
        const ipa = products.find(p => p.id === 'WHK-PROD-001');
        expect(ipa).toBeDefined();
        expect(ipa!.title).toContain('IPA');
        expect(ipa!.variants.length).toBeGreaterThan(0);
    });
});

describe('StockService.findBySearch()', () => {
    it('sin búsqueda retorna todos los productos', () => {
        const all = StockService.getProducts();
        expect(StockService.findBySearch()).toHaveLength(all.length);
        expect(StockService.findBySearch('')).toHaveLength(all.length);
    });

    it('búsqueda por título parcial funciona (case-insensitive)', () => {
        const result = StockService.findBySearch('ipa');
        expect(result.length).toBeGreaterThan(0);
        for (const p of result) {
            const matchTitle = p.title.toLowerCase().includes('ipa');
            const matchSku = p.sku.toLowerCase().includes('ipa');
            expect(matchTitle || matchSku).toBe(true);
        }
    });

    it('búsqueda por SKU funciona', () => {
        const result = StockService.findBySearch('WHK-STT');
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].sku).toContain('WHK-STT');
    });

    it('búsqueda sin coincidencias retorna array vacío', () => {
        const result = StockService.findBySearch('producto-inexistente-xyz-123');
        expect(result).toHaveLength(0);
    });
});

describe('StockService.findById()', () => {
    it('retorna el producto correcto por ID', () => {
        const product = StockService.findById('WHK-PROD-001');
        expect(product).toBeDefined();
        expect(product!.id).toBe('WHK-PROD-001');
    });

    it('retorna undefined para ID inexistente', () => {
        expect(StockService.findById('PROD-NO-EXISTE')).toBeUndefined();
    });
});

describe('StockService.reserveStock()', () => {
    it('incrementa reservedQuantity de la variante correcta', async () => {
        const products = StockService.getProducts();
        const product = products.find(p => p.id === 'WHK-PROD-001')!;
        const variant = product.variants.find(v => v.sku === 'WHK-IPA-330')!;
        const beforeReserved = variant.reservedQuantity;

        await StockService.reserveStock([{ sku: 'WHK-IPA-330', quantity: 5 }], 'test-order-res-1');

        expect(variant.reservedQuantity).toBe(beforeReserved + 5);

        // Cleanup
        await StockService.releaseReservation([{ sku: 'WHK-IPA-330', quantity: 5 }], 'cleanup');
    });

    it('actualiza el totalReserved del producto padre', async () => {
        const products = StockService.getProducts();
        const product = products.find(p => p.id === 'WHK-PROD-002')!;
        const beforeTotal = product.totalReserved;

        await StockService.reserveStock([{ sku: 'WHK-STT-330', quantity: 3 }], 'test-order-res-2');

        expect(product.totalReserved).toBe(beforeTotal + 3);

        // Cleanup
        await StockService.releaseReservation([{ sku: 'WHK-STT-330', quantity: 3 }], 'cleanup');
    });

    it('ignora SKU inexistente sin lanzar error', async () => {
        await expect(
            StockService.reserveStock([{ sku: 'SKU-NO-EXISTE', quantity: 1 }], 'test-order-res-3')
        ).resolves.not.toThrow();
    });

    it('puede reservar múltiples SKUs a la vez', async () => {
        const products = StockService.getProducts();
        const ipa = products.find(p => p.id === 'WHK-PROD-001')!;
        const stt = products.find(p => p.id === 'WHK-PROD-002')!;
        const ipaVariant = ipa.variants.find(v => v.sku === 'WHK-IPA-330')!;
        const sttVariant = stt.variants.find(v => v.sku === 'WHK-STT-330')!;

        const beforeIpa = ipaVariant.reservedQuantity;
        const beforeStt = sttVariant.reservedQuantity;

        await StockService.reserveStock(
            [{ sku: 'WHK-IPA-330', quantity: 2 }, { sku: 'WHK-STT-330', quantity: 4 }],
            'test-order-res-4'
        );

        expect(ipaVariant.reservedQuantity).toBe(beforeIpa + 2);
        expect(sttVariant.reservedQuantity).toBe(beforeStt + 4);

        // Cleanup
        await StockService.releaseReservation(
            [{ sku: 'WHK-IPA-330', quantity: 2 }, { sku: 'WHK-STT-330', quantity: 4 }],
            'cleanup'
        );
    });
});

describe('StockService.confirmDeduction()', () => {
    it('reduce inventoryQuantity definitivamente', async () => {
        const products = StockService.getProducts();
        const product = products.find(p => p.id === 'WHK-PROD-004')!; // Golden Ale, 80 unidades
        const variant = product.variants.find(v => v.sku === 'WHK-GLD-330')!;
        const beforeInventory = variant.inventoryQuantity;
        const beforeReserved = variant.reservedQuantity;

        // Primero reservar, luego confirmar deducción
        await StockService.reserveStock([{ sku: 'WHK-GLD-330', quantity: 5 }], 'order-ded-1');
        await StockService.confirmDeduction([{ sku: 'WHK-GLD-330', quantity: 5 }], 'order-ded-1');

        expect(variant.inventoryQuantity).toBe(beforeInventory - 5);
        expect(variant.reservedQuantity).toBe(beforeReserved); // Liberó la reserva también
    });

    it('no baja inventario por debajo de 0', async () => {
        const products = StockService.getProducts();
        const product = products.find(p => p.id === 'WHK-PROD-006')!; // Pale Ale, stock=0
        const variant = product.variants.find(v => v.sku === 'WHK-PLA-330')!;
        expect(variant.inventoryQuantity).toBe(0);

        await StockService.confirmDeduction([{ sku: 'WHK-PLA-330', quantity: 100 }], 'order-ded-2');

        expect(variant.inventoryQuantity).toBe(0); // Math.max(0, ...)
    });

    it('ignora SKU inexistente sin lanzar error', async () => {
        await expect(
            StockService.confirmDeduction([{ sku: 'SKU-NO-EXISTE', quantity: 1 }], 'order-ded-3')
        ).resolves.not.toThrow();
    });
});

describe('StockService.releaseReservation()', () => {
    it('libera la reserva sin tocar inventoryQuantity', async () => {
        const products = StockService.getProducts();
        const product = products.find(p => p.id === 'WHK-PROD-007')!; // Wheat Beer
        const variant = product.variants.find(v => v.sku === 'WHK-WHT-330')!;
        const beforeInventory = variant.inventoryQuantity;
        const beforeReserved = variant.reservedQuantity;

        await StockService.reserveStock([{ sku: 'WHK-WHT-330', quantity: 3 }], 'order-rel-1');
        expect(variant.reservedQuantity).toBe(beforeReserved + 3);

        await StockService.releaseReservation([{ sku: 'WHK-WHT-330', quantity: 3 }], 'order-rel-1');

        expect(variant.reservedQuantity).toBe(beforeReserved);
        expect(variant.inventoryQuantity).toBe(beforeInventory); // No se tocó el inventario
    });

    it('no baja reservedQuantity por debajo de 0', async () => {
        const products = StockService.getProducts();
        const product = products.find(p => p.id === 'WHK-PROD-008')!; // Red Ale
        const variant = product.variants.find(v => v.sku === 'WHK-RED-330')!;
        const currentReserved = variant.reservedQuantity;

        // Liberar más de lo que hay reservado
        await StockService.releaseReservation([{ sku: 'WHK-RED-330', quantity: currentReserved + 100 }], 'order-rel-2');

        expect(variant.reservedQuantity).toBe(0); // Math.max(0, ...)
    });

    it('ignora SKU inexistente sin lanzar error', async () => {
        await expect(
            StockService.releaseReservation([{ sku: 'SKU-NO-EXISTE', quantity: 1 }], 'order-rel-3')
        ).resolves.not.toThrow();
    });
});

describe('StockService — Ciclo completo reserva → deducción', () => {
    it('reservar y luego confirmar deja el stock consistente', async () => {
        const products = StockService.getProducts();
        const product = products.find(p => p.id === 'WHK-PROD-009')!; // Belgian Blonde
        const variant = product.variants.find(v => v.sku === 'WHK-BLG-500')!;
        const initialInventory = variant.inventoryQuantity;
        const initialReserved = variant.reservedQuantity;

        await StockService.reserveStock([{ sku: 'WHK-BLG-500', quantity: 10 }], 'order-cycle-1');
        expect(variant.reservedQuantity).toBe(initialReserved + 10);
        expect(variant.inventoryQuantity).toBe(initialInventory); // Inventario no cambia al reservar

        await StockService.confirmDeduction([{ sku: 'WHK-BLG-500', quantity: 10 }], 'order-cycle-1');
        expect(variant.inventoryQuantity).toBe(initialInventory - 10); // Ahora sí descuenta
        expect(variant.reservedQuantity).toBe(initialReserved); // Reserva liberada
    });
});
