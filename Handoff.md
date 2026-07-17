# Handoff — liga.paraguaya.futbol

## Resumen

Plataforma web para el seguimiento de la Primera División paraguaya de fútbol. Incluye predicciones en vivo, chat por partido, notificaciones push, tabla de posiciones, clubes, resultados en tiempo real, datos históricos desde 2020, módulo de análisis táctico IA, integración con Football-Data.org, sistema de noticias con RSS, autenticación JWT y experiencia visual cinematográfica con GSAP.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16.2.10 (App Router), TypeScript, Tailwind CSS v4, TanStack Query, GSAP 3.15, Framer Motion 12, Recharts, D3, Three.js |
| Backend | FastAPI, Python 3.14+, SQLAlchemy async, Pydantic v2, WebSockets |
| DB | SQLite (dev) / PostgreSQL Neon (prod; esquema vía `create_all`, no Alembic en runtime) |
| Scraping | selectolax, httpx, RSSSF + Wikipedia |
| Auth | JWT (bcrypt + PyJWT), 7-day tokens |
| APIs externas | Football-Data.org (competicion PA1) |
| Infra | **Oficial:** Frontend = Vercel · Backend = Render (Docker, `Dockerfile.backend`) · DB = Neon Postgres. Railway y Koyeb **descartados**. |

## Rama activa

- **`main`** — producción. Todo el trabajo se hace aquí.

## Estructura

```
liga.paraguaya.futbol/
├── backend/
│   ├── alembic/              # Migraciones (8 revisiones: 001-008)
│   ├── app/
│   │   ├── api/              # Routers FastAPI (clubes, partidos, tabla, predicciones, chat, push, admin, cerezo, noticias, transferencias, goleadores, historial, tactico, simulador)
│   │   ├── core/             # Config, DB, dependencias (get_current_user, get_current_admin), API Key
│   │   ├── models/           # SQLAlchemy (12 modelos: Club, Partido, TablaPosicion, Prediccion, User, APIKey, ChatMessage, Noticia, Transferencia, Goleador, Player, Team, MatchEvent, TacticalAnalysis, TacticalReport)
│   │   ├── schemas/          # Pydantic v2
│   │   ├── scripts/          # Seed de datos
│   │   ├── services/         # Lógica de negocio (noticia_service, rss_sync, football_data_sync, transferencia_service, historial_service, goleador_service, tactical_engine, etc.)
│   │   └── main.py           # Entry point
│   ├── scripts/              # Scrapers (Wikipedia, RSSSF)
│   ├── export_data.py        # SQLite local → data/export/*.json (migración)
│   ├── import_data.py        # JSON → Neon (TRUNCATE CASCADE, orden FKs)
│   └── tests/                # 140+ tests (pytest)
├── frontend/
│   ├── public/
│   │   ├── manifest.json     # PWA manifest (Liga PY, colores #CC001C/#0a0f1a)
│   │   ├── sw.js             # Service Worker (push + PWA)
│   │   ├── data/red-clubes.json  # Datos de rivalidades (19 nodos, 24 links)
│   │   └── escudos/          # 19 PNGs reales de escudos
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout con metadata SEO completa + PWA meta tags
│   │   │   ├── error.tsx     # Error Boundary global (UI amigable + reintentar)
│   │   │   ├── not-found.tsx # Página 404 amigable "Cancha no encontrada"
│   │   │   ├── page.tsx      # Home (CinematicHero GSAP)
│   │   │   ├── template.tsx  # Page transitions (Framer Motion)
│   │   │   ├── login/page.tsx
│   │   │   ├── clubes/       # Listado + detalle clubes
│   │   │   ├── partidos/     # Listado + detalle partidos
│   │   │   ├── tabla/        # Tabla de posiciones
│   │   │   ├── predicciones/ # Predicciones en vivo
│   │   │   ├── goleadores/   # Goleadores (por torneo + ranking histórico)
│   │   │   ├── historial/    # Estadísticas históricas (tabs: por año, ranking, por club)
│   │   │   ├── noticias/     # Noticias (grid + filtros + detalle)
│   │   │   ├── transferencias/ # Transferencias (CRUD, mercado, historial, estadísticas)
│   │   │   ├── red3d/        # Red de Clubes — grafo 2D/3D híbrido
│   │   │   ├── simulador/    # Simulador de partidos — layout Visual VS con predicción Poisson
│   │   │   └── cerezo/       # Asistente IA Cerezo Digital
│   │   ├── components/
│   │   │   ├── hero/         # CinematicHero (GSAP SplitType + sparticles)
│   │   │   ├── layout/       # Navbar, StripesBackground (GSAP parallax)
│   │   │   ├── noticia/      # NoticiaCard, NoticiaGrid, FiltrosNoticias
│   │   │   ├── red3d/        # Graph3D.tsx (grafo 3D), Red2DFallback.tsx (vista 2D de alta calidad)
│   │   │   ├── sidebar/      # FeedNoticias
│   │   │   └── ui/           # ScrollReveal, CountUp, TiltCard, PageTransition
│   │   ├── hooks/
│   │   │   └── useIsMobile.ts # Hook SSR-safe detección móvil (useSyncExternalStore + matchMedia)
│   │   ├── lib/
│   │   │   ├── api.ts        # API_URL (sin fallback Railway), fetch wrappers
│   │   │   ├── escudos.ts    # ESCUDOS_LOCALES (19 PNG) + escudoUrl()
│   │   │   └── gsap.ts       # Config GSAP central
│   │   └── types/            # TypeScript types
│   ├── next.config.ts        # images.remotePatterns (14+ dominios RSS)
│   ├── Dockerfile.frontend   # Docker multi-stage (Next.js standalone)
│   ├── .dockerignore         # Docker ignore
│   ├── Dockerfile            # Aliás de Dockerfile.frontend
│   └── vercel.json           # Config Vercel overrides
├── data/
│   ├── liga.db               # SQLite (19 clubes, noticias, users con is_admin)
│   ├── clubes_paraguay.json  # 19 clubes con datos enrichidos
│   ├── partidos_demo.json
│   ├── tabla_posiciones_demo.json
│   ├── partidos_historicos/  # Temporadas 2020-2026
│   └── export/               # JSON exportados desde SQLite (para migración a Neon)
└── docs/
    └── superpowers/          # Specs de diseño + planes
        ├── specs/            # 10+ specs de diseño
        └── plans/            # 10+ planes de implementación
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
- [x] Servicio de sincronización con Football-Data.org API
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

### SEO + Meta Tags + PWA (Julio 2026)
- [x] `layout.tsx`: title con template (`%s | Liga PY`), keywords, authors, creator, publisher.
- [x] `openGraph` completo con imagen, `twitter` card `summary_large_image`.
- [x] `robots` con googleBot detallado, `canonical` URL, `manifest` link, `theme-color` (#CC001C).
- [x] Meta tags PWA: `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
- [x] `scroll-smooth` en `<html>`, `antialiased` en `<body>`.
- [x] `public/manifest.json`: nombre "Liga PY", colores #CC001C/#0a0f1a, display standalone, ícono SVG, categories sports/entertainment.

### Error Boundary + Not Found (Julio 2026)
- [x] `error.tsx`: Error Boundary global con UI amigable, botón "Reintentar" + "Volver al inicio", muestra `error.digest`.
- [x] `not-found.tsx`: Página 404 amigable "Cancha no encontrada" con icono de campo, link a inicio.

### Lazy Loading de Imágenes con `next/image` (Julio 2026)
- [x] 16 `<img>` → `<Image loading="lazy">` en 12 archivos.
- [x] `ui-avatars.com` agregado a `remotePatterns` en `next.config.ts`.
- [x] ESLint-disable comments limpiados en `red3d/page.tsx`.

### Motor de Simulación Probabilística (Julio 2026)
- [x] Schemas Pydantic: `SimulationInput`, `ExactScore`, `SimulationResultOut`
- [x] `SimulatorService` — Poisson PMF, matrix 7×7 (goles 0-6), λ home/away por promedio histórico
- [x] `POST /api/v1/simulador/prediccion` — endpoint completo
- [x] Frontend types TypeScript: `ExactScore`, `SimulationResultOut`, `SimulationInput`
- [x] Función API `predecirPartido()` — POST a `/api/v1/simulador/prediccion`
- [x] Página `/simulador` — layout Visual VS (paneles enfrentados Local/VS/Visitante)
- [x] Modal selector de clubes con grilla 19 clubes + buscador
- [x] Barras de probabilidad animadas (local/empate/visitante)
- [x] Top 3 resultados exactos con probabilidad
- [x] Accesibilidad: aria-label, role=dialog, aria-modal, aria-disabled, focus trap, Escape key

### Red de Clubes `/red3d` — Grafo 2D/3D Híbrido (Julio 2026)
- [x] **Arquitectura híbrida responsiva 2D/3D:**
  - `useIsMobile.ts` — Hook SSR-safe con `useSyncExternalStore` + `matchMedia` (breakpoint 768px, SSR-safe).
  - `Red2DFallback.tsx` — Vista 2D de alta calidad con tabs rivalidades/fichajes, cards expandibles, escudos con `<Image loading="lazy">`, barras de intensidad.
  - `page.tsx` — Auto-detección dispositivo: 2D por defecto en móvil, 3D en desktop.
- [x] **Modo 3D:** Grafo 3D con `3d-force-graph` + Three.js: bloom, starfield, halo rojo APF y escudos reales.
  - `Graph3D.tsx` reescrito: `buildNodeObject` dibuja escudo real + anillo de color + halo + nombre SIEMPRE visible.
  - Crash `Cannot read properties of undefined (reading 'x')` ELIMINADO: `flyTo` valida `Number.isFinite(node.x/y/z)`.
- [x] **Modo 2D:** Vista nativa de alta calidad (no placeholder), tabs rivalidades/fichajes, cards expandibles con escudos, barras de intensidad.
- [x] **Controles responsivos:**
  - Botón flotante "Activar Mapa Interactivo 3D" en vista 2D móvil.
  - Botón "← Vista 2D" para volver desde 3D.
  - Auto-rotate desactivado por defecto en móvil.
  - `touch-action: pinch-zoom` en canvas 3D para no secuestrar scroll vertical.
- [x] **Robustez:** ErrorBoundary3D con auto-revert a 2D. WebGL detection antes de activar 3D. Notificación amigable si WebGL no soportado.
- [x] **Dos modos funcionales:**
  - **Rivalidades** (clásicos, grosor = historia)
  - **Mercado de Fichajes** (pases por temporada, grosor = inversión; drawer de fichaje con origen→destino, inversión ($M), tipo, enlace a `/transferencias/[id]`)
- [x] `frontend/public/escudos/` — 19 PNGs reales mapeados 1:1 en `frontend/src/lib/escudos.ts`.
- [x] `frontend/public/data/red-clubes.json` — 19 nodos, 24 links.
- [x] `frontend/src/hooks/useIsMobile.ts` — Hook SSR-safe (commit `c487c62`).
- [x] Tests Vitest: `datos.test.ts` (estructura de red) + `escudos.test.ts` (mapeo 1:1) — 7 pasan.
- [x] Verificación Playwright desktop + mobile: canvas OK, 19 clubes en lista, **0 page errors**.
- [x] PR #3 mergeado a `main` (`42d4fcd`): repara carga infinita + escudos reales.
- [x] Commit `efcef15`: sección entendible + crash-proof + nombres visibles + panel explicativo.
- [x] Commit `c487c62`: arquitectura híbrida 2D/3D con detección de dispositivo, ErrorBoundary3D, fallback de alta calidad.

## Handoff Maestro — Vision a Futuro

El **Handoff Maestro** define la dirección completa del proyecto con una identidad visual propia:

### Identidad Visual APF
- **Colores:** Rojo `#CC001C`, Azul `#00619E`, Dorado `#FFCC00`, Negro `#0A0A0A`
- **Tipografías:** Clash Display (display), Satoshi (body), JetBrains Mono (mono) — vía Fontshare
- **Componentes clave:** `StripesBackground` (rayas rojas/blanking), `ScoreRing`, `ClubBadge`, `CountUp`

### Stack Visual Definitivo
- D3.js — gráficos de datos (voronoi táctico, radar de stats)
- GSAP + ScrollTrigger — animaciones de entrada, parallax, reveal
- Three.js + React Three Fiber — visualización 3D (ya implementada en `/red3d`)
- Supabase — migración futura desde SQLite

### Roadmap del Usuario
1. ✅ Datos reales (scraping + Football-Data.org)
2. ✅ JWT Auth
3. ✅ Noticias (RSS + UI)
4. ✅ Transferencias (CRUD + RSS + UI + estadísticas)
5. ✅ Estadísticas históricas
6. ✅ Deployment a producción — Frontend en Vercel + Backend en Render (Docker) + DB en Neon Postgres.
7. ✅ SEO + Meta Tags + PWA + Error Boundaries + Lazy Loading imágenes
8. ✅ Red de Clubes `/red3d` — grafo 2D/3D híbrido responsivo con detección de dispositivo
9. ✅ Motor de Simulación Probabilística — Poisson PMF, backend + frontend Visual VS

## Pendientes / Issues conocidos

### Frontend compatibility
- El middleware de API Key es **optativo** — si no se envía `X-API-Key`, la request pasa igual.

### Deuda técnica
- El middleware de API Key crea una conexión DB separada por request (no reusa el pool).
- Mejorar la cobertura de tests en el frontend.
- Cerezo ResponseGenerator: `table_position` y `match_result` intents usan mensajes placeholder estáticos.
- Sin tests de frontend para la página `/cerezo`.
- GSAP Experience: Task 13 pendiente (verificación final smoke visual en producción).

### Bug conocido en producción (RESUELTO — Julio 2026)
- **`datetime` naive/aware:** corregido a `datetime.now(timezone.utc)` en commit `5138748`.
  Verificado: `grep` de `datetime.utcnow` en `backend/app` devuelve 0 coincidencias. Tests backend: 172 pass / 1 fail (test de noticias preexistente por seed local, ajeno a este cambio).
- El backend viejo que corría en el equipo del dev (proceso uvicorn huérfano en puerto 8000) servía código/DB obsoleta y daba 500 en `/transferencias`. Ya fue matado y reemplazado; no replicar ese setup.

### Estado de despliegue (VERIFICADO — Julio 2026)
Arquitectura oficial en producción:
- **Frontend:** ✅ Vercel → https://frontend-ten-swart-85.vercel.app
  - Project ID: `prj_uM7KzAcPV7zRwjWDGpHAIGXelCC2` (org `team_xTbaX86uhYJgVplW2yc6jTUj`)
  - `NEXT_PUBLIC_API_URL` → `https://liga-paraguaya-futbol.onrender.com` (backend de Render).
  - Carga datos reales: 348 partidos, 892 goles, 19 equipos desde Neon.
- **Backend:** ✅ Render (Web Service, runtime **Docker** → `Dockerfile.backend`)
  - URL pública: `https://liga-paraguaya-futbol.onrender.com`
  - Variables en Render (secrets): `DATABASE_URL` (Neon, SIN `sslmode`), `ADMIN_API_KEY`, `JWT_SECRET`.
  - Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
  - Health check: `/health`.
  - Branch settings: **`main`** (verificado; la causa raíz de la incidencia anterior).
- **DB:** ✅ Neon Postgres (`ep-flat-mode-aws24q8g.c-12.us-east-1.aws.neon.tech/neondb`, región us-east-1).
  - 561 filas: 19 clubes, 348 partidos, 133 tabla_posiciones, 16 goleadores, 14 transferencias, 30 noticias, 1 user.
  - **IMPORTANTE:** la connection string va SIN `?sslmode=require` (asyncpg no acepta ese parámetro
    en el query string; si aparece, el deploy falla). El código convierte `postgres://`→`postgresql+asyncpg://`.
- **Railway:** ❌ **DESCARTADO DEFINITIVAMENTE** (sin free tier útil; el backend anterior ahí estaba muerto).
- **Koyeb:** ❌ **DESCARTADO** (cambios en la plataforma); se migró a Render.
- **Repositorio:** `DAW1BSergiomg26/liga.paraguaya.futbol` (rama `main`).

### Incidencia de despliegue — Render apuntaba a rama equivocada (RESUELTO — Julio 2026)
- **Síntoma:** el backend en Render no levantaba y el dashboard mostraba builds fallidos con
  `Exited with status 3`. El servicio estaba atascado haciendo **rollbacks automáticos al commit roto
  `aabec36`** (error de `PRAGMA table_info` — sintaxis SQLite en un backend Postgres).
- **Causa raíz:** en **Settings → Branch** del servicio de Render, la rama conectada era
  **`feature/frontend-react-v1`**, no `main`. Por eso el auto-deploy ignoraba los pushes a `main`
  (incluido el fix `c360648` que eliminaba `PRAGMA` y corregía `init_db`/`run_alembic_upgrade`).
- **Solución aplicada:**
  1. En Render → **Settings → Branch**: cambiar a **`main`**.
  2. **Manual Deploy → "Clear build cache & deploy"** para forzar un build limpio desde `c360648`.
  3. El deploy terminó OK; Uvicorn arrancó y `/health` respondió `ok`.
- **✅ Resultado verificado:** `GET /api/v1/clubes` → 19 · `GET /api/v1/partidos?per_page=500` →
  `total: 348`. Neon tiene 561 filas.
- **🚨 Si el backend vuelve a caer en Render (para los 6 compañeros del equipo):** MIRAR AQUÍ →
  - **Render → Settings → Branch** debe decir **`main`** (NO `feature/*`). Si dice otra rama, el
    auto-deploy no verá los fixes y quedará bucleando en un commit viejo.
  - **Render → Deploys / Events:** si hay un build "in progress" colgado o rollback automático,
    usá **Manual Deploy → "Clear build cache & deploy"** para destrabarlo.
  - **Render → Logs:** si el build falla con `Exited with status 3` + error de `PRAGMA`/`ALTER TABLE`,
    es el bug de migraciones SQLite en Postgres ya corregido en `c360648`; no revertir, hacer deploy de `main`.
  - Recordatorio: `run_alembic_upgrade()` en Postgres **omite Alembic** (usa `create_all`); no correr
    `alembic upgrade head` a mano contra Neon (la migración `6fbc92ce284a` altera `clubes` que no existe
    vía migraciones y rompe). El esquema ya está creado con `create_all` + `alembic stamp head`.

### Incidencia de frontend — variable horneada en Vercel (RESUELTO — Julio 2026)
- **Síntoma:** la web cargaba pero todas las secciones daban `API error: 404 Not Found`
  (clubes, partidos, tabla, torneos) y carteles rojos de "Error de conexión con el backend".
  El backend de Render respondía 200 en esas mismas rutas.
- **Causa raíz:** `frontend/src/lib/api.ts` tenía un **fallback a Railway muerto**
  (`backend-production-0b7d.up.railway.app`). Como la var `NEXT_PUBLIC_API_URL` no se había
  propagado en el build de Vercel, el frontend "horneó" ese fallback muerto y apuntaba a un
  backend inexistente → 404 en todo.
- **Solución aplicada (commit `a22bb29`):**
  1. `api.ts`: `NEXT_PUBLIC_API_URL` ya **NO** cae a Railway; si falta la var, `API_URL` queda
     vacío y se loguea un error claro en consola (en vez de apuntar a un backend muerto).
  2. Vercel → **Settings → Environment Variables**: setear `NEXT_PUBLIC_API_URL` =
     `https://liga-paraguaya-futbol.onrender.com` (sin `/` final, a Production/Preview/Dev).
  3. **Redeploy limpio** en Vercel para que la var `NEXT_PUBLIC_*` se hornee en el build.
- **✅ Resultado verificado (incógnito):** web fluido, 19 clubes + 348 partidos + tabla con datos
  reales de Neon, cero carteles rojos. Endpoints clave vivos: `/health`, `/api/v1/clubes`,
  `/api/v1/clubes/{id}`, `/api/v1/partidos`, `/api/v1/partidos/{id}`, `/api/v1/tabla`,
  `/api/v1/auth/login`, `/api/v1/predicciones`, `/api/v1/leaderboard`.
- **🚨 Regla para el equipo:** las vars `NEXT_PUBLIC_*` se **incrustan en el build**, no en runtime.
  Si se cambia una, hay que **redeploy** en Vercel (no alcanza con setearla). Y nunca dejar un
  fallback a un backend muerto en el código frontend.

### Incidencia de producción — 500 en `/api/v1/tabla/torneos` (RESUELTO — Julio 2026)
- **Síntoma:** `GET /api/v1/tabla/torneos` retornaba 500; la ruta `/historial` no cargaba datos en producción.
- **Causa raíz:** `TablaService.get_torneos()` intentaba acceder a `row.torneo` cuando era `None` (una de las 133 filas de `TablaPosicion` en Neon tenía `torneo = NULL`), y luego `dict.get(None)` lanzaba `TypeError`.
- **Solución (commit `bc0bdc2`):**
  1. `tabla_service.py`: agregado `.where(TablaPosicion.torneo.isnot(None))` + filtrado `None` en Python.
  2. `tabla.py` (router): `.model_dump()` sin `mode="json"`.
  3. `handoff.md` actualizado con incidencia y reglas.
- **Verificado:** `/api/v1/tabla/torneos` → 200 con 7 torneos.

### Reglas de automatización (aplicadas en cada cambio)
1. **SSL/asyncpg:** al tocar `.env`, `config.py` o strings de conexión, NO debe haber `?sslmode=` ni
   `ssl=true` (asyncpg los rechaza). El código ya convierte `postgres://`→`postgresql+asyncpg://`.
2. **Rutas de DB/seed:** al tocar `seed.py` o migraciones, las rutas a JSON/DB locales deben ser
   absolutas (basadas en `Path(__file__)`) para no generar DB incompletas.
3. **Handoff:** se mantiene actualizado con la arquitectura oficial Vercel + Render + Neon y Railway descartado.
4. **Tipos/imports:** antes de cerrar cualquier componente React/Next o ruta FastAPI, chequeo estricto de
   imports duplicados y directivas `"use client"` para no romper el build de Vercel.

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
| `test_historial_api.py` | — | Servicio + API de estadísticas históricas |
| `test_goleadores_api.py` | 3 | Agrupación histórica (14+10=24), endpoint historial |

## Variables de entorno

```bash
# Backend (Render, secrets en el dashboard - NO hardcodeados en el repo)
DATABASE_URL=postgresql://<neon-owner>:<pass>@<host>/neondb   # Sin ?sslmode (asyncpg lo rechaza)
JWT_SECRET=<generado en Render>
ADMIN_API_KEY=<seteado en Render>
CORS_ORIGINS=http://localhost:3000,https://frontend-ten-swart-85.vercel.app
FOOTBALL_DATA_API_KEY=  # Opcional — sin ella el sync cron es no-op, solo datos demo

# Frontend (Vercel, Environment Variables)
NEXT_PUBLIC_API_URL=https://liga-paraguaya-futbol.onrender.com
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

### Scripts de migración de datos (SQLite → Neon)
- `backend/export_data.py` — Exporta SQLite local a `data/export/*.json` (migración FK-safe).
- `backend/import_data.py` — Importa JSON a Neon (TRUNCATE CASCADE, orden de FKs respetado). Validado: 561 filas.

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
- **No pagar nada:** el usuario no quiere planes de pago. Hosting gratuito sin tarjeta (Render free si se puede verificar con tarjeta). La IA **no puede** crear las cuentas de hosting; eso lo hace el usuario.

**Testing antes de declarar "listo":**
- Backend: `cd backend; $env:PYTHONPATH=".."; python -m pytest tests/ -v` (140+ tests, deben pasar).
- Frontend: `cd frontend; npm run build` (TypeScript + build limpio).
- Deploy-readiness: `backend/tests/test_deploy_readiness.py` (4 tests: `_async_url` acepta `postgres://`, `sync_loop` no-op sin API key, etc.).
- **Vars `NEXT_PUBLIC_*` (frontend):** se hornean en el build de Vercel, NO en runtime. Si se
  cambia/setea una, hay que **redeploy** (no alcanza con guardarla). Nunca dejar fallback a un
  backend muerto en `frontend/src/lib/api.ts` (incidencia resuelta en commit `a22bb29`).

**Archivos clave de infra/deploy:**
- `render.yaml` (raíz) — Blueprint para Render.
- `backend/Dockerfile.backend` — usa `$PORT` (`${PORT:-8001}`), arranque con `run_alembic_upgrade()` (NO `drop_all`).
- `backend/requirements.txt` — dependencias de build; `requirements-optional.txt` tiene `llama-cpp-python` (opcional).
- `backend/app/api/health.py` — endpoint `/health` para health checks de Koyeb/Render.
- `backend/app/core/database.py` — `_async_url` convierte `postgres://` → `postgresql+asyncpg://`.
- `backend/app/main.py` — `sync_loop` es no-op si `FOOTBALL_DATA_API_KEY` está vacío.
- `frontend/.vercel/project.json` — config del proyecto Vercel ya linkeado.
- `frontend/public/manifest.json` — PWA manifest (nombre "Liga PY", colores APF).

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
