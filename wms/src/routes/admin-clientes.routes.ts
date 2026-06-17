import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/admin/clientes — lista clientes (incluye los creados al aprobar leads del bot)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, estado } = req.query;
    const where: any = {};
    if (estado) where.estado = String(estado);
    if (search) {
      where.OR = [
        { razonSocial: { contains: String(search), mode: 'insensitive' } },
        { rut: { contains: String(search) } },
        { contactName: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: clientes.length, clientes });
  } catch (error: any) {
    logger.error('[Admin Clientes] Error listing clientes:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/clientes/:id — ficha de un cliente
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: req.params.id } });
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }
    res.json({ success: true, cliente });
  } catch (error: any) {
    logger.error('[Admin Clientes] Error getting cliente:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
