import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/admin/wms/stock — todos los formatos con su nivel de stock
router.get('/stock', authenticate, async (_req: Request, res: Response) => {
  try {
    const formatos = await prisma.productoFormato.findMany({
      include: { producto: true },
      orderBy: { stock: 'asc' },
    });

    const stock = formatos.map((f) => ({
      id: f.id,
      productoId: f.productoId,
      producto: f.producto?.nombre || '—',
      sku: f.producto?.sku || '—',
      categoria: f.producto?.categoria || '—',
      formato: f.formato,
      unidadMedida: f.unidadMedida,
      precio: f.precio,
      stock: f.stock,
      minStock: f.minStock,
      nivel: f.stock <= 0 ? 'agotado' : (f.stock <= f.minStock ? 'bajo' : 'ok'),
    }));

    res.json({ success: true, count: stock.length, stock });
  } catch (error: any) {
    logger.error('[Admin WMS] stock error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/wms/dashboard — KPIs operativos agregados
router.get('/dashboard', authenticate, async (_req: Request, res: Response) => {
  try {
    const [pedidosTotal, pedidosPendientesFacturar, leadsPendientes, clientesActivos, formatos, billingPendiente] =
      await Promise.all([
        prisma.whatsAppOrder.count(),
        prisma.billingQueue.count({ where: { status: { in: ['pendiente', 'error'] } } }),
        prisma.lead.count({ where: { status: 'pendiente' } }),
        prisma.cliente.count({ where: { estado: 'activo' } }),
        prisma.productoFormato.findMany(),
        prisma.billingQueue.aggregate({ where: { status: { in: ['pendiente', 'error'] } }, _sum: { totalAmount: true } }),
      ]);

    const stockBajo = formatos.filter((f) => f.stock <= f.minStock).length;

    res.json({
      success: true,
      kpis: {
        pedidosTotal,
        pedidosPendientesFacturar,
        montoPorFacturar: billingPendiente._sum.totalAmount || 0,
        leadsPendientes,
        clientesActivos,
        stockBajo,
        productosTotal: formatos.length,
      },
    });
  } catch (error: any) {
    logger.error('[Admin WMS] dashboard error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
