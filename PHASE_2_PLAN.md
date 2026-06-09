# 🚀 Phase 2: Plan de Implementación Detallado

**Duración estimada:** 3-4 semanas  
**Inicio:** 10 de Junio, 2026  
**Prioridad:** 7 features críticas del cliente  
**Status:** 📋 Diseño & Planificación

---

## 📊 Visión General

### De Fase 1 a Fase 2

| Aspecto | Fase 1 ✅ | Fase 2 🔄 |
|--------|----------|----------|
| **Modelo** | Mockado | Real (BD clientes + BSale) |
| **Flujo** | Simple (7 pasos) | Flexible (árbol de decisión) |
| **Notificaciones** | Manual | Automático (semanal + eventos) |
| **Panel cliente** | No existe | Portal completo 24/7 |
| **Roles** | Solo bot | Vendedor + Distribuidor + Admin |
| **Validaciones** | Local | Local + BSale API |
| **Escalabilidad** | Demo | Producción |

---

## 🎯 7 Features Críticas (Prioridad)

### 🔴 **BLOCKER CRÍTICO (Semana 1)**

#### 1. **Revisar Pipeline + Árbol de Decisión**
**Por qué primero:** Determina arquitectura de todo lo demás

- [ ] Sesión con cliente: ¿Qué información es OBLIGATORIA?
- [ ] Mapear decisiones posibles en el flujo
- [ ] Definir qué rechaza el cliente automáticamente
- [ ] Documento: `DECISION_TREE.md`
- [ ] Estimado: 4h sesión + 8h documentación

**Artefacto:**
```
DECISION_TREE.md (generado en semana 1)
├── Cliente válido?
│   ├── Sí → Producto disponible?
│   │   ├── Sí → Cantidad?
│   │   │   ├── Válida → Despacho?
│   │   │   └── Inválida → RECHAZAR + alertar
│   │   └── No → RECHAZAR + sugerir alternativas
│   └── No → Crear cliente? ¿Datos?
├── ROLES: Vendedor vs Distribuidor
└── NOTIFICACIONES por punto de decisión
```

---

#### 2. **Solicitar BD de Clientes (Esquema)**
**Por qué:** Bloquea 3 features (alertas, validación, historial)

- [ ] Formato de BD (MySQL, PostgreSQL, CSV, JSON?)
- [ ] Campos: teléfono, email, nombre, dirección, límite crédito, zona
- [ ] Volumen estimado
- [ ] Frecuencia actualización
- [ ] Acceso: API o archivo sync?
- [ ] Documento: `CLIENTES_SCHEMA.md`

**Artefacto:**
```sql
-- Esperado algo como:
-- clientes (id, phone, email, nombre, address, zona, credit_limit)
-- clientes_contacto (cliente_id, contacto_type, valor)
-- clientes_historial (cliente_id, pedido_id, fecha, monto)
```

---

#### 3. **Revisar Factibilidad API KEY BSale**
**Por qué:** Determina si Feature #4 es posible

- [ ] ¿Qué permisos tiene la key actual?
- [ ] ¿Puedo consultar: stock, clientes, documentos?
- [ ] Rate limiting ¿cuál es?
- [ ] Latencia de respuesta
- [ ] ¿Necesita nueva key con más permisos?
- [ ] Documento: `BSALE_API_ANALYSIS.md`

**Artefacto:**
```markdown
# BSale API Análisis
- Endpoints consumibles: productos, stock, clientes, documentos
- Rate: 1000 req/hr
- Latencia: 200-500ms
- Bloques: ❌ stock_masivo, ❌ facturación_batch
- Recomendación: Cachear respuestas en Redis 5 min
```

---

### 🟡 **ALTO (Semana 2)**

#### 4. **Validaciones desde BSale (Stock + Facturación)**
**Dependencia:** Feature #1 + #3 + árbol de decisión

**Scope:**
- [ ] Middleware: `src/middleware/validateWithBSale.ts`
- [ ] Consultar stock real en BSale antes de confirmar
- [ ] Consultar capacidad facturación (¿cliente tiene límite?)
- [ ] Si falla BSale: fallback a BD local + log + alerta
- [ ] Tests: happy path + timeouts + errores

**Implementación:**
```typescript
// wms/src/middleware/validateWithBSale.ts
async function validateProductStock(productId: string, qty: number) {
  const bsaleStock = await bsaleApi.getStock(productId);
  if (qty > bsaleStock) {
    throw new ValidationError(`Stock insuficiente en BSale: ${bsaleStock}`);
  }
}

async function validateClientCapacity(clientPhone: string, amount: number) {
  const client = await bsaleApi.getClient(clientPhone);
  if (client.remainingCredit < amount) {
    throw new ValidationError(`Crédito insuficiente`);
  }
}
```

**Estimado:** 2 semanas (incluye testing)

---

#### 5. **Panel para Cliente — Autogestión**
**Dependencia:** Feature #1 + #2 (BD clientes)

**Scope:**
- [ ] Página: `/clientes/portal`
- [ ] Autenticación: teléfono + código OTP (SMS)
- [ ] Features:
  - [ ] Ver historial de pedidos (tabla filtrable)
  - [ ] Crear nuevo pedido (alternativa a WhatsApp)
  - [ ] Ver estado entrega (tracking)
  - [ ] Gestionar direcciones
  - [ ] Reordenar pedido anterior (1-click)
  - [ ] Descargar factura PDF
- [ ] Notificaciones: email automático per estado
- [ ] Responsive: mobile-first

**Stack:** React 19 + TailwindCSS  
**Estimado:** 2.5 semanas

**Componentes:**
```
/clientes/portal
├── Login (OTP)
├── Dashboard
│   ├── ResumenPedidos
│   ├── ListaPedidos (con filtros)
│   ├── CrearPedido (form)
│   ├── Tracking (mapa + timeline)
│   ├── Direcciones
│   └── Perfil
└── Confirmación (pedido creado)
```

---

#### 6. **Cruces Precisos con BD Clientes (Alertas Personalizadas)**
**Dependencia:** Feature #2 + #5

**Scope:**
- [ ] Integración BD clientes existente
- [ ] Campos: teléfono, límite crédito, zona entrega, contactos
- [ ] Validación en tiempo real:
  - [ ] ¿Cliente existe en BD?
  - [ ] ¿Cantidad cumple mínimo habitual?
  - [ ] ¿Zona de entrega válida?
  - [ ] ¿Crédito disponible?
- [ ] Alertas personalizadas:
  - [ ] Cambio de precio vs última compra
  - [ ] Stock bajo de productos habituales
  - [ ] Sugerencias basadas en historial
- [ ] Ratificación: mostrar alerta, cliente debe confirmar

**Ejemplo:**
```
Cliente: "Juan Pérez"
Última compra: 10 litros leche hace 3 días
Pedido actual: 5 litros
ALERTA: "Últimamente pides 10L, ¿seguro 5L? ✓ Confirmar / ✗ Cambiar"
```

**Estimado:** 1.5 semanas

---

#### 7. **Notificaciones Mejoradas + Recordatorios Semanales**
**Dependencia:** Features #1, #2, #5

**Scope:**
- [ ] **Notificaciones mejoradas:**
  - [ ] Contenido personalizado (nombre cliente, producto específico)
  - [ ] Call-to-action claro ("Confirmar entrega", "Cambiar dirección", etc.)
  - [ ] Priorización (urgente vs informativa)
  - [ ] Canales: email + SMS + WhatsApp + in-app
  - [ ] Historial accesible en panel cliente
- [ ] **Recordatorios semanales (lunes):**
  - [ ] Job BullMQ: corra cada lunes 9am
  - [ ] Contenido: "Aquí va tu resumen semanal"
  - [ ] Personalizados por cliente
  - [ ] Plantillas HTML profesionales

**Plantillas:**
```
📧 Email (transaccional)
├── Confirmación pedido (inmediato)
├── Cambio de estado (en tránsito, entregado)
├── Resumen semanal (lunes)
└── Alertas (stock bajo, precio cambió)

📱 SMS (crítico)
├── Confirmación código OTP
├── Entrega llegando
└── Alerta urgente

💬 WhatsApp (preferencia cliente)
├── Estado pedido
└── Soporte
```

**Job BullMQ:**
```typescript
// wms/src/jobs/weeklyReminder.job.ts
const job = queue.add('weeklyReminder', {}, {
  repeat: { cron: '0 9 * * 1' } // Lunes 9am
});

await job.process(async (data) => {
  const clients = await getActiveClients();
  for (const client of clients) {
    const summary = await generateWeeklySummary(client.id);
    await sendEmail(client.email, 'Resumen Semanal', summary);
  }
});
```

**Estimado:** 1 semana

---

### 🟢 **MEDIO (Semana 3+)**

#### 8. **Roles: Vendedor + Distribuidor**
**Dependencia:** Feature #1 + #5

**Scope:**
- [ ] 3 roles en sistema:
  - [ ] **Admin:** Acceso total
  - [ ] **Vendedor:** Crea/edita pedidos, ve clientes, historial
  - [ ] **Distribuidor:** Ve pedidos asignados, actualiza estado, registra entrega
- [ ] Permisos:
  - [ ] Vendedor: POST/PATCH /api/orders, GET /api/clients/{id}
  - [ ] Distribuidor: GET /api/orders?status=pending, PATCH /api/orders/{id}/status
- [ ] UI diferenciada por rol
- [ ] Auditoría: quién hizo qué

**Estimado:** 1 semana

---

## 📅 Timeline Recomendado

```
SEMANA 1 (10-14 Junio)  🔴 BLOCKER
├─ Sesión cliente: pipeline + árbol de decisión
├─ Solicitar BD clientes (esquema)
├─ Revisar BSale API factibilidad
└─ Output: 3 documentos clave

SEMANA 2 (17-21 Junio)  🟡 ALTO
├─ Panel cliente (50%)
├─ Validaciones BSale (50%)
└─ Pruebas iniciales

SEMANA 3 (24-28 Junio)  🟡 ALTO
├─ Panel cliente (completar)
├─ Validaciones BSale (completar)
├─ Alertas personalizadas (inicio)
└─ Deploy beta

SEMANA 4 (1-5 Julio)    🟢 MEDIO
├─ Alertas personalizadas (completar)
├─ Notificaciones + recordatorios
├─ Roles vendedor/distribuidor
└─ Testing + QA

SEMANA 5 (8-12 Julio)   🚀 PRODUCCIÓN
├─ Fix finales
├─ Documentación
├─ Training cliente
└─ LAUNCH
```

---

## 🏗️ Arquitectura Cambios

### Base de Datos
```sql
-- Nuevas tablas
ALTER TABLE users ADD COLUMN role ENUM('admin', 'vendedor', 'distribuidor');

-- Tabla clientes (importada desde BD cliente)
CREATE TABLE clientes_sync (
  id UUID PRIMARY KEY,
  telefono VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  nombre VARCHAR(100) NOT NULL,
  zona VARCHAR(50),
  limite_credito DECIMAL(10,2),
  credito_disponible DECIMAL(10,2),
  sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_clientes_sync_telefono ON clientes_sync(telefono);

-- Historial de alertas
CREATE TABLE alertas_cliente (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES clientes_sync(id),
  tipo ENUM('precio_cambio', 'stock_bajo', 'cantidad_baja', 'credito_bajo'),
  contenido JSONB,
  ratificada BOOLEAN DEFAULT FALSE,
  ratificada_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES clientes_sync(id),
  tipo VARCHAR(50),
  canal ENUM('email', 'sms', 'whatsapp', 'inapp'),
  contenido TEXT,
  enviada BOOLEAN DEFAULT FALSE,
  enviada_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backend
```typescript
// Nuevas carpetas/archivos
wms/src/
├── services/
│   ├── bsaleIntegration.service.ts      // Consultas a BSale
│   ├── clienteSync.service.ts            // Sincronización BD clientes
│   ├── alertasCliente.service.ts         // Lógica alertas personalizadas
│   └── notificaciones.service.ts         // Envío emails/SMS/WhatsApp
├── jobs/
│   ├── weeklyReminder.job.ts             // Job semanal
│   └── clientSync.job.ts                 // Sync BD clientes
├── middleware/
│   ├── validateWithBSale.ts              // Validaciones BSale
│   └── roleBasedAccess.ts                // Permisos por rol
└── routes/
    ├── clientes.routes.ts                // CRUD clientes
    └── notificaciones.routes.ts          // Historial notificaciones
```

### Frontend
```typescript
// Nuevas páginas
crm/src/
├── pages/
│   ├── ClientPortal.jsx                  // Panel cliente autogestión
│   └── admin/
│       ├── Notificaciones.jsx            // Historial notificaciones
│       └── Roles.jsx                     // Gestión permisos
└── components/
    ├── AlertasCliente.jsx                // Mostrar alertas
    ├── FormCrearPedido.jsx               // Crear desde panel
    └── Tracking.jsx                      // Seguimiento con mapa
```

---

## ✅ Checklist Implementación

### Fase 2.1: Fundamentos (Semana 1-2)
- [ ] Árbol de decisión documentado
- [ ] BD clientes integrada
- [ ] Validaciones BSale funcionales
- [ ] Tests: 80% cobertura

### Fase 2.2: Interfaz Cliente (Semana 2-3)
- [ ] Panel cliente desplegado
- [ ] Autenticación OTP funcional
- [ ] CRUD pedidos completado
- [ ] Responsive mobile ✓

### Fase 2.3: Inteligencia (Semana 3-4)
- [ ] Alertas personalizadas funcionan
- [ ] Notificaciones multi-canal
- [ ] Recordatorios semanales
- [ ] Historial de notificaciones

### Fase 2.4: Producción (Semana 4-5)
- [ ] Roles + permisos implementados
- [ ] Auditoría completa
- [ ] Documentación API (Swagger)
- [ ] Training cliente completado
- [ ] ✅ LAUNCH a producción

---

## 🚀 Definición de "Listo"

Una feature está lista cuando:
1. ✅ Código pasó code review
2. ✅ Tests pasan (unit + integration)
3. ✅ Documentado (README + Swagger)
4. ✅ Desplegado en ambiente staging
5. ✅ Cliente validó el flujo
6. ✅ Monitoreo en lugar

---

## 📞 Preguntas Críticas a Resolver en Semana 1

1. **¿Cuál es la estructura exacta de tu BD de clientes?**
   - Necesito: SQL dump o esquema ERD
   - O: CSV/JSON de ejemplo

2. **¿Qué información MÍNIMA necesitas en cada pedido?**
   - Nombre, teléfono, producto, cantidad, dirección (entrega)?
   - ¿O menos?

3. **¿Qué rechaza automáticamente?**
   - Stock = 0? → Rechazo automático
   - Crédito = 0? → Rechazo automático
   - Zona no cubierta? → ¿Qué hago?

4. **¿Cada cliente tiene 1 usuario o varios?**
   - ¿Múltiples contactos por cliente?
   - ¿Permisos diferentes por contacto?

5. **¿Vendedor y Distribuidor son personas diferentes?**
   - ¿O el mismo usuario con 2 roles?
   - ¿Qué ve cada uno?

6. **¿Qué datos históricos tienes?**
   - Pedidos últimos 6 meses?
   - ¿Quiero análisis/reportes?

---

**Estado:** 📋 Diseño completado  
**Siguiente:** Confirmación cliente + inicio Semana 1  
**Última actualización:** 9 de Junio, 2026
