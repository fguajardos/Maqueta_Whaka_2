# 🔴 BLOCKER 3: Revisar Factibilidad BSale API

**Objetivo:** Verificar qué permisos tiene tu API KEY actual de BSale  
**Output:** `BSALE_API_ANALYSIS.md` con capacidades/limitaciones  
**Plazo:** 24 horas (puedo hacer parte del análisis)

---

## 📋 Qué Necesito Revisar

Tu API KEY de BSale actual tiene estos permisos. Necesito saber:

### **1. ¿Puedo Consultar PRODUCTOS?**

```
Endpoint: GET /products
Necesito:
- [ ] ¿Funciona?
- [ ] ¿Devuelve lista de productos?
- [ ] ¿Puedo filtrar por ID específico?
- [ ] ¿Velocidad aceptable? (< 1 segundo)
- [ ] ¿Incluye precio unitario?
```

**Test que haremos:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.bsale.cl/v1/products.json

# Esperado:
{
  "href": "...",
  "count": 500,
  "limit": 50,
  "offset": 0,
  "data": [
    {
      "href": "...",
      "id": 1,
      "name": "Leche Descremada",
      "description": "...",
      "state": 0,
      "unitOfMeasure": { "id": 1, "name": "litro" },
      "commercialTaxType": {...},
      "price": 1200,
      ...
    }
  ]
}
```

---

### **2. ¿Puedo Consultar STOCK?**

```
Endpoint: GET /products/{id}/stock_movements
Necesito:
- [ ] ¿Funciona?
- [ ] ¿Devuelve stock actual?
- [ ] ¿Puedo filtrar por sucursal/bodega?
- [ ] ¿Stock por lote o solo total?
- [ ] ¿Actualización en tiempo real?
```

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.bsale.cl/v1/products/1/stock_movements.json

# Esperado:
{
  "data": [
    {
      "id": 1,
      "quantity": 50,
      "movementType": "entrada",
      "date": "2026-01-10T10:00:00-03:00",
      ...
    }
  ]
}
```

**Alternativa:** Si `/stock_movements` no da stock actual:
```bash
GET /products/1/stocks.json
# Esperado: total disponible
```

---

### **3. ¿Puedo Consultar CLIENTES?**

```
Endpoint: GET /customers
Necesito:
- [ ] ¿Funciona?
- [ ] ¿Puedo filtrar por teléfono?
- [ ] ¿Puedo filtrar por RUT/ID?
- [ ] ¿Devuelve datos: nombre, email, dirección?
- [ ] ¿Límite de crédito disponible?
- [ ] ¿Saldo actual vs límite?
```

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.bsale.cl/v1/customers.json

# Esperado:
{
  "data": [
    {
      "id": 123,
      "name": "Juan Pérez",
      "email": "juan@gmail.com",
      "phone": "+56912345678",
      "rut": "12345678-9",
      "address": "Calle 5 #123",
      "city": "Guaca",
      "creditLimit": 500000,
      "creditSummary": {
        "available": 450000,
        "used": 50000,
        "limit": 500000
      },
      ...
    }
  ]
}
```

---

### **4. ¿Puedo CREAR DOCUMENTOS (Órdenes/Facturas)?**

```
Endpoint: POST /documents
Necesito:
- [ ] ¿Puedo crear órdenes de venta (presupuesto)?
- [ ] ¿Puedo crear facturas?
- [ ] ¿Qué campos son obligatorios?
- [ ] ¿Puedo agregar múltiples items?
- [ ] ¿Valida stock automático?
- [ ] ¿Devuelve número de documento?
```

**Test:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.bsale.cl/v1/documents.json \
  -d '{
    "documentTypeId": 9,  # 9=Orden, 2=Factura
    "customerId": 123,
    "officeId": 1,
    "details": [
      {
        "productId": 1,
        "quantity": 5,
        "comment": "Leche Descremada"
      }
    ]
  }'

# Esperado respuesta con:
{
  "id": 999,
  "number": "ORD-0001",
  "state": 0,
  "details": [...]
}
```

---

### **5. ¿LIMITACIONES?**

```
Rate Limiting:
- [ ] ¿Máximo requests/minuto? ___
- [ ] ¿Máximo requests/hora? ___
- [ ] ¿Rate limit resetea cada hora? ¿Cada día?

Latencia:
- [ ] Tiempo promedio respuesta: ___ ms
- [ ] Máximo aceptable: < 2000ms

Datos:
- [ ] ¿Puedo descargarvarios (batch) o solo uno por uno?
- [ ] ¿Paginación? Limit: ___ máximo

Sincronización:
- [ ] ¿Datos en tiempo real?
- [ ] ¿O con delay? Cuánto: ___
```

---

## 📧 Email para Enviar a Cliente

```
Asunto: Necesito revisar permisos API BSale

Hola [Cliente],

Para integrar el bot con tu sistema BSale, necesito verificar 
qué puede hacer tu API KEY actual.

Necesito acceso a 5 cosas:
1. Consultar productos (precio, descripción)
2. Consultar stock disponible
3. Consultar clientes (nombre, email, teléfono, crédito)
4. Crear documentos (órdenes/facturas) - opcional para MVP
5. Rate limiting / latencia

¿Puedo hacer tests contra tu API de BSale?

Opciones:
A) Me das el token (seguro en repo privado)
B) Me das credenciales de un usuario test
C) Me das reportes de qué endpoints funcionan

¿Cuál prefieres?

[Tu nombre]
```

---

## 🔍 Lo Que Yo Puedo Investigar

Si me das el TOKEN de BSale, puedo hacer tests:

```bash
# 1. Verificar si token es válido
GET /v1/customers.json?limit=1

# 2. Listar todos los endpoints disponibles
GET /v1/

# 3. Probar cada funcionalidad
GET /v1/products.json
GET /v1/products/1/stocks.json
GET /v1/customers.json
GET /v1/customers/123.json
POST /v1/documents.json (test)

# 4. Medir latencia
time curl ...

# 5. Probar rate limiting
for i in {1..100}; do curl ...; done
```

---

## 📋 Checklist: Qué Me Necesitas Dar

```
[ ] API Token de BSale (o credenciales de usuario)
[ ] URL base de API (suele ser https://api.bsale.cl/v1)
[ ] Ambiente: ¿Producción o Test?
[ ] Documentación de API si tienes
[ ] Lista de productos activos en BSale (ej: primeros 10)
[ ] Un cliente de prueba (para testar búsqueda)
[ ] Confirmación: ¿Puedo usar token en desarrollo?
```

---

## 🎯 Output Esperado: `BSALE_API_ANALYSIS.md`

```markdown
# Análisis API BSale - WhakaChile

## Resumen Ejecutivo
✅ API funcional para Fase 2
⚠️ 2 limitaciones identificadas
🔴 1 endpoint no disponible

## 1. Productos
- Status: ✅ Funciona
- Endpoint: GET /products.json
- Response time: 150-300ms
- Límite de items por request: 50
- Recomendación: CACHEAR en Redis 1 hora

## 2. Stock
- Status: ✅ Funciona (via /stock_movements.json)
- Endpoint: GET /products/{id}/stocks.json
- Response time: 100-200ms
- Real-time: Sí
- Recomendación: Consultar en cada pedido (crítico)

## 3. Clientes
- Status: ✅ Funciona
- Endpoint: GET /customers.json
- Búsqueda por teléfono: ❌ NO (necesito filtrar local)
- Búsqueda por RUT: ✅ SÍ
- Crédito: ✅ Devuelve saldo disponible
- Recomendación: Sincronizar cada 6 horas a BD local

## 4. Crear Documentos
- Status: ✅ Funciona (parcial)
- Puedo crear: Órdenes de venta
- No puedo crear: Facturas (necesita permisos adicionales)
- Recomendación: FASE 2, no en MVP

## 5. Rate Limiting
- Límite: 1000 requests/hora
- Latencia promedio: 200ms
- Recomendación: Cachear, no llamar en cada request

## Recomendaciones Implementación
1. Middleware de validación con BSale
2. Cache en Redis (stock = 5 min, clientes = 1 hora)
3. Fallback a BD local si BSale está caído
4. Log de todas las consultas a BSale
5. Alertas si rate limit cerca de alcanzarse

## Limitaciones Conocidas
- No busca cliente por teléfono (necesito sincronizar)
- Facturas requieren permisos adicionales
- Rate limit puede ser cuello de botella si 100+ usuarios
```

---

## 🔧 Si NO Puedo Acceder a BSale API

Si el cliente NO quiere compartir token:

**Plan B:**
```
1. Tú me haces tests manuales de qué endpoints funcionan
2. Me das reportes de respuesta (JSON anonymized)
3. Yo replico la estructura en BD local
4. Sincronizamos datos via CSV/API regularmente
```

**Plan C:**
```
Aplazar validación de BSale a Fase 2.1:
- MVP sin validación BSale
- Fase 2: Validación contra BD local sincronizada
- Fase 2.1: Si cliente lo autoriza, agregar validación real BSale
```

---

## ⏰ Timeline

```
HOY (10 Junio):
└─ Solicito acceso / tests a cliente

MAÑANA (11 Junio):
├─ Recibo info
├─ Hago análisis
└─ Genero BSALE_API_ANALYSIS.md

SEMANA 2 (17 Junio):
└─ Implemento validaciones con BSale
```

---

## 🚀 Si Todo Funciona (Caso Ideal)

```typescript
// wms/src/middleware/validateWithBSale.ts

async function validateProductStock(productId: string, qty: number) {
  // 1. Chequear cache Redis
  let stock = await redis.get(`bsale:stock:${productId}`);
  
  if (!stock) {
    // 2. Consultar BSale
    stock = await bsaleClient.getStock(productId);
    // 3. Cachear 5 minutos
    await redis.setex(`bsale:stock:${productId}`, 300, stock);
  }
  
  if (qty > stock) {
    throw new ValidationError('Stock insuficiente en BSale');
  }
}

async function validateClient(phone: string) {
  // 1. Buscar en BD local (sincronizada)
  let client = await db.cliente.findUnique({ where: { telefono: phone } });
  
  if (!client) {
    // 2. Intentar buscar en BSale (si tengo RUT)
    // 3. Sincronizar a BD local
    // 4. O crear como "cliente pendiente confirmación"
  }
  
  // 5. Validar crédito
  if (client.saldo_disponible <= 0) {
    throw new ValidationError('Crédito insuficiente');
  }
}
```

---

**Status:** 🔴 Pendiente acceso/análisis BSale  
**Plazo:** 48 horas  
**Siguiente:** Implementación Feature #4 (Validaciones)
