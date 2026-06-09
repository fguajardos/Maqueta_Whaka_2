# 🔴 BLOCKER 1: Sesión de Árbol de Decisión

**Objetivo:** Mapear exactamente qué datos son OBLIGATORIOS y cuándo rechazar pedidos  
**Participantes:** [Tu nombre] + [Contacto cliente]  
**Duración:** 60 minutos  
**Output:** `DECISION_TREE.md` finalizado

---

## 📋 Agenda de Sesión (60 min)

### 0-10 min: Contexto
- "Necesito que definamos exactamente qué pasa en cada paso del bot"
- "¿Cuándo digo SÍ a un pedido? ¿Cuándo digo NO?"
- "¿Hay información que SIEMPRE necesito?"

### 10-35 min: Preguntas Clave (Completa con cliente)

#### **1. VALIDACIONES DE CLIENTE** (5 min)

```
¿QUÉ VALIDO EN CLIENTE?

[ ] Nombre cliente — ¿mínimo de caracteres?
    ¿Aceptas "J" o necesitas mínimo 2 caracteres?
    
[ ] Teléfono — ¿es obligatorio? ¿formato?
    ¿Qué hago si es inválido?

[ ] ¿Cliente debe existir en tu BD?
    Si NO EXISTE:
    ¿Digo "Cliente no encontrado, no puedo procesar"?
    O ¿"Créame como nuevo cliente"?

[ ] ¿Cliente tiene LÍMITE DE CRÉDITO?
    Si SALDO = $0:
    ¿Rechazos automático el pedido?
    O ¿"Necesita aprobar manager"?

[ ] ¿Clientes por ZONA?
    Si cliente pide entrega en ZONA NO CUBIERTA:
    ¿Rechazo automático?
    O ¿"Avisaré a distribuidor"?
```

**Tu respuesta:**
```
Nombre: ___________________
Teléfono: __________________
Cliente existe? Sí / No / Crear
Límite crédito: Rechazar / Revisar
Zona cubierta: Rechazar / Revisar
```

---

#### **2. VALIDACIONES DE PRODUCTO** (5 min)

```
¿QUÉ VALIDO EN PRODUCTO?

[ ] ¿Listado de productos es FIJO o DINÁMICO?
    Fijo: 5 productos siempre (Leche, Yogurt, etc.)
    Dinámico: Viene de tu BD/BSale

[ ] Si PRODUCTO NO EXISTE:
    ¿Rechazo el pedido?
    O ¿"Permito escribir producto libre"?

[ ] Si PRODUCT ESTÁ DESCONTINUADO:
    ¿Rechazo automático?
    O ¿"Sugiero alternativa similar"?

[ ] ¿Validar precio?
    Si precio cambió desde ayer:
    ¿Alerto cliente? ¿Pido confirmación?
```

**Tu respuesta:**
```
Productos: Fijo (5) / Dinámico (BD)
No existe: Rechazar / Permitir libre
Descontinuado: Rechazar / Sugerir
Precio cambió: Alertar / Silencioso
```

---

#### **3. VALIDACIONES DE CANTIDAD** (5 min)

```
¿QUÉ VALIDO EN CANTIDAD?

[ ] ¿STOCK REAL?
    Si cliente pide 100L leche y solo tienes 50L:
    ¿Rechazo automático?
    O ¿"Te puedo dar 50L, ¿está bien?"?

[ ] ¿CANTIDAD MÍNIMA?
    Ejemplo: Leche solo se vende en packs de 10?
    Si cliente pide 5:
    ¿Rechazo? ¿Aumento a 10? ¿Alerto?

[ ] ¿CANTIDAD MÁXIMA?
    Ejemplo: No vendo más de 100L por cliente?
    ¿Rechazo si me pide 150L?

[ ] ¿COMPARAR CON HISTORIAL?
    Si cliente siempre compra 10L y hoy pide 2L:
    ¿Alerto "Esperaba 10L, ¿seguro 2L?"?
    ¿O dejo que decida?
```

**Tu respuesta:**
```
Stock insuficiente: Rechazar / Ofrecer disponible
Cantidad mínima: Rechazo / Ajusto / Alerto
Cantidad máxima: Rechazar / Alertar
Vs historial: Alertar / Silencioso
```

---

#### **4. VALIDACIONES DE DESPACHO** (5 min)

```
¿QUÉ VALIDO EN DESPACHO?

[ ] TIPOS DE DESPACHO disponibles:
    Opción 1: ___________
    Opción 2: ___________
    Opción 3: ___________

[ ] Si RETIRO:
    ¿Necesito dirección? NO
    ¿Dónde retira? En tu local fijo?

[ ] Si ENTREGA:
    [ ] ¿Es obligatoria la DIRECCIÓN?
    [ ] ¿Dirección debe estar en tu sistema?
        Si NO EXISTE:
        ¿La creo? ¿O rechazo?
    [ ] ¿Validar ZONA DE ENTREGA?
        Si NO CUBRE:
        ¿Rechazo? ¿"Disponible en X días"?
    [ ] ¿Costo de FLETE?
        ¿Es fijo o depende distancia?
        ¿Quién lo calcula?

[ ] HORARIOS:
    ¿Hay horarios específicos de entrega?
    Ejemplo: "Lunes a Viernes 9am-6pm"
    Si cliente pide entrega domingo:
    ¿Rechazo? ¿"Para el lunes"?
```

**Tu respuesta:**
```
Tipos despacho:
- Opción 1: ___________
- Opción 2: ___________

Dirección obligatoria: Sí / No
Zona no cubre: Rechazar / Avisar
Flete: Fijo / Dinámico / Gratis
Horarios: Sí / No (¿cuáles?)
```

---

#### **5. VALIDACIONES DE PAGO** (3 min)

```
¿QUÉ VALIDO EN PAGO?

[ ] MÉTODOS DISPONIBLES:
    Opción 1: ___________
    Opción 2: ___________
    Opción 3: ___________

[ ] ¿VALIDACIÓN DE CRÉDITO?
    Si cliente elige "Crédito":
    ¿Verifico saldo? ¿Aprueba manager?

[ ] ¿TRANSBANK / PAGOS ONLINE?
    ¿Integración ya existe?
    O ¿Va para Fase 2?

[ ] ¿CHEQUE?
    ¿Aceptas cheques? ¿Validación fecha?
```

**Tu respuesta:**
```
Métodos disponibles:
- Opción 1: ___________
- Opción 2: ___________
- Opción 3: ___________

Validar crédito: Sí / No
Transbank: Ya existe / Fase 2
```

---

#### **6. CASOS ESPECIALES** (5 min)

```
¿QUÉ PASA EN ESTOS CASOS?

[ ] Cliente pide 100 unidades de un producto
    Tienes 50, puedes conseguir más en 2 días
    ¿Digo "Aprobado, esperá 2 días"?
    O ¿"Solo tengo 50, ¿quieres?"?

[ ] Cliente es NUEVO (no existe en BD)
    ¿Lo rechazas automático?
    O ¿"Cuéntame quién eres"?

[ ] Pedido es MUY GRANDE (ej: $500.000)
    ¿Necesita aprobación manager?
    ¿Cómo notifica?

[ ] Cliente pide ENTREGA INMEDIATA (hoy)
    Tienes stock pero es muy tarde
    ¿Digo "No hay tiempo"?
    ¿O "Mañana temprano"?

[ ] Hay ERROR EN VALIDACIÓN (ejemplo: BD down)
    ¿Rechazo el pedido?
    ¿O "Espera, me reconecto"?
```

**Tu respuesta (libre):**
```
Stock parcial: ___________
Cliente nuevo: ___________
Pedido grande: ___________
Entrega inmediata: ___________
Error validación: ___________
```

---

### 35-50 min: Mapeo del Árbol

Con las respuestas anteriores, mapearemos:

```
INICIO (Cliente entra al bot)
│
├─→ ¿Cliente existe en BD?
│   ├─ NO → ¿Permitir nuevo? SÍ/NO
│   │   ├─ NO → RECHAZAR "Cliente no registrado"
│   │   └─ SÍ → Pedirle datos → Continuar
│   │
│   └─ SÍ → ¿Crédito disponible?
│       ├─ NO → RECHAZAR "Crédito agotado"
│       └─ SÍ → Continuar
│
├─→ ¿Producto existe?
│   ├─ NO → ¿Permitir nombre libre? SÍ/NO
│   │   ├─ NO → RECHAZAR
│   │   └─ SÍ → Continuar
│   └─ SÍ → ¿Stock suficiente?
│       ├─ NO → RECHAZAR/OFRECER disponible
│       └─ SÍ → Continuar
│
├─→ ¿Cantidad válida?
│   ├─ Mínima OK? NO → RECHAZAR
│   ├─ Máxima OK? NO → RECHAZAR
│   └─ Historial OK? Alertar si necesario
│
├─→ ¿Despacho válido?
│   └─ Si ENTREGA:
│       ├─ ¿Zona cubierta? NO → RECHAZAR
│       ├─ ¿Horario disponible? NO → CAMBIAR
│       └─ ¿Flete aplica? SÍ → Sumar costo
│
├─→ ¿Pago válido?
│   └─ Si CRÉDITO: ¿Aprobado? NO → RECHAZAR
│
└─→ CONFIRMAR PEDIDO
    │
    ├─ Cliente confirma → GUARDAR EN BD + Notificar
    └─ Cliente cancela → CANCELAR flujo
```

### 50-60 min: Confirmación

- [ ] Cliente firma documento con árbol mapeado
- [ ] Acuerdos claros sobre "rechazos automáticos"
- [ ] Contacto para cambios (si necesita ajustar luego)

---

## 🎯 Output Esperado

Después de esta sesión, tendré:

```markdown
# DECISION_TREE.md

## Validaciones Cliente
- Nombre: mínimo X caracteres
- Teléfono: OBLIGATORIO, formato [spec]
- Existe BD: [SÍ/NO/CREAR]
- Crédito: [RECHAZAR/AVISAR]
- Zona: [RECHAZAR/AVISAR]

## Validaciones Producto
[Completo]

## Validaciones Cantidad
[Completo]

## Validaciones Despacho
[Completo]

## Validaciones Pago
[Completo]

## Casos Especiales
[Completo]

## Árbol de Decisión
[Diagrama ASCII o mermaid]
```

---

## 📝 Para Enviarlo

**Copia esto en email/chat:**

```
Hola [Cliente],

Necesito que respondas estas preguntas para que el bot funcione exactamente como lo necesitas:

1. VALIDACIONES DE CLIENTE (5 min): [Ver más arriba]
2. VALIDACIONES DE PRODUCTO (5 min): [Ver más arriba]
3. VALIDACIONES DE CANTIDAD (5 min): [Ver más arriba]
4. VALIDACIONES DE DESPACHO (5 min): [Ver más arriba]
5. VALIDACIONES DE PAGO (3 min): [Ver más arriba]
6. CASOS ESPECIALES (5 min): [Ver más arriba]

Puedo hacerlo en:
- Video call 30 min (más rápido)
- Email con respuestas (más tiempo)
- Sesión presencial

¿Prefieres?

[Tu nombre]
```

---

**Estado:** 📋 Listo para sesión  
**Tiempo estimado:** 60 min (o email + 24h respuesta)  
**Siguiente:** Documento DECISION_TREE.md completado
