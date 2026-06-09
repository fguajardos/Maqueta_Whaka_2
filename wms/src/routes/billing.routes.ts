import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { billingQueueService } from '../services/billingQueue.service';

const router = Router();

/**
 * GET /api/billing/pending
 * Obtener pedidos pendientes de facturación
 * Admin only
 */
router.get('/pending', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, clientPhone } = req.query;

    const result = await billingQueueService.getPendingBillings({
      status: status as string,
      clientPhone: clientPhone as string,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      count: result.count,
      data: result.data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/billing/stats
 * Obtener estadísticas de facturación
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await billingQueueService.getBillingStats();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/billing/:id
 * Obtener detalle de un pedido por facturar
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await billingQueueService.getBillingById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/billing/client/:phone
 * Obtener pedidos por facturar de un cliente específico
 */
router.get(
  '/client/:phone',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { phone } = req.params;

      const result = await billingQueueService.getClientBillings(phone);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * PATCH /api/billing/:id/invoice
 * Marcar pedido como facturado
 * Body: { bsaleDocumentId?, bsaleDocumentNumber? }
 */
router.patch(
  '/:id/invoice',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { bsaleDocumentId, bsaleDocumentNumber } = req.body;

      const result = await billingQueueService.markAsInvoiced(
        id,
        bsaleDocumentId,
        bsaleDocumentNumber,
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * PATCH /api/billing/:id/error
 * Marcar pedido como error de facturación
 * Body: { errorMessage: string }
 */
router.patch('/:id/error', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { errorMessage } = req.body;

    if (!errorMessage) {
      return res.status(400).json({
        success: false,
        error: 'errorMessage es requerido',
      });
    }

    const result = await billingQueueService.markAsError(id, errorMessage);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/billing/:id/note
 * Agregar nota administrativa
 * Body: { note: string }
 */
router.patch('/:id/note', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'note es requerido',
      });
    }

    const result = await billingQueueService.addNote(id, note);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/billing/export/csv
 * Exportar cola de facturación a CSV
 * Query: ?status=pendiente (opcional)
 */
router.get(
  '/export/csv',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.query;

      const result = await billingQueueService.exportToCsv(status as string);

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Devolver CSV como descarga
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="billing-queue.csv"',
      );
      res.send(result.csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

export default router;
