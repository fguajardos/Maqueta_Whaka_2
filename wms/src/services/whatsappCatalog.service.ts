import prisma from '../config/database';
import { logger } from '../utils/logger';

export class WhatsAppCatalogService {
  static async getCatalogo(filters?: { activos?: boolean; categoria?: string }) {
    try {
      const productos = await prisma.producto.findMany({
        where: {
          activo: filters?.activos !== false,
          categoria: filters?.categoria,
        },
        include: {
          formatos: {
            where: { stock: { gt: 0 } },
          },
        },
      });

      const catalogo = productos
        .filter((p) => p.formatos.length > 0)
        .map((p) => ({
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          categoria: p.categoria,
          imagen: p.imagen,
          descripcion: p.descripcion,
          precioBase: p.precioBase,
          enOferta: p.enOferta,
          precioAnterior: p.precioAnterior,
          formatos: p.formatos.map((f) => ({
            id: f.id,
            formato: f.formato,
            unidadMedida: f.unidadMedida,
            precio: f.precio,
            stock: f.stock,
            cantidadBase: f.cantidadBase,
          })),
        }));

      logger.info(`[WhatsAppCatalog] Catálogo retornado: ${catalogo.length} productos`);

      return {
        success: true,
        count: catalogo.length,
        catalogo,
      };
    } catch (error: any) {
      logger.error('[WhatsAppCatalog] Error getting catalogo:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Catálogo VISUAL: todos los productos activos (con o sin stock), para galería de imágenes
  static async getCatalogoVisual() {
    try {
      const productos = await prisma.producto.findMany({
        where: { activo: true },
        include: { formatos: true },
        orderBy: { categoria: 'asc' },
      });

      const catalogo = productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        sku: p.sku,
        categoria: p.categoria,
        imagen: p.imagen,
        descripcion: p.descripcion,
        precio: p.precioBase,
        precioAnterior: p.precioAnterior,
        enOferta: p.enOferta,
        moneda: p.moneda,
        stock: p.formatos.reduce((acc, f) => acc + (f.stock || 0), 0),
      }));

      return { success: true, count: catalogo.length, catalogo };
    } catch (error: any) {
      logger.error('[WhatsAppCatalog] Error getting visual catalog:', error.message);
      return { success: false, error: error.message };
    }
  }

  static async getProductoFormatos(productoId: string) {
    try {
      const producto = await prisma.producto.findUnique({
        where: { id: productoId },
        include: {
          formatos: {
            where: { stock: { gt: 0 } },
          },
        },
      });

      if (!producto) {
        return {
          success: false,
          error: 'Producto no encontrado',
        };
      }

      return {
        success: true,
        producto: {
          id: producto.id,
          nombre: producto.nombre,
          sku: producto.sku,
          categoria: producto.categoria,
          precioBase: producto.precioBase,
          formatos: producto.formatos,
        },
      };
    } catch (error: any) {
      logger.error('[WhatsAppCatalog] Error getting product formatos:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async validateStock(
    productoFormatoId: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      const formato = await prisma.productoFormato.findUnique({
        where: { id: productoFormatoId },
      });

      if (!formato) {
        logger.warn(`[WhatsAppCatalog] Formato no encontrado: ${productoFormatoId}`);
        return false;
      }

      const available = formato.stock >= quantity;
      logger.info(
        `[WhatsAppCatalog] Stock validation: ${quantity} requested, ${formato.stock} available - ${available ? 'OK' : 'INSUFFICIENT'}`,
      );

      return available;
    } catch (error: any) {
      logger.error('[WhatsAppCatalog] Error validating stock:', error.message);
      return false;
    }
  }

  static async reserveStock(productoFormatoId: string, quantity: number) {
    try {
      const updated = await prisma.productoFormato.update({
        where: { id: productoFormatoId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      logger.info(
        `[WhatsAppCatalog] Stock reservado: ${quantity} unidades del formato ${productoFormatoId}`,
      );

      return {
        success: true,
        newStock: updated.stock,
      };
    } catch (error: any) {
      logger.error('[WhatsAppCatalog] Error reserving stock:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async releaseStock(productoFormatoId: string, quantity: number) {
    try {
      const updated = await prisma.productoFormato.update({
        where: { id: productoFormatoId },
        data: {
          stock: {
            increment: quantity,
          },
        },
      });

      logger.info(
        `[WhatsAppCatalog] Stock liberado: ${quantity} unidades del formato ${productoFormatoId}`,
      );

      return {
        success: true,
        newStock: updated.stock,
      };
    } catch (error: any) {
      logger.error('[WhatsAppCatalog] Error releasing stock:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async searchProducto(query: string) {
    try {
      const resultados = await prisma.producto.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
          activo: true,
        },
        include: {
          formatos: {
            where: { stock: { gt: 0 } },
          },
        },
        take: 10,
      });

      return {
        success: true,
        resultados,
      };
    } catch (error: any) {
      logger.error('[WhatsAppCatalog] Error searching products:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
