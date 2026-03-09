import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/kpis', async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await DashboardService.getKpis()); } catch (err) { next(err); }
});

router.get('/charts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const period = (req.query.period as string | undefined | undefined) || '7d';
        res.json(await DashboardService.getCharts(period));
    } catch (err) { next(err); }
});

router.get('/alerts', async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await DashboardService.getAlerts()); } catch (err) { next(err); }
});

router.get('/recent-leads', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 5;
        res.json(await DashboardService.getRecentLeads(limit));
    } catch (err) { next(err); }
});

export default router;
