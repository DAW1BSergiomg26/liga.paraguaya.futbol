# Deploy Vercel + Railway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar frontend Next.js en Vercel y backend FastAPI en Railway, ambos gratis y auto-deploy desde GitHub.

**Architecture:** Frontend en Vercel (sin cambios de código, solo configurar env var). Backend en Railway con PostgreSQL (cambiar driver, configurar DATABASE_URL via env, auto-seed al iniciar). GitHub Actions CI sigue usando SQLite.

**Tech Stack:** Vercel (frontend), Railway (backend + PostgreSQL), asyncpg (driver PostgreSQL), GitHub Actions

## Global Constraints

- Backend tests deben seguir usando SQLite in-memory (no requieren PostgreSQL)
- Railway usa Dockerfile.backend existente
- Vercel detecta Next.js automáticamente
- `NEXT_PUBLIC_API_URL` se configura en Vercel dashboard, no en código

---

### Task 1: Backend — Soportar PostgreSQL via env var

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/core/config.py`

**Interfaces:**
- Consumes: Settings actual con DATABASE_URL hardcodeada
- Produces: Settings con DATABASE_URL configurable via env var `DATABASE_URL`, default SQLite

- [ ] **Step 1: Agregar asyncpg a requirements.txt**

```txt
# backend/requirements.txt (agregar al final)
asyncpg>=0.30.0
```

- [ ] **Step 2: Modificar config.py para leer DATABASE_URL del entorno**

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "liga.paraguaya.futbol API"
    VERSION: str = "0.7.0"
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/liga.db"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
```

- [ ] **Step 3: Verificar que tests sigan pasando con SQLite**

Run: `python -m pytest backend/tests/ -v`
Expected: 9 passed

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt backend/app/core/config.py
git commit -m "feat: support PostgreSQL via DATABASE_URL env var"
```

---

### Task 2: Backend — Auto-seed al iniciar

**Files:**
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: `init_db()` + `seed_clubes()`, `seed_partidos()`, `seed_tabla()` de `backend/app/scripts/seed.py`
- Produces: En Railway, DB se seed automáticamente al primer inicio

- [ ] **Step 1: Modificar lifespan en main.py para auto-seed**

```python
# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.database import async_session, init_db
from backend.app.scripts.seed import seed_clubes, seed_partidos, seed_tabla
from backend.app.api.health import router as health_router
from backend.app.api.clubes import router as clubes_router
from backend.app.api.partidos import router as partidos_router
from backend.app.api.tabla import router as tabla_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session() as db:
        from sqlalchemy import select
        from backend.app.models.club import Club
        existing = await db.execute(select(Club).limit(1))
        if not existing.scalar_one_or_none():
            await seed_clubes(db)
            await seed_partidos(db)
            await seed_tabla(db)
            await db.commit()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(clubes_router, prefix="/api/v1")
app.include_router(partidos_router, prefix="/api/v1")
app.include_router(tabla_router, prefix="/api/v1")
```

- [ ] **Step 2: Verificar que seed automático funciona**

Run: `python -m pytest backend/tests/ -v`
Expected: 9 passed

(No hay test específico para auto-seed; el seed ya está probado implícitamente via el flujo de tests que insertan datos)

- [ ] **Step 3: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: auto-seed database on first startup"
```

---

### Task 3: Railway — Configurar deploy

**Files:**
- Create: `railway.json` (opcional, para configurar Railway)
- Create: `Procfile` (para Railway — define el comando)
- Verify: `Dockerfile.backend`

- [ ] **Step 1: Crear railway.json**

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.backend"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

- [ ] **Step 2: Verificar Dockerfile.backend**

```dockerfile
# Dockerfile.backend
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port 8001
```

(Asegurarse que ya está correcto — se creó en la sesión anterior)

- [ ] **Step 3: Commit**

```bash
git add railway.json Dockerfile.backend
git commit -m "feat: add Railway deployment config"
```

---

### Task 4: Frontend — Configurar Vercel

**Files:**
- Create: `vercel.json` (en raíz del proyecto, para que Vercel sepa que el frontend está en frontend/)

- [ ] **Step 1: Crear vercel.json para apuntar al subdirectorio frontend/**

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "installCommand": "cd frontend && npm install",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs"
}
```

Wait, Vercel monorepo setup is different. Actually for a monorepo where the frontend is in `frontend/`, Vercel's recommended approach is to set the Root Directory in the Vercel dashboard to `frontend/`. No `vercel.json` needed at the root.

Actually, let me reconsider. The simplest approach is:

**Option A**: Root directory config in Vercel dashboard -> set to `frontend/`
**Option B**: `vercel.json` at root with `"rootDirectory": "frontend"`

Option A is simpler but requires manual config. Option B makes it declarative.

Let me go with creating vercel.json.

- [ ] **Step 2: Crear vercel.json**

```json
{
  "rootDirectory": "frontend",
  "framework": "nextjs"
}
```

- [ ] **Step 3: Verificar que frontend build sigue funcionando**

Run: `cd frontend && npm run build`
Expected: Build exitoso

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel deployment config"
```

---

### Task 5: GitHub Actions — CI actualizado

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Config actual de CI
- Produces: CI que corre tests backend + build frontend, con soporte para PostgreSQL futuro si es necesario

- [ ] **Step 1: Verificar que CI actual funciona sin PostgreSQL**

El CI actual ya corre tests con SQLite y no necesita cambios. Solo verificar que el workflow sigue siendo correcto.

```yaml
# .github/workflows/ci.yml (sin cambios — ya funciona)
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install dependencies
        run: pip install -r backend/requirements.txt
      - name: Run tests
        run: python -m pytest backend/tests/ -v

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: frontend
      - name: Lint
        run: npm run lint
        working-directory: frontend
      - name: Build
        run: npm run build
        working-directory: frontend
```

No hay cambios reales — solo confirmar que el workflow actual está correcto.

- [ ] **Step 2: Commit (si hubo cambios)**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: update CI workflow"
```

(Si no hubo cambios, skipear este paso)

---

### Task 6: Push a GitHub y configurar deploys

- [ ] **Step 1: Subir a GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Configurar Vercel**
  1. Ir a https://vercel.com/new
  2. Importar repo `liga.paraguaya.futbol`
  3. Root Directory: `frontend/`
  4. Framework: Next.js
  5. Environment Variable: `NEXT_PUBLIC_API_URL` = URL del backend en Railway
  6. Deploy

- [ ] **Step 3: Configurar Railway**
  1. Ir a https://railway.app/new
  2. Importar repo `liga.paraguaya.futbol`
  3. Railway detecta Dockerfile.backend automáticamente
  4. Add una base de datos PostgreSQL (Railway la provee)
  5. Railway inyecta `DATABASE_URL` automáticamente en el entorno
  6. Deploy

- [ ] **Step 4: Verificar funcionamiento**
  1. Abrir URL de Vercel
  2. Verificar que carga el frontend
  3. Verificar que los datos de API se muestran (tabla, clubes, partidos)
