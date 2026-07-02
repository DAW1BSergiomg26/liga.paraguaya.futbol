### Task 5: Backend — API Routes + Main App

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/clubes.py`
- Create: `backend/app/api/partidos.py`
- Create: `backend/app/api/tabla.py`
- Create: `backend/app/api/health.py`
- Create: `backend/app/main.py`

**Interfaces:**
- Consumes: `ClubService`, `PartidoService`, `TablaService`; `get_db` dependency; schemas
- Produces: FastAPI app with CORS, routers, lifespan (init DB on startup)

- [ ] **Step 1: Create `backend/app/api/__init__.py`** (empty)

- [ ] **Step 2: Create `backend/app/api/health.py`**

```python
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "mensaje": "Backend activo correctamente"}
```

- [ ] **Step 3: Create `backend/app/api/clubes.py`**

```python
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.club import ClubOut
from backend.app.services.club_service import ClubService

router = APIRouter(prefix="/api/v1/clubes", tags=["clubes"])


@router.get("", response_model=list[ClubOut])
async def listar_clubes(
    ciudad: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await ClubService.get_all(db, ciudad=ciudad)


@router.get("/{club_id}", response_model=ClubOut)
async def detalle_club(
    club_id: str,
    db: AsyncSession = Depends(get_db),
):
    club = await ClubService.get_by_id(db, club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el club con id: {club_id}",
        )
    return club
```

- [ ] **Step 4: Create `backend/app/api/partidos.py`**

```python
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.partido import PartidoDetailOut, PartidoOut
from backend.app.services.partido_service import PartidoService

router = APIRouter(prefix="/api/v1/partidos", tags=["partidos"])


@router.get("", response_model=list[PartidoOut])
async def listar_partidos(
    torneo: Optional[str] = None,
    estado: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await PartidoService.get_all(db, torneo=torneo, estado=estado)


@router.get("/{partido_id}", response_model=PartidoDetailOut)
async def detalle_partido(
    partido_id: str,
    db: AsyncSession = Depends(get_db),
):
    partido = await PartidoService.get_by_id(db, partido_id)
    if not partido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el partido con id: {partido_id}",
        )
    return partido
```

- [ ] **Step 5: Create `backend/app/api/tabla.py`**

```python
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.tabla import TablaRowOut
from backend.app.services.tabla_service import TablaService

router = APIRouter(prefix="/api/v1/tabla", tags=["tabla"])


@router.get("", response_model=list[TablaRowOut])
async def obtener_tabla(
    torneo: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await TablaService.get_table(db, torneo=torneo)
```

- [ ] **Step 6: Create `backend/app/main.py`**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import clubes, health, partidos, tabla
from backend.app.core.config import settings
from backend.app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="API para clubes, partidos, tabla y datos base de la Liga Paraguaya de Fútbol.",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(clubes.router)
app.include_router(partidos.router)
app.include_router(tabla.router)


@app.get("/")
async def root():
    return {
        "proyecto": "liga.paraguaya.futbol",
        "estado": "API funcionando",
        "version": settings.app_version,
        "endpoints": [
            "/health",
            "/api/v1/clubes",
            "/api/v1/clubes/{club_id}",
            "/api/v1/partidos",
            "/api/v1/partidos/{partido_id}",
            "/api/v1/tabla",
        ],
    }
```

- [ ] **Step 7: Run the server to verify it starts**

```powershell
cd backend
uvicorn backend.app.main:app --reload --port 8001
```

Then open `http://localhost:8001/docs` and verify Swagger loads with all endpoints.

Stop the server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(backend): API routes and main FastAPI app"
```

---


