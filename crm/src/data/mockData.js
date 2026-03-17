// ============================================================
// MOCK DATA - Datos centralizados para toda la plataforma
// Consistencia garantizada entre módulos y apps
// ============================================================

// --- PRODUCTOS ---
export const PRODUCTOS = [
    { id: 'PRD-001', sku: 'ACAI-500', nombre: 'Acaí Orgánico 500ml', categoria: 'pulpa_acai', formato: '500ml', precioUnitario: 3200, stockDisponible: 120, stockReservado: 23, stockMinimo: 20, activo: true, descripcion: 'Pulpa 100% orgánica de açaí brasileño, sin azúcar añadida.', infoNutricional: { calorias: '70 kcal', grasas: '5g', carbos: '4g', fibra: '3g', azucar: '0g' }, requiereMaquina: false, temperaturaBodega: '-18°C' },
    { id: 'PRD-002', sku: 'ACAI-1500', nombre: 'Acaí Orgánico 1.5L', categoria: 'pulpa_acai', formato: '1.5L', precioUnitario: 8900, stockDisponible: 85, stockReservado: 14, stockMinimo: 15, activo: true, descripcion: 'Formato familiar de pulpa orgánica de açaí.', infoNutricional: { calorias: '70 kcal', grasas: '5g', carbos: '4g', fibra: '3g', azucar: '0g' }, requiereMaquina: false, temperaturaBodega: '-18°C' },
    { id: 'PRD-003', sku: 'ACAI-5000-FS', nombre: 'Acaí Orgánico 5L Food Service', categoria: 'food_service', formato: '5L', precioUnitario: 26500, stockDisponible: 42, stockReservado: 8, stockMinimo: 10, activo: true, descripcion: 'Formato profesional para alto volumen gastronómico.', infoNutricional: { calorias: '70 kcal', grasas: '5g', carbos: '4g', fibra: '3g', azucar: '0g' }, requiereMaquina: true, temperaturaBodega: '-18°C' },
    { id: 'PRD-004', sku: 'ACAI-ZERO-1000', nombre: 'Acaí Zero Sin Azúcar 1L', categoria: 'acai_zero', formato: '1L', precioUnitario: 7400, stockDisponible: 67, stockReservado: 5, stockMinimo: 15, activo: true, descripcion: 'Versión sin azúcar, endulzado con stevia natural.', infoNutricional: { calorias: '45 kcal', grasas: '3g', carbos: '2g', fibra: '2g', azucar: '0g' }, requiereMaquina: false, temperaturaBodega: '-18°C' },
    { id: 'PRD-005', sku: 'PAL-MIX-12', nombre: 'Paletas Acaí Mix (caja x12)', categoria: 'vitrina', formato: 'Caja x12 unidades', precioUnitario: 18000, stockDisponible: 34, stockReservado: 6, stockMinimo: 8, activo: true, descripcion: 'Paletas artesanales con mix de frutas tropicales.', infoNutricional: { calorias: '95 kcal', grasas: '3g', carbos: '14g', fibra: '1g', azucar: '8g' }, requiereMaquina: false, temperaturaBodega: '-18°C' },
    { id: 'PRD-006', sku: 'BASE-SB-1000', nombre: 'Base Smoothie Bowl 1kg', categoria: 'complementario', formato: '1kg', precioUnitario: 12300, stockDisponible: 28, stockReservado: 3, stockMinimo: 5, activo: true, descripcion: 'Base concentrada con superfoods.', infoNutricional: { calorias: '120 kcal', grasas: '4g', carbos: '15g', fibra: '6g', azucar: '5g' }, requiereMaquina: false, temperaturaBodega: '-18°C' },
    { id: 'PRD-007', sku: 'ACAI-500-PK10', nombre: 'Acaí Orgánico 500ml Pack x10', categoria: 'pulpa_acai', formato: 'Pack x10 (500ml c/u)', precioUnitario: 28000, stockDisponible: 15, stockReservado: 2, stockMinimo: 5, activo: true, descripcion: 'Pack mayorista. Ahorro del 12.5%.', infoNutricional: { calorias: '70 kcal', grasas: '5g', carbos: '4g', fibra: '3g', azucar: '0g' }, requiereMaquina: false, temperaturaBodega: '-18°C' },
    { id: 'PRD-008', sku: 'PAL-COCO-12', nombre: 'Paletas Acaí Coco (caja x12)', categoria: 'vitrina', formato: 'Caja x12 unidades', precioUnitario: 19500, stockDisponible: 22, stockReservado: 4, stockMinimo: 5, activo: true, descripcion: 'Paletas premium con coco rallado y leche de coco.', infoNutricional: { calorias: '110 kcal', grasas: '6g', carbos: '12g', fibra: '1g', azucar: '9g' }, requiereMaquina: false, temperaturaBodega: '-18°C' },
];

// --- CATEGORIAS ---
export const CATEGORIAS = [
    { key: 'pulpa_acai', label: 'Pulpa de Acaí Orgánico' },
    { key: 'acai_zero', label: 'Acaí Zero Sin Azúcar' },
    { key: 'food_service', label: 'Food Service' },
    { key: 'vitrina', label: 'Paletas para Vitrina' },
    { key: 'complementario', label: 'Complementarios' },
];

// --- CLIENTES ---
export const CLIENTES = [
    { id: 'CLI-001', leadOrigenId: 'LEAD-OLD-001', empresa: 'Green Bowl Providencia', nombreContacto: 'Carlos Méndez', telefono: '+56 9 1234 5678', email: 'carlos@greenbowl.cl', tipoNegocio: 'cafeteria', razonSocial: 'Green Bowl SpA', rut: '76.543.210-K', direccionDespacho: 'Av. Providencia 1020, Local 3', comuna: 'Providencia', region: 'Región Metropolitana', estadoComercial: 'activo', condicionPago: 'credito_30', limiteCredito: 500000, deudaVencida: 0, zonaCobertura: true, listaPreciosId: 'LP-CAFE', pedidoMinimo: 15000, fechaHabilitacion: '2025-08-15T10:30:00', otvPromedio: 245000, frecuenciaCompra: '3x/mes' },
    { id: 'CLI-002', leadOrigenId: 'LEAD-OLD-002', empresa: 'Roots Organic Ñuñoa', nombreContacto: 'Valentina Rojas', telefono: '+56 9 8765 4321', email: 'vale@rootsorganic.cl', tipoNegocio: 'restaurante', razonSocial: 'Roots Organic Ltda.', rut: '77.890.123-4', direccionDespacho: 'Irarrázaval 2580', comuna: 'Ñuñoa', region: 'Región Metropolitana', estadoComercial: 'activo', condicionPago: 'credito_60', limiteCredito: 800000, deudaVencida: 0, zonaCobertura: true, listaPreciosId: 'LP-RESTO', pedidoMinimo: 25000, fechaHabilitacion: '2025-06-20T14:00:00', otvPromedio: 189000, frecuenciaCompra: '2x/mes' },
    { id: 'CLI-003', leadOrigenId: 'LEAD-OLD-003', empresa: 'Bowl & Co Las Condes', nombreContacto: 'Fernando Lagos', telefono: '+56 9 5555 1234', email: 'flago@bowlco.cl', tipoNegocio: 'cafeteria', razonSocial: 'Bowl & Company SpA', rut: '76.111.222-3', direccionDespacho: 'Av. Apoquindo 4500, Local 12', comuna: 'Las Condes', region: 'Región Metropolitana', estadoComercial: 'bloqueado', condicionPago: 'credito_30', limiteCredito: 300000, deudaVencida: 145000, zonaCobertura: true, listaPreciosId: 'LP-CAFE', pedidoMinimo: 15000, fechaHabilitacion: '2025-09-01T09:00:00', otvPromedio: 167000, frecuenciaCompra: '1x/mes' },
    { id: 'CLI-004', leadOrigenId: 'LEAD-OLD-004', empresa: 'NutriFood Dark Kitchen', nombreContacto: 'Andrés Pizarro', telefono: '+56 9 7777 8888', email: 'andres@nutrifood.cl', tipoNegocio: 'dark_kitchen', razonSocial: 'NutriFood SpA', rut: '77.333.444-5', direccionDespacho: 'Calle Industrial 890, Galpón 4', comuna: 'San Miguel', region: 'Región Metropolitana', estadoComercial: 'activo', condicionPago: 'prepago', limiteCredito: 0, deudaVencida: 0, zonaCobertura: true, listaPreciosId: 'LP-DK', pedidoMinimo: 30000, fechaHabilitacion: '2025-10-10T11:30:00', otvPromedio: 312000, frecuenciaCompra: '4x/mes' },
    { id: 'CLI-005', leadOrigenId: 'LEAD-OLD-005', empresa: 'FreshFit Distribuciones', nombreContacto: 'María José Arancibia', telefono: '+56 9 6666 3333', email: 'mj@freshfit.cl', tipoNegocio: 'distribuidor', razonSocial: 'FreshFit Distribuciones Ltda.', rut: '78.555.666-7', direccionDespacho: 'Av. Vicuña Mackenna 8200', comuna: 'La Florida', region: 'Región Metropolitana', estadoComercial: 'activo', condicionPago: 'credito_30', limiteCredito: 1500000, deudaVencida: 0, zonaCobertura: true, listaPreciosId: 'LP-DIST', pedidoMinimo: 50000, fechaHabilitacion: '2025-05-01T08:00:00', otvPromedio: 578000, frecuenciaCompra: '5x/mes' },
    { id: 'CLI-006', leadOrigenId: 'LEAD-OLD-006', empresa: 'Acaí Bar Vitacura', nombreContacto: 'Sofía Herrera', telefono: '+56 9 4444 2222', email: 'sofia@acaibar.cl', tipoNegocio: 'cafeteria', razonSocial: 'Acaí Bar Chile SpA', rut: '76.999.888-1', direccionDespacho: 'Av. Vitacura 3520', comuna: 'Vitacura', region: 'Región Metropolitana', estadoComercial: 'activo', condicionPago: 'credito_60', limiteCredito: 600000, deudaVencida: 0, zonaCobertura: true, listaPreciosId: 'LP-CAFE', pedidoMinimo: 15000, fechaHabilitacion: '2025-07-12T16:00:00', otvPromedio: 198000, frecuenciaCompra: '3x/mes' },
];

// --- PEDIDOS ---
export const PEDIDOS = [
    {
        id: 'WHK-000945', clienteId: 'CLI-001', cliente: 'Green Bowl Providencia', canalOrigen: 'whatsapp', estado: 'entregado',
        items: [
            { productoId: 'PRD-002', nombre: 'Acaí Orgánico 1.5L', formato: '1.5L', cantidad: 10, precioUnit: 8900, subtotal: 89000 },
            { productoId: 'PRD-003', nombre: 'Acaí Orgánico 5L Food Service', formato: '5L', cantidad: 4, precioUnit: 26500, subtotal: 106000 },
            { productoId: 'PRD-005', nombre: 'Paletas Acaí Mix (caja x12)', formato: 'Caja x12', cantidad: 2, precioUnit: 18000, subtotal: 36000 },
        ],
        subtotal: 231000, iva: 43890, total: 274890,
        direccionDespacho: 'Av. Providencia 1020, Local 3', comuna: 'Providencia', region: 'Región Metropolitana',
        fechaPedido: '2026-02-20T09:15:00', fechaDespachoProgramada: '2026-02-21', condicionPago: 'credito_30',
        folioFactura: 'F-20260221-001', rutaDespachoId: 'RUTA-001', notaPedido: 'Entregar en puerta trasera del local',
    },
    {
        id: 'WHK-000946', clienteId: 'CLI-002', cliente: 'Roots Organic Ñuñoa', canalOrigen: 'whatsapp', estado: 'despachado',
        items: [
            { productoId: 'PRD-002', nombre: 'Acaí Orgánico 1.5L', formato: '1.5L', cantidad: 6, precioUnit: 8900, subtotal: 53400 },
            { productoId: 'PRD-005', nombre: 'Paletas Acaí Mix (caja x12)', formato: 'Caja x12', cantidad: 2, precioUnit: 18000, subtotal: 36000 },
        ],
        subtotal: 75126, iva: 14274, total: 89400,
        direccionDespacho: 'Irarrázaval 2580', comuna: 'Ñuñoa', region: 'Región Metropolitana',
        fechaPedido: '2026-02-21T11:30:00', fechaDespachoProgramada: '2026-02-23', condicionPago: 'credito_60',
        folioFactura: 'F-20260222-003', rutaDespachoId: 'RUTA-002', notaPedido: '',
    },
    {
        id: 'WHK-000947', clienteId: 'CLI-004', cliente: 'NutriFood Dark Kitchen', canalOrigen: 'ejecutivo_terreno', estado: 'en_preparacion',
        items: [
            { productoId: 'PRD-003', nombre: 'Acaí Orgánico 5L Food Service', formato: '5L', cantidad: 8, precioUnit: 26500, subtotal: 212000 },
            { productoId: 'PRD-006', nombre: 'Base Smoothie Bowl 1kg', formato: '1kg', cantidad: 5, precioUnit: 12300, subtotal: 61500 },
            { productoId: 'PRD-004', nombre: 'Acaí Zero Sin Azúcar 1L', formato: '1L', cantidad: 4, precioUnit: 7400, subtotal: 29600 },
        ],
        subtotal: 262605, iva: 49895, total: 312500,
        direccionDespacho: 'Calle Industrial 890, Galpón 4', comuna: 'San Miguel', region: 'Región Metropolitana',
        fechaPedido: '2026-02-22T08:00:00', fechaDespachoProgramada: '2026-02-24', condicionPago: 'prepago',
        folioFactura: '', rutaDespachoId: '', notaPedido: 'Coordinar con encargado de recepción',
    },
    {
        id: 'WHK-000948', clienteId: 'CLI-005', cliente: 'FreshFit Distribuciones', canalOrigen: 'manual_backoffice', estado: 'validado',
        items: [
            { productoId: 'PRD-007', nombre: 'Acaí Orgánico 500ml Pack x10', formato: 'Pack x10', cantidad: 12, precioUnit: 28000, subtotal: 336000 },
            { productoId: 'PRD-005', nombre: 'Paletas Acaí Mix (caja x12)', formato: 'Caja x12', cantidad: 8, precioUnit: 18000, subtotal: 144000 },
            { productoId: 'PRD-008', nombre: 'Paletas Acaí Coco (caja x12)', formato: 'Caja x12', cantidad: 4, precioUnit: 19500, subtotal: 78000 },
        ],
        subtotal: 485714, iva: 92286, total: 578000,
        direccionDespacho: 'Av. Vicuña Mackenna 8200', comuna: 'La Florida', region: 'Región Metropolitana',
        fechaPedido: '2026-02-22T14:20:00', fechaDespachoProgramada: '2026-02-25', condicionPago: 'credito_30',
        folioFactura: '', rutaDespachoId: '', notaPedido: 'Pedido mayorista - requiere dos pallets',
    },
    {
        id: 'WHK-000949', clienteId: 'CLI-001', cliente: 'Green Bowl Providencia', canalOrigen: 'whatsapp', estado: 'recibido',
        items: [
            { productoId: 'PRD-001', nombre: 'Acaí Orgánico 500ml', formato: '500ml', cantidad: 20, precioUnit: 3200, subtotal: 64000 },
            { productoId: 'PRD-004', nombre: 'Acaí Zero Sin Azúcar 1L', formato: '1L', cantidad: 4, precioUnit: 7400, subtotal: 29600 },
        ],
        subtotal: 79160, iva: 15040, total: 94200,
        direccionDespacho: 'Av. Providencia 1020, Local 3', comuna: 'Providencia', region: 'Región Metropolitana',
        fechaPedido: '2026-02-23T10:05:00', fechaDespachoProgramada: '2026-02-24', condicionPago: 'credito_30',
        folioFactura: '', rutaDespachoId: '', notaPedido: '',
    },
    {
        id: 'WHK-000950', clienteId: 'CLI-006', cliente: 'Acaí Bar Vitacura', canalOrigen: 'whatsapp', estado: 'listo_bodega',
        items: [
            { productoId: 'PRD-002', nombre: 'Acaí Orgánico 1.5L', formato: '1.5L', cantidad: 8, precioUnit: 8900, subtotal: 71200 },
            { productoId: 'PRD-008', nombre: 'Paletas Acaí Coco (caja x12)', formato: 'Caja x12', cantidad: 3, precioUnit: 19500, subtotal: 58500 },
        ],
        subtotal: 131681, iva: 25019, total: 156700,
        direccionDespacho: 'Av. Vitacura 3520', comuna: 'Vitacura', region: 'Región Metropolitana',
        fechaPedido: '2026-02-22T16:45:00', fechaDespachoProgramada: '2026-02-24', condicionPago: 'credito_60',
        folioFactura: '', rutaDespachoId: '', notaPedido: 'Preguntar por Sofía',
    },
    {
        id: 'WHK-PED-DEMO-001', clienteId: 'CLI-001', cliente: 'Green Bowl Providencia', canalOrigen: 'whatsapp', estado: 'despachado',
        items: [
            { productoId: 'PRD-001', nombre: 'Acaí IPA 330ml', formato: '330ml', cantidad: 6, precioUnit: 3200, subtotal: 19200 },
            { productoId: 'PRD-002', nombre: 'Stout Tropical 330ml', formato: '330ml', cantidad: 4, precioUnit: 3400, subtotal: 13600 },
        ],
        subtotal: 27563, iva: 5237, total: 32800,
        direccionDespacho: 'Av. Providencia 1020, Local 3', comuna: 'Providencia', region: 'Región Metropolitana',
        fechaPedido: '2026-03-10T09:00:00', fechaDespachoProgramada: '2026-03-13', condicionPago: 'credito_30',
        folioFactura: 'F-20260313-010', rutaDespachoId: 'RUTA-DEMO-001', notaPedido: 'Pedido demo — sincronizado con WMS',
    },
    {
        id: 'WHK-PED-DEMO-002', clienteId: 'CLI-002', cliente: 'Roots Organic Ñuñoa', canalOrigen: 'whatsapp', estado: 'despachado',
        items: [
            { productoId: 'PRD-003', nombre: 'Amber Orgánico 330ml', formato: '330ml', cantidad: 3, precioUnit: 3600, subtotal: 10800 },
            { productoId: 'PRD-004', nombre: 'Golden Ale 330ml', formato: '330ml', cantidad: 12, precioUnit: 3200, subtotal: 38400 },
        ],
        subtotal: 41513, iva: 7887, total: 49400,
        direccionDespacho: 'La Florida 5430, Local 8', comuna: 'La Florida', region: 'Región Metropolitana',
        fechaPedido: '2026-03-10T10:30:00', fechaDespachoProgramada: '2026-03-13', condicionPago: 'credito_60',
        folioFactura: 'F-20260313-011', rutaDespachoId: 'RUTA-DEMO-001', notaPedido: 'Pedido demo — sincronizado con WMS',
    },
    {
        id: 'WHK-000951', clienteId: 'CLI-003', cliente: 'Bowl & Co Las Condes', canalOrigen: 'whatsapp', estado: 'incidencia',
        items: [],
        subtotal: 0, iva: 0, total: 0,
        direccionDespacho: 'Av. Apoquindo 4500, Local 12', comuna: 'Las Condes', region: 'Región Metropolitana',
        fechaPedido: '2026-02-23T09:30:00', fechaDespachoProgramada: '', condicionPago: 'credito_30',
        folioFactura: '', rutaDespachoId: '', notaPedido: 'Cliente bloqueado por deuda vencida de $145.000',
    },
];

// --- LEADS ---
export const LEADS = [
    { id: 'LEAD-001', nombreContacto: 'Rodrigo Fuentes', empresa: 'Café Origen Vitacura', telefono: '+56 9 1111 2222', email: 'rfuentes@cafeorigen.cl', tipoNegocio: 'cafeteria', razonSocial: 'Café Origen SpA', rut: '76.200.300-1', direccionDespacho: 'Av. Bicentenario 3800', comuna: 'Vitacura', region: 'Región Metropolitana', estado: 'pendiente', fechaContacto: '2026-02-20T10:00:00', asignadoA: 'María Comercial', notasInternas: 'Interesado en formato 500ml para bowls. Tiene 2 locales.' },
    { id: 'LEAD-002', nombreContacto: 'Camila Bravo', empresa: 'Deli Market Maipú', telefono: '+56 9 3333 4444', email: 'cbravo@delimarkt.cl', tipoNegocio: 'tienda_saludable', razonSocial: 'Deli Market SpA', rut: '77.400.500-6', direccionDespacho: 'Av. Pajaritos 920', comuna: 'Maipú', region: 'Región Metropolitana', estado: 'nuevo', fechaContacto: '2026-02-22T15:30:00', asignadoA: '', notasInternas: '' },
    { id: 'LEAD-003', nombreContacto: 'Tomás Muñoz', empresa: 'Smoothies Emprendimiento', telefono: '+56 9 5555 6666', email: 'tomas@smoothiesemp.cl', tipoNegocio: 'emprendimiento', razonSocial: 'Tomás Muñoz EIRL', rut: '12.345.678-9', direccionDespacho: 'Pasaje Los Naranjos 45', comuna: 'La Reina', region: 'Región Metropolitana', estado: 'aprobado', fechaContacto: '2026-02-15T09:00:00', asignadoA: 'María Comercial', notasInternas: 'Emprendimiento con potencial. Aprobado con prepago y mínimo $15.000.' },
    { id: 'LEAD-004', nombreContacto: 'Francisca Díaz', empresa: 'RestauChile Ltda.', telefono: '+56 9 7777 8888', email: 'fdiaz@restauchile.cl', tipoNegocio: 'restaurante', razonSocial: 'RestauChile Ltda.', rut: '78.600.700-8', direccionDespacho: 'Av. Italia 1200', comuna: 'Providencia', region: 'Región Metropolitana', estado: 'observado', fechaContacto: '2026-02-18T11:45:00', asignadoA: 'María Comercial', notasInternas: 'RUT tiene inconsistencia. Verificar con SII. Dirección confirmada.' },
    { id: 'LEAD-005', nombreContacto: 'Pablo Soto', empresa: 'Dark Fusion Kitchen', telefono: '+56 9 9999 0000', email: 'psoto@darkfusion.cl', tipoNegocio: 'dark_kitchen', razonSocial: 'Dark Fusion SpA', rut: '76.800.900-2', direccionDespacho: 'Calle El Roble 650', comuna: 'Rancagua', region: 'O\'Higgins', estado: 'rechazado', fechaContacto: '2026-02-10T14:20:00', asignadoA: 'María Comercial', notasInternas: 'Fuera de zona de cobertura actual. Rancagua no está en las comunas activas.' },
    { id: 'LEAD-006', nombreContacto: 'Javiera González', empresa: 'Café Verde San Miguel', telefono: '+56 9 2222 1111', email: 'javiera@cafeverde.cl', tipoNegocio: 'cafeteria', razonSocial: 'Café Verde SpA', rut: '77.100.200-3', direccionDespacho: 'Gran Avenida 4560', comuna: 'San Miguel', region: 'Región Metropolitana', estado: 'nuevo', fechaContacto: '2026-02-23T08:15:00', asignadoA: '', notasInternas: '' },
];

// --- USUARIOS DEL SISTEMA ---
export const USUARIOS = [
    { email: 'admin@whakachile.cl', nombre: 'Carlos Administrador', rol: 'admin', acceso: 'Acceso total al sistema', avatar: 'CA', password: 'Admin123!' },
    { email: 'ejecutivo@whakachile.cl', nombre: 'María Ejecutiva', rol: 'ejecutivo', acceso: 'Dashboard comercial, Leads, Clientes y Catálogo', avatar: 'ME', password: 'Admin123!' },
    { email: 'bodega@whakachile.cl', nombre: 'Juan Bodeguero', rol: 'bodega', acceso: 'Dashboard bodega, WMS Stock y Pedidos', avatar: 'JB', password: 'Admin123!' },
    { email: 'repartidor@whakachile.cl', nombre: 'Pedro Repartidor', rol: 'repartidor', acceso: 'Dashboard entregas, WMS Despacho', avatar: 'PR', password: 'Admin123!' },
];

// --- RUTAS DE DESPACHO ---
export const RUTAS = [
    {
        id: 'RUTA-001', zona: 'Providencia - Ñuñoa', vehiculo: 'Furgón Hyundai H100 - ABCD-12', repartidor: 'Pedro Reparto',
        estado: 'completado', fechaDespacho: '2026-02-21', horaSalida: '2026-02-21T08:30:00',
        pedidosIds: ['WHK-000945'],
        evidencias: [{ pedidoId: 'WHK-000945', fotoUrl: '', receptor: 'Carlos Méndez', horaEntrega: '2026-02-21T10:15:00' }],
    },
    {
        id: 'RUTA-002', zona: 'Ñuñoa - Vitacura', vehiculo: 'Furgón Hyundai H100 - ABCD-12', repartidor: 'Pedro Reparto',
        estado: 'en_ruta', fechaDespacho: '2026-02-23', horaSalida: '2026-02-23T09:00:00',
        pedidosIds: ['WHK-000946'],
        evidencias: [],
    },
    {
        id: 'RUTA-003', zona: 'Vitacura - Las Condes', vehiculo: 'Furgón Kia Bongo - EFGH-34', repartidor: 'Pedro Reparto',
        estado: 'planificado', fechaDespacho: '2026-02-24', horaSalida: '',
        pedidosIds: ['WHK-000950'],
        evidencias: [],
    },
];

// --- ESTADOS DE PEDIDO (para pipeline visual) ---
export const ESTADOS_PEDIDO = [
    { key: 'recibido', label: 'Recibido', color: 'badge-nuevo' },
    { key: 'validado', label: 'Validado', color: 'badge-pendiente' },
    { key: 'en_preparacion', label: 'En Preparación', color: 'badge-preparacion' },
    { key: 'listo_bodega', label: 'Listo Bodega', color: 'badge-aprobado' },
    { key: 'facturado', label: 'Facturado', color: 'badge-pendiente' },
    { key: 'despachado', label: 'Despachado', color: 'badge-despachado' },
    { key: 'entregado', label: 'Entregado', color: 'badge-entregado' },
    { key: 'incidencia', label: 'Incidencia', color: 'badge-incidencia' },
];

// --- ESTADOS DE LEAD ---
export const ESTADOS_LEAD = [
    { key: 'nuevo', label: 'Nuevo', color: 'badge-nuevo' },
    { key: 'pendiente', label: 'Pendiente', color: 'badge-pendiente' },
    { key: 'aprobado', label: 'Aprobado', color: 'badge-aprobado' },
    { key: 'observado', label: 'Observado', color: 'badge-observado' },
    { key: 'rechazado', label: 'Rechazado', color: 'badge-rechazado' },
];

// --- TIPOS DE NEGOCIO ---
export const TIPOS_NEGOCIO = [
    { key: 'cafeteria', label: 'Cafetería' },
    { key: 'restaurante', label: 'Restaurante' },
    { key: 'dark_kitchen', label: 'Dark Kitchen' },
    { key: 'distribuidor', label: 'Distribuidor' },
    { key: 'tienda_saludable', label: 'Tienda Saludable' },
    { key: 'emprendimiento', label: 'Emprendimiento' },
    { key: 'instalacion', label: 'Instalando mi Local' },
    { key: 'otro', label: 'Otro' },
];

// --- DASHBOARD MOCK DATA ---
export const DASHBOARD_DATA = {
    kpis: {
        pedidosHoy: { valor: 12, variacion: 20, periodo: 'vs ayer' },
        ventasMes: { valor: 4850000, variacion: 15.3, periodo: 'vs mes anterior' },
        clientesActivos: { valor: 18, variacion: 8, periodo: 'vs mes anterior' },
        otvPromedio: { valor: 245000, variacion: -3.2, periodo: 'vs mes anterior' },
    },
    ventasMensuales: [
        { dia: '1', ventas: 180000, objetivo: 200000 },
        { dia: '3', ventas: 320000, objetivo: 350000 },
        { dia: '5', ventas: 480000, objetivo: 500000 },
        { dia: '7', ventas: 650000, objetivo: 700000 },
        { dia: '9', ventas: 890000, objetivo: 900000 },
        { dia: '11', ventas: 1100000, objetivo: 1100000 },
        { dia: '13', ventas: 1350000, objetivo: 1300000 },
        { dia: '15', ventas: 1600000, objetivo: 1500000 },
        { dia: '17', ventas: 1850000, objetivo: 1700000 },
        { dia: '19', ventas: 2150000, objetivo: 1900000 },
        { dia: '21', ventas: 2800000, objetivo: 2500000 },
        { dia: '23', ventas: 3200000, objetivo: 2800000 },
    ],
    distribucionClientes: [
        { tipo: 'Cafetería', cantidad: 8, porcentaje: 44 },
        { tipo: 'Restaurante', cantidad: 4, porcentaje: 22 },
        { tipo: 'Dark Kitchen', cantidad: 3, porcentaje: 17 },
        { tipo: 'Distribuidor', cantidad: 2, porcentaje: 11 },
        { tipo: 'Otros', cantidad: 1, porcentaje: 6 },
    ],
    topProductos: [
        { nombre: 'Acaí Orgánico 1.5L', unidades: 156 },
        { nombre: 'Paletas Acaí Mix', unidades: 89 },
        { nombre: 'Acaí 5L Food Service', unidades: 67 },
        { nombre: 'Acaí Orgánico 500ml', unidades: 54 },
        { nombre: 'Acaí Zero 1L', unidades: 42 },
    ],
    estadoPedidosHoy: [
        { estado: 'Recibido', cantidad: 3 },
        { estado: 'Validado', cantidad: 2 },
        { estado: 'En Preparación', cantidad: 2 },
        { estado: 'Listo Bodega', cantidad: 1 },
        { estado: 'Despachado', cantidad: 2 },
        { estado: 'Entregado', cantidad: 2 },
    ],
};

// --- CONFIGURACIÓN DEL SISTEMA ---
export const CONFIGURACION = {
    reglasComerciales: {
        montoMinimoPedido: 15000,
        despachoGratisSobre: 50000,
        costoDespacho: 5000,
        horarioOperacion: 'Lun-Vie 9:00-18:00 / Sáb 10:00-14:00',
        descuentosVolumen: [
            { desde: 10, hasta: 24, descuento: 5 },
            { desde: 25, hasta: 49, descuento: 10 },
            { desde: 50, hasta: '+', descuento: 15 },
        ],
    },
    zonas: [
        { nombre: 'Zona Oriente', comunas: ['Providencia', 'Ñuñoa', 'Las Condes', 'Vitacura', 'La Reina'], activa: true },
        { nombre: 'Zona Sur', comunas: ['La Florida', 'San Miguel'], activa: true },
        { nombre: 'Zona Poniente', comunas: ['Maipú', 'Santiago Centro'], activa: false },
    ],
    listasPrecios: [
        { nombre: 'Lista Cafetería', descuento: 0, tiposCliente: ['cafeteria'] },
        { nombre: 'Lista Restaurante', descuento: 5, tiposCliente: ['restaurante'] },
        { nombre: 'Lista Dark Kitchen', descuento: 8, tiposCliente: ['dark_kitchen'] },
        { nombre: 'Lista Distribuidor', descuento: 15, tiposCliente: ['distribuidor'] },
    ],
    integraciones: [
        { nombre: 'WhatsApp Business API', tipo: 'Mensajería', activa: true },
        { nombre: 'Sistema de Facturación (SII)', tipo: 'Facturación', activa: false },
        { nombre: 'Khipu / Transbank', tipo: 'Pagos', activa: false },
    ],
};

// --- HELPER: Formatear CLP ---
export const formatCLP = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
};

// --- HELPER: Formato fecha ---
export const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// --- PERMISOS POR ROL ---
export const PERMISOS_ROL = {
    admin: ['dashboard', 'leads', 'clientes', 'wms_dashboard', 'wms_stock', 'wms_pedidos', 'wms_despacho', 'catalogo', 'reportes', 'configuracion'],
    ejecutivo: ['dashboard', 'leads', 'clientes', 'catalogo'],
    bodega: ['dashboard', 'wms_dashboard', 'wms_stock', 'wms_pedidos'],
    repartidor: ['dashboard', 'wms_dashboard', 'wms_despacho'],
};
