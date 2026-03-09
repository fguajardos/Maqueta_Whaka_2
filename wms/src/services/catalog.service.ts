import prisma from '../config/database';
import { shopifyClient } from '../integrations/shopify/shopify.client';
import { bsaleClient } from '../integrations/bsale/bsale.client';
import { ShopifyTransformer } from '../integrations/shopify/shopify.transformer';
import { StockService } from './stock.service';
import { audit } from '../utils/audit';
import { paginate } from '../utils/pagination';

export class CatalogService {
    /**
     * GET /api/catalog/products (tabla 23)
     * Datos de Shopify (producto) + BSale (stock real).
     * Fallback: productos mock via StockService.
     */
    static async listProducts(filters: {
        categoria?: string;
        activo?: string;
        search?: string;
        page: number;
        limit: number;
    }) {
        try {
            const shopifyData = await shopifyClient.getProducts(filters.limit);
            const products = (shopifyData?.products?.edges || []).map((edge: any) =>
                ShopifyTransformer.productToInternalFormat(edge.node)
            );

            if (products.length > 0) {
                return paginate(products, products.length, filters.page, filters.limit);
            }
        } catch {
            // Shopify no disponible — continuamos con mock data
        }

        // Fallback: productos desde StockService (maqueta)
        const filtered = StockService.findBySearch(filters.search);
        return paginate(filtered, filtered.length, filters.page, filters.limit);
    }

    /**
     * GET /api/catalog/products/:id
     */
    static async getProduct(id: string) {
        const mapping = await prisma.idMapping.findFirst({
            where: { OR: [{ internalId: id }, { shopifyId: id }], entityType: 'producto' },
        });

        if (mapping) {
            return {
                internalId: mapping.internalId,
                shopifyId: mapping.shopifyId,
                bsaleId: mapping.bsaleId,
            };
        }

        // Fallback: buscar en StockService
        const mockProduct = StockService.findById(id);
        if (mockProduct) {
            return {
                internalId: mockProduct.id,
                shopifyId: null,
                bsaleId: null,
                ...mockProduct,
            };
        }

        return { internalId: id, shopifyId: null, bsaleId: null };
    }

    /**
     * PUT /api/catalog/products/:id
     */
    static async updateProduct(id: string, data: any, actor: string) {
        const mapping = await prisma.idMapping.findFirst({
            where: { internalId: id, entityType: 'producto' },
        });

        if (mapping?.shopifyId) {
            const shopifyData = ShopifyTransformer.productToExternalFormat(data);
            await shopifyClient.updateProduct(mapping.shopifyId, shopifyData);
        }

        if (mapping?.bsaleId) {
            const { BSaleTransformer } = await import('../integrations/bsale/bsale.transformer');
            const bsaleData = BSaleTransformer.productToExternalFormat(data);
            await bsaleClient.updateProduct(mapping.bsaleId, bsaleData);
        }

        await audit({
            action: 'product_updated',
            actor,
            entityType: 'producto',
            entityId: id,
            sourceSystem: 'panel_admin',
            requestPayload: data,
        });

        return { success: true };
    }

    /**
     * POST /api/catalog/products/:id/toggle-active
     */
    static async toggleActive(id: string, actor: string) {
        await audit({
            action: 'product_toggled',
            actor,
            entityType: 'producto',
            entityId: id,
            sourceSystem: 'panel_admin',
        });

        return { success: true };
    }

    /**
     * GET /api/catalog/categories
     */
    static async getCategories() {
        return [
            { id: 'ipa', name: 'IPA' },
            { id: 'stout', name: 'Stout' },
            { id: 'amber', name: 'Amber Ale' },
            { id: 'golden', name: 'Golden Ale' },
            { id: 'porter', name: 'Porter' },
            { id: 'pale-ale', name: 'Pale Ale' },
            { id: 'wheat', name: 'Wheat Beer' },
            { id: 'lager', name: 'Lager' },
            { id: 'saison', name: 'Saison' },
            { id: 'belgian', name: 'Belgian' },
        ];
    }

    /**
     * GET /api/catalog/price-lists
     */
    static async getPriceLists() {
        return [
            { id: 'mayorista', name: 'Mayorista', descuento: 15 },
            { id: 'distribuidor', name: 'Distribuidor', descuento: 25 },
            { id: 'retail', name: 'Retail / Público', descuento: 0 },
        ];
    }
}
