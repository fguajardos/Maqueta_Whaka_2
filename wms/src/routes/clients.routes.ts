import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ClientsService } from '../services/clients.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { paginationSchema } from '../utils/pagination';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        res.json(await ClientsService.list({ estado: req.query.estado as string | undefined, search: req.query.search as string | undefined, page, limit }));
    } catch (err) { next(err); }
});

router.get('/:id', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ClientsService.getById(req.params.id)); } catch (err) { next(err); }
});

router.get('/:id/orders', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        res.json(await ClientsService.getOrders(req.params.id, page, limit));
    } catch (err) { next(err); }
});

router.get('/:id/metrics', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const period = (req.query.period as string | undefined | undefined) || '30d';
        res.json(await ClientsService.getMetrics(req.params.id, period));
    } catch (err) { next(err); }
});

router.put('/:id/commercial-config', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ClientsService.updateCommercialConfig(req.params.id, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

router.post('/:id/block', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { motivo } = z.object({ motivo: z.string() }).parse(req.body);
        res.json(await ClientsService.block(req.params.id, motivo, (req as any).user.email));
    } catch (err) { next(err); }
});

router.post('/:id/unblock', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ClientsService.unblock(req.params.id, (req as any).user.email)); } catch (err) { next(err); }
});

export default router;
