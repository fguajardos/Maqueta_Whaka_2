import { Router, Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalog.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { paginationSchema } from '../utils/pagination';

const router = Router();
router.use(authenticate);

router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        res.json(await CatalogService.listProducts({
            categoria: req.query.categoria as string | undefined,
            activo: req.query.activo as string | undefined,
            search: req.query.search as string | undefined,
            page, limit,
        }));
    } catch (err) { next(err); }
});

router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await CatalogService.getProduct(req.params.id)); } catch (err) { next(err); }
});

router.put('/products/:id', requireRole('admin', 'ejecutivo_comercial'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await CatalogService.updateProduct(req.params.id, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

router.post('/products/:id/toggle-active', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await CatalogService.toggleActive(req.params.id, (req as any).user.email)); } catch (err) { next(err); }
});

router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await CatalogService.getCategories()); } catch (err) { next(err); }
});

router.get('/price-lists', async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await CatalogService.getPriceLists()); } catch (err) { next(err); }
});

export default router;
