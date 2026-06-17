# 🧪 TESTING GUIDE — Step by Step

**Objetivo:** Validar que el sistema completo funciona antes de enviar a Render.com

**Duración:** 75 minutos  
**Status:** 🟡 En progreso

---

## ⏱️ TIMELINE

```
00:00 — 15:00  │ FASE 1: Local Setup
15:00 — 45:00  │ FASE 2: E2E Tests
45:00 — 55:00  │ FASE 3: Validación
55:00 — 75:00  │ FASE 4: Documentar Resultados
```

---

## 🟢 FASE 1: LOCAL SETUP (15 min)

### **Paso 1.1: Backend Dependencies**

```bash
cd wms
npm install
```

**Esperado:** ✅ Sin errores de dependencias

### **Paso 1.2: Configurar .env**

```bash
cp .env.example .env
```

**Editar `.wms/.env` con valores:**

```env
# Para desarrollo local con PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whakachile_dev"

# O si usas otra BD en la nube:
DATABASE_URL="postgresql://user:password@host:5432/database"

# Redis local (o comentar si no tienes)
REDIS_URL="redis://localhost:6379"

# JWT (puedes dejar los default para testing)
JWT_SECRET="test_jwt_secret_minimo_32_caracteres_aqui"
JWT_REFRESH_SECRET="test_refresh_secret_minimo_32_caracteres"
```

**⚠️ Importante:** 
- [ ] Cambiar `DATABASE_URL` a tu BD (local o nube)
- [ ] Si no tienes Redis, los jobs no funcionarán (pero puedes testear sin ellos)

### **Paso 1.3: Prisma Setup**

```bash
cd wms
npx prisma generate
```

**Esperado:** ✅ `Generated Prisma Client`

### **Paso 1.4: Database Migrations**

```bash
npx prisma migrate dev --name initial
```

**Cuando pregunte "name":** presiona Enter o escribe `initial`

**Esperado:** ✅ Migraciones ejecutadas

### **Paso 1.5: Seed Data**

```bash
npx ts-node prisma/seed.ts
```

**Esperado:**
```
✅ Users seeded
✅ Business rules seeded
✅ Product mappings seeded
✅ 4 Productos creados
✅ ProductoFormatos creados
✅ Cliente de prueba creado
✅ Lead de prueba creado
✅ Notificaciones creadas
```

**Clientes para testing:**
- RUT: `12.345.678-9` (cliente existente)
- RUT: `99.999.999-9` (lead nuevo para aprobar)

### **Paso 1.6: Backend Health Check**

```bash
npm run dev
```

Espera 5 segundos y abre otra terminal:

```bash
curl http://localhost:3000/health
```

**Esperado:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "ok" }
  }
}
```

✅ **Backend está listo!**

### **Paso 1.7: Frontend Setup**

En otra terminal:

```bash
cd crm
npm install
npm run dev
```

**Esperado:** 
```
VITE v7.3.1 ready in XXXms
Local: http://localhost:5173
```

✅ **Frontend está listo!**

---

## 🟡 FASE 2: E2E TESTS (30 min)

### **Test 1: Cliente Nuevo (Lead Flow)**

**Duración:** ~10 min

#### Paso 2.1.1: Validar RUT no existente

```bash
curl -X POST http://localhost:3000/api/whatsapp/leads/validate-rut \
  -H "Content-Type: application/json" \
  -d '{"rut": "88.888.888-8"}'
```

**Esperado:**
```json
{
  "success": true,
  "exists": false,
  "flowType": "new_lead"
}
```

✅ **PASO 1 PASADO**

#### Paso 2.1.2: Crear Lead

```bash
curl -X POST http://localhost:3000/api/whatsapp/leads/create \
  -H "Content-Type: application/json" \
  -d '{
    "rut": "88.888.888-8",
    "razonSocial": "Test Empresa Nueva",
    "tipoNegocio": "Restaurante",
    "tipoCliente": "Empresa",
    "phone": "+56987654321",
    "contactName": "Carlos Prueba"
  }'
```

**Esperado:**
```json
{
  "success": true,
  "leadId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "lead": {...}
}
```

💾 **Guardar `leadId` para próximos pasos**

✅ **PASO 2 PASADO**

#### Paso 2.1.3: Polling Status (Antes de Aprobar)

```bash
curl http://localhost:3000/api/whatsapp/leads/<leadId>/status
```

(Reemplazar `<leadId>` con el que copiaste)

**Esperado:**
```json
{
  "success": true,
  "status": "pendiente",
  "clientId": null
}
```

✅ **PASO 3 PASADO**

#### Paso 2.1.4: Admin Aprueba Lead

⚠️ **Esto requiere JWT token.** Para testing local, podemos bypassear auth temporalmente.

**Opción A: Usar token JWT** (si sabes generarlo)
```bash
curl -X POST http://localhost:3000/api/admin/leads/<leadId>/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "admin-test"}'
```

**Opción B: Comentar auth temporalmente en las rutas** (para testing)

En `wms/src/routes/admin-leads.routes.ts`, cambiar:
```typescript
// De: router.get('/pendientes', authenticate, async ...
// A:  router.get('/pendientes', async ...  (comentar authenticate)
```

Luego:
```bash
curl -X POST http://localhost:3000/api/admin/leads/<leadId>/approve \
  -H "Content-Type: application/json" \
  -d '{"userId": "admin-test"}'
```

**Esperado:**
```json
{
  "success": true,
  "lead": {
    "status": "aprobado",
    "approvedAt": "...",
    "clientId": "xxxxxxxx..."
  }
}
```

✅ **PASO 4 PASADO**

#### Paso 2.1.5: Verificar Cliente Creado

```bash
curl http://localhost:3000/api/whatsapp/leads/<leadId>/status
```

**Esperado:**
```json
{
  "success": true,
  "status": "cliente_creado",
  "clientId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
}
```

✅ **PASO 5 PASADO — Lead Flow Completado!**

---

### **Test 2: Cliente Existente (Compra Rápida)**

**Duración:** ~5 min

#### Paso 2.2.1: Validar RUT Existente

```bash
curl -X POST http://localhost:3000/api/whatsapp/leads/validate-rut \
  -H "Content-Type: application/json" \
  -d '{"rut": "12.345.678-9"}'
```

**Esperado:**
```json
{
  "success": true,
  "exists": true,
  "flowType": "existing_client",
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

✅ **PASO 1 PASADO**

#### Paso 2.2.2: Obtener Catálogo

```bash
curl http://localhost:3000/api/whatsapp/catalog/productos
```

**Esperado:**
```json
{
  "success": true,
  "count": 4,
  "catalogo": [
    {
      "id": "...",
      "nombre": "Leche Descremada",
      "formatos": [
        {
          "id": "...",
          "formato": "litro",
          "precio": 1200,
          "stock": 500
        }
      ]
    }
  ]
}
```

💾 **Guardar un `productoId` y `formatoId` para la próxima orden**

✅ **PASO 2 PASADO**

#### Paso 2.2.3: Crear Orden Directa

```bash
curl -X POST http://localhost:3000/api/whatsapp/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "clientPhone": "+56912345678",
    "clientName": "Café Test",
    "clientId": "<clientId-del-paso-anterior>",
    "productoFormatoId": "<formatoId-del-paso-anterior>",
    "productId": "<productoId-del-paso-anterior>",
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

**Esperado:**
```json
{
  "success": true,
  "orderId": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
  "order": {...}
}
```

✅ **PASO 3 PASADO — Compra Rápida Completada!**

---

### **Test 3: Lead Rechazado**

**Duración:** ~5 min

#### Paso 2.3.1-2.3.3: Crear y validar lead

(Seguir pasos 2.1.1 a 2.1.3 con otro RUT, ej: `77.777.777-7`)

#### Paso 2.3.4: Admin Rechaza Lead

```bash
curl -X POST http://localhost:3000/api/admin/leads/<leadId>/reject \
  -H "Content-Type: application/json" \
  -d '{"userId": "admin-test", "reason": "Datos incompletos"}'
```

**Esperado:**
```json
{
  "success": true,
  "lead": {
    "status": "rechazado",
    "rejectedAt": "..."
  }
}
```

✅ **PASO 1 PASADO**

#### Paso 2.3.5: Verificar Status

```bash
curl http://localhost:3000/api/whatsapp/leads/<leadId>/status
```

**Esperado:**
```json
{
  "success": true,
  "status": "rechazado",
  "flowType": "rejected_lead"
}
```

✅ **PASO 2 PASADO — Lead Rechazado Completado!**

---

### **Test 4: Admin Panel**

**Duración:** ~5 min

#### Paso 2.4.1: Obtener Leads Pendientes

```bash
curl http://localhost:3000/api/admin/leads/pendientes \
  -H "Content-Type: application/json"
```

**Esperado:**
```json
{
  "success": true,
  "count": X,
  "leads": [
    {
      "id": "...",
      "rut": "...",
      "razonSocial": "...",
      "status": "pendiente"
    }
  ]
}
```

✅ **PASO 1 PASADO**

#### Paso 2.4.2: Ver Detalle

```bash
curl http://localhost:3000/api/admin/leads/<leadId>
```

**Esperado:** Lead con todos los datos

✅ **PASO 2 PASADO**

#### Paso 2.4.3: Agregar Nota

```bash
curl -X PATCH http://localhost:3000/api/admin/leads/<leadId>/note \
  -H "Content-Type: application/json" \
  -d '{"note": "Cliente de prueba - testing"}'
```

**Esperado:** Lead actualizado con nota

✅ **PASO 3 PASADO — Admin Panel Completado!**

---

## 🟢 FASE 3: VALIDACIÓN (10 min)

### ✅ Checklist Final

- [ ] Test 1: Cliente Nuevo — ✅ 5/5 pasos
- [ ] Test 2: Cliente Existente — ✅ 3/3 pasos
- [ ] Test 3: Lead Rechazado — ✅ 2/2 pasos
- [ ] Test 4: Admin Panel — ✅ 3/3 pasos

### 📊 Validaciones Críticas

- [ ] Stock se decrementó en BD después de crear orden
- [ ] Orden automáticamente en BillingQueue
- [ ] BullMQ jobs se dispararon (revisar logs)
- [ ] Notificaciones creadas para cada evento
- [ ] No hay errores en logs del backend

---

## 🟡 FASE 4: DOCUMENTAR RESULTADOS (10 min)

Crear archivo `TEST_RESULTS.md`:

```markdown
# 🧪 TEST RESULTS

**Fecha:** 2026-06-16  
**Environment:** Local (PostgreSQL)  
**Status:** ✅ TODOS LOS TESTS PASADOS

## Test 1: Cliente Nuevo (Lead Flow)
✅ PASO 1: Validar RUT no existente
✅ PASO 2: Crear Lead
✅ PASO 3: Polling Status (pendiente)
✅ PASO 4: Admin aprueba
✅ PASO 5: Cliente creado automático

## Test 2: Cliente Existente
✅ PASO 1: Validar RUT existente
✅ PASO 2: Obtener catálogo
✅ PASO 3: Crear orden directa

## Test 3: Lead Rechazado
✅ PASO 1: Rechazar lead
✅ PASO 2: Verificar status

## Test 4: Admin Panel
✅ PASO 1: Listar leads
✅ PASO 2: Ver detalle
✅ PASO 3: Agregar nota

## Validaciones Críticas
✅ Stock management
✅ BillingQueue
✅ Notificaciones
✅ Jobs BullMQ

**Listo para:** Deployment en Render.com
```

---

## 🎯 RESULTADO ESPERADO

```
✅ Todos los tests pasados
✅ Backend sin errores
✅ Frontend conectando a WMS
✅ Base de datos sincronizada
✅ Jobs ejecutándose
✅ Sistema listo para Render

→ Proceder a DEPLOYMENT_RENDER.md
```

---

## 🆘 Troubleshooting Rápido

**Backend no levanta:**
```bash
# Verificar DB
npm run dev
# Si falla: editar .env con DB correcta
```

**Test falla con 401 (unauthorized):**
```bash
# Comentar authenticate en admin routes (temporal)
# O generar JWT token válido
```

**PostgreSQL no conecta:**
```bash
# Opción 1: Instalar PostgreSQL local
# Opción 2: Usar PostgreSQL online (Neon, Supabase, etc.)
```

**Redis no disponible:**
```bash
# Los jobs BullMQ no funcionarán
# Pero el resto de tests sí
# Para producción: agregar Redis en Render
```

---

**Status:** 🟡 Listo para comenzar  
**Próximo:** Ejecutar FASE 1 (Backend + Frontend setup)

¿Empezamos? 🚀
