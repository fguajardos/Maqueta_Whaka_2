import prisma from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';
import { billingQueueService } from './billingQueue.service';

export interface CreateWhatsAppOrderDTO {
  clientPhone: string;
  clientName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitOfMeasure: string;
  deliveryType: string;
  address?: string;
  city?: string;
  reference?: string;
  paymentMethod: string;
  unitPrice?: number;
}

export class WhatsAppOrdersService {
  /**
   * Validar y crear orden desde WhatsApp Bot
   */
  static async createOrder(data: CreateWhatsAppOrderDTO): Promise<any> {
    const errors: string[] = [];

    // Validar cantidad
    if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      errors.push('La cantidad debe ser un número mayor a 0');
    }

    // Validar dirección (si es entrega)
    if (data.deliveryType === 'entrega' || data.deliveryType === '2') {
      if (!data.address || data.address.trim().length < 10) {
        errors.push('Dirección debe tener al menos 10 caracteres');
      }
      if (!data.city || data.city.trim().length === 0) {
        errors.push('Ciudad es requerida');
      }
    }

    // Validar nombre cliente
    if (!data.clientName || data.clientName.trim().length < 2) {
      errors.push('Nombre debe tener al menos 2 caracteres');
    }

    // Calcular subtotal
    const subtotal = data.quantity * (data.unitPrice || 1200);

    try {
      // Crear registro en BD
      const whatsappOrder = await prisma.whatsAppOrder.create({
        data: {
          clientPhone: data.clientPhone,
          clientName: data.clientName,
          productId: data.productId,
          productName: data.productName,
          quantity: data.quantity,
          unitOfMeasure: data.unitOfMeasure,
          subtotal,
          deliveryType: (data.deliveryType === '2' || data.deliveryType === 'entrega') ? 'entrega' : 'retiro',
          address: data.address,
          city: data.city,
          reference: data.reference,
          paymentMethod: data.paymentMethod,
          status: errors.length > 0 ? 'error' : 'confirmado',
          validationErrors: errors.length > 0 ? JSON.stringify(errors) : JSON.stringify([]),
        },
      });

      // Log de auditoría
      await prisma.auditLog.create({
        data: {
          timestamp: new Date(),
          action: 'WHATSAPP_ORDER_CREATE',
          actor: 'whatsapp_bot',
          entityType: 'whatsapp_order',
          entityId: whatsappOrder.id,
          sourceSystem: 'whatsapp',
          requestPayload: data as any,
          responseSummary: {
            success: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            orderId: whatsappOrder.id,
          } as any,
          status: errors.length === 0 ? 'success' : 'failed',
        },
      });

      logger.info(
        `[WhatsApp] Orden creada: ${whatsappOrder.id} (${errors.length} errores)`
      );

      // Si la orden es exitosa, agregar a cola de facturación
      if (errors.length === 0) {
        const deliveryFee = data.deliveryType === 'entrega' ? 0 : 0; // Puede ser dinámico
        const totalAmount = subtotal + deliveryFee;

        const billingResult = await billingQueueService.createBillingEntry({
          whatsappOrderId: whatsappOrder.id,
          clientPhone: data.clientPhone,
          clientName: data.clientName,
          deliveryAddress: data.address || 'No especificada',
          deliveryCity: data.city || 'No especificada',
          productName: data.productName,
          productSKU: data.productId,
          quantity: data.quantity,
          unitOfMeasure: data.unitOfMeasure,
          unitPrice: data.unitPrice || 1200,
          subtotal,
          deliveryType: data.deliveryType === 'entrega' ? 'entrega' : 'retiro',
          deliveryFee,
          paymentMethod: data.paymentMethod,
          totalAmount,
        });

        if (!billingResult.success) {
          logger.warn(
            `[WhatsApp] Advertencia: No se pudo agregar orden a cola de facturación: ${billingResult.error}`
          );
        } else {
          logger.info(
            `[WhatsApp] Orden agregada a cola de facturación: ${billingResult.billingId}`
          );
        }
      }

      return {
        success: errors.length === 0,
        orderId: whatsappOrder.id,
        errors: errors.length > 0 ? errors : undefined,
        order: whatsappOrder,
      };
    } catch (error) {
      logger.error(`[WhatsApp] Error al crear orden:`, error);
      throw error;
    }
  }

  /**
   * Obtener órdenes por teléfono del cliente
   */
  static async getOrdersByPhone(phone: string) {
    try {
      const orders = await prisma.whatsAppOrder.findMany({
        where: { clientPhone: phone },
        orderBy: { createdAt: 'desc' },
      });

      return orders;
    } catch (error) {
      logger.error(`[WhatsApp] Error al obtener órdenes:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las órdenes con filtros
   */
  static async listOrders(filters?: {
    status?: string;
    clientPhone?: string;
    createdAfter?: Date;
  }) {
    try {
      const where: any = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.clientPhone) {
        where.clientPhone = filters.clientPhone;
      }

      if (filters?.createdAfter) {
        where.createdAt = { gte: filters.createdAfter };
      }

      const orders = await prisma.whatsAppOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return orders;
    } catch (error) {
      logger.error(`[WhatsApp] Error al listar órdenes:`, error);
      throw error;
    }
  }

  /**
   * Obtener una orden por ID
   */
  static async getOrderById(id: string) {
    try {
      const order = await prisma.whatsAppOrder.findUnique({
        where: { id },
      });

      if (!order) {
        const error = new Error('Orden no encontrada');
        (error as any).statusCode = 404;
        throw error;
      }

      return order;
    } catch (error) {
      logger.error(`[WhatsApp] Error al obtener orden:`, error);
      throw error;
    }
  }

  /**
   * Actualizar estado de una orden
   */
  static async updateOrderStatus(
    id: string,
    status: string,
    processedAt?: Date
  ) {
    try {
      const order = await prisma.whatsAppOrder.update({
        where: { id },
        data: {
          status,
          processedAt: processedAt || new Date(),
        },
      });

      logger.info(`[WhatsApp] Orden ${id} actualizada a estado: ${status}`);

      return order;
    } catch (error) {
      logger.error(`[WhatsApp] Error al actualizar orden:`, error);
      throw error;
    }
  }
}
