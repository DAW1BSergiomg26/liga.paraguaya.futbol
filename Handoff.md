# Handoff — liga.paraguaya.futbol

## Resumen

Plataforma web para el seguimiento de la Primera División paraguaya de fútbol. Incluye predicciones en vivo, chat por partido, notificaciones push, tabla de posiciones, clubes, resultados en tiempo real, datos históricos desde 2020, módulo de análisis táctico IA, integración con Football-Data.org, sistema de noticias con RSS, autenticación JWT y experiencia visual cinematográfica con GSAP.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16.2.10 (App Router), TypeScript, Tailwind CSS v4, TanStack Query, GSAP 3.15, Framer Motion 12, Recharts, D3, Three.js |
| Backend | FastAPI, Python 3.14+, SQLAlchemy async, Pydantic v2, WebSockets |
| DB | SQLite (dev) / PostgreSQL (prod via Alembic) |
| Scraping | selectolax, httpx, RSSSF + Wikipedia |
| Auth | JWT (bcrypt + PyJWT), 7-day tokens |
| APIs externas | Football-Data.org (competicion PA1) |
| Infra | Docker, Railway (backend), Vercel (frontend) |

## Rama activa

- **`main`** — producción. Todo el trabajo se hace aquí.

## Estructura

```
liga.paraguaya.futbol/
├── backend/
│   ├── alembic/              # Migraciones (8 revisiones: 001-008)
│   ├── app/
│   │   ├── api/              # Routers FastAPI (clubes, partidos, tabla, predicciones, chat, push, admin, cerezo, noticias, transferencias)
│   │   ├── core/             # Config, DB, dependencias (get_current_user, get_current_admin), API Key
│   │   ├── models/           # SQLAlchemy (11 modelos: Club, Partido, TablaPosicion, Prediccion, User, APIKey, ChatMessage, Noticia, Transferencia, etc.)
│   │   ├── schemas/          # Pydantic v2
│   │   ├── scripts/          # Seed de datos
│   │   ├── services/         # Lógica de negocio (noticia_service, rss_sync, football_data_sync, transferencia_service, transferencia_rss_sync, etc.)
│   │   └── main.py           # Entry point
│   ├── scripts/              # Scrapers (Wikipedia, RSSSF)
│   └── tests/                # 140+ tests (pytest)
├── frontend/
│   ├── public/sw.js          # Service Worker (push + PWA)
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/
│   │   │   ├── hero/         # CinematicHero (GSAP SplitType + sparticles)
│   │   │   ├── layout/       # Navbar, StripesBackground (GSAP parallax)
│   │   │   ├── noticia/      # NoticiaCard, NoticiaGrid, FiltrosNoticias
│   │   │   ├── sidebar/      # FeedNoticias
│   │   │   └── ui/           # ScrollReveal, CountUp, TiltCard, PageTransition
│   │   ├── lib/              # api.ts, gsap.ts
│   │   └── types/            # TypeScript types
│   └── next.config.ts        # images.remotePatterns (todos los dominios RSS)
├── data/
│   ├── liga.db               # SQLite (19 clubes, noticias, users con is_admin)
│   ├── clubes_paraguay.json  # 19 clubes con datos enrichidos
│   ├── partidos_demo.json
│   ├── tabla_posiciones_demo.json
│   └── partidos_historicos/  # Temporadas 2020-2026
└── docs/
    └── superpowers/          # Specs de diseño + planes
        ├── specs/            # 10 specs de diseño
        └── plans/            # 10 planes de implementación
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
- [x] TanStack Query: `staleTime: 30s` default, 60s para datos estáticos
- [x] `refetchOnWindowFocus: false`

### Clubes — Datos Enriquecidos
- [x] 19 clubes con escudo, sitio web, descripción, títulos (16 originales + general-diaz, deportivo-capiata, 3-de-febrero)
- [x] Página de detalle con toda la info visible
- [x] Tipos TypeScript actualizados (`Club` + `ClubDetail`)

### Cerezo Digital — AI Assistant (Julio 2026)
- [x] `CerezoIntentClassifier` — clasificador por keywords (5 intents)
- [x] `CerezoEntityExtractor` — extrae clubes (alias), fechas, torneos
- [x] `CerezoDataFetcher` — consulta DB real para 5 intents
- [x] `CerezoPredictionEngine` — predicciones estadísticas H2H
- [x] `CerezoResponseGenerator` — Tiny LLM (Llama 3.2 1B GGUF) + template fallback
- [x] `POST /api/v1/cerezo/ask` — endpoint completo
- [x] Página `/cerezo` — chat UI con ChatBubble, PredictionCard, TypingIndicator

### Módulo Análisis Táctico IA (Julio 2026)
- [x] Modelos: Player, Team, MatchEvent, TacticalAnalysis, TacticalReport
- [x] Servicios: event_collector, video_analyzer, tactical_engine, report_generator
- [x] API endpoints: análisis en tiempo real, reportes, stats de jugadores
- [x] 5 tests backend pasando

### Football-Data.org Integration (Julio 2026)
- [x] Servicio de syncronización con Football-Data.org API
- [x] Competición configurada: código `PA1` (Paraguay Primera División)
- [x] Cron job cada 10 minutos para sync automática
- [x] Migraciones 005_add_tactical_tables + 006
- [x] 9/9 tasks completadas, 18 tests

### Autenticación JWT (Julio 2026)
- [x] JWT tokens con expiración de 7 días
- [x] Bcrypt para hashing de contraseñas
- [x] Login + registro con email y contraseña
- [x] `get_current_user` dependency para proteger endpoints
- [x] `get_current_admin` para endpoints de admin
- [x] Migración 007_add_hashed_password
- [x] 140 tests backend pasando

### Módulo Noticias (Julio 2026)
- [x] Modelo `Noticia` en SQLAlchemy
- [x] `NoticiaService` — CRUD completo con filtros por fuente, categoría, destacadas
- [x] `RssSyncService` — Sync automático con 6 fuentes RSS
- [x] 6 API endpoints: lista, detalle, fuentes, categorías, destacadas, sync manual
- [x] RSS Sources: ABC Color Deportes, ABC Color Fútbol, APF, Noticias CDE, ESPN Paraguay, Telefuturo
- [x] Extracción de imágenes: media_content → enclosures → HTML img → URL patterns
- [x] Frontend: NoticiaCard (con placeholder para sin imagen), NoticiaGrid, FiltrosNoticias
- [x] Páginas: `/noticias` (grid + filtros) y `/noticias/[id]` (detalle)
- [x] Navbar link a Noticias
- [x] 10/10 tests backend pasando
- [x] 28 noticias en DB, 100% con imágenes

### Módulo Transferencias (Julio 2026)
- [x] Modelo `Transferencia` en SQLAlchemy (jugador como string, sin modelo Player separado)
- [x] Migración 008_add_transferencias
- [x] Schemas Pydantic con validaciones (create/update/out/paginado/estadísticas)
- [x] `TransferenciaService` — CRUD + filtros + estadísticas + mercado + historial
- [x] 9 API endpoints (list, detail, create, update, delete, mercado, historial, estadísticas, sync-rss)
- [x] RSS sync service para transferencias (5 fuentes)
- [x] Frontend types TypeScript (Transferencia, paginado, estadísticas)
- [x] Navbar link a Transferencias
- [x] TransferCard, VerificationBadge, TipoBadge components
- [x] Páginas: `/transferencias`, `/transferencias/[id]`, `/transferencias/mercado`, `/transferencias/historial`, `/transferencias/estadisticas`
- [x] EstadisticasDashboard con Recharts (pie por tipo/posición, bar por club)
- [x] GSAP: ScrollReveal en grid + CountUp en total
- [x] 11/11 tests backend pasando

### GSAP Experience — Animaciones Cinematográficas (Julio 2026)
- [x] Task 1: `lib/gsap.ts` — Config GSAP central + `ScrollReveal.tsx` (5 variantes)
- [x] Task 2: `CountUp.tsx` — Números animados con ScrollTrigger
- [x] Task 3: `TiltCard.tsx` — Efecto 3D hover con perspective
- [x] Task 4: `StripesBackground.tsx` — Parallax con GSAP ScrollTrigger
- [x] Task 5: `CinematicHero.tsx` — Hero full-screen con SplitType reveal + sparticles + counters
- [x] Task 6: Integración CinematicHero en home page
- [ ] Task 7: Page Transitions (Framer Motion AnimatePresence)
- [ ] Task 8: ScrollReveal en Tabla de Posiciones
- [ ] Task 9: ScrollReveal en Goleadores
- [ ] Task 10: ScrollReveal en Noticias
- [ ] Task 11: ScrollReveal + Tilt en Clubes
- [ ] Task 12: Glow Effect para líder
- [ ] Task 13: Verificación final

## Handoff Maestro — Vision a Futuro

El **Handoff Maestro** define la dirección completa del proyecto con una identidad visual propia:

### Identidad Visual APF
- **Colores:** Rojo `#CC001C`, Azul `#00619E`, Dorado `#FFCC00`, Negro `#0A0A0A`
- **Tipografías:** Clash Display (display), Satoshi (body), JetBrains Mono (mono) — vía Fontshare
- **Componentes clave:** `StripesBackground` (rayas rojas/blanking), `ScoreRing`, `ClubBadge`, `CountUp`

### Stack Visual Definitivo
- D3.js — gráficos de datos (voronoi táctico, radar de stats)
- GSAP + ScrollTrigger — animaciones de entrada, parallax, reveal
- Three.js + React Three Fiber — visualización 3D (futuro)
- Supabase — migración futura desde SQLite

### Roadmap del Usuario
1. ✅ Datos reales (scraping + Football-Data.org)
2. ✅ JWT Auth
3. ✅ Noticias (RSS + UI)
4. ✅ Transferencias (CRUD + RSS + UI + estadísticas)
5. 📋 Estadísticas históricas
6. 📋 Deployment a producción

## Pendientes / Issues conocidos

### Frontend compatibility
- El middleware de API Key es **optativo** — si no se envía `X-API-Key`, la request pasa igual.

### Deuda técnica
- El middleware de API Key crea una conexión DB separada por request (no reusa el pool).
- Mejorar la cobertura de tests en el frontend.
- Cerezo ResponseGenerator: `table_position` y `match_result` intents usan mensajes placeholder estáticos.
- Sin tests de frontend para la página `/cerezo`.
- GSAP Experience: Tasks 7-13 pendientes (Page Transitions, ScrollReveal en páginas, Glow Effect).

### En producción (Railway + Vercel)
- Backend: https://backend-production-0b7d.up.railway.app
- Frontend: https://frontend-ten-swart-85.vercel.app
- Railway usa PostgreSQL vía plugin (DATABASE_URL auto-set)
- Vercel deploy apunta a Railway backend via `NEXT_PUBLIC_API_URL`

### Configuración Pendiente
- `FOOTBALL_DATA_API_KEY` no configurada — sync cron retorna errores, solo datos demo.

## Tests

```bash
# Backend (140+ tests)
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v

# Frontend
cd frontend
npm run build  # Verifica TypeScript + build
npx vitest run  # Si hay tests configurados
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
| `test_cerezo_classifier.py` | 5 | Clasificación de intents |
| `test_cerezo_entity_extractor.py` | 5 | Extracción de entidades |
| `test_cerezo_data_fetcher.py` | 3 | Fetch de datos por intent |
| `test_cerezo_prediction_engine.py` | 3 | Predicciones H2H |
| `test_cerezo_response_generator.py` | 3 | Template fallback + tiny LLM |
| `test_cerezo_router.py` | 3 | POST /api/v1/cerezo/ask |
| `test_noticias_api.py` | 8 | CRUD noticias, filtros, admin |
| `test_rss_sync.py` | 2 | RSS parse + sync |
| `test_tactical_analysis.py` | 5 | Análisis táctico |
| `test_transferencias_api.py` | 11 | CRUD transferencias, filtros, auth, mercado, historial, estadísticas |

## Variables de entorno

```bash
# Backend
DATABASE_URL=sqlite+aiosqlite:///./data/liga.db   # Railway setea PostgreSQL
SECRET_KEY=change-me-in-production-2026
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
ADMIN_API_KEY=Rufi141414%$
FOOTBALL_DATA_API_KEY=  # Opcional — sin ella solo datos demo

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

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
| Análisis Táctico IA | `specs/2026-07-12-modulo-analisis-tactico-ia-design.md` |
| Football-Data.org | `specs/2026-07-13-football-data-integration-design.md` |
| Noticias | `specs/2026-07-13-noticias-design.md` |
| GSAP Experience | `specs/2026-07-14-gsap-experience-design.md` |
