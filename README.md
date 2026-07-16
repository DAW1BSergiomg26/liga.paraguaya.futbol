# Liga Paraguaya de Fútbol

Plataforma web para el seguimiento de la **Primera División paraguaya de fútbol**. Proyecto de portfolio que combina datos reales (scraping + Football-Data.org), predicciones en vivo, chat por partido, notificaciones push, noticias RSS, módulo de transferencias, estadísticas históricas, análisis táctico IA, un asistente (Cerezo Digital) y una **red 3D interactiva de clubes**.

> Demo en producción (frontend en Vercel): el backend corre en hosting gratuito (sin tarjeta). Ver `Handoff.md` para el estado de despliegue y credenciales.

## Tech Stack

| Capa | Tecnologías |
|------|-------------|
| Frontend | Next.js 16 (App Router), TypeScript (estricto), Tailwind CSS v4, TanStack Query, GSAP 3.15, Framer Motion 12, Recharts, D3, Three.js / 3d-force-graph |
| Backend | FastAPI, Python 3.12+, SQLAlchemy (async), Pydantic v2, WebSockets |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción vía Alembic + Neon) |
| Scraping | selectolax, httpx, RSSSF + Wikipedia |
| Autenticación | JWT (bcrypt + PyJWT), 7-day tokens |
| APIs externas | Football-Data.org (competición `PA1`), 6 fuentes RSS de noticias |
| Infraestructura | Docker, Uvicorn, Vercel (frontend), Koyeb + Neon (backend, gratis sin tarjeta) |

## Funcionalidades

### Predicciones + Autenticación
- Predicciones en vivo (local / empate / visitante) con cierre automático al iniciar el partido.
- Sistema de puntuación (3 pts exacto, 1 por tendencia) y leaderboard.
- Autenticación JWT por email + contraseña (registro/login), panel de admin.

### Chat + Notificaciones
- Chat en vivo por partido vía WebSocket.
- Notificaciones push (Service Worker + Push API) con suscripción y envío desde admin.

### Scraper Engine + Datos históricos
- `ScraperBase` con rate limiting y cache; scrapers de Wikipedia (datos de clubes) y RSSSF (resultados 2020–2026).
- 7 temporadas reconstruibles; seed automático al arrancar la app.

### Módulo Noticias
- `NoticiaService` (CRUD + filtros) y `RssSyncService` (6 fuentes RSS: ABC Color, APF, ESPN Paraguay, Telefuturo, etc.).
- Páginas `/noticias` y `/noticias/[id]` con `NoticiaCard`, `NoticiaGrid`, `FiltrosNoticias`.

### Módulo Transferencias
- Modelo `Transferencia`, 9 endpoints (CRUD, mercado, historial, estadísticas, sync RSS).
- Páginas `/transferencias`, `/transferencias/[id]`, `/mercado`, `/historial`, `/estadisticas` (gráficos Recharts).

### Estadísticas Históricas
- `HistorialService` (campeones por torneo, ranking all-time, rendimiento por club).
- Sección `/historial` con 3 tabs y gráficos de títulos / posición por temporada.

### Cerezo Digital — Asistente IA
- Clasificador de intents, extractor de entidades, motor de predicciones H2H y generador de respuestas.
- Endpoint `POST /api/v1/cerezo/ask` y página `/cerezo` (chat UI).

### Análisis Táctico IA
- Modelos `Player`/`Team`/`MatchEvent`/`TacticalAnalysis`; endpoints de análisis en tiempo real, reportes y stats.

### Red 3D de Clubes (`/red3d`)
- Grafo 3D (Three.js + 3d-force-graph) con **escudos reales** de los 19 clubes, nombres siempre visibles, halo APF, bloom y starfield.
- Dos modos: **Rivalidades** (clásicos/enfrentamientos) y **Mercado de Fichajes** (pases entre clubes por temporada).
- Lista lateral clicable con escudo + nombre, buscador, auto-rotación, centrado de cámara, panel de detalle y leyenda. Crash-proof ante nodos sin coordenadas.

### API REST
- OpenAPI en `/docs`; API Key opcional con rate limiting; health check en `/health`.

## Cómo empezar

### Requisitos
- Python 3.12+
- Node.js 20+
- Docker (opcional)

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
$env:PYTHONPATH=".."          # PowerShell
python -m alembic upgrade head
python -m uvicorn backend.app.main:app --reload --port 8000
```
API en `http://localhost:8000` · docs en `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App en `http://localhost:3000`.

### Docker
```bash
docker compose up --build
```

## Tests

```bash
# Backend (140+ tests)
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v

# Frontend (typecheck + build limpio)
cd frontend
npm run build
npx vitest run
```

## Estructura del proyecto

```
liga.paraguaya.futbol/
├── backend/
│   ├── alembic/              # Migraciones (001-008)
│   ├── app/
│   │   ├── api/              # Routers (clubes, partidos, tabla, predicciones, chat, push,
│   │   │                     #   admin, cerezo, noticias, transferencias, historial, health)
│   │   ├── core/             # Config, DB, dependencias (get_current_user, get_current_admin)
│   │   ├── models/           # 11 modelos SQLAlchemy
│   │   ├── schemas/          # Pydantic v2
│   │   ├── scripts/          # Seed de datos
│   │   ├── services/         # Lógica de negocio (noticias, RSS, cerezo, transferencias...)
│   │   └── main.py           # Entry point
│   ├── scripts/              # Scrapers (Wikipedia, RSSSF)
│   ├── tests/                # 140+ tests (pytest)
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── escudos/          # 19 PNG reales de clubes (mapeados en lib/escudos.ts)
│   │   ├── data/red-clubes.json
│   │   └── sw.js             # Service Worker (push + PWA)
│   └── src/
│       ├── app/              # Páginas (tabla, clubes, partidos, predicciones, red3d, ...)
│       ├── components/       # hero, layout, noticia, sidebar, red3d, tactico, transferencia, ui
│       ├── lib/              # api.ts, escudos.ts, gsap.ts
│       └── types/            # Tipos TypeScript
├── data/                     # liga.db, clubes_paraguay.json, partidos_historicos/
├── docs/superpowers/         # Specs de diseño + planes
├── Dockerfile.backend
├── Dockerfile.frontend
├── render.yaml               # Blueprint para Render (alternativa de deploy)
└── docker-compose.yml
```

## Licencia

Distribuido bajo licencia MIT. Consulta el archivo `LICENSE` para más información.

> Para el estado de despliegue, cuentas de hosting, variables de entorno y el workflow de desarrollo, lee **`Handoff.md`**.
