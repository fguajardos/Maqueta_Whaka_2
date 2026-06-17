import { Router, Request, Response } from 'express';
import { WhatsAppOrdersService } from '../services/whatsappOrders.service';
import { WhatsAppCatalogService } from '../services/whatsappCatalog.service';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/whatsapp/orders/create
// Crear orden (después de validar cliente/lead)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      clientPhone,
      clientName,
      clientId,
      productoFormatoId,
      productId,
      productName,
      quantity,
      unitOfMeasure,
      unitPrice,
      deliveryType,
      address,
      city,
      reference,
      paymentMethod,
    } = req.body;

    // Validaciones básicas
    if (!clientPhone || !clientName || !productId || !productName) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: clientPhone, clientName, productId, productName',
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Cantidad debe ser mayor a 0',
      });
    }

    // Validar stock si se proporciona productoFormatoId
    if (productoFormatoId) {
      const hasStock = await WhatsAppCatalogService.validateStock(
        productoFormatoId,
        quantity,
      );

      if (!hasStock) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente. Solicitaste ${quantity} unidades`,
        });
      }

      // Reservar stock
      await WhatsAppCatalogService.reserveStock(productoFormatoId, quantity);
    }

    // Crear orden
    const result = await WhatsAppOrdersService.createOrder({
      clientPhone,
      clientName,
      productId,
      productName,
      quantity,
      unitOfMeasure,
      unitPrice,
      deliveryType,
      address,
      city,
      reference,
      paymentMethod,
    });

    if (!result.success) {
      // Si falla la orden, liberar stock
      if (productoFormatoId) {
        await WhatsAppCatalogService.releaseStock(productoFormatoId, quantity);
      }

      return res.status(400).json(result);
    }

    res.json({
      success: true,
      orderId: result.orderId,
      order: result.order,
    });
  } catch (error: any) {
    logger.error('[WhatsApp Orders] Error creating order:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/whatsapp/orders/by-phone/:phone
router.get('/by-phone/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    const orders = await WhatsAppOrdersService.getOrdersByPhone(phone);

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    logger.error('[WhatsApp Orders] Error getting orders:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/whatsapp/orders/list
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { status, phone } = req.query;

    const orders = await WhatsAppOrdersService.listOrders({
      status: status as string,
      clientPhone: phone as string,
    });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    logger.error('[WhatsApp Orders] Error listing orders:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/whatsapp/orders/:orderId
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await WhatsAppOrdersService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error: any) {
    logger.error('[WhatsApp Orders] Error getting order:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
