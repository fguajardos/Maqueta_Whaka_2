import { Router, Request, Response } from 'express';
import { LeadWhatsAppService } from '../services/leadWhatsApp.service';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/whatsapp/leads/validate-rut
router.post('/validate-rut', async (req: Request, res: Response) => {
  try {
    const { rut } = req.body;

    if (!rut) {
      return res.status(400).json({
        success: false,
        error: 'RUT es requerido',
      });
    }

    const result = await LeadWhatsAppService.validateRut(rut);

    res.json(result);
  } catch (error: any) {
    logger.error('[WhatsApp Leads] Error validating RUT:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/whatsapp/leads/create
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { rut, razonSocial, tipoNegocio, tipoCliente, phone, email, contactName, direccion, comuna, region } =
      req.body;

    if (!rut || !razonSocial || !tipoNegocio || !tipoCliente) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: rut, razonSocial, tipoNegocio, tipoCliente',
      });
    }

    const result = await LeadWhatsAppService.createLead({
      rut,
      razonSocial,
      tipoNegocio,
      tipoCliente,
      phone,
      email,
      contactName,
      direccion,
      comuna,
      region,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('[WhatsApp Leads] Error creating lead:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/whatsapp/leads/:leadId/status
// Polling endpoint para que el bot consulte el estado del lead
router.get('/:leadId/status', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;

    const result = await LeadWhatsAppService.getLeadStatus(leadId);

    res.json(result);
  } catch (error: any) {
    logger.error('[WhatsApp Leads] Error getting lead status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
