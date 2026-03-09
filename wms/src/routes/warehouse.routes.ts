import { Router, Request, Response, NextFunction } from 'express';
import { WarehouseService } from '../services/warehouse.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
router.use(authenticate, requireRole('admin', 'ejecutivo_comercial', 'operario_bodega'));

router.get('/picking', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await WarehouseService.getPickingOrders(req.query.status as string | undefined)); } catch (err) { next(err); }
});

router.post('/picking/:orderId/start', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await WarehouseService.startPicking(req.params.orderId, (req as any).user.email)); } catch (err) { next(err); }
});

router.post('/picking/:orderId/complete', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const itemsChecked = req.body.items_checked || [];
        res.json(await WarehouseService.completePicking(req.params.orderId, itemsChecked, (req as any).user.email));
    } catch (err) { next(err); }
});

router.post('/picking/:orderId/shortage', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await WarehouseService.reportShortage(req.params.orderId, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

export default router;
