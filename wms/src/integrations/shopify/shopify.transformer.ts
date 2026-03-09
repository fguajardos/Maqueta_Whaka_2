/**
 * Transformer Shopify: mapea datos entre formato interno WHK y Shopify GraphQL.
 * Basado en las tablas de mapeo del orchestrator_flow.md
 */

export class ShopifyTransformer {
    /**
     * WHK → Shopify (para crear/actualizar productos en Shopify)
     */
    static productToExternalFormat(product: any): any {
        return {
            title: product.nombre,
            descriptionHtml: product.descripcion,
            productType: product.categoria,
            status: product.activo ? 'ACTIVE' : 'DRAFT',
            variants: [
                {
                    sku: product.sku,
                    price: product.precioUnitario.toString(), // Bruto en CLP
                },
            ],
        };
    }

    /**
     * Shopify → WHK (para leer productos de Shopify)
     */
    static productToInternalFormat(shopifyProduct: any): any {
        const variant = shopifyProduct.variants?.edges?.[0]?.node || {};
        return {
            nombre: shopifyProduct.title,
            descripcion: shopifyProduct.descriptionHtml || '',
            sku: variant.sku || '',
            precioUnitario: parseFloat(variant.price || '0'),
            categoria: shopifyProduct.productType || '',
            stockDisponible: variant.inventoryQuantity || 0,
            activo: shopifyProduct.status === 'ACTIVE',
        };
    }

    /**
     * WHK → Shopify (para crear clientes en Shopify)
     */
    static clientToExternalFormat(client: any): any {
        return {
            email: client.email,
            firstName: client.nombre?.split(' ')[0] || '',
            lastName: client.nombre?.split(' ').slice(1).join(' ') || '',
            tags: [
                `rut:${client.rut}`,
                `payment:${client.condicionPago}`,
                `price_list:${client.listaPreciosId}`,
                `status:${client.estadoComercial || 'activo'}`,
            ],
            addresses: client.direccionDespacho
                ? [
                    {
                        address1: client.direccionDespacho.direccion,
                        city: client.direccionDespacho.comuna,
                        province: client.direccionDespacho.region,
                        country: 'CL',
                    },
                ]
                : [],
            metafields: [
                {
                    namespace: 'whakachile',
                    key: 'razon_social',
                    value: client.razonSocial,
                    type: 'single_line_text_field',
                },
            ],
        };
    }

    /**
     * Shopify Order → WHK Pedido (normalizar pedido entrante)
     */
    static orderToInternalFormat(shopifyOrder: any): any {
        return {
            shopifyId: shopifyOrder.id,
            shopifyName: shopifyOrder.name,
            email: shopifyOrder.email,
            canalOrigen: 'shopify',
            total: parseFloat(shopifyOrder.totalPriceSet?.shopMoney?.amount || '0'),
            moneda: shopifyOrder.totalPriceSet?.shopMoney?.currencyCode || 'CLP',
            estadoFinanciero: shopifyOrder.displayFinancialStatus,
            estadoFulfillment: shopifyOrder.displayFulfillmentStatus,
            fechaCreacion: shopifyOrder.createdAt,
            items: (shopifyOrder.lineItems?.edges || []).map((edge: any) => ({
                nombre: edge.node.title,
                cantidad: edge.node.quantity,
                sku: edge.node.variant?.sku || '',
                precioUnitario: parseFloat(edge.node.originalUnitPriceSet?.shopMoney?.amount || '0'),
            })),
            direccionDespacho: shopifyOrder.shippingAddress
                ? {
                    direccion: shopifyOrder.shippingAddress.address1,
                    comuna: shopifyOrder.shippingAddress.city,
                    region: shopifyOrder.shippingAddress.province,
                    pais: shopifyOrder.shippingAddress.country,
                    codigoPostal: shopifyOrder.shippingAddress.zip,
                }
                : null,
            condicionPago: 'prepago', // Shopify siempre es prepago
        };
    }
}
