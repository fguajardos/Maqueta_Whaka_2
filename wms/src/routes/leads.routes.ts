import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LeadsService } from '../services/leads.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { paginationSchema } from '../utils/pagination';

const router = Router();
router.use(authenticate);

// GET /api/leads
router.get('/', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const result = await LeadsService.list({
            status: req.query.status as string | undefined,
            search: req.query.search as string | undefined,
            page, limit,
        });
        res.json(result);
    } catch (err) { next(err); }
});

// GET /api/leads/:id
router.get('/:id', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await LeadsService.getById(req.params.id)); } catch (err) { next(err); }
});

// POST /api/leads/:id/approve
const approveSchema = z.object({
    listaPreciosId: z.string(),
    condicionPago: z.string(),
    limiteCredito: z.number(),
    pedidoMinimo: z.number(),
});

router.post('/:id/approve', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = approveSchema.parse(req.body);
        const result = await LeadsService.approve(req.params.id, data, (req as any).user.email);
        res.json(result);
    } catch (err) { next(err); }
});

// POST /api/leads/:id/reject
router.post('/:id/reject', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { motivo } = z.object({ motivo: z.string() }).parse(req.body);
        res.json(await LeadsService.reject(req.params.id, motivo, (req as any).user.email));
    } catch (err) { next(err); }
});

// POST /api/leads/:id/observe
router.post('/:id/observe', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { observacion } = z.object({ observacion: z.string() }).parse(req.body);
        res.json(await LeadsService.observe(req.params.id, observacion, (req as any).user.email));
    } catch (err) { next(err); }
});

// PUT /api/leads/:id
router.put('/:id', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await LeadsService.update(req.params.id, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

// POST /api/leads/:id/notes
router.post('/:id/notes', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { texto } = z.object({ texto: z.string() }).parse(req.body);
        res.json(await LeadsService.addNote(req.params.id, texto, (req as any).user.email));
    } catch (err) { next(err); }
});

export default router;
