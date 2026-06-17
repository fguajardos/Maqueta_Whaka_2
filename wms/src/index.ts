import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import prisma from './config/database';

// Routes
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import leadsRoutes from './routes/leads.routes';
import clientsRoutes from './routes/clients.routes';
import ordersRoutes from './routes/orders.routes';
import warehouseRoutes from './routes/warehouse.routes';
import logisticsRoutes from './routes/logistics.routes';
import catalogRoutes from './routes/catalog.routes';
import reportsRoutes from './routes/reports.routes';
import configRoutes from './routes/config.routes';
import webhooksRoutes from './routes/webhooks.routes';
import processesRoutes from './routes/processes.routes';
import auditRoutes from './routes/audit.routes';
import evidenceRoutes from './routes/evidence.routes';
import billingRoutes from './routes/billing.routes';
import whatsappLeadsRoutes from './routes/whatsapp-leads.routes';
import whatsappCatalogRoutes from './routes/whatsapp-catalog.routes';
import whatsappOrdersRoutes from './routes/whatsapp-orders.routes';
import adminLeadsRoutes from './routes/admin-leads.routes';
import adminClientesRoutes from './routes/admin-clientes.routes';
import adminWmsRoutes from './routes/admin-wms.routes';

// Queues & Scheduler
import { startScheduler } from './queues/scheduler';
import { initializeJobOrchestrator } from './queues/jobOrchestrator';
import leadApprovalWorker from './queues/workers/leadApproval.worker';
import leadRejectionWorker from './queues/workers/leadRejection.worker';
import leadExpirationWorker from './queues/workers/leadExpiration.worker';

const app = express();

// ==========================================
// Middleware Global
// ==========================================
app.use(helmet({
    contentSecurityPolicy: false, // Permitir inline scripts del panel admin
    crossOriginEmbedderPolicy: false,
    frameguard: false, // Permitir iframe desde el CRM
}));
app.use(cors());

// Servir archivos estáticos del panel admin
app.use(express.static(path.join(__dirname, '..', 'public')));

// Servir archivos de evidencia (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Redirigir /admin al panel
app.get('/admin', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Para validación HMAC de webhooks necesitamos el raw body
app.use('/webhooks', express.json({
    verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
    },
}));

// JSON parser para el resto de rutas
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Health Check (spec: tabla 32)
// ==========================================
app.get('/health', async (_req, res) => {
    const checks: Record<string, any> = {};

    // Database check
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = { status: 'ok' };
    } catch (err: any) {
        checks.database = { status: 'error', message: err.message };
    }

    // Integration checks (non-blocking)
    const { bsaleClient } = await import('./integrations/bsale/bsale.client');
    const { shopifyClient } = await import('./integrations/shopify/shopify.client');
    const { syncManagerClient } = await import('./integrations/syncmanager/syncmanager.client');

    checks.bsale = { circuitState: bsaleClient.getCircuitState() };
    checks.shopify = { circuitState: shopifyClient.getCircuitState() };
    checks.syncmanager = { circuitState: syncManagerClient.getCircuitState() };

    const allOk = checks.database.status === 'ok';

    res.status(allOk ? 200 : 503).json({
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        checks,
    });
});

// ==========================================
// API Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/processes', processesRoutes);
app.use('/api/audit', auditRoutes);

// Billing Queue (cola de facturación)
app.use('/api/billing', billingRoutes);

// WhatsApp Bot Routes (sin autenticación para MVP)
app.use('/api/whatsapp/leads', whatsappLeadsRoutes);
app.use('/api/whatsapp/catalog', whatsappCatalogRoutes);
app.use('/api/whatsapp/orders', whatsappOrdersRoutes);

// Admin Leads Management (con autenticación)
app.use('/api/admin/leads', adminLeadsRoutes);

// Admin Clientes (con autenticación) — lee prisma.cliente (clientes del flujo WhatsApp)
app.use('/api/admin/clientes', adminClientesRoutes);

// Admin WMS (con autenticación) — stock y dashboard operativo
app.use('/api/admin/wms', adminWmsRoutes);

// Evidence (sin autenticación JWT — acceso público por token)
app.use('/api/evidence', evidenceRoutes);

// Webhooks (sin autenticación JWT — usan sus propios validadores)
app.use('/webhooks', webhooksRoutes);

// ==========================================
// Error Handler
// ==========================================
app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================
async function start() {
    try {
        // Verify database connection
        await prisma.$connect();
        logger.info('✅ Database connected');

        // Sync stock reservations from in-flight orders
        const { StockService } = await import('./services/stock.service');
        await StockService.syncReservationsFromDatabase();

        // Start Express server
        app.listen(env.PORT, () => {
            logger.info(`🚀 Orquestador WhakaChile running on port ${env.PORT}`);
            logger.info(`📋 Environment: ${env.NODE_ENV}`);
            logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
            logger.info(`🔗 API: http://localhost:${env.PORT}/api`);
        });

        // Start scheduler for periodic jobs (async — tests Redis first)
        try {
            await startScheduler();
        } catch (err: any) {
            logger.warn('Scheduler could not start (Redis may not be available):', err.message);
        }

        // Initialize Job Orchestrator (BullMQ workers)
        try {
            await initializeJobOrchestrator();
            logger.info('✅ Job Orchestrator initialized');
        } catch (err: any) {
            logger.warn('Job Orchestrator could not start (Redis may not be available):', err.message);
        }

    } catch (err) {
        logger.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

start();

export default app;
