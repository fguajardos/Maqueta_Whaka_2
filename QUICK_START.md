# 🚀 QUICK START — WhakaChile CRM+WMS

**¿Dónde estamos?** Proyecto 100% completado. 4 sprints terminados. Listo para producción.

---

## ⚡ 5 Minutos: Entiende el Proyecto

```
Bot WhatsApp (React)  ←→  Backend WMS (Express/TS)  ←→  PostgreSQL
     :5173                      :3000                   
                                  ↓
                        Admin Panel (Leads)
                        Billing Queue
                        BullMQ Jobs
```

**3 flujos principales:**
1. **Lead Nuevo:** RUT → Formulario → Aprobación → Catálogo → Orden
2. **Cliente Existente:** RUT → Catálogo → Orden
3. **Admin Aprueba Leads:** Panel → Aprobación → Crear Cliente

---

## 🏃 15 Minutos: Ejecutar Localmente

### 1. Backend Setup
```bash
cd wms
npm install
cp .env.example .env
# Editar .env con DATABASE_URL PostgreSQL local
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev
```
✅ Backend en http://localhost:3000

### 2. Frontend Setup
```bash
cd crm
npm install
npm run dev
```
✅ Frontend en http://localhost:5173

### 3. Acceder
- Ir a http://localhost:5173
- Click: "Bot de Pedidos"
- Escribir RUT: `12.345.678-9` (existente) o `99.999.999-9` (nuevo lead)

---

## 🧪 20 Minutos: Ejecutar E2E Tests

### Opción 1: Manual (Recomendado MVP)
```bash
# En otra terminal, curl commands:
# Ver: E2E_TEST_PLAN.md
# Test 1: Validar RUT
curl -X POST http://localhost:3000/api/whatsapp/leads/validate-rut \
  -H "Content-Type: application/json" \
  -d '{"rut": "99.999.999-9"}'
# Respuesta: flowType: "new_lead"

# Test 2: Crear Lead
curl -X POST http://localhost:3000/api/whatsapp/leads/create \
  -H "Content-Type: application/json" \
  -d '{
    "rut": "99.999.999-9",
    "razonSocial": "Test Empresa",
    "tipoNegocio": "Restaurante",
    "tipoCliente": "Empresa",
    "phone": "+56987654321",
    "contactName": "Carlos"
  }'
# Respuesta: success: true, leadId: <id>
```

### Opción 2: Desde UI Bot
1. Abrir bot en http://localhost:5173
2. Escribir RUT nuevo (ej: 88.888.888-8)
3. Completar formulario
4. Esperar aprobación en panel admin

Ver: **E2E_TEST_PLAN.md** para todos los scenarios

---

## 📋 Documentación Clave

| Archivo | Propósito | Lectura |
|---------|-----------|---------|
| **README_COMPLETO.md** | Visión completa del sistema | 15 min |
| **E2E_TEST_PLAN.md** | Cómo testear (4 scenarios) | 20 min |
| **DEPLOYMENT_RENDER.md** | Deployar en Render.com | 30 min |
| **SPRINT_4_SUMMARY.md** | Resumen de trabajo completado | 5 min |

---

## 🚀 30 Minutos: Deployar en Render.com

### Paso 1: PostgreSQL
1. Ir a Render.com → Databases → Create PostgreSQL
2. Copiar `DATABASE_URL`

### Paso 2: Backend Deploy
1. Create Web Service
2. Conectar GitHub
3. Settings:
   ```
   Build: npm install && npx prisma migrate deploy && npm run build
   Start: npm run start
   Environment: DATABASE_URL=<tu_url>
   ```

### Paso 3: Frontend Deploy
1. Create Static Site
2. Conectar GitHub
3. Build: `cd crm && npm install && npm run build`
4. Publish: `crm/dist`

### Paso 4: Verificar
```bash
# Health check
curl https://whakachile-wms.onrender.com/health
# Esperado: {"status": "healthy"}

# Frontend
https://whakachile-crm.onrender.com
```

Ver: **DEPLOYMENT_RENDER.md** para detalles completos

---

## 🎯 Ahora Mismo: Elige Tu Camino

### 🛣️ Camino A: Testing Completo (Recomendado)
```
1. Ejecutar E2E tests localmente (20 min)
   → Ver E2E_TEST_PLAN.md
   
2. Validar todos los scenarios
   → Test 1: Cliente Nuevo
   → Test 2: Cliente Existente
   → Test 3: Lead Rechazado
   → Test 4: Admin Panel

3. Deployar en Render (30 min)
   → Ver DEPLOYMENT_RENDER.md

Total: ~90 minutos → Producción lista
```

### 🛣️ Camino B: Deploy Directo
```
1. Preparar Render.com (5 min)
2. Deployar backend (15 min)
3. Deployar frontend (10 min)
4. Testear en producción

Total: ~30 minutos → Producción en vivo
```

### 🛣️ Camino C: Entender Primero
```
1. Leer README_COMPLETO.md (15 min)
2. Leer DEPLOYMENT_RENDER.md (20 min)
3. Ejecutar localmente (15 min)
4. Deployar cuando esté listo

Total: Flexible → Entendimiento profundo
```

---

## 🎓 Estructura Rápida

```
SPRINTS COMPLETADOS:

Sprint 1: Modelos + Migrations
  └─ 5 modelos Prisma (Lead, Producto, etc.)
  └─ 4 servicios backend
  └─ 9 endpoints API

Sprint 2: Bot + Orders
  └─ Bot React (16+ pasos)
  └─ 2 flujos (Lead vs Existente)
  └─ Stock management
  └─ 4 endpoints órdenes

Sprint 3: Admin + Jobs
  └─ Admin panel
  └─ 3 BullMQ workers
  └─ Job orchestrator
  └─ E2E test plan

Sprint 4: Testing + Deploy
  └─ Seed data
  └─ Deployment guide
  └─ E2E tests
  └─ Documentación completa

✅ TOTAL: 16 API Endpoints | 5 Services | 3 Workers
```

---

## 🔑 Conceptos Clave

**Lead Management:**
- RUT que NO existe → Crear Lead → Admin aprueba → Crear Cliente automático

**Stock Management:**
- Validar stock → Reservar (decrement) → Crear orden → Fallback liberar si falla

**BullMQ Jobs:**
- leadApproval: Aprobar → crear cliente + notificar
- leadRejection: Rechazar → crear tarea manual
- leadExpiration: Cron cada 6h → cancelar leads >72h

**API Auth:**
- Admin endpoints: JWT requerido
- WhatsApp endpoints: Sin auth (MVP)

---

## ✅ Checklist de Validación

- [ ] Backend corre en :3000 sin errores
- [ ] Frontend corre en :5173 sin errores
- [ ] Seed data ejecutado (4 productos, 1 cliente, 1 lead)
- [ ] RUT 12.345.678-9 (cliente existente) → flujo rápido
- [ ] RUT 99.999.999-9 (lead nuevo) → formulario
- [ ] Admin panel muestra leads pendientes
- [ ] Orden se crea y entra en BillingQueue
- [ ] Health endpoint responde ✅

---

## 🚨 Troubleshooting Rápido

**Backend no levanta:**
```bash
# Error: DATABASE_URL?
# Solución: Crear PostgreSQL local o usar DB online
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
npm run dev
```

**Frontend no conecta:**
```bash
# Error: CORS?
# Backend incluye CORS configurado
# Cambiar VITE_WMS_URL en crm/.env si es necesario
```

**Migrations fallan:**
```bash
# Error: schema exists?
npx prisma migrate reset  # ⚠️ Borra BD local
npx prisma migrate dev
npx ts-node prisma/seed.ts
```

---

## 📞 Preguntas Comunes

**P: ¿Puedo comenzar sin PostgreSQL local?**  
R: Sí, usa PostgreSQL online (Render, Neon, Supabase) en .env

**P: ¿Qué usuarios de prueba hay?**  
R: RUT 12.345.678-9 (cliente) y 99.999.999-9 (lead) después de seed

**P: ¿Cómo apruebo un lead desde terminal?**  
R: Necesitas JWT. Ver E2E_TEST_PLAN.md para auth primero

**P: ¿Cuánto cuesta Render.com?**  
R: Free tier suficiente para MVP. $7/mes Web Service + PostgreSQL

**P: ¿Es necesario Redis?**  
R: Sí para BullMQ. Render lo incluye en plan Pro

---

## 🎯 Próximo Paso Recomendado

```
1. Ahora: Leer README_COMPLETO.md (15 min)
2. Luego: Ejecutar E2E tests (30 min)
3. Finalmente: Deployar en Render (30 min)

Total: ~75 minutos → Sistema en producción ✅
```

---

## 📚 Archivos Clave

```
Entender:
└─ README_COMPLETO.md (visión general)

Testear:
└─ E2E_TEST_PLAN.md (4 scenarios)

Deployar:
└─ DEPLOYMENT_RENDER.md (paso a paso)

Resumen:
└─ SPRINT_4_SUMMARY.md (trabajo completado)

Rápido:
└─ QUICK_START.md (este archivo)
```

---

**Status:** 🟢 Production Ready  
**Componentes:** 16 endpoints | 5 services | 3 workers  
**Documentación:** Completa y actualizada  
**Next:** Leer README_COMPLETO.md → Ejecutar tests → Deployar

¡Vamos! 🚀
