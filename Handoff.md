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
│   └── tests/                # 64 tests (pytest)
├── frontend/
│   ├── public/sw.js          # Service Worker (push + PWA)
│   └── src/                  # Next.js App Router
├── data/
│   ├── clubes_paraguay.json  # 16 clubes con datos enrichidos
│   ├── partidos_demo.json
│   ├── tabla_posiciones_demo.json
│   └── partidos_historicos/  # Temporadas 2020-2026
└── docs/
    └── superpowers/          # Specs de diseño + planes
        ├── specs/            # 8 specs de diseño
        └── plans/            # 7 planes de implementación
```

## Funcionalidades implementadas

### Fase 1 — Predicciones + Autenticación
- [x] Autenticación por email + nombre (sin contraseña)
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

### API Pública
- [x] `APIKey` model + schema + middleware
- [x] Rate limiting (100 req/ventana de 60s por key)
- [x] Admin endpoints: CRUD de API Keys
- [x] Migración Alembic 003_add_api_keys
- [x] Middleware opcional (frontend no necesita key)

### UI/UX — Frontend Pulido (Julio 2026)
- [x] Navbar responsive con menú hamburguesa en mobile
- [x] Errores visibles en Home con banners individuales
- [x] Loading skeletons para cards, tablas y detalle
- [x] Página `/login` con formulario email+nombre
- [x] Botón Ingresar/Salir según sesión en Navbar
- [x] Fix localStorage key `auth_token` → `user_token`

### Calidad Interna (Julio 2026)
- [x] Migración `datetime.utcnow()` → `datetime.now(timezone.utc)` (3 archivos)
- [x] Tests nuevos: `test_admin.py` (5), `test_cron.py` (2), `test_api_key.py` (8)
- [x] `rate_limit_info()` refactorizada con `db: AsyncSession | None` opcional
- [x] Fix startup en Windows/SQLite: `subprocess.run` + `PRAGMA table_info`
- [x] Total: 64 tests pasando, 0 errores, 0 utcnow warnings
- [x] TanStack Query: `staleTime: 30s` default, 60s para datos estáticos
- [x] `refetchOnWindowFocus: false`

### Clubes — Datos Enriquecidos
- [x] 16 clubes con escudo, sitio web, descripción, títulos
- [x] Página de detalle con toda la info visible
- [x] Tipos TypeScript actualizados (`Club` + `ClubDetail`)

### Cerezo Digital — AI Assistant (Julio 2026)
- [x] `CerezoIntentClassifier` — clasificador por keywords (5 intents: greeting, club_info, prediction, head_to_head, unknown)
- [x] `CerezoEntityExtractor` — extrae clubes (alias incluyendo «sol», «cerro»), fechas, torneos
- [x] `CerezoDataFetcher` — consulta DB real para 5 intents via servicios existentes
- [x] `CerezoPredictionEngine` — predicciones estadísticas H2H (local/empate/visitante + confianza)
- [x] `CerezoResponseGenerator` — Tiny LLM (Llama 3.2 1B GGUF) + template fallback (8 intents)
- [x] `POST /api/v1/cerezo/ask` — endpoint completo con Pydantic request/response
- [x] Página `/cerezo` — chat UI con ChatBubble, PredictionCard, TypingIndicator (Next.js + Tailwind)
- [x] Docker: download condicional del modelo GGUF + `llama-cpp-python` en imagen

## Pendientes / Issues conocidos

### Frontend compatibility
- El middleware de API Key es **optativo** — si no se envía `X-API-Key`, la request pasa igual. Si se desea requerir key para terceros, el frontend debe actualizarse.

### Deuda técnica
- El middleware de API Key crea una conexión DB separada por request (no reusa el pool de `async_session`). Aceptable para MVP.
- Mejorar la cobertura de tests en el frontend.
- Cerezo ResponseGenerator: `table_position` y `match_result` intents usan mensajes placeholder estáticos (sin datos reales formateados) hasta que se integren con el DataFetcher correspondiente.
- Sin tests de frontend para la página `/cerezo` (solo verificación manual + build).

### En producción (Railway + Vercel)
- Backend: https://backend-production-0b7d.up.railway.app
- Frontend: https://frontend-ten-swart-85.vercel.app
- Railway usa PostgreSQL vía plugin (DATABASE_URL auto-set)
- Vercel deploy apunta a Railway backend via `NEXT_PUBLIC_API_URL`

## Tests

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v    # 86 tests (64 legacy + 22 Cerezo)
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
| `test_admin.py` | 5 | Update partido, validación, API Key |
| `test_cron.py` | 2 | Cierre automático de predicciones |
| `test_api_key.py` | 8 | CRUD, rate limiting, admin endpoints |
| `test_cerezo_classifier.py` | 5 | Clasificación de intents por keywords |
| `test_cerezo_entity_extractor.py` | 5 | Extracción de entidades (clubes, fecha, torneo) |
| `test_cerezo_data_fetcher.py` | 3 | Fetch de datos por intent |
| `test_cerezo_prediction_engine.py` | 3 | Predicciones H2H estadísticas |
| `test_cerezo_response_generator.py` | 3 | Template fallback + tiny LLM |
| `test_cerezo_router.py` | 3 | POST /api/v1/cerezo/ask |

## Variables de entorno

```bash
# Backend
DATABASE_URL=sqlite+aiosqlite:///./data/liga.db   # Railway setea PostgreSQL
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
| Cerezo Digital | `specs/2026-07-08-cerezo-digital-design.md` |

## Para correr local

```bash
# Backend
cd backend
pip install -r requirements.txt
$env:PYTHONPATH=".."
python -m alembic upgrade head
python -m uvicorn backend.app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npx next dev

# O ambos con Docker
docker compose up --build
```
