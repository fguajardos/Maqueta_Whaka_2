# 🧪 E2E TEST PLAN — Lead Management + Orders

## Objetivo
Verificar que el flujo completo de:
1. Validación de RUT
2. Creación de Lead
3. Aprobación/Rechazo
4. Creación de Cliente
5. Orden desde catálogo

funciona sin errores de punta a punta.

---

## 📋 Test Scenarios

### Test 1: Cliente Nuevo (Lead Flow)
**Descripción:** Un nuevo cliente intenta hacer un pedido, crea un lead, es aprobado, y recibe el catálogo.

**Pasos:**

1. **Validar RUT no existente**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/leads/validate-rut \
     -H "Content-Type: application/json" \
     -d '{"rut": "99.999.999-9"}'
   ```
   **Esperado:** `flowType: "new_lead"`

2. **Crear Lead**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/leads/create \
     -H "Content-Type: application/json" \
     -d '{
       "rut": "99.999.999-9",
       "razonSocial": "Café Test SpA",
       "tipoNegocio": "Cafetería",
       "tipoCliente": "Empresa",
       "phone": "+56912345678",
       "contactName": "Juan Prueba"
     }'
   ```
   **Esperado:** `success: true, leadId: <id>`

3. **Polling de Status (Simular espera)**
   ```bash
   curl http://localhost:3000/api/whatsapp/leads/<leadId>/status \
     -H "Content-Type: application/json"
   ```
   **Esperado (antes de aprobar):** `status: "pendiente"`

4. **Admin Aprueba Lead**
   ```bash
   curl -X POST http://localhost:3000/api/admin/leads/<leadId>/approve \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"userId": "admin-1"}'
   ```
   **Esperado:** `success: true, cliente creado, status: "aprobado"`

5. **Verificar Lead en Status (Después de aprobar)**
   ```bash
   curl http://localhost:3000/api/whatsapp/leads/<leadId>/status
   ```
   **Esperado:** `status: "cliente_creado", clientId: <id>`

6. **Obtener Catálogo Dinámico**
   ```bash
   curl http://localhost:3000/api/whatsapp/catalog/productos
   ```
   **Esperado:** Array de productos con formatos y stock

7. **Seleccionar Producto y Formato**
   ```bash
   curl http://localhost:3000/api/whatsapp/catalog/producto/<productoId>/formatos
   ```
   **Esperado:** Array de formatos disponibles con precios y stock

8. **Validar Stock**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/catalog/validate-stock \
     -H "Content-Type: application/json" \
     -d '{
       "productoFormatoId": "<formatoId>",
       "quantity": 5
     }'
   ```
   **Esperado:** `isValid: true`

9. **Crear Orden**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/orders/create \
     -H "Content-Type: application/json" \
     -d '{
       "clientPhone": "+56912345678",
       "clientName": "Café Test",
       "clientId": "<clientId>",
       "productoFormatoId": "<formatoId>",
       "productId": "<productId>",
       "productName": "Leche Descremada",
       "quantity": 5,
       "unitOfMeasure": "litro",
       "unitPrice": 1200,
       "deliveryType": "entrega",
       "address": "Calle Test 123",
       "city": "Santiago",
       "paymentMethod": "Transferencia"
     }'
   ```
   **Esperado:** `success: true, orderId: <id>, order creada en BD`

10. **Verificar Orden en BillingQueue**
    ```bash
    curl http://localhost:3000/api/billing/pending
    ```
    **Esperado:** Orden en status "pendiente"

---

### Test 2: Cliente Existente (Compra Rápida)
**Descripción:** Un cliente ya registrado valida RUT y hace un pedido directamente.

**Pasos:**

1. **Validar RUT Existente**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/leads/validate-rut \
     -H "Content-Type: application/json" \
     -d '{"rut": "12.345.678-9"}'
   ```
   **Esperado:** `flowType: "existing_client", clientId: <id>`

2. **Obtener Catálogo (igual al Test 1 paso 6)**

3. **Crear Orden directamente (igual al Test 1 paso 9)**

---

### Test 3: Lead Rechazado
**Descripción:** Un lead es rechazado y se crea tarea manual.

**Pasos:**

1-3. [Igual al Test 1 pasos 1-3]

4. **Admin Rechaza Lead**
   ```bash
   curl -X POST http://localhost:3000/api/admin/leads/<leadId>/reject \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"userId": "admin-1", "reason": "Datos incompletos"}'
   ```
   **Esperado:** `success: true, status: "rechazado"`

5. **Verificar Lead en Status**
   ```bash
   curl http://localhost:3000/api/whatsapp/leads/<leadId>/status
   ```
   **Esperado:** `status: "rechazado", flowType: "rejected_lead"`

6. **Verificar Notificación Creada**
   ```bash
   # (No hay endpoint público, pero se verifica en BD)
   SELECT * FROM notifications WHERE entity_id = '<leadId>';
   ```
   **Esperado:** 2 notificaciones creadas (cliente + admin)

---

### Test 4: Admin Panel - Leads Pendientes
**Descripción:** Admin visualiza y gestiona leads en el panel.

**Pasos:**

1. **Obtener Leads Pendientes**
   ```bash
   curl http://localhost:3000/api/admin/leads/pendientes \
     -H "Authorization: Bearer <token>"
   ```
   **Esperado:** Array de leads con status "pendiente"

2. **Obtener Detalle de Lead**
   ```bash
   curl http://localhost:3000/api/admin/leads/<leadId> \
     -H "Authorization: Bearer <token>"
   ```
   **Esperado:** Lead con todos los datos (rut, razonSocial, etc.)

3. **Agregar Nota**
   ```bash
   curl -X PATCH http://localhost:3000/api/admin/leads/<leadId>/note \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"note": "Contactar mañana a las 10am"}'
   ```
   **Esperado:** `success: true, lead.adminNotes actualizada`

---

## 📊 Validaciones Críticas

- [ ] **Stock Management:** Cuando se crea orden, se decrementa stock en ProductoFormato
- [ ] **Notificaciones:** Se crea registro en Notifications para cada evento
- [ ] **BillingQueue:** Orden automáticamente entra en cola de facturación
- [ ] **Jobs:** BullMQ jobs se disparan correctamente
- [ ] **Timestamps:** createdAt, updatedAt, approvedAt, rejectedAt se registran correctamente
- [ ] **Foreign Keys:** clientId, leadId, productoId se relacionan correctamente
- [ ] **Validaciones:** Errores se capturan y retornan con mensajes claros

---

## 🚀 Ejecución

### Opción 1: Manual (cURL)
Ejecutar los comandos anteriores en orden, verificando respuestas.

### Opción 2: Bot React
1. Abrir http://localhost:5173/whatsapp
2. Seleccionar "Bot de Pedidos"
3. Ingresar RUT nuevo
4. Completar formulario
5. En admin panel, aprobar lead
6. Volver al bot, catálogo debe cargar
7. Seleccionar producto y confirmar orden

### Opción 3: Automated Test Suite
```bash
# (Crear test file con Jest/Vitest)
npm run test:e2e
```

---

## 📝 Checklist Final

- [ ] Todos los endpoints retornan códigos HTTP correctos
- [ ] Las validaciones funcionan (RUT duplicado, stock insuficiente, etc.)
- [ ] Las notificaciones se crean correctamente
- [ ] El job orchestrator dispara jobs sin errores
- [ ] PostgreSQL tiene todos los datos (no hay pérdida de datos)
- [ ] El bot React fluye correctamente entre pantallas
- [ ] El panel admin se actualiza en tiempo real

---

## 🎯 Resultado Esperado

✅ Todo funciona sin errores
✅ Lead → Aprobación → Cliente → Orden → Facturación (flujo completo)
✅ Stock se decrementa correctamente
✅ Notificaciones se crean para cada evento
✅ Admin panel es responsive y funcional
