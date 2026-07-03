# liga.paraguaya.futbol — Diseño de Re-arquitectura Profesional

## Meta

- **Estado:** Spec aprobado
- **Fecha:** 2026-07-02
- **Stack:** Next.js 14+ (TypeScript) + FastAPI (Python) + PostgreSQL/SQLite

---

## 1. Visión General

Plataforma profesional de datos, análisis y seguimiento de la Liga Paraguaya de Fútbol. Proyecto de doble propósito: (1) portfolio técnico para presentar a reclutadores, y (2) web funcional para aficionados al fútbol paraguayo.

---

## 2. Arquitectura

### 2.1 Estructura del Repositorio

```
liga.paraguaya.futbol/
├── backend/                          # FastAPI Python API
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── api/                      # Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── clubes.py
│   │   │   ├── partidos.py
│   │   │   ├── tabla.py
│   │   │   └── health.py
│   │   ├── core/                     # Config, DB, dependencies
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # pydantic-settings
│   │   │   ├── database.py           # SQLAlchemy async engine
│   │   │   └── dependencies.py       # FastAPI Depends()
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── club.py
│   │   │   ├── partido.py
│   │   │   └── tabla.py
│   │   ├── schemas/                  # Pydantic request/response
│   │   │   ├── __init__.py
│   │   │   ├── club.py
│   │   │   ├── partido.py
│   │   │   └── tabla.py
│   │   └── services/                 # Business logic
│   │       ├── __init__.py
│   │       ├── club_service.py
│   │       ├── partido_service.py
│   │       └── tabla_service.py
│   ├── scripts/
│   │   ├── scrape.py                 # Consume APIs externas
│   │   └── seed.py                   # Seed data desde JSON a DB
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_clubes.py
│   │   ├── test_partidos.py
│   │   └── test_tabla.py
│   ├── alembic/                      # DB migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── data/                         # JSON seed data
│   │   ├── clubes_paraguay.json
│   │   ├── partidos_demo.json
│   │   └── tabla_posiciones_demo.json
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                         # Next.js 14+ TypeScript
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout (header, nav, footer)
│   │   │   ├── page.tsx              # Dashboard / home
│   │   │   ├── clubes/
│   │   │   │   ├── page.tsx          # Club list (SSR)
│   │   │   │   └── [id]/page.tsx     # Club detail (SSR)
│   │   │   ├── partidos/
│   │   │   │   ├── page.tsx          # Match list
│   │   │   │   └── [id]/page.tsx     # Match detail
│   │   │   ├── tabla/
│   │   │   │   └── page.tsx          # Standings (ISR)
│   │   │   ├── loading.tsx           # Loading states
│   │   │   ├── error.tsx             # Error boundaries
│   │   │   └── not-found.tsx         # 404 page
│   │   ├── components/
│   │   │   ├── layout/               # Navbar, Footer, Sidebar
│   │   │   ├── clubes/               # ClubCard, ClubGrid, ClubDetail
│   │   │   ├── partidos/             # MatchCard, MatchList, ScoreBadge
│   │   │   ├── tabla/                # StandingsTable, PositionRow
│   │   │   └── ui/                   # Button, Card, Spinner, ErrorBoundary
│   │   ├── lib/
│   │   │   ├── api.ts                # Typed HTTP client
│   │   │   └── utils.ts              # Date formatting, etc.
│   │   └── types/
│   │       └── index.ts              # Club, Partido, TablaRow interfaces
│   ├── public/
│   │   ├── favicon.svg
│   │   └── images/
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml                # Backend + Frontend + DB
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint, test, build
│   │   └── cd.yml                    # Deploy
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE/
├── .gitignore
├── README.md                         # Portfolio-ready
├── LICENSE                           # MIT
├── CONTRIBUTING.md
└── CHANGELOG.md
```

### 2.2 Diagrama de Flujo

```
[Browser] ←→ [Next.js SSR] ←→ [FastAPI API] ←→ [PostgreSQL/SQLite]
                               ↕
                        [scripts/scrape.py] ←→ [API-Football/ESPN]
                               ↕
                        [JSON seed data] (fallback/local)
```

### 2.3 Principios Arquitectónicos

- **Separación de concerns:** Frontend (Next.js) y Backend (FastAPI) son proyectos independientes con su propio ciclo de vida, tests y deploy.
- **API-first:** FastAPI expone una API REST documentada (OpenAPI/Swagger). Next.js la consume.
- **SSR + ISR:** Next.js renderiza en servidor para SEO y performance. Páginas de clubes usan ISR (revalidate cada hora). Datos en vivo usan fetching cliente.
- **Inyección de dependencias:** FastAPI `Depends()` para DB sessions y config.
- **Tipado compartido:** Schemas Pydantic en backend → interfaces TypeScript en frontend (manual pero consistente).

---

## 3. Backend (FastAPI)

### 3.1 Modelos de Datos (SQLAlchemy)

**Club:**
- `id: str` (PK, slug: "olimpia")
- `nombre: str`
- `ciudad: str`
- `apodo: str`
- `colores: List[str]` (JSON)
- `estadio: str`
- `fundacion: Optional[str]`
- `escudo_url: Optional[str]`
- `created_at: datetime`
- `updated_at: datetime`

**Partido:**
- `id: str` (PK)
- `torneo: str`
- `fecha: date`
- `jornada: int`
- `local_id: str` (FK → Club)
- `visitante_id: str` (FK → Club)
- `goles_local: Optional[int]`
- `goles_visitante: Optional[int]`
- `estado: str` (programado, en_vivo, finalizado, suspendido)
- `created_at: datetime`

**TablaPosicion:**
- `id: int` (PK, auto)
- `torneo: str`
- `jornada: int`
- `club_id: str` (FK → Club)
- `posicion: int`
- `pj: int`
- `pg: int`
- `pe: int`
- `pp: int`
- `gf: int`
- `gc: int`
- `dg: int`
- `puntos: int`
- `created_at: datetime`

### 3.2 Endpoints de la API

| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/` | Info del proyecto + endpoints |
| GET | `/health` | Health check |
| GET | `/api/v1/clubes` | Listar clubes (query: ?ciudad=) |
| GET | `/api/v1/clubes/{id}` | Detalle de club |
| GET | `/api/v1/partidos` | Listar partidos (query: ?torneo=&estado=&jornada=) |
| GET | `/api/v1/partidos/{id}` | Detalle de partido |
| GET | `/api/v1/tabla` | Tabla de posiciones (query: ?torneo=&jornada=) |

### 3.3 Schemas Pydantic

- `ClubOut`, `ClubDetailOut` — response models con todos los campos
- `PartidoOut`, `PartidoDetailOut` — con datos expandidos de clubes
- `TablaRowOut` — fila de tabla
- `ErrorOut` — error estándar

### 3.4 Servicios

- `ClubService` — CRUD clubes, búsqueda por nombre/ciudad
- `PartidoService` — CRUD partidos, filtros por torneo/estado/fecha
- `TablaService` — cálculo y consulta de posiciones

### 3.5 Base de Datos

- **Dev:** SQLite (`sqlite+aiosqlite:///./data/liga.db`)
- **Prod:** PostgreSQL (`postgresql+asyncpg://...`)
- **Migraciones:** Alembic (comandos `revision --autogenerate` y `upgrade head`)
- Configurable via variable de entorno `DATABASE_URL`

### 3.6 Pruebas

- `pytest` + `pytest-asyncio`
- `httpx.AsyncClient` para tests de integración contra la API
- Fixtures con fábricas de datos
- Cobertura mínima objetivo: 80%

---

## 4. Frontend (Next.js)

### 4.1 Páginas y Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | SSR | Dashboard con resumen (top clubes, próximos partidos, tabla) |
| `/clubes` | SSR | Grid de todos los clubes con búsqueda |
| `/clubes/[id]` | SSR | Perfil completo del club (datos, partidos, estadísticas) |
| `/partidos` | SSR+CSR | Calendario de partidos con filtros |
| `/partidos/[id]` | SSR | Detalle del partido (marcador, estadísticas) |
| `/tabla` | ISR (30s) | Tabla de posiciones actualizada |

### 4.2 Componentes Clave

- **layout/Navbar** — Navegación responsive con links a secciones
- **layout/Footer** — Info del proyecto, GitHub link
- **clubes/ClubCard** — Card individual en grid
- **clubes/ClubGrid** — Grid responsive con search
- **clubes/ClubDetail** — Perfil completo
- **partidos/MatchCard** — Card de partido con score
- **partidos/ScoreBadge** — Badge del resultado
- **tabla/StandingsTable** — Tabla completa con colores de posición
- **ui/LoadingSpinner** — Estado de carga
- **ui/ErrorBoundary** — Manejo de errores
- **ui/EmptyState** — Estado vacío
- **ui/SearchBar** — Input de búsqueda reutilizable

### 4.3 Data Fetching

- **SSR:** `fetch()` en Server Components para datos iniciales
- **CSR:** TanStack Query para datos dinámicos (partidos en vivo)
- **API Client:** Función tipada `api.get<T>(path, params)` con manejo de errores centralizado

### 4.4 Estilos

- Tailwind CSS para utility-first styling
- Tema oscuro predeterminado (herencia del diseño actual)
- Componentes UI consistentes (Card, Button, Badge)

### 4.5 Pruebas

- Jest + @testing-library/react
- Tests de componentes y páginas
- Mocks del API client

---

## 5. Pipeline de Datos

### 5.1 Fuentes

1. **API-Football (RapidAPI)** — fuente primaria para partidos, resultados, posiciones
2. **ESPN (soccerdata)** — fuente secundaria, laboratorio
3. **JSON seed data** — fallback local para desarrollo y demo

### 5.2 Scripts

- `scripts/scrape.py` — con `schedule` para ejecución periódica
- `scripts/seed.py` — carga datos JSON iniciales a DB
- Los scripts se ejecutan manualmente o via GitHub Actions (cron)

### 5.3 Flujo

1. Seed carga JSON a DB vacía
2. Scrape actualiza partidos y resultados desde API
3. FastAPI siempre sirve desde DB
4. Si no hay conexión a API externa → datos existentes en DB

---

## 6. Infraestructura

### 6.1 Desarrollo Local

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# O todo junto
docker-compose up
```

### 6.2 Docker Compose

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/liga.db
      - CORS_ORIGINS=http://localhost:3000
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on: [backend]
```

### 6.3 CI/CD (GitHub Actions)

- **CI:** `npm run lint` + `npm run test` + `pytest` en cada PR a main
- **CD:** Deploy automático a Vercel (frontend) + Railway/Render (backend)

### 6.4 Variables de Entorno

```
# Backend
DATABASE_URL=sqlite+aiosqlite:///./data/liga.db
CORS_ORIGINS=http://localhost:3000,https://ligaparaguaya.vercel.app
API_FOOTBALL_KEY=xxx

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 7. Portfolio-Ready

### Documentación

- **README.md:** Badges (build, coverage, license), descripción, capturas, arquitectura, quickstart, tech stack, contributors
- **LICENSE:** MIT
- **CONTRIBUTING.md:** Cómo contribuir, estándares de código
- **CHANGELOG.md:** Historial de versiones

### Calidad

- ESLint + Prettier (frontend)
- Ruff (backend)
- Conventional Commits
- Issue y PR templates
- GitHub Projects para roadmap

### Despliegue

- Frontend en Vercel (deploy automático desde main)
- Backend en Railway o Render
- URL pública: https://ligaparaguaya.vercel.app (ejemplo)

---

## 8. Roadmap de Implementación

El trabajo se divide en 3 fases progresivas, cada una entregable y desplegable:

### Fase 1 — Fundación (prioridad máxima)
- Migrar backend a arquitectura en capas (api/core/models/schemas/services)
- Configurar SQLAlchemy + Alembic + SQLite
- Migrar frontend a Next.js + TypeScript + Tailwind
- Páginas: Home, Clubes, Partidos, Tabla
- README + LICENSE + CI básico

### Fase 2 — Profesionalización
- Tests (backend pytest + frontend Jest)
- Docker Compose
- Pipeline de scraping
- Error boundaries, loading states
- CHANGELOG + CONTRIBUTING + templates
- Deploy a producción

### Fase 3 — Features Avanzadas (futuro)
- Autenticación de usuarios
- Comentarios / predicciones
- Crónicas generadas por IA (usando el prompt existente)
- Estadísticas avanzadas y gráficos
- PWA / mobile-first
