# 🔴 BLOCKER 2: Solicitud BD de Clientes

**Objetivo:** Obtener acceso a BD de clientes existente (estructura + datos de prueba)  
**Plazo:** 24-48 horas  
**Entregable:** CSV/JSON/SQL dump con esquema

---

## 📧 Email para Enviar al Cliente

```
Asunto: URGENTE — Necesito acceso a BD de clientes para integración

Hola [Nombre],

Para completar la Fase 2 del bot, necesito tu Base de Datos de Clientes.

Específicamente necesito:

1. ESTRUCTURA (esquema)
   ¿Qué campos tiene cada cliente?
   ¿En qué tabla/sistema está?

2. DATOS DE PRUEBA
   10-20 clientes de ejemplo (con datos reales o anónimos)

3. INFORMACIÓN DE ACCESO
   ¿Cómo acceso? ¿API, CSV, SQL, etc.?

VER DETALLES MÁS ABAJO ↓

¡Gracias!
[Tu nombre]
```

---

## 🎯 Lo Que Necesito Exactamente

### **Opción A: Si tienes SQL (PostgreSQL/MySQL)**

```sql
-- DAME:
1. CREATE TABLE statements
2. Sample data (10 filas reales o anónimos)

-- EJEMPLO DE LO QUE NECESITO:
CREATE TABLE clientes (
  id INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  direccion_default VARCHAR(255),
  ciudad VARCHAR(50),
  zona_entrega VARCHAR(50),
  limite_credito DECIMAL(10,2),
  saldo_credito_disponible DECIMAL(10,2),
  estado VARCHAR(20), -- 'activo', 'inactivo', 'bloqueado'
  fecha_registro TIMESTAMP,
  ...otros campos que tengas
);

INSERT INTO clientes VALUES (...);
```

**Cómo me lo envías:**
- Option 1: Dump SQL → Archivo .sql
- Option 2: CSV de la tabla → Archivo .csv
- Option 3: Link a database de prueba (con credenciales seguras)

---

### **Opción B: Si tienes CSV/Excel**

```
Necesito un CSV con todas las columnas, ej:

id,nombre,telefono,email,direccion,ciudad,zona,limite_credito,saldo_disponible,estado
1,Juan Pérez,+56912345678,juan@gmail.com,Calle 5 #123,Guaca,Centro,500000,450000,activo
2,María García,+56987654321,maria@gmail.com,Calle 10 #456,Santiago,Sur,1000000,200000,activo
3,Carlos López,+56922334455,carlos@gmail.com,Calle 15 #789,Providencia,Norte,300000,0,bloqueado
...
```

**Formato:**
- File: `clientes_muestra.csv`
- Encoding: UTF-8
- Separador: coma (,)
- Incluir header (nombres columnas)
- 10-20 filas de prueba

---

### **Opción C: Si está en CRM/Sistema Externo**

```
¿Tienes API para consultar clientes?

Necesito:
1. Endpoint: [URL]
2. Método: GET o POST?
3. Parámetros: [ej: ?phone=+56912345678]
4. Respuesta ejemplo: [JSON]
5. Autenticación: [API key, token, etc.]
6. Rate limit: ¿Máximo requests/minuto?

EJEMPLO:
GET /api/clientes?phone=+56912345678
Auth: Bearer token_aqui
Response:
{
  "id": "1",
  "nombre": "Juan Pérez",
  "telefono": "+56912345678",
  "email": "juan@gmail.com",
  ...
}
```

---

## 📋 Campos Mínimos Necesarios

**OBLIGATORIO tener:**

```
id              → Identificador único del cliente
nombre          → Nombre completo
telefono        → Número (será clave de búsqueda)
email           → Para notificaciones
```

**MUY IMPORTANTE tener:**

```
direccion_default   → Dirección de entrega habitual
ciudad              → Ciudad/región
zona_entrega        → Zona servida (para validar cobertura)
limite_credito      → Cuánto máximo puede comprar
saldo_disponible    → Cuánto puede usar HOY
estado              → activo/inactivo/bloqueado
```

**NICE TO HAVE:**

```
contactos           → Múltiples personas (si aplica)
historial_compra    → Últimas compras
notas              → Información especial ("Paga lento", etc.)
fecha_registro     → Desde cuándo es cliente
```

---

## ✅ Checklist: Lo Que Me Enviarás

```
[ ] Estructura de la tabla (CREATE TABLE o descripción)
[ ] 10-20 registros de ejemplo
[ ] Explicación de cada campo
[ ] Información sobre acceso:
    [ ] Es datos estáticos? (me das CSV/SQL una vez)
    [ ] O es dinámica? (necesito API para sincronizar)
[ ] Si es API:
    [ ] Endpoint
    [ ] Autenticación (API key, etc.)
    [ ] Rate limiting
    [ ] Formato respuesta (JSON)
```

---

## 🔄 Alternativa: Estructura Sugerida

Si NO tienes los datos organizados, sugiero esta estructura:

```sql
-- Tabla de clientes base
CREATE TABLE clientes (
  id UUID PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  estado ENUM('activo', 'inactivo', 'bloqueado') DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_at TIMESTAMP
);

-- Tabla de direcciones (un cliente puede tener varias)
CREATE TABLE clientes_direcciones (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  calle VARCHAR(255) NOT NULL,
  numero VARCHAR(10),
  ciudad VARCHAR(50) NOT NULL,
  zona VARCHAR(50),
  es_default BOOLEAN DEFAULT FALSE,
  fecha_agregada TIMESTAMP
);

-- Tabla de crédito
CREATE TABLE clientes_credito (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) UNIQUE,
  limite_credito DECIMAL(10,2),
  saldo_disponible DECIMAL(10,2),
  último_pago TIMESTAMP,
  próximo_pago_esperado TIMESTAMP
);

-- Tabla de contactos (múltiples personas por cliente)
CREATE TABLE clientes_contactos (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  nombre VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(100),
  rol VARCHAR(50), -- 'gerente', 'comprador', 'ejecutivo', etc.
  activo BOOLEAN DEFAULT TRUE
);

-- Tabla de historial de compras (para análisis)
CREATE TABLE clientes_historial (
  id UUID PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  pedido_id VARCHAR(100),
  fecha TIMESTAMP,
  monto DECIMAL(10,2),
  cantidad_items INT,
  ...
);
```

---

## 📞 Preguntas Adicionales

Además de los datos, pregunta:

```
1. ¿Los datos de clientes se actualizan cómo?
   [ ] Manualmente (ej: una vez al mes)
   [ ] Automáticamente (ej: cada hora)
   [ ] En tiempo real

2. ¿Cuántos clientes activos tienes?
   [ ] < 100
   [ ] 100-500
   [ ] 500-1000
   [ ] > 1000

3. ¿Cada cliente es 1 usuario o pueden ser varios?
   [ ] 1 usuario por cliente
   [ ] Múltiples contactos por cliente

4. ¿Información sensible a ocultar?
   [ ] Datos reales (completos)
   [ ] Datos anónimos (nombres/números ficticios)
   [ ] Mix (datos reales + ficticio)

5. ¿Tienes histórico de pedidos?
   [ ] Sí, de últimos X meses
   [ ] No
   [ ] Parcial

6. ¿Zonas de entrega / cobertura definidas?
   [ ] Sí, lista de zonas:
   [ ] No
```

---

## 📤 Cómo Entregarme los Datos

**Seguridad:**
- ❌ NO envíes por email sin protección
- ✅ SÍ zip protegido con contraseña
- ✅ SÍ upload a Google Drive con acceso restringido
- ✅ SÍ acceso a servidor de pruebas (si tienes)

**Formatos aceptados:**
- .sql (dump SQL)
- .csv (Excel exportado)
- .json (JSON structure)
- API endpoint (con credenciales)

---

## 🎯 Qué Haré con Esta Info

1. **Crear tabla en mi BD:** `clientes_sync`
2. **Validar cliente existe:** Cuando alguien haga pedido por WhatsApp
3. **Mostrar información:** Dirección, crédito, zona, contactos
4. **Generar alertas:** Si cambios vs última compra
5. **Resumen semanal:** Basado en historial de ese cliente

---

## ⏰ Timeline

```
HOY (10 Junio):
└─ Envías estructura + datos

MAÑANA (11 Junio):
├─ Reviso integridad
├─ Creo migraciones
└─ Inicio Feature #4 (Validaciones BSale)

SEMANA 2:
└─ Panel cliente integrado con tus datos
```

---

**Email Template (copiar/pegar):**

```
Asunto: [BLOCKER 2] BD de Clientes para integración

Hola [Contacto Cliente],

Para la Fase 2 del bot de pedidos, necesito acceso a tu BD de clientes.

Puede ser:
- SQL dump
- CSV de la tabla
- Endpoint API
- Link a base datos

Estructura mínima:
id, nombre, telefono, email, direccion, ciudad, zona, limite_credito, saldo_disponible, estado

Incluir: 10-20 clientes de ejemplo

¿Puedes enviar esto en 24-48h?

Gracias,
[Tu nombre]
```

---

**Status:** 🔴 Pendiente respuesta cliente  
**Plazo:** 48 horas máximo  
**Siguiente:** BLOCKER 3 (BSale API)
