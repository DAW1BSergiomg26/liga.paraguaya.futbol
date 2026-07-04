# Deploy: Vercel + Railway

## Objetivo
Publicar la Liga Paraguaya de Fútbol online: frontend Next.js en Vercel, backend FastAPI en Railway, ambos gratis.

## Arquitectura

```
Usuario → https://liga-paraguaya.vercel.app (Vercel)
                    ↓ (fetch a Railway)
         https://liga-paraguaya-backend.up.railway.app (Railway)
                    ↓
         PostgreSQL (Railway add-on gratuito)
```

## Cambios necesarios

### 1. Backend — PostgreSQL en Railway
- Agregar `asyncpg` a `requirements.txt`
- Configurar `DATABASE_URL` para que lea de variable de entorno (Railway la inyecta)
- En `core/config.py`: `DATABASE_URL: str = "sqlite+aiosqlite:///./data/liga.db"` como default (dev), y Railway sobreescribe con PostgreSQL
- **Auto-seed**: en `main.py → lifespan`, después de `init_db()`, si la tabla clubes está vacía, ejecutar seed automáticamente
- Railway usa el `Dockerfile.backend` existente, expone puerto 8001

### 2. Frontend — Vercel
- No requiere cambios de código
- `NEXT_PUBLIC_API_URL` se configura en el dashboard de Vercel
- Vercel detecta Next.js automáticamente
- Opcional: `vercel.json` para configurar rewrites si se quiere proxy inverso (no necesario)

### 3. GitHub integración
- Push a `main` → Vercel deploy automático (frontend)
- Push a `main` → Railway deploy automático (backend)
- Cada quien detecta el repo raíz

## Datos
- Seed corre automático al primer inicio en Railway
- PostgreSQL persistente — los datos sobreviven redeploys
- Para refrescar datos: endpoint o reiniciar el seed manual

## Costos
- Vercel: gratis (100GB ancho banda/mes, builds 6000 min/mes)
- Railway: gratis ($5 crédito único, $5/mes de uso gratis — PostgreSQL $0, container $0 mientras no exceda)
- Dominio: .vercel.app gratis, .railway.app gratis

## Riesgos
- Railway gratis: si no hay actividad por ~30 min, el contenedor se duerme; al primer request tarda ~10s en responder (cold start)
- Solución: usar un cron gratuito (cron-job.org) que haga ping cada 10 min, o actualizar a $5/mes
