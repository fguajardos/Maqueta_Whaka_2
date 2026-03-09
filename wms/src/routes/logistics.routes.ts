import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { LogisticsService } from '../services/logistics.service';
import { EvidenceService } from '../services/evidence.service';
import { authenticate } from '../middleware/auth';

// Multer config para foto de entrega
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'evidence');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `delivery-${suffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        cb(null, allowed.includes(file.mimetype));
    },
});

const router = Router();
router.use(authenticate);

router.get('/available-orders', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await LogisticsService.getAvailableOrders(req.query.fecha as string | undefined, req.query.zona as string | undefined));
    } catch (err) { next(err); }
});

router.post('/routes', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await LogisticsService.createRoute(req.body, (req as any).user.email)); } catch (err) { next(err); }
});

router.get('/routes', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await LogisticsService.listRoutes(req.query.fecha as string | undefined)); } catch (err) { next(err); }
});

router.get('/routes/:id', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await LogisticsService.getRoute(req.params.id)); } catch (err) { next(err); }
});

router.post('/routes/:routeId/orders/:orderId/deliver', upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = {
            ...req.body,
            foto: req.file ? `/uploads/evidence/${req.file.filename}` : undefined,
        };
        res.json(await LogisticsService.deliverOrder(req.params.routeId, req.params.orderId, body, (req as any).user.email));
    } catch (err) { next(err); }
});

router.post('/routes/:routeId/orders/:orderId/incident', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await LogisticsService.reportDeliveryIncident(req.params.routeId, req.params.orderId, req.body, (req as any).user.email));
    } catch (err) { next(err); }
});

router.get('/routes/:routeId/orders/:orderId/evidence', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await EvidenceService.getEvidenceByOrder(req.params.orderId));
    } catch (err) { next(err); }
});

export default router;
