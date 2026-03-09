import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { paginationSchema } from '../utils/pagination';

const router = Router();
router.use(authenticate, requireRole('admin'));

// GET /api/audit — list audit log records
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                orderBy: { timestamp: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count(),
        ]);

        res.json({ data, total, page, limit });
    } catch (err) { next(err); }
});

export default router;
