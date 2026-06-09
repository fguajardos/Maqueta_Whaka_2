# 🧾 Sistema de Cola de Facturación

**Status:** ✅ Implementado  
**Objetivo:** Capturar datos limpios para facturación, independiente de BSale API  
**Beneficio:** Fallback si BSale no está disponible  

---

## 📋 Resumen Ejecutivo

Cada pedido del bot WhatsApp se agrega **automáticamente** a una **cola de facturación**:

```
WhatsApp Bot
    ↓
[Pedido Confirmado] ✅
    ↓
[Automáticamente agregado a BillingQueue]
    ↓
Admin Panel "Pendiente por Facturar"
    ├─ Si BSale API disponible → Facturar automático
    └─ Si BSale API NO disponible → Facturación manual
```

**Ventajas:**
- ✅ Datos siempre capturados (nunca se pierden)
- ✅ No depende de BSale API
- ✅ Panel administrativo para supervisar
- ✅ Exportar a CSV para proceso manual
- ✅ Historial completo de facturación

---

## 🏗️ Arquitectura

### **Base de Datos: BillingQueue**

```sql
CREATE TABLE billing_queue (
  id UUID PRIMARY KEY,
  
  -- Referencia a orden original
  whatsapp_order_id STRING,
  
  -- Cliente
  client_phone STRING UNIQUE INDEX,
  client_name STRING,
  client_rut STRING,
  client_email STRING,
  
  -- Producto
  product_name STRING,
  product_sku STRING,
  quantity FLOAT,
  unit_of_measure STRING,
  unit_price FLOAT,
  subtotal FLOAT,
  
  -- Entrega
  delivery_address STRING,
  delivery_city STRING,
  delivery_zone STRING,
  delivery_type STRING (retiro|entrega),
  delivery_fee FLOAT,
  
  -- Pago
  payment_method STRING,
  total_amount FLOAT,
  
  -- Estados
  status STRING DEFAULT 'pendiente'
    -- pendiente: Aún no facturado
    -- procesando: En proceso de facturación
    -- facturado: ✅ Facturado en BSale
    -- error: ❌ Error en facturación
  
  -- Información BSale (si se facturo)
  bsale_document_id STRING,
  bsale_document_number STRING,
  bsale_invoice_date TIMESTAMP,
  
  -- Errores
  error_message STRING,
  error_count INT DEFAULT 0,
  last_error_at TIMESTAMP,
  
  -- Notas
  admin_notes STRING,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  facturado_at TIMESTAMP,
  
  INDEXES:
  - client_phone
  - status
  - created_at
  - bsale_document_id
)
```

---

## 🔄 Flujo Completo

### **1. Pedido WhatsApp se Crea** ✅

```typescript
// BotPedidosWhatsApp.jsx → POST /api/orders/whatsapp/create

{
  clientPhone: '+56912345678',
  clientName: 'Juan Pérez',
  productId: 'leche-desc',
  productName: 'Leche Descremada',
  quantity: 5,
  unitOfMeasure: 'litro',
  unitPrice: 1200,
  deliveryType: 'entrega',
  address: 'Calle 5 #123',
  city: 'Guaca',
  paymentMethod: 'Transferencia'
}
```

### **2. Backend Valida** ✅

```typescript
// whatsappOrders.service.ts → createOrder()

if (errors.length === 0) {
  // ✅ Crear WhatsAppOrder
  const whatsappOrder = await prisma.whatsAppOrder.create({...})
  
  // ✅ Automáticamente: Agregar a BillingQueue
  const billingResult = await billingQueueService.createBillingEntry({
    whatsappOrderId: whatsappOrder.id,
    clientPhone: '+56912345678',
    clientName: 'Juan Pérez',
    ...
  })
}
```

### **3. Entrada en Cola de Facturación** 📝

Tabla `billing_queue` con estado `pendiente`:

```
ID: bill-12345
Teléfono: +56912345678
Nombre: Juan Pérez
Producto: Leche Descremada
Cantidad: 5 litro
Subtotal: $6.000
Dirección: Calle 5 #123, Guaca
Total: $6.000
Estado: ⏳ pendiente
```

### **4. Admin Ve en Panel** 👨‍💼

URL: `http://localhost:5173/billing-queue`

```
Dashboard:
  Pendientes: 15
  Facturados: 234
  Errores: 3
  Monto Pendiente: $45.000

Tabla de Pedidos Pendientes:
  [Juan Pérez] [Leche 5L] [$6.000] [⏳ Pendiente] [Detalles]
  [María García] [Yogurt 10] [$8.000] [⏳ Pendiente] [Detalles]
  ...
```

### **5. Opciones de Facturación**

#### **Opción A: Automático (si BSale API disponible)**
```
Admin hace click: "Facturar"
  → Llama a BSale API
  → Crea documento/factura
  → Marca como "facturado"
  → Almacena número documento
```

#### **Opción B: Manual (si BSale API NO disponible)**
```
Admin ingresa número documento: "F-001234"
  → Click "Marcar como Facturado"
  → Status cambia a "facturado"
  → Guarda número para referencia
  → Puede facturar después en BSale
```

#### **Opción C: Exportar CSV**
```
Admin click: "Exportar CSV"
  → Descarga todos los pendientes
  → Abre en Excel
  → Procesa manualmente
  → Carga de vuelta a sistema
```

---

## 🛠️ Servicio BillingQueueService

### **Métodos Disponibles**

```typescript
// 1. Crear entrada (se llama automáticamente)
billingQueueService.createBillingEntry({
  whatsappOrderId,
  clientPhone,
  clientName,
  ...
})
→ { success: true, billingId: 'bill-123' }

// 2. Obtener pendientes
billingQueueService.getPendingBillings({
  status: 'pendiente', // o 'error', 'facturado'
  clientPhone: '+56912345678'
})
→ { success: true, count: 5, data: [...] }

// 3. Obtener estadísticas
billingQueueService.getBillingStats()
→ { 
    byStatus: { pendiente: 15, facturado: 234, error: 3 },
    pendingTotal: 45000
  }

// 4. Marcar como facturado
billingQueueService.markAsInvoiced(
  'bill-123',
  'F-001234', // número documento BSale (opcional)
  'FCF-001234'
)
→ { success: true, message: '✅ Pedido facturado' }

// 5. Marcar como error
billingQueueService.markAsError(
  'bill-123',
  'Error al conectar a BSale: timeout'
)
→ { success: true, status: 'error' }

// 6. Agregar nota
billingQueueService.addNote(
  'bill-123',
  'Cliente confirmó dirección, listo para facturar'
)
→ { success: true }

// 7. Exportar a CSV
billingQueueService.exportToCsv('pendiente')
→ { success: true, csv: '...', count: 15 }
```

---

## 📡 API Endpoints

### **GET /api/billing/pending**
Obtener cola pendiente de facturación

```bash
curl http://localhost:3000/api/billing/pending \
  -H "Authorization: Bearer TOKEN" \
  -H "?status=pendiente"

# Response:
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": "bill-123",
      "clientPhone": "+56912345678",
      "clientName": "Juan Pérez",
      "productName": "Leche Descremada",
      "quantity": 5,
      "totalAmount": 6000,
      "status": "pendiente",
      "createdAt": "2026-06-10T10:30:00Z"
    }
  ]
}
```

### **GET /api/billing/stats**
Obtener estadísticas de facturación

```bash
curl http://localhost:3000/api/billing/stats \
  -H "Authorization: Bearer TOKEN"

# Response:
{
  "success": true,
  "byStatus": {
    "pendiente": 15,
    "facturado": 234,
    "error": 3
  },
  "pendingTotal": 45000
}
```

### **GET /api/billing/:id**
Obtener detalle de un pedido

```bash
curl http://localhost:3000/api/billing/bill-123 \
  -H "Authorization: Bearer TOKEN"
```

### **PATCH /api/billing/:id/invoice**
Marcar como facturado

```bash
curl -X PATCH http://localhost:3000/api/billing/bill-123/invoice \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bsaleDocumentId": "9999",
    "bsaleDocumentNumber": "F-001234"
  }'
```

### **PATCH /api/billing/:id/error**
Marcar como error

```bash
curl -X PATCH http://localhost:3000/api/billing/bill-123/error \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "errorMessage": "Stock insuficiente en BSale"
  }'
```

### **GET /api/billing/export/csv**
Exportar a CSV

```bash
curl http://localhost:3000/api/billing/export/csv?status=pendiente \
  -H "Authorization: Bearer TOKEN" \
  -o billing.csv
```

---

## 🎨 Panel de Facturación (React)

**Componente:** `BillingQueuePanel.jsx`

### **Características:**

1. **Dashboard de Estadísticas**
   - Pedientes: X
   - Facturados: X
   - Errores: X
   - Monto Pendiente: $X

2. **Tabla de Pedidos**
   - Filtrable por estado (pendiente, facturado, error)
   - Ordenable por fecha
   - Búsqueda por cliente

3. **Modal de Detalle**
   - Ver todos los datos del pedido
   - Opción para marcar como facturado
   - Campo para número documento BSale
   - Agregar notas

4. **Exportar CSV**
   - Descarga todos los pendientes
   - Formato: ID, Cliente, Producto, Cantidad, Total, Estado, Fecha

---

## 🚀 Integración en App

### **Opción 1: Agregar a Menú Existente**

En `WhatsAppApp.jsx`:

```jsx
<div className="flex gap-2">
  <button onClick={() => setCurrentView('bot')}>Bot</button>
  <button onClick={() => setCurrentView('pedidos')}>Pedidos</button>
  <button onClick={() => setCurrentView('billing')}>💾 Facturación</button>
</div>

{currentView === 'billing' && <BillingQueuePanel />}
```

### **Opción 2: Página Dedicada**

Crear: `crm/src/pages/BillingPage.jsx`

```jsx
import BillingQueuePanel from '../components/BillingQueuePanel';

export default function BillingPage() {
  return <BillingQueuePanel />;
}
```

---

## 📊 Casos de Uso

### **Caso 1: BSale API Disponible y Funcionando** ✅

```
1. Cliente hace pedido WhatsApp
2. Bot confirma
3. Automáticamente entra en BillingQueue
4. Job periodic (cada 5 min) intenta facturar en BSale
5. Si éxito: status = 'facturado' + número documento
6. Si error: status = 'error' + mensaje
```

### **Caso 2: BSale API NO Disponible** 📝

```
1. Cliente hace pedido WhatsApp
2. Bot confirma
3. Automáticamente entra en BillingQueue (status = 'pendiente')
4. Job intenta facturar en BSale → FALLA
5. Status = 'error' → Admin ve en panel
6. Admin marca manualmente como "facturado"
7. Ingresa número documento: "F-001234"
8. Después, cuando BSale vuelva, sincroniza documentos
```

### **Caso 3: Facturación Manual Completa** 📋

```
1. Cliente hace pedido WhatsApp
2. Bot confirma
3. Admin click "Exportar CSV"
4. Abre en Excel
5. Procesa en sistema contable
6. Vuelve a ingresar número documento en panel
7. Sistema queda actualizado
```

---

## 🔄 Job de Facturación (Fase 2)

**Implementar en `wms/src/jobs/billingProcessor.job.ts`:**

```typescript
// Corre cada 5 minutos
const job = queue.add('processBilling', {}, {
  repeat: { pattern: '*/5 * * * *' }
});

job.process(async (data) => {
  // 1. Obtener todos los pendientes
  const pending = await billingQueueService.getPendingBillings({
    status: 'pendiente'
  });

  // 2. Por cada uno, intentar facturar
  for (const billing of pending.data) {
    try {
      // 3. Llamar a BSale API
      const bsaleResponse = await bsaleClient.createInvoice({
        customerId: billing.clientRut,
        items: [{
          productId: billing.productSKU,
          quantity: billing.quantity,
          price: billing.unitPrice
        }]
      });

      // 4. Si éxito: actualizar
      await billingQueueService.markAsInvoiced(
        billing.id,
        bsaleResponse.documentId,
        bsaleResponse.documentNumber
      );
    } catch (error) {
      // 5. Si error: registrar
      await billingQueueService.markAsError(
        billing.id,
        error.message
      );
    }
  }
});
```

---

## ✅ Checklist Implementación

```
[✅] Tabla BillingQueue creada en Prisma
[✅] Servicio BillingQueueService implementado
[✅] Rutas API /api/billing/* completadas
[✅] Componente React BillingQueuePanel listo
[✅] WhatsAppOrdersService agrega automáticamente a queue
[✅] Migraciones Prisma generadas
[✅] Documentación completada

Pendiente:
[ ] Incluir BillingQueuePanel en navegación CRM
[ ] Job periódico de facturación (Fase 2)
[ ] Sincronización con BSale API (Fase 2)
[ ] Webhooks de notificación (Fase 2)
```

---

## 🎯 Beneficios Finales

| Antes (sin BillingQueue) | Después (con BillingQueue) |
|------------------------|--------------------------|
| Pedidos en WhatsApp solo | Pedidos capturados en BD para siempre |
| Si BSale falla, pierdo el pedido | Si BSale falla, tengo datos para factura manual |
| No hay historial de facturación | Historial completo en sistema |
| Facturación manual sin estructura | Facturación estructurada en panel |
| CSV difícil de generar | Exportar CSV con 1 click |

---

**Estado:** ✅ Implementado y listo para usar  
**Siguiente:** Incluir en menú CRM + Job de facturación (Fase 2)

