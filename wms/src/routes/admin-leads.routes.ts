import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { LeadWhatsAppService } from '../services/leadWhatsApp.service';
import { ClientsWhatsAppService } from '../services/clientsWhatsApp.service';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import { dispatchLeadApproval, dispatchLeadRejection } from '../queues/jobOrchestrator';

const router = Router();

// GET /api/admin/leads/pendientes
router.get('/pendientes', authenticate, async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        status: 'pendiente',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: any) {
    logger.error('[Admin Leads] Error getting pending leads:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/admin/leads  — lista TODOS los leads (filtro opcional ?status=)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where = status ? { status: String(status) } : {};

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: any) {
    logger.error('[Admin Leads] Error listing leads:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/admin/leads/:leadId/approve
router.post('/:leadId/approve', authenticate, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { userId } = req.body;

    // Aprobar lead
    const approveResult = await LeadWhatsAppService.approveLead(
      leadId,
      userId || 'admin',
    );

    if (!approveResult.success) {
      return res.status(400).json(approveResult);
    }

    // Crear cliente automáticamente
    const clientResult = await ClientsWhatsAppService.createFromLead(leadId);

    if (!clientResult.success) {
      logger.warn(`[Admin Leads] Failed to create client from lead ${leadId}`);
    }

    // Notificar al cliente
    await LeadWhatsAppService.notifyLeadStatusChange(leadId, 'aprobado');

    // Disparar job de aprobación en segundo plano (fire-and-forget):
    // no bloquea la respuesta HTTP aunque Redis/BullMQ no esté disponible.
    dispatchLeadApproval(leadId, userId || 'admin').catch((jobError: any) =>
      logger.warn(`[Admin Leads] Error disparando job de aprobación:`, jobError.message)
    );

    res.json({
      success: true,
      lead: approveResult.lead,
      cliente: clientResult.cliente,
      message: 'Lead aprobado y cliente creado',
    });
  } catch (error: any) {
    logger.error('[Admin Leads] Error approving lead:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/admin/leads/:leadId/reject
router.post('/:leadId/reject', authenticate, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { userId, reason } = req.body;

    const result = await LeadWhatsAppService.rejectLead(
      leadId,
      userId || 'admin',
      reason,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Notificar al cliente
    await LeadWhatsAppService.notifyLeadStatusChange(leadId, 'rechazado');

    // Disparar job de rechazo en segundo plano (fire-and-forget):
    // no bloquea la respuesta HTTP aunque Redis/BullMQ no esté disponible.
    dispatchLeadRejection(leadId, userId || 'admin', reason).catch((jobError: any) =>
      logger.warn(`[Admin Leads] Error disparando job de rechazo:`, jobError.message)
    );

    res.json({
      success: true,
      lead: result.lead,
      message: 'Lead rechazado',
    });
  } catch (error: any) {
    logger.error('[Admin Leads] Error rejecting lead:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/admin/leads/:leadId
router.get('/:leadId', authenticate, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado',
      });
    }

    res.json({
      success: true,
      lead,
    });
  } catch (error: any) {
    logger.error('[Admin Leads] Error getting lead:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PATCH /api/admin/leads/:leadId/note
router.patch('/:leadId/note', authenticate, async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { note } = req.body;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        adminNotes: note,
      },
    });

    res.json({
      success: true,
      lead,
    });
  } catch (error: any) {
    logger.error('[Admin Leads] Error updating note:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
