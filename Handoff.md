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
| Infra | Docker (`render.yaml` para Render), Vercel (frontend en producción), backend migrando a host gratuito (Koyeb + Neon Postgres) tras vencer el trial de Railway |

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

### Estadísticas Históricas (Julio 2026)
- [x] `HistorialService` — agrega TablaPosicion: campeones por torneo, ranking all-time, historial por club
- [x] 3 API endpoints: `/api/v1/historial/campeones`, `/api/v1/historial/ranking-clubes`, `/api/v1/historial/club/{id}`
- [x] Schemas Pydantic: CampeonOut, RankingClubOut, ClubTemporadaOut
- [x] Frontend types + API functions
- [x] Sección `/historial` con 3 tabs: Tablas por año, Ranking agregado, Rendimiento por club
- [x] Recharts: barchart de títulos, linechart de posición por temporada
- [x] Navbar link a Historial
- [x] Tests backend (service + api) pasando

> Nota: los datos históricos son tablas finales por torneo (2020–2026). No incluye resultados fecha por fecha.

### Goleadores — Ranking Histórico (Julio 2026)
- [x] `GoleadorService.get_historial()` — agrega por jugador (SUM goles/asistencias, COUNT torneos) para ranking all-time.
- [x] Endpoint `GET /api/v1/goleadores/historial` (limit configurable).
- [x] Frontend `GoleadoresHistorial.tsx` — ranking acumulado con ScrollReveal + CountUp (dorado APF).
- [x] `goleadores/page.tsx` — tabs **Por torneo / Ranking histórico** + filtro de torneo.
- [x] `GoleadoresList.tsx` mejorado a "nivel Dios": pódium top-3 (🥇🥈🥉 con glow), barras de progreso, CountUp animado.
- [x] Tests backend: `test_goleadores_api.py` (3 tests, incluye agrupación histórica 14+10=24).
- [x] `getGoleadoresHistorial` + tipo `Goleador` extendido (`torneo`/`temporada`) en `lib/api.ts`.

### GSAP Experience — Animaciones Cinematográficas (Julio 2026)
- [x] Task 1: `lib/gsap.ts` — Config GSAP central + `ScrollReveal.tsx` (5 variantes)
- [x] Task 2: `CountUp.tsx` — Números animados con ScrollTrigger
- [x] Task 3: `TiltCard.tsx` — Efecto 3D hover con perspective
- [x] Task 4: `StripesBackground.tsx` — Parallax con GSAP ScrollTrigger
- [x] Task 5: `CinematicHero.tsx` — Hero full-screen con SplitType reveal + sparticles + counters
- [x] Task 6: Integración CinematicHero en home page
- [x] Task 7: Page Transitions — `app/template.tsx` con Framer Motion (fade + slide en cada navegación)
- [x] Task 8: Tabla ya tenía animaciones (row-enter, pulse-lider, tilt)
- [x] Task 9: ScrollReveal en Goleadores (`GoleadoresList.tsx`, stagger 0.06)
- [x] Task 10: ScrollReveal en Noticias (ya aplicado en `NoticiaGrid.tsx`)
- [x] Task 11: ScrollReveal + TiltCard en Clubes (`clubes/page.tsx`, stagger 0.08, maxTilt 12)
- [x] Task 12: Glow Effect para líder — fila `posicion===1` con `shadow-[inset...]` dorado + ring APF
- [ ] Task 13: Verificación final (build OK, tsc OK; pendiente smoke visual en producción)

### Red 3D de Clubes — `/red3d` (Julio 2026)
- [x] Grafo 3D con `3d-force-graph` + Three.js: bloom, starfield, halo rojo APF y escudos reales.
- [x] `frontend/public/escudos/` — 19 PNG reales mapeados 1:1 en `frontend/src/lib/escudos.ts` (sin nombres inventados; `capiata.png` → `deportivo-capiata`).
- [x] `Graph3D.tsx` reescrito: `buildNodeObject` dibuja escudo real + anillo de color + halo + **nombre SIEMPRE visible** (`makeLabelSprite`).
- [x] **Crash `Cannot read properties of undefined (reading 'x')` ELIMINADO**: `flyTo` valida `Number.isFinite(node.x/y/z)` y cae a `zoomToFit`; `autoRotate` blindado; import dinámico de `3d-force-graph` + `useEffect` de precarga.
- [x] Tipos estrictos `GraphInstance` / `ClubNode` / `ClubLink` sin `any`; comentarios en español.
- [x] `page.tsx`: panel "¿Qué es esto?" (explica el propósito), subtítulos por modo, leyenda visual, buscador, lista lateral clicable (escudo + nombre) de los 19 clubes, auto-rotación, centrado de cámara, panel de detalle.
- [x] Dos modos: **Rivalidades** (clásicos, grosor = historia) y **Mercado de Fichajes** (pases por temporada, grosor = inversión).
- [x] Tests Vitest: `datos.test.ts` (estructura de red) + `escudos.test.ts` (mapeo 1:1) — 7 pasan.
- [x] Verificación Playwright desktop + mobile: canvas OK, 19 clubes en lista, **0 page errors**; solo `ERR_CONNECTION_REFUSED` del backend Koyeb dormido (no del grafo).
- [x] PR #3 mergeado a `main` (`42d4fcd`): repara carga infinita + escudos reales.
- [x] Commit `efcef15`: sección entendible + crash-proof + nombres visibles + panel explicativo. Pusheado a `main` → Vercel despliega solo.

> Nota: el usuario reportó un botón "ISSUE" que daba el crash; no existe string "ISSUE" en el código fuente — probablemente UI de Vercel o confusión. El crash real estaba en `cameraPosition`/`flyTo` leyendo coords no inicializadas.

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
5. ✅ Estadísticas históricas
 6. 🔶 Deployment a producción — frontend en Vercel ✅; backend en Koyeb+Neon (gratis, sin tarjeta). Ver sección "Estado de despliegue".

## Pendientes / Issues conocidos

### Frontend compatibility
- El middleware de API Key es **optativo** — si no se envía `X-API-Key`, la request pasa igual.

### Deuda técnica
- El middleware de API Key crea una conexión DB separada por request (no reusa el pool).
- Mejorar la cobertura de tests en el frontend.
- Cerezo ResponseGenerator: `table_position` y `match_result` intents usan mensajes placeholder estáticos.
- Sin tests de frontend para la página `/cerezo`.
- GSAP Experience: Tasks 7-13 pendientes (Page Transitions, ScrollReveal en páginas, Glow Effect).

### Bug conocido en producción (RESUELTO — Julio 2026)
- **`datetime` naive/aware:** el único `datetime.utcnow()` (naive) restante en modelos estaba en
  `backend/app/models/goleador.py` (`updated_at`). Corregido a `datetime.now(timezone.utc)` en commit `5138748`.
  `push_subscription` y `push_service` ya usaban `timezone.utc`. Verificado: `grep` de `datetime.utcnow` en
  `backend/app` devuelve 0 coincidencias. Tests backend: 172 pass / 1 fail (test de noticias preexistente por
  seed local, ajeno a este cambio).
- El backend viejo que corría en el equipo del dev (proceso uvicorn huérfano en puerto 8000) servía código/DB
  obsoleta y daba 500 en `/transferencias`. Ya fue matado y reemplazado; no replicar ese setup.

### Estado de despliegue (ACTUALIZADO — leer antes de tocar infra)
- **Frontend:** ✅ EN PRODUCCIÓN en Vercel → https://frontend-ten-swart-85.vercel.app
  - Project ID: `prj_uM7KzAcPV7zRwjWDGpHAIGXelCC2` (org `team_xTbaX86uhYJgVplW2yc6jTUj`)
  - `NEXT_PUBLIC_API_URL` apunta al backend de Koyeb en producción (antes apuntaba a Railway, ya muerto; actualizado).
- **Backend:** ✅ EN PRODUCCIÓN en **Koyeb** (web service Docker) + **Neon** (Postgres gratis, sin tarjeta).
  - **Decisión del usuario:** NO pagar ningún plan. Backend migrado a hosting gratuito sin tarjeta (Koyeb + Neon).
  - Alternativa si se puede agregar tarjeta: Render free (`render.yaml` ya está en el repo). Render free exige tarjeta SOLO para verificar (no cobra).
- **Repositorio:** `DAW1BSergiomg26/liga.paraguaya.futbol` (rama `main`).
- **Últimos commits en `main`:** `efcef15` (fix red3d: sección entendible + crash-proof + nombres visibles + panel explicativo), `42d4fcd` (fix red3d: repara carga infinita + escudos reales #3), `2fd9153` (feat red3d: grafo 3D pro con escudos reales, bloom, starfield y UI albirroja), `de17a9b` (fix goleadores/predicciones).

### Pasos pendientes para completar el deploy (item 6 del roadmap)
1. Usuario crea cuenta **Koyeb** (koyeb.com, sin tarjeta) y conecta el repo.
2. Usuario crea proyecto Postgres gratis en **Neon** (neon.tech, sin tarjeta) y copia la *connection string* (`postgresql://...?sslmode=require`).
3. En Koyeb: App desde el repo, runtime Docker, `Dockerfile` = `./Dockerfile.backend`, puerto `8000`, env vars:
   - `DATABASE_URL` = string de Neon
   - `SECRET_KEY` / `JWT_SECRET` = valores random
   - `ADMIN_API_KEY=Rufi141414%$`
   - `CORS_ORIGINS=http://localhost:3000,https://frontend-ten-swart-85.vercel.app`
   - `FOOTBALL_DATA_API_KEY=` (vacío → el sync cron es no-op, solo datos demo)
4. Deployar y obtener la URL del backend.
5. Verificar `/health`, `/api/v1/transferencias`, `/api/v1/historial/campeones` → 200.
6. En Vercel: setear `NEXT_PUBLIC_API_URL` = nueva URL del backend y redeployar el frontend.
7. Cerrar Handoff + marcar roadmap item 6 como ✅.

### Configuración
- `FOOTBALL_DATA_API_KEY` no configurada (intencional) → el sync cron es no-op y solo se usan datos demo. No es un error.
- `llama-cpp-python` es **opcional** (está en `requirements-optional.txt`, no en `requirements.txt`). El bot Cerezo usa templates por defecto; el modelo `.gguf` no está en el repo. Quitarlo del build gratuito evita fallos de instalación.
- `render.yaml` (raíz) define el Blueprint para Render por si se elige esa vía.

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
| `test_deploy_readiness.py` | 4 | `_async_url` postgres://, `sync_loop` no-op sin API key, health check |

## Variables de entorno

```bash
# Backend
DATABASE_URL=sqlite+aiosqlite:///./data/liga.db   # Local SQLite. En prod: postgresql://... de Neon (el código acepta postgres:// y lo convierte a postgresql+asyncpg://)
SECRET_KEY=change-me-in-production-2026
JWT_SECRET=change-me-in-production-2026
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
ADMIN_API_KEY=Rufi141414%$
CORS_ORIGINS=http://localhost:3000,https://frontend-ten-swart-85.vercel.app
FOOTBALL_DATA_API_KEY=  # Opcional — sin ella el sync cron es no-op, solo datos demo

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000         # En Vercel: debe apuntar a la URL del backend en producción
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

### Launchers locales (Windows)
- `iniciar.bat` — panel CMD que limpia procesos, verifica archivos y abre backend (`:8000`) y frontend (`:3000`) en ventanas separadas.
- `iniciar.ps1` — igual pero en PowerShell (corrige `pause` y abre cada servicio en su propia ventana).
- Ambos setean `PYTHONPATH` a la raíz y usan SQLite local por defecto (sin `DATABASE_URL`).
- Requieren `python` y `npm` en el PATH.

## Workflow de desarrollo (LEER ANTES DE EMPEZAR)

**Idioma:** El usuario se comunica en **castellano**. Responder SIEMPRE en español, sin excepción.

**Cómo se construyó este proyecto (convenciones a respetar):**
- Se usa **OpenCode** con las skills de **superpowers** (`docs/` y `.agents/skills/`). Flujo típico:
  1. Antes de crear/modificar funcionalidad → skill `brainstorming` (explorar intención y diseño).
  2. Para bugs → skill `systematic-debugging` (encontrar causa raíz antes de parchear).
  3. TDD: escribir/extender tests primero (`backend/tests/`), luego implementar.
  4. Planes y specs vivos en `docs/superpowers/plans/` y `docs/superpowers/specs/`.
- **Rama:** todo el trabajo va directo a `main` (no se crean branches de feature salvo que el usuario lo pida). No crear PRs salvo indicación explícita.
- **Commits:** mensajes cortos y descriptivos en castellano. No commitear secrets (ya hay `ADMIN_API_KEY` en el repo por decisión del usuario; no agregar más).
- **No pagar nada:** el usuario no quiere planes de pago. Hosting gratuito sin tarjeta (Koyeb + Neon, o Render free si se puede verificar con tarjeta). La IA **no puede** crear las cuentas de hosting; eso lo hace el usuario.

**Testing antes de declarar "listo":**
- Backend: `cd backend; $env:PYTHONPATH=".."; python -m pytest tests/ -v` (140+ tests, deben pasar).
- Frontend: `cd frontend; npm run build` (TypeScript + build limpio).
- Deploy-readiness: `backend/tests/test_deploy_readiness.py` (4 tests: `_async_url` acepta `postgres://`, `sync_loop` no-op sin API key, etc.).

**Archivos clave de infra/deploy:**
- `render.yaml` (raíz) — Blueprint para Render.
- `backend/Dockerfile.backend` — usa `$PORT` (`${PORT:-8001}`), arranque con `run_alembic_upgrade()` (NO `drop_all`).
- `backend/requirements.txt` — dependencias de build; `requirements-optional.txt` tiene `llama-cpp-python` (opcional).
- `backend/app/api/health.py` — endpoint `/health` para health checks de Koyeb/Render.
- `backend/app/core/database.py` — `_async_url` convierte `postgres://` → `postgresql+asyncpg://`.
- `backend/app/main.py` — `sync_loop` es no-op si `FOOTBALL_DATA_API_KEY` está vacío.
- `frontend/.vercel/project.json` — config del proyecto Vercel ya linkeado.

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
