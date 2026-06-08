import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrdersService } from '../services/orders.service';
import { EvidenceService } from '../services/evidence.service';
import { WhatsAppOrdersService } from '../services/whatsappOrders.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { paginationSchema } from '../utils/pagination';

const router = Router();

// =====================================================
// Endpoints WhatsApp Bot (sin autenticación JWT)
// =====================================================

// POST /whatsapp/create — Crear orden desde WhatsApp Bot
router.post('/whatsapp/create', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await WhatsAppOrdersService.createOrder({
            clientPhone: req.body.clientPhone,
            clientName: req.body.clientName,
            productId: req.body.productId,
            productName: req.body.productName,
            quantity: req.body.quantity,
            unitOfMeasure: req.body.unitOfMeasure,
            deliveryType: req.body.deliveryType,
            address: req.body.address,
            city: req.body.city,
            reference: req.body.reference,
            paymentMethod: req.body.paymentMethod,
            unitPrice: req.body.unitPrice,
        });

        res.status(result.success ? 201 : 400).json(result);
    } catch (err) {
        next(err);
    }
});

// GET /whatsapp/:phone — Obtener órdenes de un cliente
router.get('/whatsapp/:phone', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await WhatsAppOrdersService.getOrdersByPhone(req.params.phone);
        res.json(orders);
    } catch (err) {
        next(err);
    }
});

// GET /whatsapp — Listar todas las órdenes WhatsApp (con autenticación)
router.get('/whatsapp', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await WhatsAppOrdersService.listOrders({
            status: req.query.status as string | undefined,
            clientPhone: req.query.clientPhone as string | undefined,
        });
        res.json({ orders, total: orders.length });
    } catch (err) {
        next(err);
    }
});

// =====================================================
// Endpoints Originales
// =====================================================

// POST /:id/tracking-link — API key auth para integración CRM sin JWT
router.post('/:id/tracking-link', async (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-api-key'] !== 'whaka-internal-2026') {
        res.status(401).json({ error: 'API key inválida' });
        return;
    }
    try {
        res.json(await EvidenceService.generateEvidenceToken(req.params.id, 'sistema_crm'));
    } catch (err) { next(err); }
});

router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        res.json(await OrdersService.list({
            status: req.query.status as string | undefined,
            client: req.query.client as string | undefined,
            canal: req.query.canal as string | undefined,
            page, limit,
        }));
    } catch (err) { next(err); }
});

router.get('/pipeline', async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await OrdersService.getPipeline()); } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await OrdersService.getById(req.params.id)); } catch (err) { next(err); }
});

const manualOrderSchema = z.object({
    clientId: z.string(),
    items: z.array(z.object({ sku: z.string(), quantity: z.number(), price: z.number() })),
    fechaDespacho: z.string(),
    notas: z.string().optional(),
});

router.post('/manual', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = manualOrderSchema.parse(req.body);
        res.json(await OrdersService.createManual(data, (req as any).user.email));
    } catch (err) { next(err); }
});

router.post('/:id/advance', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { action, data } = z.object({ action: z.string(), data: z.any().optional() }).parse(req.body);
        res.json(await OrdersService.advance(req.params.id, action, data, (req as any).user.email));
    } catch (err) { next(err); }
});

router.post('/:id/incident', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await OrdersService.reportIncident(req.params.id, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

router.post('/:id/resolve-incident', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await OrdersService.resolveIncident(req.params.id, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

// Evidence endpoints
router.get('/:id/evidence', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await EvidenceService.getEvidenceByOrder(req.params.id));
    } catch (err) { next(err); }
});

router.post('/:id/evidence-token', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await EvidenceService.generateEvidenceToken(req.params.id, (req as any).user.email));
    } catch (err) { next(err); }
});

export default router;
