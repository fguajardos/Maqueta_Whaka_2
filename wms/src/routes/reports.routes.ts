import { Router, Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
router.use(authenticate, requireRole('admin', 'ejecutivo_comercial'));

router.get('/sales', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ReportsService.getSalesReport(req.query.period as string | undefined || '30d', req.query)); } catch (err) { next(err); }
});

router.get('/clients', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ReportsService.getClientsReport(req.query.period as string | undefined || '30d')); } catch (err) { next(err); }
});

router.get('/operations', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ReportsService.getOperationsReport(req.query.period as string | undefined || '30d')); } catch (err) { next(err); }
});

router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ReportsService.getProductsReport(req.query.period as string | undefined || '30d')); } catch (err) { next(err); }
});

router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as string | undefined || 'sales';
        const format = req.query.format as string | undefined || 'xlsx';
        res.json(await ReportsService.exportReport(type, format));
    } catch (err) { next(err); }
});

export default router;
