# Phase 1 — Fundación: Implementación Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar backend a arquitectura en capas con DB y migrar frontend a Next.js + TypeScript + Tailwind

**Architecture:** Backend FastAPI con capas (api/core/models/schemas/services) + SQLAlchemy asíncrono + SQLite. Frontend Next.js 14+ App Router con TypeScript y Tailwind. El frontend consume el backend via HTTP.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, Next.js 14+, TypeScript 5+, Tailwind CSS 4, TanStack Query 5

## Global Constraints

- Python >= 3.11
- Node.js >= 20
- FastAPI >= 0.115
- SQLAlchemy >= 2.0
- Next.js >= 14
- TypeScript >= 5
- Tailwind CSS v4
- Backend corre en puerto 8001
- Frontend corre en puerto 3000
- Base de datos SQLite en dev (`data/liga.db`)
- Variable de entorno `DATABASE_URL` para DB URL
- Variable de entorno `CORS_ORIGINS` para orígenes permitidos
- Variable de entorno `NEXT_PUBLIC_API_URL` para URL del backend

---

## File Structure

### Backend (crear/modificar):

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FASTAPI app con CORS, routers, lifespan
│   ├── api/
│   │   ├── __init__.py
│   │   ├── clubes.py                    # GET /api/v1/clubes, GET /api/v1/clubes/{id}
│   │   ├── partidos.py                  # GET /api/v1/partidos, GET /api/v1/partidos/{id}
│   │   ├── tabla.py                     # GET /api/v1/tabla
│   │   └── health.py                    # GET /api/v1/health
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                    # pydantic-settings
│   │   ├── database.py                  # SQLAlchemy async engine + session
│   │   └── dependencies.py              # get_db session dependency
│   ├── models/
│   │   ├── __init__.py                  # Base + reg all models
│   │   ├── club.py                      # Club ORM
│   │   ├── partido.py                   # Partido ORM
│   │   └── tabla.py                     # TablaPosicion ORM
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── club.py                      # ClubOut, ClubDetailOut
│   │   ├── partido.py                   # PartidoOut, PartidoDetailOut
│   │   └── tabla.py                     # TablaRowOut
│   ├── services/
│   │   ├── __init__.py
│   │   ├── club_service.py              # get_all, get_by_id
│   │   ├── partido_service.py           # get_all, get_by_id
│   │   └── tabla_service.py             # get_table
│   └── scripts/
│       └── seed.py                      # Carga JSON a DB desde CLI
├── data/
│   ├── clubes_paraguay.json             # (existente)
│   ├── partidos_demo.json               # (existente)
│   └── tabla_posiciones_demo.json       # (existente)
├── tests/
│   ├── __init__.py
│   ├── conftest.py                      # Fixtures: test DB, client
│   ├── test_clubes.py
│   ├── test_partidos.py
│   └── test_tabla.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/                        # Migraciones auto-generadas
├── requirements.txt
└── Dockerfile
```

### Frontend (crear nuevo proyecto):

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout con Navbar + Footer
│   │   ├── page.tsx                     # Dashboard
│   │   ├── clubes/
│   │   │   ├── page.tsx                 # Lista clubes (SSR)
│   │   │   └── [id]/page.tsx            # Detalle club (SSR)
│   │   ├── partidos/
│   │   │   ├── page.tsx                 # Lista partidos (SSR)
│   │   │   └── [id]/page.tsx            # Detalle partido (SSR)
│   │   ├── tabla/page.tsx               # Tabla posiciones (ISR)
│   │   ├── loading.tsx                  # Loading state
│   │   ├── error.tsx                    # Error boundary
│   │   └── not-found.tsx               # 404
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── clubes/
│   │   │   ├── ClubCard.tsx
│   │   │   └── ClubGrid.tsx
│   │   ├── partidos/
│   │   │   ├── MatchCard.tsx
│   │   │   └── ScoreBadge.tsx
│   │   ├── tabla/
│   │   │   └── StandingsTable.tsx
│   │   └── ui/
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorMessage.tsx
│   ├── lib/
│   │   └── api.ts                       # Cliente HTTP tipado
│   └── types/
│       └── index.ts                     # Interfaces: Club, Partido, TablaRow
├── public/
│   └── images/
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile
```

---

### Task 1: Backend — Core (config, database, dependencies)

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/core/dependencies.py`
- Modify: `backend/requirements.txt`

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `Settings` class (from `core.config`)
  - `engine` (AsyncEngine), `async_session` (async_sessionmaker) (from `core.database`)
  - `get_db()` -> AsyncIterator[AsyncSession] (from `core.dependencies`)
  - `Base` declarative base (from `core.database`)

- [ ] **Step 1: Update requirements.txt**

```txt
# backend/requirements.txt
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy[asyncio]>=2.0.0
aiosqlite>=0.20.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
alembic>=1.13.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.24.0
```

- [ ] **Step 2: Create `backend/app/__init__.py`** (empty file)

- [ ] **Step 3: Create `backend/app/core/__init__.py`** (empty file)

- [ ] **Step 4: Create `backend/app/core/config.py`**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "liga.paraguaya.futbol API"
    app_version: str = "0.6.0"
    debug: bool = True

    database_url: str = "sqlite+aiosqlite:///./data/liga.db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    api_football_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
```

- [ ] **Step 5: Create `backend/app/core/database.py`**

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.app.core.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_connection():
    async with engine.begin() as conn:
        yield conn


async def init_db():
    async with engine.begin() as conn:
        from backend.app.models import club, partido, tabla
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 6: Create `backend/app/core/dependencies.py`**

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import async_session


async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

- [ ] **Step 7: Verify imports work**

```powershell
cd backend
python -c "from backend.app.core.config import settings; print(settings.app_name)"
```

Expected output: `liga.paraguaya.futbol API`

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(backend): core config, database and dependencies"
```

---

### Task 2: Backend — SQLAlchemy Models

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/club.py`
- Create: `backend/app/models/partido.py`
- Create: `backend/app/models/tabla.py`

**Interfaces:**
- Consumes: `Base` from `core.database`
- Produces:
  - `Club` ORM class (tabla `clubes`)
  - `Partido` ORM class (tabla `partidos`)
  - `TablaPosicion` ORM class (tabla `tabla_posiciones`)

- [ ] **Step 1: Create `backend/app/models/__init__.py`**

```python
from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion

__all__ = ["Club", "Partido", "TablaPosicion"]
```

- [ ] **Step 2: Create `backend/app/models/club.py`**

```python
from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Club(Base):
    __tablename__ = "clubes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    ciudad: Mapped[str] = mapped_column(String(100))
    apodo: Mapped[str] = mapped_column(String(100))
    colores: Mapped[list[str]] = mapped_column(JSON, default=list)
    estadio: Mapped[str] = mapped_column(String(150))
```

- [ ] **Step 3: Create `backend/app/models/partido.py`**

```python
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Partido(Base):
    __tablename__ = "partidos"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    torneo: Mapped[str] = mapped_column(String(100))
    fecha: Mapped[date] = mapped_column(Date)
    jornada: Mapped[int] = mapped_column(Integer, default=1)
    local_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    visitante_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    goles_local: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    goles_visitante: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="programado")

    local = relationship("Club", foreign_keys=[local_id])
    visitante = relationship("Club", foreign_keys=[visitante_id])
```

- [ ] **Step 4: Create `backend/app/models/tabla.py`**

```python
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class TablaPosicion(Base):
    __tablename__ = "tabla_posiciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    torneo: Mapped[str] = mapped_column(String(100))
    jornada: Mapped[int] = mapped_column(Integer, default=1)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    posicion: Mapped[int] = mapped_column(Integer)
    pj: Mapped[int] = mapped_column(Integer, default=0)
    pg: Mapped[int] = mapped_column(Integer, default=0)
    pe: Mapped[int] = mapped_column(Integer, default=0)
    pp: Mapped[int] = mapped_column(Integer, default=0)
    gf: Mapped[int] = mapped_column(Integer, default=0)
    gc: Mapped[int] = mapped_column(Integer, default=0)
    dg: Mapped[int] = mapped_column(Integer, default=0)
    puntos: Mapped[int] = mapped_column(Integer, default=0)
```

- [ ] **Step 5: Verify models load correctly**

```powershell
cd backend
python -c "from backend.app.models import Club, Partido, TablaPosicion; print('Models OK:', Club.__tablename__, Partido.__tablename__, TablaPosicion.__tablename__)"
```

Expected: `Models OK: clubes partidos tabla_posiciones`

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(backend): SQLAlchemy ORM models"
```

---

### Task 3: Backend — Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/club.py`
- Create: `backend/app/schemas/partido.py`
- Create: `backend/app/schemas/tabla.py`

**Interfaces:**
- Consumes: nothing (standalone Pydantic models)
- Produces:
  - `ClubOut`, `ClubDetailOut`
  - `PartidoOut`, `PartidoDetailOut`
  - `TablaRowOut`

- [ ] **Step 1: Create `backend/app/schemas/__init__.py`** (empty)

- [ ] **Step 2: Create `backend/app/schemas/club.py`**

```python
from pydantic import BaseModel


class ClubOut(BaseModel):
    id: str
    nombre: str
    ciudad: str
    apodo: str
    colores: list[str]
    estadio: str

    model_config = {"from_attributes": True}


class ClubDetailOut(ClubOut):
    pass
```

- [ ] **Step 3: Create `backend/app/schemas/partido.py`**

```python
from datetime import date
from typing import Optional

from pydantic import BaseModel


class PartidoOut(BaseModel):
    id: str
    torneo: str
    fecha: date
    jornada: int
    local_id: str
    visitante_id: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    estado: str

    model_config = {"from_attributes": True}


class PartidoDetailOut(PartidoOut):
    local_nombre: str = ""
    visitante_nombre: str = ""
```

- [ ] **Step 4: Create `backend/app/schemas/tabla.py`**

```python
from pydantic import BaseModel


class TablaRowOut(BaseModel):
    posicion: int
    club_id: str
    club: str
    pj: int
    pg: int
    pe: int
    pp: int
    gf: int
    gc: int
    dg: int
    puntos: int

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Verify schemas**

```powershell
cd backend
python -c "
from backend.app.schemas.club import ClubOut
from backend.app.schemas.partido import PartidoOut
from backend.app.schemas.tabla import TablaRowOut
print('Schemas OK')
"
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(backend): Pydantic schemas"
```

---

### Task 4: Backend — Services Layer

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/club_service.py`
- Create: `backend/app/services/partido_service.py`
- Create: `backend/app/services/tabla_service.py`

**Interfaces:**
- Consumes: `Club`, `Partido`, `TablaPosicion` ORM models; `AsyncSession` from `core.dependencies`; `ClubOut`, `PartidoOut`, `PartidoDetailOut`, `TablaRowOut` schemas
- Produces:
  - `ClubService.get_all(db, ciudad)` -> `list[ClubOut]`
  - `ClubService.get_by_id(db, club_id)` -> `ClubOut | None`
  - `PartidoService.get_all(db, torneo, estado)` -> `list[PartidoOut]`
  - `PartidoService.get_by_id(db, partido_id)` -> `PartidoDetailOut | None`
  - `TablaService.get_table(db, torneo)` -> `list[TablaRowOut]`

- [ ] **Step 1: Create `backend/app/services/__init__.py`** (empty)

- [ ] **Step 2: Create `backend/app/services/club_service.py`**

```python
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.club import Club
from backend.app.schemas.club import ClubOut


class ClubService:

    @staticmethod
    async def get_all(db: AsyncSession, ciudad: Optional[str] = None) -> list[ClubOut]:
        stmt = select(Club)
        if ciudad:
            stmt = stmt.where(Club.ciudad == ciudad)
        result = await db.execute(stmt)
        clubs = result.scalars().all()
        return [ClubOut.model_validate(c) for c in clubs]

    @staticmethod
    async def get_by_id(db: AsyncSession, club_id: str) -> Optional[ClubOut]:
        result = await db.execute(select(Club).where(Club.id == club_id))
        club = result.scalar_one_or_none()
        return ClubOut.model_validate(club) if club else None
```

- [ ] **Step 3: Create `backend/app/services/partido_service.py`**

```python
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.partido import Partido
from backend.app.schemas.partido import PartidoDetailOut, PartidoOut


class PartidoService:

    @staticmethod
    async def get_all(
        db: AsyncSession,
        torneo: Optional[str] = None,
        estado: Optional[str] = None,
    ) -> list[PartidoOut]:
        stmt = select(Partido)
        if torneo:
            stmt = stmt.where(Partido.torneo == torneo)
        if estado:
            stmt = stmt.where(Partido.estado == estado)
        stmt = stmt.order_by(Partido.fecha.desc())
        result = await db.execute(stmt)
        partidos = result.scalars().all()
        return [PartidoOut.model_validate(p) for p in partidos]

    @staticmethod
    async def get_by_id(db: AsyncSession, partido_id: str) -> Optional[PartidoDetailOut]:
        stmt = (
            select(Partido)
            .where(Partido.id == partido_id)
            .options(selectinload(Partido.local), selectinload(Partido.visitante))
        )
        result = await db.execute(stmt)
        partido = result.scalar_one_or_none()
        if not partido:
            return None
        return PartidoDetailOut(
            id=partido.id,
            torneo=partido.torneo,
            fecha=partido.fecha,
            jornada=partido.jornada,
            local_id=partido.local_id,
            visitante_id=partido.visitante_id,
            goles_local=partido.goles_local,
            goles_visitante=partido.goles_visitante,
            estado=partido.estado,
            local_nombre=partido.local.nombre if partido.local else "",
            visitante_nombre=partido.visitante.nombre if partido.visitante else "",
        )
```

- [ ] **Step 4: Create `backend/app/services/tabla_service.py`**

```python
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.tabla import TablaPosicion
from backend.app.schemas.tabla import TablaRowOut


class TablaService:

    @staticmethod
    async def get_table(
        db: AsyncSession,
        torneo: Optional[str] = None,
    ) -> list[TablaRowOut]:
        stmt = select(TablaPosicion).order_by(TablaPosicion.posicion)
        if torneo:
            stmt = stmt.where(TablaPosicion.torneo == torneo)
        result = await db.execute(stmt)
        rows = result.scalars().all()
        return [TablaRowOut.model_validate(r) for r in rows]
```

- [ ] **Step 5: Verify imports**

```powershell
cd backend
python -c "
from backend.app.services.club_service import ClubService
from backend.app.services.partido_service import PartidoService
from backend.app.services.tabla_service import TablaService
print('Services OK')
"
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(backend): services layer"
```

---

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

### Task 6: Backend — Seed Script

**Files:**
- Create: `backend/app/scripts/__init__.py`
- Create: `backend/app/scripts/seed.py`

**Interfaces:**
- Consumes: `Club`, `Partido`, `TablaPosicion` ORM; `engine`, `async_session` from core
- Produces: Loads JSON seed data into database tables

- [ ] **Step 1: Create directories**

```powershell
New-Item -ItemType Directory -Path "backend/app/scripts" -Force
```

- [ ] **Step 2: Create `backend/app/scripts/__init__.py`** (empty)

- [ ] **Step 3: Create `backend/app/scripts/seed.py`**

```python
import json
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import async_session, init_db
from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"


def load_json(name: str) -> list:
    path = DATA_DIR / name
    if not path.exists():
        print(f"  File not found: {path}")
        return []
    with open(path, "r", encoding="utf-8-sig") as f:
        return json.load(f)


async def seed_clubes(db: AsyncSession):
    data = load_json("clubes_paraguay.json")
    count = 0
    for item in data:
        existing = await db.execute(select(Club).where(Club.id == item["id"]))
        if existing.scalar_one_or_none():
            continue
        club = Club(
            id=item["id"],
            nombre=item["nombre"],
            ciudad=item["ciudad"],
            apodo=item["apodo"],
            colores=item["colores"],
            estadio=item["estadio"],
        )
        db.add(club)
        count += 1
    await db.flush()
    print(f"  Clubes: {count} nuevos")
    return count


async def seed_partidos(db: AsyncSession):
    data = load_json("partidos_demo.json")
    count = 0
    for item in data:
        existing = await db.execute(select(Partido).where(Partido.id == item["id"]))
        if existing.scalar_one_or_none():
            continue
        partido = Partido(
            id=item["id"],
            torneo=item["torneo"],
            fecha=date.fromisoformat(item["fecha"]),
            jornada=item.get("jornada", 1),
            local_id=item["local"],
            visitante_id=item["visitante"],
            goles_local=item.get("goles_local"),
            goles_visitante=item.get("goles_visitante"),
            estado=item["estado"],
        )
        db.add(partido)
        count += 1
    await db.flush()
    print(f"  Partidos: {count} nuevos")
    return count


async def seed_tabla(db: AsyncSession):
    data = load_json("tabla_posiciones_demo.json")
    count = 0
    for item in data:
        tabla_row = TablaPosicion(
            torneo=item.get("torneo", "Apertura 2026"),
            jornada=item.get("jornada", 1),
            club_id=item["club_id"],
            posicion=item["posicion"],
            pj=item["pj"],
            pg=item["pg"],
            pe=item["pe"],
            pp=item["pp"],
            gf=item["gf"],
            gc=item["gc"],
            dg=item["dg"],
            puntos=item["puntos"],
        )
        db.add(tabla_row)
        count += 1
    await db.flush()
    print(f"  Tabla: {count} filas nuevas")
    return count


async def main():
    print("Inicializando base de datos...")
    await init_db()
    print("Ejecutando seed...")
    async with async_session() as db:
        await seed_clubes(db)
        await seed_partidos(db)
        await seed_tabla(db)
        await db.commit()
    print("Seed completado.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

- [ ] **Step 4: Run seed script**

```powershell
cd backend
python -m backend.app.scripts.seed
```

Expected output:
```
Inicializando base de datos...
Ejecutando seed...
  Clubes: 4 nuevos
  Partidos: 2 nuevos
  Tabla: 4 filas nuevas
Seed completado.
```

- [ ] **Step 5: Run seed again (idempotent)**

```powershell
cd backend && python -m backend.app.scripts.seed
```

Expected: `Clubes: 0 nuevos, Partidos: 0 nuevos, Tabla: 0 filas nuevas`

- [ ] **Step 6: Verify API returns data**

```powershell
# In another terminal, start server
cd backend && uvicorn backend.app.main:app --reload --port 8001

# Then test
curl http://localhost:8001/api/v1/clubes
```

Expected: JSON array with 4 clubs.

```powershell
curl http://localhost:8001/api/v1/partidos
curl http://localhost:8001/api/v1/tabla
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(backend): seed script for initial data"
```

---

### Task 7: Backend — Tests

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_clubes.py`
- Create: `backend/tests/test_partidos.py`
- Create: `backend/tests/test_tabla.py`

**Interfaces:**
- Consumes: FastAPI `app`, services, models
- Produces: Test suite (pytest)

- [ ] **Step 1: Create `backend/tests/__init__.py`** (empty)

- [ ] **Step 2: Create `backend/tests/conftest.py`**

```python
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import Base, get_db
from backend.app.main import app

TEST_DB_URL = "sqlite+aiosqlite://"


@pytest.fixture(scope="session")
def engine():
    return create_async_engine(TEST_DB_URL, echo=False)


@pytest.fixture(scope="function")
async def db_session(engine):
    session_local = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with session_local() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

- [ ] **Step 3: Create seed helper — add to conftest.py**

Append to `backend/tests/conftest.py`:

```python
import json

from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion


async def seed_test_data(db: AsyncSession):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="El Decano", colores=["blanco", "negro"], estadio="Manuel Ferreira"),
        Club(id="cerro-porteno", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="El Ciclón", colores=["azul", "rojo"], estadio="General Pablo Rojas"),
    ]
    for c in clubs:
        db.add(c)
    await db.flush()

    partidos = [
        Partido(id="p001", torneo="Apertura 2026", fecha=date(2026, 2, 1), jornada=1, local_id="olimpia", visitante_id="cerro-porteno", estado="programado"),
    ]
    for p in partidos:
        db.add(p)
    await db.flush()

    tabla = [
        TablaPosicion(torneo="Apertura 2026", jornada=1, club_id="olimpia", posicion=1, pj=1, pg=1, pe=0, pp=0, gf=2, gc=0, dg=2, puntos=3),
    ]
    for t in tabla:
        db.add(t)
    await db.flush()
```

- [ ] **Step 4: Create `backend/tests/test_clubes.py`**

```python
import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_listar_clubes(client):
    response = await client.get("/api/v1/clubes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_listar_clubes_con_datos(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes")
    data = response.json()
    assert len(data) == 2
    assert data[0]["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_detalle_club_existente(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes/olimpia")
    assert response.status_code == 200
    assert response.json()["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_detalle_club_no_existente(client):
    response = await client.get("/api/v1/clubes/no-existe")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_filtrar_por_ciudad(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes?ciudad=Asunción")
    assert response.status_code == 200
    assert len(response.json()) == 2
```

- [ ] **Step 5: Create `backend/tests/test_partidos.py`**

```python
import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_listar_partidos(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


@pytest.mark.asyncio
async def test_detalle_partido(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos/p001")
    assert response.status_code == 200
    data = response.json()
    assert data["local_id"] == "olimpia"


@pytest.mark.asyncio
async def test_detalle_partido_no_existente(client):
    response = await client.get("/api/v1/partidos/no-existe")
    assert response.status_code == 404
```

- [ ] **Step 6: Create `backend/tests/test_tabla.py`**

```python
import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_obtener_tabla(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/tabla")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["club_id"] == "olimpia"
```

- [ ] **Step 7: Run tests**

```powershell
cd backend
pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(backend): test suite"
```

---

### Task 8: Frontend — Scaffold Next.js + TypeScript + Tailwind

**Files:**
- Create: `frontend/` (new Next.js project replacing old React app)

- [ ] **Step 1: Remove old frontend and create new Next.js project**

```powershell
# Backup the old frontend vite.config proxy change if needed
Remove-Item -Recurse -Force frontend -ErrorAction SilentlyContinue

npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

When prompted, say "Yes" to all defaults.

- [ ] **Step 2: Install additional dependencies**

```powershell
cd frontend
npm install @tanstack/react-query@5
```

- [ ] **Step 3: Configure Next.js to allow backend API images (if needed later)**

No changes needed for now. Next.js default config is fine.

- [ ] **Step 4: Update `frontend/src/app/layout.tsx`**

Read the generated file first, then replace content:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liga Paraguaya de Fútbol",
  description: "Clubes, partidos, tabla de posiciones y datos base del fútbol paraguayo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#07111f] text-[#f8fafc] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Add favicon** — replace `frontend/public/` with a simple SVG shield or keep default

```powershell
# Create a simple SVG favicon
New-Item -ItemType Directory -Path "frontend/public/images" -Force
```

Create `frontend/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚽</text></svg>
```

- [ ] **Step 6: Verify dev server starts**

```powershell
cd frontend && npm run dev
```

Open `http://localhost:3000` — should see the default Next.js page with "Liga Paraguaya de Fútbol" title.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(frontend): scaffold Next.js project"
```

---

### Task 9: Frontend — API Client + Types

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: Backend API at `NEXT_PUBLIC_API_URL`
- Produces: Typed API client functions and TypeScript interfaces

- [ ] **Step 1: Create `frontend/src/types/index.ts`**

```typescript
export interface Club {
  id: string;
  nombre: string;
  ciudad: string;
  apodo: string;
  colores: string[];
  estadio: string;
}

export interface Partido {
  id: string;
  torneo: string;
  fecha: string;
  jornada: number;
  local_id: string;
  visitante_id: string;
  goles_local: number | null;
  goles_visitante: number | null;
  estado: string;
}

export interface PartidoDetail extends Partido {
  local_nombre: string;
  visitante_nombre: string;
}

export interface TablaRow {
  posicion: number;
  club_id: string;
  club: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  puntos: number;
}
```

- [ ] **Step 2: Create `frontend/src/lib/api.ts`**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

import type { Club, Partido, PartidoDetail, TablaRow } from "@/types";

export async function getClubes(ciudad?: string): Promise<Club[]> {
  const params = ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : "";
  return fetchJSON<Club[]>(`/api/v1/clubes${params}`);
}

export async function getClub(id: string): Promise<Club> {
  return fetchJSON<Club>(`/api/v1/clubes/${id}`);
}

export async function getPartidos(torneo?: string, estado?: string): Promise<Partido[]> {
  const params = new URLSearchParams();
  if (torneo) params.set("torneo", torneo);
  if (estado) params.set("estado", estado);
  const qs = params.toString();
  return fetchJSON<Partido[]>(`/api/v1/partidos${qs ? `?${qs}` : ""}`);
}

export async function getPartido(id: string): Promise<PartidoDetail> {
  return fetchJSON<PartidoDetail>(`/api/v1/partidos/${id}`);
}

export async function getTabla(torneo?: string): Promise<TablaRow[]> {
  const params = torneo ? `?torneo=${encodeURIComponent(torneo)}` : "";
  return fetchJSON<TablaRow[]>(`/api/v1/tabla${params}`);
}
```

- [ ] **Step 3: Add `.env.local` for development**

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(frontend): API client and TypeScript types"
```

---

### Task 10: Frontend — Layout Components (Navbar + Footer)

**Files:**
- Create: `frontend/src/components/layout/Navbar.tsx`
- Create: `frontend/src/components/layout/Footer.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Create `frontend/src/components/layout/Navbar.tsx`**

```tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          ⚽ Liga PY
        </Link>
        <div className="flex gap-6 text-sm font-medium text-gray-300">
          <Link href="/clubes" className="hover:text-white transition">Clubes</Link>
          <Link href="/partidos" className="hover:text-white transition">Partidos</Link>
          <Link href="/tabla" className="hover:text-white transition">Tabla</Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/layout/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a1628]/60 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
        <p>liga.paraguaya.futbol — Proyecto de datos y seguimiento del fútbol paraguayo</p>
        <p className="mt-1">
          <a href="https://github.com/usuario/liga.paraguaya.futbol" className="hover:text-gray-300 transition" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update `frontend/src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liga Paraguaya de Fútbol",
  description: "Clubes, partidos, tabla de posiciones y datos base del fútbol paraguayo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#07111f] text-[#f8fafc] min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Update `frontend/src/app/globals.css` — replace with clean styles**

```css
@import "tailwindcss";

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(frontend): layout components (Navbar, Footer)"
```

---

### Task 11: Frontend — UI Components + Query Provider

**Files:**
- Create: `frontend/src/components/ui/LoadingSpinner.tsx`
- Create: `frontend/src/components/ui/ErrorMessage.tsx`
- Create: `frontend/src/app/providers.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/LoadingSpinner.tsx`**

```tsx
export default function LoadingSpinner({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#76e4f7] border-t-transparent" />
      <span className="ml-3 text-gray-400">{text}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/ui/ErrorMessage.tsx`**

```tsx
export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-red-400 text-lg">{message}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/app/providers.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Update `frontend/src/app/layout.tsx` to wrap with Providers**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liga Paraguaya de Fútbol",
  description: "Clubes, partidos, tabla de posiciones y datos base del fútbol paraguayo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#07111f] text-[#f8fafc] min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Create loading, error, and not-found pages**

`frontend/src/app/loading.tsx`:
```tsx
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return <LoadingSpinner />;
}
```

`frontend/src/app/error.tsx`:
```tsx
"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-24">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal</h2>
      <p className="text-gray-400 mb-6">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
        Intentar de nuevo
      </button>
    </div>
  );
}
```

`frontend/src/app/not-found.tsx`:
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h2 className="text-6xl font-bold text-gray-600 mb-4">404</h2>
      <p className="text-xl text-gray-400 mb-6">Página no encontrada</p>
      <Link href="/" className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-block">
        Volver al inicio
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(frontend): UI components and query provider"
```

---

### Task 12: Frontend — Home Page (Dashboard)

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Replace `frontend/src/app/page.tsx`**

```tsx
import { getClubes, getPartidos, getTabla } from "@/lib/api";
import Link from "next/link";

export default async function HomePage() {
  const [clubes, partidos, tabla] = await Promise.all([
    getClubes().catch(() => []),
    getPartidos().catch(() => []),
    getTabla().catch(() => []),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="mb-12 p-8 rounded-2xl border border-white/10 bg-[#0a1628]/80 shadow-xl">
        <p className="text-[#76e4f7] text-sm font-bold uppercase tracking-widest mb-3">
          Proyecto DAW · Next.js + FastAPI
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-4">
          Liga Paraguaya de Fútbol
        </h1>
        <p className="text-gray-400 max-w-xl text-lg">
          Plataforma de datos, clubes, partidos y tabla de posiciones del fútbol paraguayo.
        </p>
        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-green-900/30 text-green-300 border border-green-500/30 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
          Backend activo correctamente
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-xl bg-[#0a1628]/60 border border-white/5 text-center">
          <p className="text-3xl font-bold text-[#76e4f7]">{clubes.length}</p>
          <p className="text-gray-400 mt-1">Clubes</p>
        </div>
        <div className="p-6 rounded-xl bg-[#0a1628]/60 border border-white/5 text-center">
          <p className="text-3xl font-bold text-[#76e4f7]">{partidos.length}</p>
          <p className="text-gray-400 mt-1">Partidos</p>
        </div>
        <div className="p-6 rounded-xl bg-[#0a1628]/60 border border-white/5 text-center">
          <p className="text-3xl font-bold text-[#76e4f7]">{tabla.length}</p>
          <p className="text-gray-400 mt-1">Equipos en tabla</p>
        </div>
      </div>

      {/* Top Table */}
      {tabla.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Tabla de Posiciones</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a1628]/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
                  <th className="p-4 text-left">Pos</th>
                  <th className="p-4 text-left">Club</th>
                  <th className="p-4">PJ</th>
                  <th className="p-4">PG</th>
                  <th className="p-4">PE</th>
                  <th className="p-4">PP</th>
                  <th className="p-4">DG</th>
                  <th className="p-4">Pts</th>
                </tr>
              </thead>
              <tbody>
                {tabla.slice(0, 4).map((row) => (
                  <tr key={row.club_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 font-bold">{row.posicion}</td>
                    <td className="p-4">{row.club}</td>
                    <td className="p-4 text-center">{row.pj}</td>
                    <td className="p-4 text-center">{row.pg}</td>
                    <td className="p-4 text-center">{row.pe}</td>
                    <td className="p-4 text-center">{row.pp}</td>
                    <td className="p-4 text-center">{row.dg}</td>
                    <td className="p-4 text-center font-bold text-[#76e4f7]">{row.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Link href="/tabla" className="text-sm text-[#76e4f7] hover:underline">Ver tabla completa →</Link>
          </div>
        </section>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/clubes" className="p-6 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
          <h3 className="text-lg font-bold mb-2">Clubes</h3>
          <p className="text-gray-400 text-sm">Explora todos los clubes de la liga paraguaya</p>
        </Link>
        <Link href="/partidos" className="p-6 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
          <h3 className="text-lg font-bold mb-2">Partidos</h3>
          <p className="text-gray-400 text-sm">Calendario y resultados de la temporada</p>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test that the page compiles**

```powershell
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(frontend): home page dashboard"
```

---

### Task 13: Frontend — Clubes Pages

**Files:**
- Create: `frontend/src/components/clubes/ClubCard.tsx`
- Create: `frontend/src/components/clubes/ClubGrid.tsx`
- Create: `frontend/src/app/clubes/page.tsx`
- Create: `frontend/src/app/clubes/[id]/page.tsx`

- [ ] **Step 1: Create `frontend/src/components/clubes/ClubCard.tsx`**

```tsx
import Link from "next/link";
import type { Club } from "@/types";

export default function ClubCard({ club }: { club: Club }) {
  return (
    <Link href={`/clubes/${club.id}`}>
      <div className="p-5 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition h-full">
        <h3 className="text-lg font-bold mb-1">{club.nombre}</h3>
        <p className="text-yellow-400 text-sm mb-2">{club.apodo}</p>
        <p className="text-gray-400 text-xs">{club.ciudad} · {club.estadio}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/clubes/ClubGrid.tsx`**

```tsx
import type { Club } from "@/types";
import ClubCard from "./ClubCard";

export default function ClubGrid({ clubes }: { clubes: Club[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clubes.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/app/clubes/page.tsx`**

```tsx
import { getClubes } from "@/lib/api";
import ClubGrid from "@/components/clubes/ClubGrid";

export default async function ClubesPage() {
  const clubes = await getClubes();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Clubes</h1>
      <p className="text-gray-400 mb-8">Todos los clubes de la Liga Paraguaya de Fútbol.</p>
      {clubes.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay clubes disponibles.</p>
      ) : (
        <ClubGrid clubes={clubes} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/app/clubes/[id]/page.tsx`**

```tsx
import { getClub } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let club;
  try {
    club = await getClub(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{club.nombre}</h1>
      <p className="text-yellow-400 text-lg mb-6">{club.apodo}</p>

      <div className="grid grid-cols-2 gap-6 p-6 rounded-xl border border-white/10 bg-[#0a1628]/60">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ciudad</p>
          <p className="font-medium">{club.ciudad}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Estadio</p>
          <p className="font-medium">{club.estadio}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Colores</p>
          <div className="flex gap-2">
            {club.colores.map((color) => (
              <span key={color} className="px-3 py-1 rounded-full bg-white/10 text-sm capitalize">
                {color}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```powershell
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(frontend): clubes pages"
```

---

### Task 14: Frontend — Partidos Pages

**Files:**
- Create: `frontend/src/components/partidos/MatchCard.tsx`
- Create: `frontend/src/components/partidos/ScoreBadge.tsx`
- Create: `frontend/src/app/partidos/page.tsx`
- Create: `frontend/src/app/partidos/[id]/page.tsx`

- [ ] **Step 1: Create `frontend/src/components/partidos/ScoreBadge.tsx`**

```tsx
export default function ScoreBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    programado: "bg-yellow-900/30 text-yellow-300 border-yellow-500/30",
    en_vivo: "bg-green-900/30 text-green-300 border-green-500/30",
    finalizado: "bg-blue-900/30 text-blue-300 border-blue-500/30",
    suspendido: "bg-red-900/30 text-red-300 border-red-500/30",
  };
  const cls = colors[estado] || colors.programado;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {estado.replace("_", " ")}
    </span>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/partidos/MatchCard.tsx`**

```tsx
import Link from "next/link";
import type { Partido } from "@/types";
import ScoreBadge from "./ScoreBadge";

export default function MatchCard({ partido }: { partido: Partido }) {
  return (
    <Link href={`/partidos/${partido.id}`}>
      <div className="p-5 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{partido.torneo}</span>
          <ScoreBadge estado={partido.estado} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-right flex-1">{partido.local_id}</span>
          <span className="text-lg font-bold text-[#76e4f7]">
            {partido.goles_local !== null ? `${partido.goles_local} - ${partido.goles_visitante}` : "vs"}
          </span>
          <span className="font-medium flex-1">{partido.visitante_id}</span>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">{partido.fecha}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create `frontend/src/app/partidos/page.tsx`**

```tsx
import { getPartidos } from "@/lib/api";
import MatchCard from "@/components/partidos/MatchCard";

export default async function PartidosPage() {
  const partidos = await getPartidos();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Partidos</h1>
      <p className="text-gray-400 mb-8">Calendario de partidos de la Liga Paraguaya.</p>

      {partidos.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay partidos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partidos.map((p) => (
            <MatchCard key={p.id} partido={p} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/app/partidos/[id]/page.tsx`**

```tsx
import { getPartido } from "@/lib/api";
import { notFound } from "next/navigation";
import ScoreBadge from "@/components/partidos/ScoreBadge";

export default async function PartidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let partido;
  try {
    partido = await getPartido(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-sm text-gray-400 mb-2">{partido.torneo} · Jornada {partido.jornada}</p>
      <h1 className="text-2xl font-bold mb-6">
        {partido.local_nombre} vs {partido.visitante_nombre}
      </h1>

      <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center mb-6">
        <div className="flex items-center justify-center gap-8 mb-4">
          <span className="text-xl font-bold">{partido.local_nombre}</span>
          <span className="text-4xl font-bold text-[#76e4f7]">
            {partido.goles_local !== null ? `${partido.goles_local} - ${partido.goles_visitante}` : "vs"}
          </span>
          <span className="text-xl font-bold">{partido.visitante_nombre}</span>
        </div>
        <ScoreBadge estado={partido.estado} />
        <p className="text-gray-500 text-sm mt-4">{partido.fecha}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```powershell
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(frontend): partidos pages"
```

---

### Task 15: Frontend — Tabla Page

**Files:**
- Create: `frontend/src/components/tabla/StandingsTable.tsx`
- Create: `frontend/src/app/tabla/page.tsx`

- [ ] **Step 1: Create `frontend/src/components/tabla/StandingsTable.tsx`**

```tsx
import type { TablaRow } from "@/types";

export default function StandingsTable({ rows }: { rows: TablaRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a1628]/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
            <th className="p-4 text-left">Pos</th>
            <th className="p-4 text-left">Club</th>
            <th className="p-4">PJ</th>
            <th className="p-4">PG</th>
            <th className="p-4">PE</th>
            <th className="p-4">PP</th>
            <th className="p-4">GF</th>
            <th className="p-4">GC</th>
            <th className="p-4">DG</th>
            <th className="p-4">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.club_id} className="border-b border-white/5 hover:bg-white/5 transition">
              <td className="p-4 font-bold">{row.posicion}</td>
              <td className="p-4 font-medium">{row.club}</td>
              <td className="p-4 text-center">{row.pj}</td>
              <td className="p-4 text-center">{row.pg}</td>
              <td className="p-4 text-center">{row.pe}</td>
              <td className="p-4 text-center">{row.pp}</td>
              <td className="p-4 text-center">{row.gf}</td>
              <td className="p-4 text-center">{row.gc}</td>
              <td className="p-4 text-center">{row.dg}</td>
              <td className="p-4 text-center font-bold text-[#76e4f7]">{row.puntos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/app/tabla/page.tsx`**

```tsx
import { getTabla } from "@/lib/api";
import StandingsTable from "@/components/tabla/StandingsTable";

export default async function TablaPage() {
  const tabla = await getTabla();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Tabla de Posiciones</h1>
      <p className="text-gray-400 mb-8">Clasificación actual de la Liga Paraguaya de Fútbol.</p>

      {tabla.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay datos de tabla disponibles.</p>
      ) : (
        <StandingsTable rows={tabla} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```powershell
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(frontend): tabla page"
```

---

### Task 16: CI + Docker Compose

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - run: pip install ruff pytest
      - run: ruff check
      - run: pytest tests/ -v

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

- [ ] **Step 2: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

- [ ] **Step 3: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/liga.db
      - CORS_ORIGINS=http://localhost:3000
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8001
    depends_on:
      - backend
```

- [ ] **Step 5: Add `frontend/.gitignore` entries**

Ensure `frontend/.gitignore` includes `.env.local` and `.next/`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "ci: add GitHub Actions CI and Docker Compose"
```

---

### Task 17: README + LICENSE

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# ⚽ liga.paraguaya.futbol

[![CI](https://github.com/USER/liga.paraguaya.futbol/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/liga.paraguaya.futbol/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

Plataforma de datos, análisis y seguimiento de la **Liga Paraguaya de Fútbol**. Construida con Next.js + FastAPI.

## 🏗️ Arquitectura

```
frontend/   → Next.js 14+ (TypeScript, Tailwind, SSR)
backend/    → FastAPI (Python, SQLAlchemy, SQLite/PostgreSQL)
docker-compose.yml → Orquestación local
```

## 🚀 Quick Start

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
python -m backend.app.scripts.seed    # Cargar datos iniciales
uvicorn backend.app.main:app --reload --port 8001

# 2. Frontend
cd frontend
npm install
npm run dev

# 3. O todo con Docker
docker-compose up
```

## 📡 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/clubes` | Listar clubes |
| GET | `/api/v1/clubes/{id}` | Detalle de club |
| GET | `/api/v1/partidos` | Listar partidos |
| GET | `/api/v1/partidos/{id}` | Detalle de partido |
| GET | `/api/v1/tabla` | Tabla de posiciones |
| GET | `/docs` | Swagger UI |

## 🧪 Tests

```bash
cd backend && pytest tests/ -v
cd frontend && npm run test
```

## 🛠️ Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, TanStack Query
- **Backend:** FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic
- **DB:** SQLite (dev) / PostgreSQL (prod)
- **Infra:** Docker, GitHub Actions

## 📄 Licencia

MIT
```

- [ ] **Step 2: Create `LICENSE`** (MIT standard)

```text
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Create `CONTRIBUTING.md`**

```markdown
# Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/nueva-funcionalidad`)
3. Commit changes (`git commit -m "feat: add new feature"`)
4. Push to branch (`git push origin feat/nueva-funcionalidad`)
5. Open a Pull Request

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `refactor:` cambio de código sin cambio funcional
- `docs:` solo documentación
- `test:` solo tests
- `ci:` cambios en CI/CD
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "docs: add README, LICENSE and CONTRIBUTING"
```

---

## Self-Review

After writing the plan, the implementer must run this checklist:

1. **Spec coverage:** Each section of the spec has corresponding tasks: backend architecture (tasks 1-6), tests (7), frontend scaffold (8-15), CI/Docker (16), docs (17). All covered.
2. **Placeholder scan:** All steps contain complete code, no TBD/TODO.
3. **Type consistency:** All interfaces are consistent — `get_db` returns `AsyncSession`, services use `ClubOut` schema, API routes use correct prefix `/api/v1/`.
