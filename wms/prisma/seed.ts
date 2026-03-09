import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // =============================================
    // Usuarios del sistema (4 roles)
    // =============================================
    const passwordHash = await bcrypt.hash('Admin123!', 12);

    const users = [
        { email: 'admin@whakachile.cl', nombre: 'Carlos Administrador', role: 'admin' as const, passwordHash },
        { email: 'ejecutivo@whakachile.cl', nombre: 'María Ejecutiva', role: 'ejecutivo_comercial' as const, passwordHash },
        { email: 'bodega@whakachile.cl', nombre: 'Juan Bodeguero', role: 'operario_bodega' as const, passwordHash },
        { email: 'repartidor@whakachile.cl', nombre: 'Pedro Repartidor', role: 'repartidor' as const, passwordHash },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: user,
        });
    }
    console.log('✅ Users seeded');

    // =============================================
    // Reglas de negocio
    // =============================================
    const rules = [
        {
            ruleKey: 'pedido_minimo_clp',
            ruleValue: { value: 50000, currency: 'CLP' },
            description: 'Monto mínimo de pedido en pesos chilenos',
        },
        {
            ruleKey: 'horario_inicio',
            ruleValue: { hora: '08:00', timezone: 'America/Santiago' },
            description: 'Hora de inicio de operaciones',
        },
        {
            ruleKey: 'horario_fin',
            ruleValue: { hora: '18:00', timezone: 'America/Santiago' },
            description: 'Hora de fin de operaciones',
        },
        {
            ruleKey: 'stock_sync_interval_min',
            ruleValue: { value: 15 },
            description: 'Intervalo de sincronización de stock BSale-Shopify en minutos',
        },
        {
            ruleKey: 'circuit_breaker_threshold',
            ruleValue: { value: 5 },
            description: 'Número de fallos consecutivos antes de abrir circuit breaker',
        },
        {
            ruleKey: 'circuit_breaker_timeout_ms',
            ruleValue: { value: 60000 },
            description: 'Tiempo que permanece abierto el circuit breaker en ms',
        },
        {
            ruleKey: 'retry_max_attempts',
            ruleValue: { value: 3 },
            description: 'Número máximo de reintentos para operaciones críticas',
        },
        {
            ruleKey: 'stock_alerta_umbral',
            ruleValue: { value: 10 },
            description: 'Umbral de stock mínimo para generar alerta',
        },
        {
            ruleKey: 'zonas_cobertura_activas',
            ruleValue: {
                zonas: [
                    { id: 'santiago-centro', nombre: 'Santiago Centro', comunas: ['Santiago', 'Providencia', 'Ñuñoa', 'Las Condes', 'Vitacura'], activa: true },
                    { id: 'santiago-sur', nombre: 'Santiago Sur', comunas: ['San Bernardo', 'Puente Alto', 'La Florida', 'Maipú'], activa: true },
                    { id: 'santiago-norte', nombre: 'Santiago Norte', comunas: ['Quilicura', 'Huechuraba', 'Conchalí', 'Recoleta'], activa: true },
                    { id: 'valparaiso', nombre: 'Valparaíso', comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué'], activa: false },
                ],
            },
            description: 'Zonas de cobertura para despacho, con comunas asociadas',
        },
        {
            ruleKey: 'condiciones_pago_disponibles',
            ruleValue: {
                opciones: [
                    { key: 'prepago', label: 'Prepago', dias: 0 },
                    { key: 'credito_7', label: 'Crédito 7 días', dias: 7 },
                    { key: 'credito_15', label: 'Crédito 15 días', dias: 15 },
                    { key: 'credito_30', label: 'Crédito 30 días', dias: 30 },
                ],
            },
            description: 'Condiciones de pago disponibles para clientes',
        },
    ];

    for (const rule of rules) {
        await prisma.businessRule.upsert({
            where: { ruleKey: rule.ruleKey },
            update: {},
            create: {
                ...rule,
                isActive: true,
                updatedBy: 'system_seed',
            },
        });
    }
    console.log('✅ Business rules seeded');

    // =============================================
    // Productos mock (IdMappings)
    // =============================================
    const productMappings = [
        { internalId: 'WHK-PROD-001', shopifyId: 'gid://shopify/Product/100001', bsaleId: 'bsale-prod-001' },
        { internalId: 'WHK-PROD-002', shopifyId: 'gid://shopify/Product/100002', bsaleId: 'bsale-prod-002' },
        { internalId: 'WHK-PROD-003', shopifyId: 'gid://shopify/Product/100003', bsaleId: 'bsale-prod-003' },
        { internalId: 'WHK-PROD-004', shopifyId: 'gid://shopify/Product/100004', bsaleId: 'bsale-prod-004' },
        { internalId: 'WHK-PROD-005', shopifyId: 'gid://shopify/Product/100005', bsaleId: 'bsale-prod-005' },
        { internalId: 'WHK-PROD-006', shopifyId: 'gid://shopify/Product/100006', bsaleId: 'bsale-prod-006' },
        { internalId: 'WHK-PROD-007', shopifyId: 'gid://shopify/Product/100007', bsaleId: 'bsale-prod-007' },
        { internalId: 'WHK-PROD-008', shopifyId: 'gid://shopify/Product/100008', bsaleId: 'bsale-prod-008' },
        { internalId: 'WHK-PROD-009', shopifyId: 'gid://shopify/Product/100009', bsaleId: 'bsale-prod-009' },
        { internalId: 'WHK-PROD-010', shopifyId: 'gid://shopify/Product/100010', bsaleId: 'bsale-prod-010' },
        { internalId: 'WHK-PROD-011', shopifyId: 'gid://shopify/Product/100011', bsaleId: 'bsale-prod-011' },
        { internalId: 'WHK-PROD-012', shopifyId: 'gid://shopify/Product/100012', bsaleId: 'bsale-prod-012' },
    ];

    for (const mapping of productMappings) {
        await prisma.idMapping.upsert({
            where: {
                entityType_internalId: {
                    entityType: 'producto',
                    internalId: mapping.internalId,
                },
            },
            update: {},
            create: {
                entityType: 'producto',
                ...mapping,
            },
        });
    }
    console.log('✅ Product mappings seeded');

    // =============================================
    // Pedidos de prueba (con items para stock)
    // =============================================
    const testOrders = [
        {
            entityId: 'WHK-PED-DEMO-001',
            currentStep: 'despachado',
            status: 'in_progress' as const,
            stepsLog: [
                { step: 'creado', source: 'manual', timestamp: new Date().toISOString(), items: [{ sku: 'WHK-IPA-330', quantity: 6 }, { sku: 'WHK-STT-330', quantity: 4 }] },
                { from: 'recibido', to: 'validado', action: 'validate', timestamp: new Date().toISOString() },
                { from: 'validado', to: 'en_preparacion', action: 'send_to_warehouse', timestamp: new Date().toISOString() },
                { from: 'en_preparacion', to: 'listo_bodega', action: 'confirm_picking', timestamp: new Date().toISOString() },
                { from: 'listo_bodega', to: 'facturado', action: 'generate_invoice', timestamp: new Date().toISOString() },
                { from: 'facturado', to: 'despachado', action: 'dispatch', timestamp: new Date().toISOString() },
            ],
        },
        {
            entityId: 'WHK-PED-DEMO-002',
            currentStep: 'despachado',
            status: 'in_progress' as const,
            stepsLog: [
                { step: 'creado', source: 'manual', timestamp: new Date().toISOString(), items: [{ sku: 'WHK-AMB-330', quantity: 3 }, { sku: 'WHK-GLD-330', quantity: 12 }] },
                { from: 'recibido', to: 'validado', action: 'validate', timestamp: new Date().toISOString() },
                { from: 'validado', to: 'en_preparacion', action: 'send_to_warehouse', timestamp: new Date().toISOString() },
                { from: 'en_preparacion', to: 'listo_bodega', action: 'confirm_picking', timestamp: new Date().toISOString() },
                { from: 'listo_bodega', to: 'facturado', action: 'generate_invoice', timestamp: new Date().toISOString() },
                { from: 'facturado', to: 'despachado', action: 'dispatch', timestamp: new Date().toISOString() },
            ],
        },
        {
            entityId: 'WHK-PED-DEMO-003',
            currentStep: 'en_preparacion',
            status: 'in_progress' as const,
            stepsLog: [
                { step: 'creado', source: 'shopify', timestamp: new Date().toISOString(), items: [{ sku: 'WHK-RED-330', quantity: 2 }, { sku: 'WHK-SAI-500', quantity: 3 }] },
                { from: 'recibido', to: 'validado', action: 'validate', timestamp: new Date().toISOString() },
                { from: 'validado', to: 'en_preparacion', action: 'send_to_warehouse', timestamp: new Date().toISOString() },
            ],
        },
        {
            entityId: 'WHK-PED-DEMO-004',
            currentStep: 'validado',
            status: 'in_progress' as const,
            stepsLog: [
                { step: 'creado', source: 'shopify', timestamp: new Date().toISOString(), items: [{ sku: 'WHK-BLG-500', quantity: 5 }, { sku: 'WHK-WHT-330', quantity: 8 }] },
                { from: 'recibido', to: 'validado', action: 'validate', timestamp: new Date().toISOString() },
            ],
        },
    ];

    for (const order of testOrders) {
        const existing = await prisma.processState.findFirst({ where: { entityId: order.entityId } });
        if (!existing) {
            await prisma.processState.create({
                data: {
                    processType: 'pedido_completo',
                    ...order,
                },
            });
        }
    }
    console.log('✅ Test orders seeded');

    // =============================================
    // Rutas de despacho con pedidos asignados
    // =============================================
    const testRoutes = [
        {
            entityId: 'WHK-RUT-DEMO-001',
            currentStep: 'en_ruta',
            status: 'in_progress' as const,
            stepsLog: [{
                step: 'ruta_creada',
                fecha: new Date().toISOString().split('T')[0],
                zona: 'santiago-centro',
                pedidos: ['WHK-PED-DEMO-001', 'WHK-PED-DEMO-002'],
                vehiculo: 'Furgón WHK-01',
                repartidorId: 'repartidor@whakachile.cl',
                timestamp: new Date().toISOString(),
            }],
        },
    ];

    for (const route of testRoutes) {
        const existing = await prisma.processState.findFirst({ where: { entityId: route.entityId } });
        if (!existing) {
            await prisma.processState.create({
                data: {
                    processType: 'despacho',
                    ...route,
                },
            });
        }
    }
    console.log('✅ Test routes seeded');

    console.log('🌱 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
