# Design Spec: Deployment a Producción

> Módulo del roadmap del usuario: item 6 — "Deployment a producción"
> Fecha: 2026-07-14

## Objetivo
Llevar la aplicación (backend FastAPI + frontend Next.js) a producción real en
Railway (backend) y Vercel (frontend), desplegando los módulos ya completados
(Transferencias, Estadísticas Históricas, etc.) y verificando que funcionan
end-to-end en el entorno cloud.

## Estado actual (verificado)
- Infra de deploy presente y sana:
  - `Dockerfile.backend` (usa `$PORT` vía `${PORT:-8001}`), `Dockerfile.frontend`, `docker-compose.yml`
  - `railway.json` (builder DOCKERFILE → `Dockerfile.backend`)
  - Proyecto Vercel configurado (`.vercel/project.json`)
  - `asyncpg` en `requirements.txt`, `alembic` en startup (`run_alembic_upgrade`, NO `drop_all`)
  - Routers `transferencias` y `historial` registrados en `main.py`
- La URL de producción del Handoff (`backend-production-0b7d.up.railway.app`) devuelve
  `404 Application not found` → la app vieja no existe; hay que deployar fresca.
- CLIs `railway` y `vercel` autenticadas en la máquina (Railway: Sergio M.; Vercel: daw1bsergiomg26).
- Repo con remote GitHub: `https://github.com/DAW1BSergiomg26/liga.paraguaya.futbol.git`.

## Arquitectura objetivo
```
Usuario → frontend Vercel (prod) ──fetch──▶ backend Railway (prod)
                                        └──▶ PostgreSQL (Railway plugin)
```

## Cambios necesarios (hardening previo al deploy)

### 1. `backend/app/core/database.py` — `_async_url`
Hoy solo convierte `postgresql://` → `postgresql+asyncpg://`.
Railway inyecta `DATABASE_URL` que puede empezar con `postgres://`.
Agregar rama para `postgres://` → `postgresql+asyncpg://` (evita error de driver en prod).

### 2. `backend/app/main.py` — `sync_loop`
Hoy corre `FootballDataService.sync_all()` cada 600s aunque no haya API key,
logueando error cada 10 min en producción.
Hacer no-op cuando `settings.api_football_key` esté vacío.

## Pasos de deploy

### Backend (Railway)
1. Crear proyecto/servicio en Railway desde `Dockerfile.backend`.
2. Agregar plugin PostgreSQL (inyecta `DATABASE_URL`).
3. Setear env vars:
   - `SECRET_KEY`, `JWT_SECRET` (valores de producción, no los de dev)
   - `ADMIN_API_KEY`
   - `CORS_ORIGINS` = incluye la URL del frontend Vercel (ej. `https://<frontend>.vercel.app`)
   - `FOOTBALL_DATA_API_KEY` (opcional; si falta, sync_loop es no-op)
4. Obtener URL pública del backend.

### Frontend (Vercel)
1. Setear `NEXT_PUBLIC_API_URL` = URL del backend Railway.
2. `vercel deploy --prod` desde `frontend/`.
3. Obtener URL pública del frontend.

## Verificación en vivo
- Backend: `GET /health` (200), `/api/v1/transferencias` (200, lista),
  `/api/v1/historial/campeones` (200).
- Frontend: abrir `/transferencias` y `/historial` en la URL de Vercel; confirmar render.

## Riesgos
- Cold start de Railway (~10s en tier gratis) → los primeros requests tardan.
- `DATABASE_URL` de Railway con `postgres://` → mitigado por fix #1.
- CORS mal configurado → frontend no puede llamar al backend → mitigado seteando `CORS_ORIGINS`.

## Out of scope (YAGNI)
- Dominio custom, HTTPS custom, CI/CD adicional, monitoreo externo, Supabase migration.
