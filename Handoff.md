# Handoff — liga.paraguaya.futbol

## Resumen

Plataforma web para el seguimiento de la Primera División paraguaya de fútbol. Incluye predicciones en vivo, chat por partido, notificaciones push, tabla de posiciones, clubes, resultados en tiempo real y datos históricos desde 2020.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Backend | FastAPI, Python 3.14+, SQLAlchemy async, Pydantic v2, WebSockets |
| DB | SQLite (dev) / PostgreSQL (prod via Alembic) |
| Scraping | selectolax, httpx, RSSSF + Wikipedia |
| Infra | Docker, Railway (backend), Vercel (frontend) |

## Rama activa

- **`main`** — producción. Todo el trabajo se hace aquí.
- `feature/frontend-react-v1` — obsoleta, mergeada a main.

## Estructura

```
liga.paraguaya.futbol/
├── backend/
│   ├── alembic/              # Migraciones (3 revisiones)
│   ├── app/
│   │   ├── api/              # Routers FastAPI
│   │   ├── core/             # Config, DB, dependencias, API Key
│   │   ├── models/           # SQLAlchemy (8 modelos)
│   │   ├── schemas/          # Pydantic v2
│   │   ├── scripts/          # Seed de datos
│   │   ├── services/         # Lógica de negocio
│   │   └── main.py           # Entry point
│   ├── scripts/              # Scrapers (Wikipedia, RSSSF)
│   └── tests/                # 38 tests (pytest)
├── frontend/
│   ├── public/sw.js          # Service Worker (push + PWA)
│   └── src/                  # Next.js App Router
├── data/
│   ├── clubes_paraguay.json  # 10 clubes con datos enrichidos
│   ├── partidos_demo.json
│   ├── tabla_posiciones_demo.json
│   └── partidos_historicos/  # Temporadas 2020-2026
└── docs/
    └── superpowers/          # Specs de diseño + planes
        ├── specs/            # 7 specs de diseño
        └── plans/            # 6 planes de implementación
```

## Funcionalidades implementadas

### Fase 1 — Predicciones + Autenticación
- [x] Autenticación Google OAuth
- [x] Predicciones en vivo (local/empate/visitante)
- [x] Sistema de puntuación (3 pts exacto, 1 tendencia)
- [x] Leaderboard con ranking
- [x] Admin panel para resultados
- [x] Cron de cierre automático de predicciones

### Fase 2 — Chat + Notificaciones
- [x] Chat en vivo por partido via WebSocket
- [x] ChatWidget + ChatMessage components
- [x] Notificaciones push (Service Worker + Push API)
- [x] Suscripción y envío desde admin

### Scraper Engine
- [x] `ScraperBase` — HTTP con rate limiting, cache, HTML parsing
- [x] Wikipedia scraper — datos de clubes (fundación, estadio, títulos)
- [x] RSSSF scraper — resultados históricos 2020-2026
- [x] Tests para ambos scrapers

### Datos históricos
- [x] 7 temporadas (2020-2026) con resultados de cada jornada
- [x] Seed automático al iniciar la app
- [x] Tabla histórica reconstruible

### API Pública (recién implementada)
- [x] `APIKey` model + schema + middleware
- [x] Rate limiting (100 req/ventana de 60s por key)
- [x] Admin endpoints: CRUD de API Keys
- [x] Migración Alembic 003_add_api_keys
- [x] Middleware opcional (frontend no necesita key)

## Pendientes / Issues conocidos

### Frontend compatibility
- El middleware de API Key es **optativo** — si no se envía `X-API-Key`, la request pasa igual. Esto mantiene la compatibilidad con el frontend actual. Si se desea requerir key para terceros, el frontend debe actualizarse para enviar una key o usar un dominio/path separado.

### Spec vs implementación
- El spec dice "sin key → 401" pero se implementó como optativo para no romper el frontend. Decidir si se quiere strictly public API o mantener dual access.

### Deuda técnica
- El middleware de API Key crea una conexión DB separada por request (no reusa el pool de `async_session`). Esto es aceptable para MVP pero conviene migrar a inyección de dependencias.
- `datetime.utcnow()` está deprecado en Python 3.14. Migrar a `datetime.now(datetime.UTC)`.
- Hay funcionalidades sin tests (admin panel, cron, API Key en sí).
- Los `feature/frontend-react-v1` están mergeados pero la rama remota sigue existiendo.

### En producción (Railway + Vercel)
- Backend: https://backend-production-0b7d.up.railway.app
- Frontend: https://frontend-ten-swart-85.vercel.app
- Railway usa PostgreSQL vía plugin (DATABASE_URL auto-set)
- Vercel deploy apunta a Railway backend via `NEXT_PUBLIC_API_URL`

## Tests

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v    # 38 tests
```

| Archivo | Tests | Qué cubre |
|---------|-------|-----------|
| `test_clubes.py` | 5 | Listar, detalle, filtrar |
| `test_partidos.py` | 5 | Listar, detalle, paginación |
| `test_tabla.py` | 1 | Obtener tabla |
| `test_predicciones.py` | 7 | Login, predicciones, leaderboard, puntos |
| `test_chat_push.py` | 8 | Chat CRUD, push subscribe/unsubscribe |
| `test_scraper_base.py` | 4 | Fetch, cache, rate limit, HTML parse |
| `test_scraper_clubes.py` | 2 | Parse Wikipedia, enrich JSON |
| `test_scraper_historico.py` | 3 | Parse RSSSF, alias, múltiples tablas |
| `test_seed_historico.py` | 3 | Insert, dedup, sin archivos |

## Variables de entorno

```bash
# Backend
DATABASE_URL=sqlite+aiosqlite:///./data/liga.db   # Railway setea PostgreSQL
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SECRET_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
ADMIN_API_KEY=Rufi141414%$

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

## Documentación de diseño

Toda en `docs/superpowers/`:

| Spec | Archivo |
|------|---------|
| Arquitectura general | `docs/arquitectura.md` |
| Diseño inicial + rearchitecture | `specs/2026-07-02-liga-paraguaya-rearchitecture-design.md` |
| Deploy Vercel + Railway | `specs/2026-07-03-deploy-vercel-railway-design.md` |
| Admin clubes improvements | `specs/2026-07-04-admin-clubes-improvements-design.md` |
| Fútbol Total ecosystem | `specs/2026-07-04-futbol-total-ecosystem-design.md` |
| Fase 2 chat + push | `specs/2026-07-07-fase2-chat-push-design.md` |
| Scraper engine + DB | `specs/2026-07-07-scraper-engine-database-design.md` |
| API Pública | `specs/2026-07-07-api-publica-design.md` |

## Último commit

`95e4089 docs: spec API Pública — diseño completo` (más implementación actual)

## Para correr local

```bash
# Backend
cd backend
pip install -r requirements.txt
$env:PYTHONPATH=".."
python -m alembic upgrade head
uvicorn backend.app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# O ambos con Docker
docker compose up --build
```
