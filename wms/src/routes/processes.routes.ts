import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { paginationSchema } from '../utils/pagination';

const router = Router();
router.use(authenticate);

// GET /api/processes — list orchestrated process states
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const statusFilter = req.query.status as string | undefined;
        const typeFilter = req.query.type as string | undefined;

        const where: any = {};
        if (statusFilter) where.status = statusFilter;
        if (typeFilter) where.processType = typeFilter;

        const [data, total] = await Promise.all([
            prisma.processState.findMany({
                where,
                orderBy: { startedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.processState.count({ where }),
        ]);

        res.json({ data, total, page, limit });
    } catch (err) { next(err); }
});

export default router;
