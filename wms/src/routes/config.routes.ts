import { Router, Request, Response, NextFunction } from 'express';
import { ConfigService } from '../services/config.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
router.use(authenticate);

// === Business Rules ===
router.get('/business-rules', requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.getBusinessRules()); } catch (err) { next(err); }
});

router.put('/business-rules/:key', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.updateBusinessRule(req.params.key, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

// === Coverage Zones ===
router.get('/coverage-zones', requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.getCoverageZones()); } catch (err) { next(err); }
});

router.put('/coverage-zones/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.updateCoverageZone(req.params.id, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

// === Users ===
router.get('/users', requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.getUsers()); } catch (err) { next(err); }
});

router.post('/users', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.createUser(req.body, (req as any).user.email)); } catch (err) { next(err); }
});

router.put('/users/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.updateUser(req.params.id, req.body, (req as any).user.email)); } catch (err) { next(err); }
});

router.delete('/users/:id', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.deactivateUser(req.params.id, (req as any).user.email)); } catch (err) { next(err); }
});

// === Integrations ===
router.get('/integrations', requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await ConfigService.getIntegrationsStatus()); } catch (err) { next(err); }
});

export default router;
