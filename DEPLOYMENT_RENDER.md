# 🚀 Deployment Guide — Render.com

**Sistema:** WhakaChile CRM + WMS Integrado  
**Plataforma:** Render.com (PostgreSQL + Express + Vite)  
**Fecha:** 2026-06-16

---

## 📋 Pre-requisitos

- ✅ Cuenta en Render.com
- ✅ GitHub conectado a Render
- ✅ Rama `main` con código listo
- ✅ Variables de entorno configuradas
- ✅ PostgreSQL database en Render (o crear nueva)

---

## 🔧 Variables de Entorno

### Backend (WMS — .env)

```bash
# Server
PORT=3000
NODE_ENV=production

# Database (PostgreSQL en Render)
DATABASE_URL=postgresql://user:password@host:5432/whakachile_prod

# Redis (para BullMQ)
REDIS_URL=redis://user:password@host:port

# JWT
JWT_SECRET=<generate-secure-key>
JWT_REFRESH_SECRET=<generate-secure-key>
JWT_EXPIRES_IN=4h
JWT_REFRESH_EXPIRES_IN=7d

# APIs Externas
BSALE_API_URL=https://api.bsale.cl/v1
BSALE_ACCESS_TOKEN=<token-bsale>

SHOPIFY_STORE_DOMAIN=<tu-tienda>.myshopify.com
SHOPIFY_API_KEY=<key>
SHOPIFY_API_SECRET=<secret>
SHOPIFY_ACCESS_TOKEN=<token>
SHOPIFY_API_VERSION=2024-10
SHOPIFY_WEBHOOK_SECRET=<secret>

SYNCMANAGER_API_URL=https://api.syncmanager.example.com
SYNCMANAGER_API_KEY=<key>
SYNCMANAGER_WEBHOOK_SECRET=<secret>

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000

# Retry
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000

# Stock Sync
STOCK_SYNC_INTERVAL=15
```

### Frontend (CRM — .env)

```bash
VITE_WMS_URL=https://whakachile-wms.onrender.com
VITE_API_TIMEOUT=30000
```

---

## 🔐 Crear PostgreSQL en Render

### Paso 1: Crear base de datos

1. Ir a **Render Dashboard** → **Databases**
2. Click **Create** → **PostgreSQL**
3. Completar:
   - **Name:** `whakachile-db-prod`
   - **PostgreSQL Version:** 14+
   - **Region:** Same as services
4. Click **Create Database**

### Paso 2: Obtener connection string

- Copiar `DATABASE_URL` del dashboard
- Guardar en secretos de Render

---

## 📦 Deploy Backend (WMS)

### Paso 1: Crear Web Service

1. **Render Dashboard** → **Web Services** → **Create**
2. Conectar repositorio GitHub
3. **Build & Deploy Settings:**
   ```
   Name: whakachile-wms
   Environment: Node
   Region: North America (Santiago si disponible)
   Branch: main
   Build Command: npm install && npx prisma migrate deploy && npm run build
   Start Command: npm run start
   ```

4. **Plan:** Choose tier (recomendado: Standard for testing)

### Paso 2: Agregar environment variables

En **Settings** → **Environment:**

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=...
JWT_SECRET=...
# ... resto de variables
```

### Paso 3: Build & Deploy

- Click **Deploy**
- Esperar 10-15 minutos
- Verificar logs: **Logs** tab

### Paso 4: Ejecutar migrations

```bash
# En Render, ejecutar comando one-off:
# Render Dashboard → Service → Shell
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

---

## 🎨 Deploy Frontend (CRM)

### Paso 1: Crear Static Site

1. **Render Dashboard** → **Static Sites** → **Create**
2. Conectar repositorio GitHub
3. **Settings:**
   ```
   Name: whakachile-crm
   Environment: Node
   Region: North America
   Branch: main
   Build Command: cd crm && npm install && npm run build
   Publish Directory: crm/dist
   ```

4. **Plan:** Free o Starter (suficiente para SPA)

### Paso 2: Agregar environment

En **Settings** → **Environment:**

```bash
VITE_WMS_URL=https://whakachile-wms.onrender.com
```

### Paso 3: Build & Deploy

- Click **Deploy**
- Esperar 5-10 minutos
- URL: `https://whakachile-crm.onrender.com`

---

## 🔗 Conectar servicios

### Backend → Database

1. Backend automáticamente usa `DATABASE_URL`
2. Migrations se ejecutan en build

### Frontend → Backend

1. Frontend usa `VITE_WMS_URL` en environment
2. CORS debe estar configurado en WMS:
   ```typescript
   // en index.ts
   app.use(cors({
     origin: [
       'https://whakachile-crm.onrender.com',
       'http://localhost:5173'
     ]
   }));
   ```

---

## ✅ Verificación Post-Deploy

### 1. Backend Health

```bash
curl https://whakachile-wms.onrender.com/health
```

**Esperado:**
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "bsale": { "circuitState": "CLOSED" }
  }
}
```

### 2. Endpoints principales

```bash
# Validar RUT
curl -X POST https://whakachile-wms.onrender.com/api/whatsapp/leads/validate-rut \
  -H "Content-Type: application/json" \
  -d '{"rut": "12.345.678-9"}'

# Obtener catálogo
curl https://whakachile-wms.onrender.com/api/whatsapp/catalog/productos

# Health check billing
curl https://whakachile-wms.onrender.com/api/billing/stats
```

### 3. Frontend accesible

- Abrir `https://whakachile-crm.onrender.com` en navegador
- Verificar que carga sin errores
- Botón "Bot de Pedidos" → debe conectar a WMS

---

## 📊 Monitoreo

### Logs

1. **Render Dashboard** → Service → **Logs**
2. Buscar errores: `ERROR`, `Exception`
3. Filtrar por fecha/hora

### Métricas

1. **Render Dashboard** → Service → **Metrics**
2. Monitorear:
   - CPU usage
   - Memory usage
   - Requests/sec
   - Error rate

### Alertas (Opcional)

```bash
# Configurar en Render Settings → Notifications
- Alert on deploy failure
- Alert on memory limit
- Alert on restart
```

---

## 🔄 CI/CD Pipeline

### Automatic Deploy

- Merge a `main` → Render auto-deploys
- Logs visibles en Render dashboard
- Rollback: Revert commit + Render re-deploys

### Manual Redeploy

```bash
# Render Dashboard → Service → "Manual Deploy"
# o desde CLI:
render deploy <service-id>
```

---

## 🆘 Troubleshooting

### Build fails: "npm ERR! code ENOENT"

```bash
# Error: node_modules ausentes
# Solución:
# Limpieza de Render:
- Settings → Build & Deploy → Clear Cache
- Redeploy
```

### Database connection timeout

```bash
# Error: "Can't reach database server"
# Verificar:
1. DATABASE_URL correcta en env
2. PostgreSQL running en Render
3. Network policies permiten conexión
4. Credentials correctos
```

### CORS errors en frontend

```bash
# Error: "Access to XMLHttpRequest blocked by CORS policy"
# Solución en WMS/index.ts:
app.use(cors({
  origin: 'https://whakachile-crm.onrender.com',
  credentials: true
}));
```

### Prisma migrations fail

```bash
# Error en build: "Prisma schema not found"
# Solución:
1. Asegurar schema.prisma en git
2. Build Command: npx prisma migrate deploy
3. Redeploy
```

---

## 📈 Scaling

### Si tráfico aumenta:

**Backend:**
```
Current: Standard → Upgrade to Professional
- More CPU/Memory
- Auto-scaling
```

**Frontend:**
```
Current: Free/Starter → Upgrade to Pro
- CDN included
```

**Database:**
```
Current: Starter → Upgrade to Standard/Pro
- Better performance
- Backup included
```

---

## 🔐 Seguridad en Producción

### Checklist

- [ ] `JWT_SECRET` es único y fuerte (>32 chars)
- [ ] `DATABASE_URL` contiene credenciales seguras
- [ ] CORS solo permite origen permitido
- [ ] Helmet headers configurados
- [ ] Rate limiting en endpoints públicos
- [ ] Logs no contienen secrets
- [ ] HTTPS solo (Render lo maneja)
- [ ] Database backups habilitados

### Credenciales

```bash
# NUNCA commitear:
- .env files
- jwt_secret en código
- database passwords

# SIEMPRE:
- Usar Render Secrets
- Rotar secrets cada 3 meses
- Auditar acceso a logs
```

---

## 📝 Checklist de Deploy

Pre-Deploy:
- [ ] Git main está limpio (sin cambios uncommitted)
- [ ] Tests pasan localmente
- [ ] Migrations creadas y testeadas
- [ ] Seed data listo
- [ ] Variables de entorno documentadas
- [ ] README con instrucciones actualizado

Deploy:
- [ ] WMS service creado en Render
- [ ] CRM static site creado en Render
- [ ] PostgreSQL database creado
- [ ] Environment variables configuradas
- [ ] Build completó sin errores
- [ ] Migrations ejecutadas post-deploy
- [ ] Seed data ejecutado (si needed)

Post-Deploy:
- [ ] Health endpoint responde ✅
- [ ] Endpoints principales funcionan
- [ ] Frontend carga sin errores
- [ ] Bot puede validar RUT
- [ ] Orders se crean en BD
- [ ] Logs no tienen errores críticos
- [ ] Admin panel es accesible

---

## 🎉 Resultado Final

```
✅ Backend:  https://whakachile-wms.onrender.com
✅ Frontend: https://whakachile-crm.onrender.com
✅ Database: PostgreSQL en Render
✅ CI/CD:    Automático en cada merge a main
```

**Ready for Production!** 🚀

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **Prisma Migration:** https://www.prisma.io/docs/orm/prisma-migrate
- **React Vite:** https://vitejs.dev/guide/
