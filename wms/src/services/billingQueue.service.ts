import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateBillingQueueDTO {
  whatsappOrderId: string;
  clientPhone: string;
  clientName: string;
  clientRut?: string;
  clientEmail?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZone?: string;
  productName: string;
  productSKU?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  subtotal: number;
  deliveryType: string;
  deliveryFee?: number;
  paymentMethod: string;
  totalAmount: number;
}

export class BillingQueueService {
  /**
   * Crear entrada en cola de facturación
   * Se llama automáticamente cuando WhatsAppOrder se confirma
   */
  async createBillingEntry(data: CreateBillingQueueDTO) {
    try {
      const entry = await prisma.billingQueue.create({
        data: {
          whatsappOrderId: data.whatsappOrderId,
          clientPhone: data.clientPhone,
          clientName: data.clientName,
          clientRut: data.clientRut,
          clientEmail: data.clientEmail,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryZone: data.deliveryZone,
          productName: data.productName,
          productSKU: data.productSKU,
          quantity: data.quantity,
          unitOfMeasure: data.unitOfMeasure,
          unitPrice: data.unitPrice,
          subtotal: data.subtotal,
          deliveryType: data.deliveryType,
          deliveryFee: data.deliveryFee || 0,
          paymentMethod: data.paymentMethod,
          totalAmount: data.totalAmount,
          status: 'pendiente',
        },
      });

      return {
        success: true,
        billingId: entry.id,
        message: 'Pedido agregado a cola de facturación',
      };
    } catch (error: any) {
      console.error('Error creating billing entry:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener cola de facturación pendiente
   */
  async getPendingBillings(filter?: { status?: string; clientPhone?: string }) {
    try {
      const where: any = {};

      if (filter?.status) {
        where.status = filter.status;
      } else {
        // Por defecto mostrar pendiente + error
        where.status = {
          in: ['pendiente', 'error'],
        };
      }

      if (filter?.clientPhone) {
        where.clientPhone = filter.clientPhone;
      }

      const billings = await prisma.billingQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        count: billings.length,
        data: billings,
      };
    } catch (error: any) {
      console.error('Error getting pending billings:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Obtener estadísticas de facturación
   */
  async getBillingStats() {
    try {
      const stats = await prisma.billingQueue.groupBy({
        by: ['status'],
        _count: true,
      });

      const byStatus: Record<string, number> = {};
      stats.forEach((stat: any) => {
        byStatus[stat.status] = stat._count;
      });

      // Total monto pendiente
      const pendingAmount = await prisma.billingQueue.aggregate({
        where: {
          status: {
            in: ['pendiente', 'error'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      return {
        success: true,
        byStatus,
        pendingTotal: pendingAmount._sum.totalAmount || 0,
      };
    } catch (error: any) {
      console.error('Error getting billing stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Actualizar estado de facturación
   * Cuando se factura en BSale O manualmente
   */
  async markAsInvoiced(
    billingId: string,
    bsaleDocumentId?: string,
    bsaleDocumentNumber?: string,
  ) {
    try {
      const billing = await prisma.billingQueue.update({
        where: { id: billingId },
        data: {
          status: 'facturado',
          bsaleDocumentId,
          bsaleDocumentNumber,
          bsaleInvoiceDate: new Date(),
          facturadoAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Pedido facturado con documento: ${bsaleDocumentNumber || 'Manual'}`,
        data: billing,
      };
    } catch (error: any) {
      console.error('Error marking as invoiced:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Marcar como error de facturación
   * Cuando intenta facturar en BSale y falla
   */
  async markAsError(billingId: string, errorMessage: string) {
    try {
      const billing = await prisma.billingQueue.update({
        where: { id: billingId },
        data: {
          status: 'error',
          errorMessage,
          errorCount: {
            increment: 1,
          },
          lastErrorAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Pedido marcado con error de facturación',
        data: billing,
      };
    } catch (error: any) {
      console.error('Error marking as error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Agregar nota administrativa a pedido
   */
  async addNote(billingId: string, note: string) {
    try {
      const billing = await prisma.billingQueue.update({
        where: { id: billingId },
        data: {
          adminNotes: note,
        },
      });

      return {
        success: true,
        message: 'Nota agregada',
        data: billing,
      };
    } catch (error: any) {
      console.error('Error adding note:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener un pedido de la cola por ID
   */
  async getBillingById(billingId: string) {
    try {
      const billing = await prisma.billingQueue.findUnique({
        where: { id: billingId },
      });

      if (!billing) {
        return {
          success: false,
          error: 'Pedido no encontrado',
        };
      }

      return {
        success: true,
        data: billing,
      };
    } catch (error: any) {
      console.error('Error getting billing:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtener pedidos para un cliente específico
   */
  async getClientBillings(clientPhone: string) {
    try {
      const billings = await prisma.billingQueue.findMany({
        where: { clientPhone },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        count: billings.length,
        data: billings,
      };
    } catch (error: any) {
      console.error('Error getting client billings:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Exportar cola de facturación a CSV
   * Para facturación manual o transferencia a sistema externo
   */
  async exportToCsv(status?: string) {
    try {
      const where: any = {};
      if (status) {
        where.status = status;
      } else {
        where.status = {
          in: ['pendiente', 'error'],
        };
      }

      const billings = await prisma.billingQueue.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      // Generar CSV
      const headers = [
        'ID',
        'Teléfono Cliente',
        'Nombre Cliente',
        'RUT',
        'Email',
        'Producto',
        'Cantidad',
        'Unidad',
        'Precio Unitario',
        'Subtotal',
        'Dirección',
        'Ciudad',
        'Tipo Despacho',
        'Flete',
        'Método Pago',
        'Total',
        'Estado',
        'Fecha',
      ];

      const rows = billings.map((b) => [
        b.id,
        b.clientPhone,
        b.clientName,
        b.clientRut || '-',
        b.clientEmail || '-',
        b.productName,
        b.quantity,
        b.unitOfMeasure,
        b.unitPrice,
        b.subtotal,
        b.deliveryAddress,
        b.deliveryCity,
        b.deliveryType,
        b.deliveryFee,
        b.paymentMethod,
        b.totalAmount,
        b.status,
        b.createdAt.toISOString(),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return {
        success: true,
        csv,
        count: billings.length,
      };
    } catch (error: any) {
      console.error('Error exporting to CSV:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const billingQueueService = new BillingQueueService();
