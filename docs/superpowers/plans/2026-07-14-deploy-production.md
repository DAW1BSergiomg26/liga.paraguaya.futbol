# Deployment a Producción Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desplegar el backend (FastAPI) en Railway y el frontend (Next.js) en Vercel, con los módulos completados (Transferencias, Estadísticas Históricas), y verificar que funcionan en producción.

**Architecture:** Backend en Railway vía `Dockerfile.backend` (builder DOCKERFILE) + plugin PostgreSQL; frontend en Vercel (`vercel deploy --prod`). El frontend consume el backend vía `NEXT_PUBLIC_API_URL`. Ambos CLIs ya están autenticados en la máquina. Se aplican 2 fixes de hardening antes del deploy para evitar fallos en producción.

**Tech Stack:** FastAPI, SQLAlchemy+asyncpg, Alembic, Railway CLI, Vercel CLI, Next.js 16, React Query.

## Global Constraints

- Backend usa `DATABASE_URL` desde env; default dev `sqlite+aiosqlite:///./data/liga.db`. Railway inyecta PostgreSQL.
- `core/database.py` `_async_url` convierte `postgresql://` → `postgresql+asyncpg://`. (Se extiende a `postgres://`.)
- `main.py` lifespan ejecuta `run_alembic_upgrade()` (NO `drop_all`) + seeds idempotentes + `sync_loop`.
- Dockerfile.backend corre uvicorn en `${PORT:-8001}`.
- CORS: `settings.cors_origin_list` lee `cors_origins` (coma-separado).
- Commits en español, frecuentes. Tests backend con pytest (`$env:PYTHONPATH=".."`).

---

### Task 1: `_async_url` maneja `postgres://`

**Files:**
- Modify: `backend/app/core/database.py:13-16`
- Test: `backend/tests/test_deploy_readiness.py` (crear)

**Interfaces:**
- Consumes: ninguno.
- Produces: `_async_url(url: str) -> str` debe devolver driver asyncpg tanto para `postgresql://` como `postgres://`.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_deploy_readiness.py
from backend.app.core.database import _async_url


def test_async_url_postgresql_prefix():
    assert _async_url("postgresql://u:p@host/db") == "postgresql+asyncpg://u:p@host/db"


def test_async_url_postgres_prefix():
    # Railway a veces inyecta DATABASE_URL como postgres://
    assert _async_url("postgres://u:p@host/db") == "postgresql+asyncpg://u:p@host/db"


def test_async_url_sqlite_unchanged():
    assert _async_url("sqlite+aiosqlite:///./data/liga.db") == "sqlite+aiosqlite:///./data/liga.db"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend ; $env:PYTHONPATH=".." ; python -m pytest tests/test_deploy_readiness.py -v`
Expected: FAIL en `test_async_url_postgres_prefix` (devuelve `postgres://...` sin convertir).

- [ ] **Step 3: Write minimal implementation**

```python
# backend/app/core/database.py  (reemplazar función _async_url)
def _async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend ; $env:PYTHONPATH=".." ; python -m pytest tests/test_deploy_readiness.py -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/database.py backend/tests/test_deploy_readiness.py
git commit -m "fix: handle postgres:// DATABASE_URL prefix for Railway"
```

---

### Task 2: `sync_loop` no-op sin API key

**Files:**
- Modify: `backend/app/main.py:28-36` (función `sync_loop`)
- Test: agregar a `backend/tests/test_deploy_readiness.py`

**Interfaces:**
- Consumes: `settings.api_football_key` (str, vacío = sin key).
- Produces: `sync_loop()` retorna inmediatamente (no hace loop) cuando `api_football_key` está vacío.

- [ ] **Step 1: Write the failing test**

```python
# agregar a backend/tests/test_deploy_readiness.py
import asyncio
import backend.app.main as main


async def test_sync_loop_skips_without_api_key(monkeypatch):
    monkeypatch.setattr(main.settings, "api_football_key", "")
    task = asyncio.create_task(main.sync_loop())
    done, _ = await asyncio.wait({task}, timeout=1.0)
    assert task in done  # completó (no entró en loop de 600s)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend ; $env:PYTHONPATH=".." ; python -m pytest tests/test_deploy_readiness.py::test_sync_loop_skips_without_api_key -v`
Expected: FAIL (el loop no termina en 1s → timeout, task no done).

- [ ] **Step 3: Write minimal implementation**

```python
# backend/app/main.py  (reemplazar sync_loop)
async def sync_loop():
    if not settings.api_football_key:
        logger.info("FOOTBALL_DATA_API_KEY no configurada - sync_loop desactivado")
        return
    while True:
        try:
            from backend.app.services.football_data_service import FootballDataService
            result = FootballDataService.sync_all()
            logger.info(f"Sync result: {result}")
        except Exception as e:
            logger.error(f"Sync failed: {e}")
        await asyncio.sleep(600)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend ; $env:PYTHONPATH=".." ; python -m pytest tests/test_deploy_readiness.py -v`
Expected: PASS (incluye los 3 de Task 1 + este).

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/tests/test_deploy_readiness.py
git commit -m "fix: disable sync_loop when FOOTBALL_DATA_API_KEY is empty"
```

---

### Task 3: Push hardening a main

**Files:** (ninguno nuevo; solo push)

- [ ] **Step 1: Push a main**

```bash
git push origin main
```

Expected: push exitoso. Railway/Vercel (si están linkeados al repo) iniciarán deploy; de todos modos en Tasks 4-6 deployamos vía CLI.

---

### Task 4: Deploy backend a Railway

**Files:** (infra existente: `Dockerfile.backend`, `railway.json`)

- [ ] **Step 1: Inicializar proyecto Railway (desde raíz del repo)**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
railway init --name liga-paraguaya-backend
```
Si ya existe proyecto y querés reusarlo: `railway link` y elegir el proyecto.

- [ ] **Step 2: Agregar PostgreSQL**

```bash
railway add --service liga-paraguaya-backend  # elegir "PostgreSQL" en el prompt
```
(Alternativa por dashboard: agregar plugin Postgres al servicio.)

- [ ] **Step 3: Setear variables de entorno**

```bash
railway variables set SECRET_KEY="<generar: openssl rand -hex 32>"
railway variables set JWT_SECRET="<generar: openssl rand -hex 32>"
railway variables set ADMIN_API_KEY="Rufi141414%$"
railway variables set CORS_ORIGINS="http://localhost:3000,https://frontend-ten-swart-85.vercel.app"
railway variables set FOOTBALL_DATA_API_KEY=""
```
Nota: `CORS_ORIGINS` se actualiza en Task 6 con la URL real de Vercel. `DATABASE_URL` lo inyecta Railway automáticamente (Postgres plugin).

- [ ] **Step 4: Deploy**

```bash
railway up
```
Esperar build exitoso. Luego obtener dominio:

```bash
railway domain
```
Anotar la URL del backend (ej. `https://<id>.up.railway.app`).

- [ ] **Step 5: Commit (si railway genera archivos locales)**

```bash
git add -A
git commit -m "chore: railway project config"  # solo si hay cambios (railway.json ya existe)
```
(Si no hay cambios locales, omitir.)

---

### Task 5: Deploy frontend a Vercel (prod)

**Files:** `frontend/` (build existente)

- [ ] **Step 1: Setear NEXT_PUBLIC_API_URL con la URL del backend (Task 4)**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend
vercel env add NEXT_PUBLIC_API_URL production  # pegar la URL del backend Railway, ej. https://<id>.up.railway.app
```

- [ ] **Step 2: Deploy a producción**

```bash
vercel deploy --prod
```
Esperar build exitoso. Anotar la URL del frontend (ej. `https://frontend-<hash>.vercel.app` o la del proyecto).

- [ ] **Step 3: Actualizar CORS en backend con la URL real de Vercel**

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
railway variables set CORS_ORIGINS="http://localhost:3000,https://<frontend-vercel-url>"
```
Esto re-deploya el backend. Esperar a que termine.

---

### Task 6: Verificación en vivo

**Files:** (ninguno)

- [ ] **Step 1: Backend health**

```bash
$B="https://<backend-railway-url>"
curl.exe -s -m 30 "$B/health"
```
Expected: `{"status":"ok",...}` (HTTP 200). (El primer request puede tardar ~10s por cold start.)

- [ ] **Step 2: Endpoints nuevos**

```bash
curl.exe -s -m 30 "$B/api/v1/transferencias" | Select-Object -First 1
curl.exe -s -m 30 "$B/api/v1/historial/campeones" | Select-Object -First 1
```
Expected: HTTP 200 con JSON (`transferencias` lista; `campeones` lista).

- [ ] **Step 3: Frontend**

Abrir en navegador: `https://<frontend-vercel-url>/transferencias` y `https://<frontend-vercel-url>/historial`.
Expected: las páginas renderizan datos (transferencias e historial).

---

### Task 7: Actualizar Handoff y roadmap

**Files:**
- Modify: `Handoff.md`

- [ ] **Step 1: Actualizar sección de producción**

En "### En producción (Railway + Vercel)" reemplazar las URLs por las nuevas obtenidas en Tasks 4-5, y borrar la nota "`FOOTBALL_DATA_API_KEY` no configurada — sync cron retorna errores" (ahora es no-op).

- [ ] **Step 2: Marcar roadmap**

En "## Roadmap del Usuario", cambiar:
`6. 📋 Deployment a producción` → `6. ✅ Deployment a producción`

- [ ] **Step 3: Commit y push**

```bash
git add Handoff.md
git commit -m "docs: update Handoff with production deployment URLs"
git push origin main
```

---

## Self-Review Notes
- Spec coverage: fix #1 (_async_url postgres://) → Task 1; fix #2 (sync_loop no-op) → Task 2; backend deploy → Task 4; frontend deploy → Task 5; verify → Task 6; Handoff → Task 7. Cobertura completa.
- No placeholders: tasks 1-2 con código y tests reales; tasks 4-5 con comandos CLI concretos (algunos pasos pueden requerir selección en prompt interactivo del CLI).
- Consistencia de tipos: `_async_url(str)->str` y `sync_loop()` coinciden entre tasks.
