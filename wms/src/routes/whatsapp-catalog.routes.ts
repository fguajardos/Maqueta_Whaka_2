import { Router, Request, Response } from 'express';
import { WhatsAppCatalogService } from '../services/whatsappCatalog.service';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/whatsapp/catalog/productos
router.get('/productos', async (req: Request, res: Response) => {
  try {
    const { activos, categoria } = req.query;

    const result = await WhatsAppCatalogService.getCatalogo({
      activos: activos === 'false' ? false : true,
      categoria: categoria as string,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('[WhatsApp Catalog] Error getting catalogo:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/whatsapp/catalog/visual — galería de productos (con imagen/descripción)
router.get('/visual', async (_req: Request, res: Response) => {
  try {
    const result = await WhatsAppCatalogService.getCatalogoVisual();
    res.json(result);
  } catch (error: any) {
    logger.error('[WhatsApp Catalog] Error getting visual catalog:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/whatsapp/catalog/producto/:productoId/formatos
router.get('/producto/:productoId/formatos', async (req: Request, res: Response) => {
  try {
    const { productoId } = req.params;

    const result = await WhatsAppCatalogService.getProductoFormatos(productoId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error: any) {
    logger.error('[WhatsApp Catalog] Error getting formatos:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/whatsapp/catalog/validate-stock
router.post('/validate-stock', async (req: Request, res: Response) => {
  try {
    const { productoFormatoId, quantity } = req.body;

    if (!productoFormatoId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'productoFormatoId y quantity son requeridos',
      });
    }

    const isValid = await WhatsAppCatalogService.validateStock(
      productoFormatoId,
      quantity,
    );

    res.json({
      success: true,
      isValid,
    });
  } catch (error: any) {
    logger.error('[WhatsApp Catalog] Error validating stock:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/whatsapp/catalog/search
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" es requerido',
      });
    }

    const result = await WhatsAppCatalogService.searchProducto(q as string);

    res.json(result);
  } catch (error: any) {
    logger.error('[WhatsApp Catalog] Error searching:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
