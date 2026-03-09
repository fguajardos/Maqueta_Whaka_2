/**
 * Transformer BSale: mapea datos entre formato interno WHK y formato BSale.
 * Basado en las tablas de mapeo del orchestrator_flow.md
 */

export interface WHKProduct {
    nombre: string;
    descripcion: string;
    sku: string;
    precioUnitario: number;
    categoria: string;
    stockDisponible: number;
    activo: boolean;
    infoNutricional?: any;
    temperaturaBodega?: string;
}

export interface BSaleProduct {
    name: string;
    description: string;
    variants: Array<{
        code: string;
        price: number;
        stock?: number;
    }>;
    productType?: { name: string };
    state: number;
}

export class BSaleTransformer {
    /**
     * WHK → BSale (para crear/actualizar productos en BSale)
     */
    static productToExternalFormat(product: WHKProduct): any {
        return {
            name: product.nombre,
            description: product.descripcion,
            state: product.activo ? 1 : 0,
            variants: [
                {
                    code: product.sku,
                    price: product.precioUnitario, // Neto en BSale
                },
            ],
        };
    }

    /**
     * BSale → WHK (para leer productos de BSale)
     */
    static productToInternalFormat(bsaleProduct: any): Partial<WHKProduct> {
        const variant = bsaleProduct.variants?.items?.[0] || {};
        return {
            nombre: bsaleProduct.name,
            descripcion: bsaleProduct.description || '',
            sku: variant.code || '',
            precioUnitario: variant.price || 0,
            activo: bsaleProduct.state === 1,
        };
    }

    /**
     * WHK → BSale (para crear clientes con datos tributarios chilenos)
     */
    static clientToExternalFormat(client: any): any {
        return {
            name: client.razonSocial,
            code: client.rut,
            email: client.email,
            address: client.direccionDespacho,
            phone: client.telefono,
        };
    }

    /**
     * WHK → BSale (para crear documentos tributarios/facturas)
     */
    static documentToExternalFormat(order: any, client: any): any {
        return {
            documentTypeId: 1, // Factura electrónica
            clientId: client.bsaleId,
            emissionDate: Math.floor(Date.now() / 1000),
            details: order.items.map((item: any) => ({
                variantId: item.bsaleVariantId,
                quantity: item.cantidad,
                unitValue: item.precioUnitario,
                discount: item.descuento || 0,
            })),
        };
    }
}
