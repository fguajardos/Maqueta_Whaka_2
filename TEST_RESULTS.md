# 🧪 TEST RESULTS — WhakaChile

**Fecha:** 2026-06-16
**Environment:** Local — Backend :3000 (nodemon) + Frontend :5173 (Vite) + PostgreSQL (Neon)
**Método:** Suite E2E automatizada (Node + fetch) contra la API real, con datos reales en Neon y limpieza posterior.

## ✅ Resultado: 22 / 22 PASS

### Test 1 — Cliente Nuevo (Lead Flow con región/comuna)
- ✅ 1.1 `validate-rut` → `new_lead`
- ✅ 1.2 Crear lead
- ✅ 1.2b Lead guarda **región / comuna / dirección** (Los Ríos / Valdivia)
- ✅ 1.3 Status = `pendiente`
- ✅ 1.4 Aparece en CRM admin con la región correcta
- ✅ 1.5 Aprobar lead → cliente creado
- ✅ 1.5b **Cliente hereda región / comuna / dirección** del lead
- ✅ 1.6 Status = `cliente_creado`
- ✅ 1.7 RUT ahora resuelve a `existing_client`

### Test 2 — Cliente Existente (Compra Rápida)
- ✅ 2.1 `validate-rut` existente → `clientId`
- ✅ 2.2 Catálogo cargado (4 productos)
- ✅ 2.3 Crear orden directa
- ✅ 2.4 Stock decrementado (300 → 298)
- ✅ 2.5 Orden entró a **BillingQueue**

### Test 3 — Lead Rechazado
- ✅ 3.1 Crear lead
- ✅ 3.2 Rechazar → status `rechazado`
- ✅ 3.3 `validate-rut` → `rejected_lead`

### Test 4 — Admin Panel
- ✅ 4.0 Crear lead pendiente
- ✅ 4.1 Listar pendientes
- ✅ 4.2 Ver detalle
- ✅ 4.3 Agregar nota

## Validaciones críticas confirmadas
- ✅ Persistencia región/comuna/dirección (bot → Lead → Cliente)
- ✅ Stock management (decremento + restaurado en limpieza)
- ✅ BillingQueue alimentada por las órdenes
- ✅ Aprobar/Rechazar desde el panel admin (con JWT)
- ✅ Colas BullMQ desactivadas sin bloquear (Redis opcional en dev)

## Pendiente: verificación manual de UI (en navegador)
Estos flujos son de interfaz y requieren validación visual:
- [ ] Bot: cascada **región → comuna** (dropdown filtrado, acepta número o nombre)
- [ ] Bot: **escalado a ejecutivo** ("¿Dudas? Hablar con un ejecutivo" + volver al pedido)
- [ ] CRM Leads: lead del bot visible, badge "WhatsApp", botones Aprobar/Rechazar
- [ ] CRM: indicador "🟢 En vivo" y botón Actualizar

**Backend/integración: ✅ listo. Próximo: smoke test visual de la UI.**
