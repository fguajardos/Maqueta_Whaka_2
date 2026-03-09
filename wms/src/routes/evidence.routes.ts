import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EvidenceService } from '../services/evidence.service';

const router = Router();

// ==========================================
// Multer config para uploads de evidencia
// ==========================================
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'evidence');

// Crear directorio si no existe
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `evidence-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, HEIC)'));
        }
    },
});

// ==========================================
// Endpoints PÚBLICOS (sin auth) — Portal Cliente
// ==========================================

/**
 * GET /api/evidence/:token
 * Valida token y retorna datos del pedido para tracking.
 */
router.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await EvidenceService.validateToken(req.params.token);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/evidence/:token/confirm
 * Cliente confirma recepción del pedido con foto opcional.
 */
router.post('/:token/confirm', upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await EvidenceService.confirmReception(
            req.params.token,
            req.file,
            {
                receptorNombre: req.body.receptorNombre,
                notas: req.body.notas,
            }
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/evidence/:token/discrepancy
 * Cliente reporta discrepancia en la entrega.
 */
router.post('/:token/discrepancy', upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await EvidenceService.reportDiscrepancy(
            req.params.token,
            {
                type: req.body.type,
                description: req.body.description,
            },
            req.file
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
