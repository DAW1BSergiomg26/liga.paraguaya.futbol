# Transferencias — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete player transfer system for Paraguayan football with CRUD, RSS scraping, Football-Data.org integration, mercado de pases, historial por club, and estadísticas dashboard.

**Architecture:** Single `transferencias` table with player name as string (no separate player model). Backend handles CRUD + RSS sync + Football-Data.org sync. Frontend renders transfer list with filters, detail page, mercado timeline, historial by club, and stats dashboard with Recharts.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, httpx, feedparser, Next.js App Router, React Query, Tailwind CSS, GSAP, Recharts

## Global Constraints

- Python 3.12+, async/await throughout backend
- SQLAlchemy 2.0+ mapped_column style (see `noticia.py` model pattern)
- Alembic migrations with sequential revision IDs: "008", "009"
- Frontend: Next.js App Router, `"use client"` directive, React Query for data fetching
- Tailwind classes: `bg-bg-secundario`, `text-texto-principal`, `border-borde-sutil`, `text-apf-rojo`, `bg-bg-noche`
- JWT auth via `get_current_user` / `get_current_admin` from `backend/app/core/dependencies.py`
- Test pattern: `pytest-asyncio`, `httpx.AsyncClient` with `ASGITransport`, fixtures in `conftest.py`
- No new dependencies — use only libraries already installed

---

### Task 1: Transferencia Model + Migration

**Files:**
- Create: `backend/app/models/transferencia.py`
- Create: `backend/alembic/versions/008_add_transferencias.py`
- Modify: `backend/app/models/__init__.py`

**Interfaces:**
- Produces: `Transferencia` SQLAlchemy model with all fields from spec

- [ ] **Step 1: Create the Transferencia model**

```python
# backend/app/models/transferencia.py
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Transferencia(Base):
    __tablename__ = "transferencias"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    jugador_nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    jugador_posicion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    club_origen_id: Mapped[str | None] = mapped_column(String(50), ForeignKey("clubes.id"), nullable=True)
    club_destino_id: Mapped[str] = mapped_column(String(50), ForeignKey("clubes.id"), nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="confirmada")
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="confirmada")
    monto: Mapped[float | None] = mapped_column(Float, nullable=True)
    duracion_meses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fuente_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    fuente_nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    verification_level: Mapped[int] = mapped_column(Integer, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
```

- [ ] **Step 2: Register model in __init__.py**

Add to `backend/app/models/__init__.py`:
```python
from backend.app.models.transferencia import Transferencia
```
And add `"Transferencia"` to the `__all__` list.

- [ ] **Step 3: Create Alembic migration**

```python
# backend/alembic/versions/008_add_transferencias.py
"""create transferencias table

Revision ID: 008
Revises: 007
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "transferencias",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("jugador_nombre", sa.String(200), nullable=False),
        sa.Column("jugador_posicion", sa.String(50), nullable=True),
        sa.Column("club_origen_id", sa.String(50), sa.ForeignKey("clubes.id"), nullable=True),
        sa.Column("club_destino_id", sa.String(50), sa.ForeignKey("clubes.id"), nullable=False),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False, server_default="confirmada"),
        sa.Column("estado", sa.String(20), nullable=False, server_default="confirmada"),
        sa.Column("monto", sa.Float, nullable=True),
        sa.Column("duracion_meses", sa.Integer, nullable=True),
        sa.Column("fuente_url", sa.String(1000), nullable=True),
        sa.Column("fuente_nombre", sa.String(100), nullable=True),
        sa.Column("verification_level", sa.Integer, server_default="3"),
        sa.Column("is_active", sa.Boolean, server_default="1"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_transferencias_club_destino", "transferencias", ["club_destino_id"])
    op.create_index("ix_transferencias_club_origen", "transferencias", ["club_origen_id"])
    op.create_index("ix_transferencias_fecha", "transferencias", ["fecha"])
    op.create_index("ix_transferencias_estado", "transferencias", ["estado"])


def downgrade() -> None:
    op.drop_table("transferencias")
```

- [ ] **Step 4: Run migration**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m alembic upgrade head`
Expected: Success, table created

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/transferencia.py backend/app/models/__init__.py backend/alembic/versions/008_add_transferencias.py
git commit -m "feat: add Transferencia model and migration"
```

---

### Task 2: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/transferencia.py`

**Interfaces:**
- Produces: `TransferenciaCreate`, `TransferenciaUpdate`, `TransferenciaOut`, `TransferenciasPaginatedResponse`, `EstadisticasTransferencias`

- [ ] **Step 1: Create schemas**

```python
# backend/app/schemas/transferencia.py
from datetime import date, datetime
from pydantic import BaseModel, Field


class TransferenciaCreate(BaseModel):
    jugador_nombre: str = Field(..., min_length=1, max_length=200)
    jugador_posicion: str | None = Field(None, max_length=50)
    club_origen_id: str | None = None
    club_destino_id: str = Field(..., min_length=1)
    fecha: date
    tipo: str = Field("confirmada", pattern="^(compra|prestamo|libre|cesion|refuerzo)$")
    estado: str = Field("confirmada", pattern="^(confirmada|rumor|oficial|desmentida)$")
    monto: float | None = Field(None, ge=0)
    duracion_meses: int | None = Field(None, ge=1)
    fuente_url: str | None = Field(None, max_length=1000)
    fuente_nombre: str | None = Field(None, max_length=100)
    verification_level: int = Field(3, ge=1, le=5)
    is_active: bool = True


class TransferenciaUpdate(BaseModel):
    jugador_nombre: str | None = Field(None, min_length=1, max_length=200)
    jugador_posicion: str | None = None
    club_origen_id: str | None = None
    club_destino_id: str | None = None
    fecha: date | None = None
    tipo: str | None = Field(None, pattern="^(compra|prestamo|libre|cesion|refuerzo)$")
    estado: str | None = Field(None, pattern="^(confirmada|rumor|oficial|desmentida)$")
    monto: float | None = None
    duracion_meses: int | None = None
    fuente_url: str | None = None
    fuente_nombre: str | None = None
    verification_level: int | None = Field(None, ge=1, le=5)
    is_active: bool | None = None


class TransferenciaOut(BaseModel):
    id: str
    jugador_nombre: str
    jugador_posicion: str | None
    club_origen_id: str | None
    club_destino_id: str
    fecha: date
    tipo: str
    estado: str
    monto: float | None
    duracion_meses: int | None
    fuente_url: str | None
    fuente_nombre: str | None
    verification_level: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    club_origen_nombre: str | None = None
    club_origen_escudo: str | None = None
    club_destino_nombre: str | None = None
    club_destino_escudo: str | None = None

    model_config = {"from_attributes": True}


class TransferenciasPaginatedResponse(BaseModel):
    transferencias: list[TransferenciaOut]
    total: int
    page: int
    total_pages: int


class GastoPorClub(BaseModel):
    club_id: str
    club_nombre: str
    total_gastado: float
    total_recibido: float


class EstadisticasTransferencias(BaseModel):
    total_transferencias: int
    gasto_total_por_club: list[GastoPorClub]
    top_compras: list[TransferenciaOut]
    distribucion_posiciones: dict[str, int]
    distribucion_tipos: dict[str, int]
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/transferencia.py
git commit -m "feat: add Transferencia Pydantic schemas"
```

---

### Task 3: TransferenciaService — CRUD + Filtros

**Files:**
- Create: `backend/app/services/transferencia_service.py`

**Interfaces:**
- Consumes: `Transferencia` model, `Club` model, SQLAlchemy session
- Produces: `TransferenciaService` class with `create`, `get_by_id`, `get_all`, `update`, `delete`, `get_estadisticas`, `get_historial`

- [ ] **Step 1: Create the service**

```python
# backend/app/services/transferencia_service.py
import math
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.club import Club
from backend.app.models.transferencia import Transferencia
from backend.app.schemas.transferencia import (
    EstadisticasTransferencias,
    GastoPorClub,
    TransferenciaCreate,
    TransferenciaOut,
    TransferenciaUpdate,
    TransferenciasPaginatedResponse,
)


class TransferenciaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _enrich(self, t: Transferencia, clubs: dict[str, Club] | None = None) -> TransferenciaOut:
        out = TransferenciaOut.model_validate(t)
        if clubs:
            if t.club_origen_id and t.club_origen_id in clubs:
                c = clubs[t.club_origen_id]
                out.club_origen_nombre = c.nombre
                out.club_origen_escudo = c.escudo
            if t.club_destino_id in clubs:
                c = clubs[t.club_destino_id]
                out.club_destino_nombre = c.nombre
                out.club_destino_escudo = c.escudo
        return out

    async def _get_clubs_map(self) -> dict[str, Club]:
        result = await self.db.execute(select(Club))
        return {c.id: c for c in result.scalars().all()}

    async def create(self, data: TransferenciaCreate) -> TransferenciaOut:
        t = Transferencia(**data.model_dump())
        self.db.add(t)
        await self.db.flush()
        await self.db.refresh(t)
        clubs = await self._get_clubs_map()
        return self._enrich(t, clubs)

    async def get_by_id(self, transferencia_id: str) -> TransferenciaOut | None:
        result = await self.db.execute(
            select(Transferencia).where(Transferencia.id == transferencia_id)
        )
        t = result.scalar_one_or_none()
        if not t:
            return None
        clubs = await self._get_clubs_map()
        return self._enrich(t, clubs)

    async def get_all(
        self,
        club_id: str | None = None,
        tipo: str | None = None,
        estado: str | None = None,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
        jugador: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> TransferenciasPaginatedResponse:
        query = select(Transferencia)
        count_query = select(func.count(Transferencia.id))

        if club_id:
            query = query.where(
                (Transferencia.club_origen_id == club_id) | (Transferencia.club_destino_id == club_id)
            )
            count_query = count_query.where(
                (Transferencia.club_origen_id == club_id) | (Transferencia.club_destino_id == club_id)
            )
        if tipo:
            query = query.where(Transferencia.tipo == tipo)
            count_query = count_query.where(Transferencia.tipo == tipo)
        if estado:
            query = query.where(Transferencia.estado == estado)
            count_query = count_query.where(Transferencia.estado == estado)
        if fecha_desde:
            query = query.where(Transferencia.fecha >= fecha_desde)
            count_query = count_query.where(Transferencia.fecha >= fecha_desde)
        if fecha_hasta:
            query = query.where(Transferencia.fecha <= fecha_hasta)
            count_query = count_query.where(Transferencia.fecha <= fecha_hasta)
        if jugador:
            query = query.where(Transferencia.jugador_nombre.ilike(f"%{jugador}%"))
            count_query = count_query.where(Transferencia.jugador_nombre.ilike(f"%{jugador}%"))

        total = (await self.db.execute(count_query)).scalar() or 0
        total_pages = math.ceil(total / per_page) if total > 0 else 1

        query = query.order_by(Transferencia.fecha.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)

        result = await self.db.execute(query)
        transferencias = result.scalars().all()

        clubs = await self._get_clubs_map()
        enriched = [self._enrich(t, clubs) for t in transferencias]

        return TransferenciasPaginatedResponse(
            transferencias=enriched,
            total=total,
            page=page,
            total_pages=total_pages,
        )

    async def update(self, transferencia_id: str, data: TransferenciaUpdate) -> TransferenciaOut | None:
        result = await self.db.execute(
            select(Transferencia).where(Transferencia.id == transferencia_id)
        )
        t = result.scalar_one_or_none()
        if not t:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(t, key, value)
        await self.db.flush()
        await self.db.refresh(t)
        clubs = await self._get_clubs_map()
        return self._enrich(t, clubs)

    async def delete(self, transferencia_id: str) -> bool:
        result = await self.db.execute(
            select(Transferencia).where(Transferencia.id == transferencia_id)
        )
        t = result.scalar_one_or_none()
        if not t:
            return False
        await self.db.delete(t)
        return True

    async def get_historial(self, club_id: str) -> list[TransferenciaOut]:
        result = await self.db.execute(
            select(Transferencia)
            .where(
                (Transferencia.club_origen_id == club_id) | (Transferencia.club_destino_id == club_id)
            )
            .order_by(Transferencia.fecha.desc())
        )
        transferencias = result.scalars().all()
        clubs = await self._get_clubs_map()
        return [self._enrich(t, clubs) for t in transferencias]

    async def get_mercado(self, dias: int = 30) -> list[TransferenciaOut]:
        from datetime import timedelta
        desde = date.today() - timedelta(days=dias)
        result = await self.db.execute(
            select(Transferencia)
            .where(Transferencia.fecha >= desde)
            .where(Transferencia.estado.in_(["confirmada", "oficial"]))
            .order_by(Transferencia.fecha.desc())
        )
        transferencias = result.scalars().all()
        clubs = await self._get_clubs_map()
        return [self._enrich(t, clubs) for t in transferencias]

    async def get_estadisticas(self) -> EstadisticasTransferencias:
        result = await self.db.execute(select(Transferencia))
        all_t = result.scalars().all()
        clubs = await self._get_clubs_map()

        total = len(all_t)

        gasto_map: dict[str, dict] = {}
        for t in all_t:
            if t.monto and t.monto > 0:
                if t.club_destino_id not in gasto_map:
                    c = clubs.get(t.club_destino_id)
                    gasto_map[t.club_destino_id] = {
                        "club_id": t.club_destino_id,
                        "club_nombre": c.nombre if c else t.club_destino_id,
                        "total_gastado": 0.0,
                        "total_recibido": 0.0,
                    }
                gasto_map[t.club_destino_id]["total_gastado"] += t.monto

                if t.club_origen_id:
                    if t.club_origen_id not in gasto_map:
                        c = clubs.get(t.club_origen_id)
                        gasto_map[t.club_origen_id] = {
                            "club_id": t.club_origen_id,
                            "club_nombre": c.nombre if c else t.club_origen_id,
                            "total_gastado": 0.0,
                            "total_recibido": 0.0,
                        }
                    gasto_map[t.club_origen_id]["total_recibido"] += t.monto

        gasto_list = sorted(gasto_map.values(), key=lambda x: x["total_gastado"], reverse=True)

        top_compras = sorted(
            [t for t in all_t if t.monto and t.monto > 0],
            key=lambda t: t.monto,
            reverse=True,
        )[:10]
        top_compras_out = [self._enrich(t, clubs) for t in top_compras]

        posiciones: dict[str, int] = {}
        tipos: dict[str, int] = {}
        for t in all_t:
            pos = t.jugador_posicion or "No especificada"
            posiciones[pos] = posiciones.get(pos, 0) + 1
            tipos[t.tipo] = tipos.get(t.tipo, 0) + 1

        return EstadisticasTransferencias(
            total_transferencias=total,
            gasto_total_por_club=[GastoPorClub(**g) for g in gasto_list],
            top_compras=top_compras_out,
            distribucion_posiciones=posiciones,
            distribucion_tipos=tipos,
        )
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/transferencia_service.py
git commit -m "feat: add TransferenciaService with CRUD, filters, stats"
```

---

### Task 4: API Endpoints

**Files:**
- Create: `backend/app/api/transferencias.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: `TransferenciaService`, `get_current_admin`, `get_db`
- Produces: 9 API endpoints under `/api/v1/transferencias`

- [ ] **Step 1: Create API router**

```python
# backend/app/api/transferencias.py
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_current_admin, get_db
from backend.app.schemas.transferencia import (
    EstadisticasTransferencias,
    TransferenciaCreate,
    TransferenciaOut,
    TransferenciaUpdate,
    TransferenciasPaginatedResponse,
)
from backend.app.services.transferencia_service import TransferenciaService

router = APIRouter(prefix="/api/v1/transferencias", tags=["transferencias"])


@router.get("", response_model=TransferenciasPaginatedResponse)
async def list_transferencias(
    club_id: str | None = Query(None),
    tipo: str | None = Query(None),
    estado: str | None = Query(None),
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    jugador: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    svc = TransferenciaService(db)
    return await svc.get_all(
        club_id=club_id, tipo=tipo, estado=estado,
        fecha_desde=fecha_desde, fecha_hasta=fecha_hasta,
        jugador=jugador, page=page, per_page=per_page,
    )


@router.get("/mercado", response_model=list[TransferenciaOut])
async def mercado_transferencias(
    dias: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    svc = TransferenciaService(db)
    return await svc.get_mercado(dias=dias)


@router.get("/estadisticas", response_model=EstadisticasTransferencias)
async def estadisticas_transferencias(db: AsyncSession = Depends(get_db)):
    svc = TransferenciaService(db)
    return await svc.get_estadisticas()


@router.get("/historial/{club_id}", response_model=list[TransferenciaOut])
async def historial_club(club_id: str, db: AsyncSession = Depends(get_db)):
    svc = TransferenciaService(db)
    return await svc.get_historial(club_id)


@router.get("/{transferencia_id}", response_model=TransferenciaOut)
async def get_transferencia(transferencia_id: str, db: AsyncSession = Depends(get_db)):
    svc = TransferenciaService(db)
    t = await svc.get_by_id(transferencia_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return t


@router.post("", response_model=TransferenciaOut, status_code=status.HTTP_201_CREATED)
async def create_transferencia(
    body: TransferenciaCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if body.club_origen_id and body.club_origen_id == body.club_destino_id:
        raise HTTPException(status_code=400, detail="Club origen y destino no pueden ser el mismo")
    svc = TransferenciaService(db)
    return await svc.create(body)


@router.put("/{transferencia_id}", response_model=TransferenciaOut)
async def update_transferencia(
    transferencia_id: str,
    body: TransferenciaUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    svc = TransferenciaService(db)
    t = await svc.update(transferencia_id, body)
    if not t:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return t


@router.delete("/{transferencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transferencia(
    transferencia_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    svc = TransferenciaService(db)
    deleted = await svc.delete(transferencia_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
```

- [ ] **Step 2: Register router in main.py**

Add import and router in `backend/app/main.py`:
```python
from backend.app.api.transferencias import router as transferencias_router
app.include_router(transferencias_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/transferencias.py backend/app/main.py
git commit -m "feat: add Transferencias API endpoints (CRUD, filters, stats, mercado, historial)"
```

---

### Task 5: Backend Tests

**Files:**
- Create: `backend/tests/test_transferencias_api.py`

**Interfaces:**
- Consumes: API endpoints from Task 4
- Produces: 10+ tests covering CRUD, filters, auth, validation

- [ ] **Step 1: Create tests**

```python
# backend/tests/test_transferencias_api.py
import pytest


@pytest.fixture
async def seed_clubs(db_session):
    from backend.app.models.club import Club
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="El Decano", colores=["blanco", "negro"], estadio="Manuel Ferreira"),
        Club(id="cerro-porteno", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="El Ciclón", colores=["azul", "rojo"], estadio="General Pablo Rojas"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=["negro", "blanco"], estadio="Dr. Nicolás Leoz"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()


@pytest.fixture
async def admin_token(db_session):
    from backend.app.models.user import User
    user = User(id="admin1", email="admin@test.com", name="Admin", username="admin", token="admin_token_123", is_admin=True, hashed_password="x")
    db_session.add(user)
    await db_session.flush()
    return "admin_token_123"


@pytest.fixture
async def user_token(db_session):
    from backend.app.models.user import User
    user = User(id="user1", email="user@test.com", name="User", username="user1", token="user_token_123", is_admin=False, hashed_password="x")
    db_session.add(user)
    await db_session.flush()
    return "user_token_123"


@pytest.mark.asyncio
async def test_list_transferencias_empty(client, db_session):
    response = await client.get("/api/v1/transferencias")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["transferencias"] == []


@pytest.mark.asyncio
async def test_create_transferencia_as_admin(client, db_session, seed_clubs, admin_token):
    response = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "Juan Pérez",
            "jugador_posicion": "Delantero",
            "club_origen_id": "cerro-porteno",
            "club_destino_id": "olimpia",
            "fecha": "2026-07-14",
            "tipo": "compra",
            "estado": "confirmada",
            "monto": 1.5,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["jugador_nombre"] == "Juan Pérez"
    assert data["club_origen_nombre"] == "Club Cerro Porteño"
    assert data["club_destino_nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_create_transferencia_requires_admin(client, db_session, seed_clubs, user_token):
    response = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "Test",
            "club_destino_id": "olimpia",
            "fecha": "2026-07-14",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_transferencia_same_club_fails(client, db_session, seed_clubs, admin_token):
    response = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "Test",
            "club_origen_id": "olimpia",
            "club_destino_id": "olimpia",
            "fecha": "2026-07-14",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_transferencia_by_id(client, db_session, seed_clubs, admin_token):
    create_resp = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "María López",
            "club_destino_id": "libertad",
            "fecha": "2026-07-10",
            "tipo": "libre",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    tid = create_resp.json()["id"]
    response = await client.get(f"/api/v1/transferencias/{tid}")
    assert response.status_code == 200
    assert response.json()["jugador_nombre"] == "María López"


@pytest.mark.asyncio
async def test_filter_by_tipo(client, db_session, seed_clubs, admin_token):
    for tipo in ["compra", "prestamo", "libre"]:
        await client.post(
            "/api/v1/transferencias",
            json={"jugador_nombre": f"Jugador {tipo}", "club_destino_id": "olimpia", "fecha": "2026-07-14", "tipo": tipo},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    resp = await client.get("/api/v1/transferencias?tipo=compra")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_filter_by_jugador(client, db_session, seed_clubs, admin_token):
    await client.post(
        "/api/v1/transferencias",
        json={"jugador_nombre": "Carlos González", "club_destino_id": "olimpia", "fecha": "2026-07-14"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    resp = await client.get("/api/v1/transferencias?jugador=Carlos")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_mercado_endpoint(client, db_session, seed_clubs, admin_token):
    resp = await client.get("/api/v1/transferencias/mercado")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_estadisticas_endpoint(client, db_session, seed_clubs, admin_token):
    resp = await client.get("/api/v1/transferencias/estadisticas")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_transferencias" in data
    assert "gasto_total_por_club" in data


@pytest.mark.asyncio
async def test_historial_endpoint(client, db_session, seed_clubs, admin_token):
    await client.post(
        "/api/v1/transferencias",
        json={"jugador_nombre": "Hist Player", "club_destino_id": "olimpia", "fecha": "2026-07-14"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    resp = await client.get("/api/v1/transferencias/historial/olimpia")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_delete_transferencia(client, db_session, seed_clubs, admin_token):
    create_resp = await client.post(
        "/api/v1/transferencias",
        json={"jugador_nombre": "To Delete", "club_destino_id": "olimpia", "fecha": "2026-07-14"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    tid = create_resp.json()["id"]
    resp = await client.delete(f"/api/v1/transferencias/{tid}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 204
    get_resp = await client.get(f"/api/v1/transferencias/{tid}")
    assert get_resp.status_code == 404
```

- [ ] **Step 2: Run tests**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/test_transferencias_api.py -v`
Expected: 11/11 PASS

- [ ] **Step 3: Run full suite**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/ -v --tb=short`
Expected: All pass (except pre-existing 3 failures)

- [ ] **Step 4: Commit**

```bash
git add backend/tests/test_transferencias_api.py
git commit -m "feat: add Transferencia API tests (11 tests)"
```

---

### Task 6: RSS Sync Service for Transferencias

**Files:**
- Create: `backend/app/services/transferencia_rss_sync.py`
- Modify: `backend/app/api/transferencias.py` (add sync endpoint)

**Interfaces:**
- Consumes: `TransferenciaService`, feedparser, httpx
- Produces: `TransferenciaRssSync` class + `POST /sync-rss` admin endpoint

- [ ] **Step 1: Create RSS sync service**

```python
# backend/app/services/transferencia_rss_sync.py
import re
import logging
from datetime import datetime, timezone

import feedparser
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.transferencia import Transferencia
from backend.app.services.transferencia_service import TransferenciaService
from backend.app.schemas.transferencia import TransferenciaCreate

logger = logging.getLogger(__name__)

_RSS_FEEDS = [
    {"nombre": "ABC Color Deportes", "url": "https://www.abc.com.py/deportes/"},
    {"nombre": "APF", "url": "https://www.apf.org.py"},
    {"nombre": "ESPN Paraguay", "url": "https://www.espn.com.py/futbol/"},
    {"nombre": "Diario Popular", "url": "https://www.popular.com.py/deportes/"},
    {"nombre": "1000 Noticias", "url": "https://1000noticias.com/deportes/"},
]

_TRANSFER_KEYWORDS = [
    "fichaje", "firma", "refuerzo", "refuerza", "reforzó",
    "se desvincula", "desvinculado", "se va", "abandona",
    "préstamo", "prestado", "cesión", "cesido",
    "transferencia", "traspaso", "compra", "adquiere",
    "regresa", "vuelve", "retorna", "regresó", "volvió",
]

_CLUB_ALIASES = {
    "olimpia": "olimpia", "decano": "olimpia",
    "cerro": "cerro-porteno", "cerro porteño": "cerro-porteno", "ciclón": "cerro-porteno",
    "libertad": "libertad", "gumarelo": "libertad",
    "nacional": "nacional", "tricolor": "nacional",
    "guaraní": "guarani", "guarani": "guarani", "aborigen": "guarani",
    "sol de américa": "sol-de-america", "sol": "sol-de-america",
    "luqueño": "sportivo-luqueno", "luqueno": "sportivo-luqueno",
    "tacuary": "tacuary",
    "2 de mayo": "2-de-mayo",
    "general díaz": "general-diaz", "general diaz": "general-diaz",
    "deportivo capiata": "deportivo-capiata",
    "3 de febrero": "3-de-febrero",
}


class TransferenciaRssSync:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.svc = TransferenciaService(db)

    async def sync_all(self) -> dict:
        created = 0
        skipped = 0
        errors = []

        for feed_info in _RSS_FEEDS:
            try:
                items = await self._fetch_and_parse(feed_info["nombre"], feed_info["url"])
                for item in items:
                    result = await self._process_item(item, feed_info["nombre"])
                    if result == "created":
                        created += 1
                    else:
                        skipped += 1
            except Exception as e:
                logger.warning("RSS sync error for %s: %s", feed_info["nombre"], e)
                errors.append(f"{feed_info['nombre']}: {str(e)}")

        return {"created": created, "skipped": skipped, "errors": errors}

    async def _fetch_and_parse(self, nombre: str, url: str) -> list[dict]:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "LigaParaguayaBot/1.0"})
            resp.raise_for_status()
        feed = feedparser.parse(resp.text)
        results = []
        for entry in feed.entries[:20]:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            link = entry.get("link", "")
            all_text = f"{title} {summary}".lower()
            has_keyword = any(kw in all_text for kw in _TRANSFER_KEYWORDS)
            if not has_keyword:
                continue
            results.append({"title": title, "summary": summary, "link": link, "text": all_text})
        return results

    async def _process_item(self, item: dict, fuente_nombre: str) -> str:
        existing = await self.svc.db.execute(
            select(Transferencia).where(Transferencia.fuente_url == item["link"])
        )
        if existing.scalar_one_or_none():
            return "skipped"

        clubs_found = []
        for alias, club_id in _CLUB_ALIASES.items():
            if alias in item["text"] and club_id not in clubs_found:
                clubs_found.append(club_id)

        club_destino = clubs_found[0] if clubs_found else None
        club_origen = clubs_found[1] if len(clubs_found) > 1 else None

        if not club_destino:
            return "skipped"

        tipo = "confirmada"
        if any(w in item["text"] for w in ["préstamo", "prestado", "cesión"]):
            tipo = "prestamo"
        elif any(w in item["text"] for w in ["libre", "agente libre"]):
            tipo = "libre"

        t = Transferencia(
            jugador_nombre=item["title"][:200],
            jugador_posicion=None,
            club_origen_id=club_origen,
            club_destino_id=club_destino,
            fecha=datetime.now(timezone.utc).date(),
            tipo=tipo,
            estado="rumor",
            monto=None,
            fuente_url=item["link"],
            fuente_nombre=fuente_nombre,
            verification_level=1,
            is_active=True,
        )
        self.db.add(t)
        await self.db.flush()
        return "created"


from sqlalchemy import select
```

- [ ] **Step 2: Add sync endpoint to API**

Add to `backend/app/api/transferencias.py`:
```python
from backend.app.services.transferencia_rss_sync import TransferenciaRssSync


class SyncResponse(BaseModel):
    created: int
    skipped: int
    errors: list[str]


@router.post("/sync-rss", response_model=SyncResponse)
async def sync_rss(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    sync_service = TransferenciaRssSync(db)
    return await sync_service.sync_all()
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/transferencia_rss_sync.py backend/app/api/transferencias.py
git commit -m "feat: add Transferencia RSS sync service + endpoint"
```

---

### Task 7: Frontend Types + Navbar

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/layout/Navbar.tsx`

**Interfaces:**
- Consumes: Backend API types from Task 2
- Produces: TypeScript types + Navbar link

- [ ] **Step 1: Add transferencia types to types/index.ts**

Append to `frontend/src/types/index.ts`:

```typescript
// === Transferencias ===
export type TipoTransferencia = "compra" | "prestamo" | "libre" | "cesion" | "refuerzo";
export type EstadoTransferencia = "confirmada" | "rumor" | "oficial" | "desmentida";

export interface Transferencia {
  id: string;
  jugador_nombre: string;
  jugador_posicion: string | null;
  club_origen_id: string | null;
  club_destino_id: string;
  fecha: string;
  tipo: TipoTransferencia;
  estado: EstadoTransferencia;
  monto: number | null;
  duracion_meses: number | null;
  fuente_url: string | null;
  fuente_nombre: string | null;
  verification_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  club_origen_nombre?: string;
  club_origen_escudo?: string;
  club_destino_nombre?: string;
  club_destino_escudo?: string;
}

export interface TransferenciasPaginatedResponse {
  transferencias: Transferencia[];
  total: number;
  page: number;
  total_pages: number;
}

export interface GastoPorClub {
  club_id: string;
  club_nombre: string;
  total_gastado: number;
  total_recibido: number;
}

export interface EstadisticasTransferencias {
  total_transferencias: number;
  gasto_total_por_club: GastoPorClub[];
  top_compras: Transferencia[];
  distribucion_posiciones: Record<string, number>;
  distribucion_tipos: Record<string, number>;
}
```

- [ ] **Step 2: Add Transferencias link to Navbar**

In `frontend/src/components/layout/Navbar.tsx`, add to the navigation links array:
```typescript
{ label: "Transferencias", href: "/transferencias" }
```

- [ ] **Step 3: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/components/layout/Navbar.tsx
git commit -m "feat: add Transferencia TypeScript types + Navbar link"
```

---

### Task 8: TransferCard Component

**Files:**
- Create: `frontend/src/components/transferencia/TransferCard.tsx`
- Create: `frontend/src/components/transferencia/VerificationBadge.tsx`
- Create: `frontend/src/components/transferencia/TipoBadge.tsx`

**Interfaces:**
- Consumes: `Transferencia` type from Task 7
- Produces: Visual card component for transfer list

- [ ] **Step 1: Create VerificationBadge**

```tsx
// frontend/src/components/transferencia/VerificationBadge.tsx
"use client";

const COLORS: Record<number, string> = {
  1: "bg-red-500/20 text-red-400",
  2: "bg-orange-500/20 text-orange-400",
  3: "bg-yellow-500/20 text-yellow-400",
  4: "bg-lime-500/20 text-lime-400",
  5: "bg-green-500/20 text-green-400",
};

export default function VerificationBadge({ level }: { level: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[level] || COLORS[3]}`}>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? "bg-current" : "bg-current/20"}`} />
        ))}
      </span>
      {level}/5
    </span>
  );
}
```

- [ ] **Step 2: Create TipoBadge**

```tsx
// frontend/src/components/transferencia/TipoBadge.tsx
"use client";

const TIPO_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  compra: { bg: "bg-green-500/20", text: "text-green-400", label: "Compra" },
  prestamo: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Préstamo" },
  libre: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Libre" },
  cesion: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Cesión" },
  refuerzo: { bg: "bg-apf-dorado/20", text: "text-apf-dorado", label: "Refuerzo" },
};

export default function TipoBadge({ tipo }: { tipo: string }) {
  const config = TIPO_CONFIG[tipo] || TIPO_CONFIG.compra;
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
```

- [ ] **Step 3: Create TransferCard**

```tsx
// frontend/src/components/transferencia/TransferCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Transferencia } from "@/types";
import VerificationBadge from "./VerificationBadge";
import TipoBadge from "./TipoBadge";

const PLACEHOLDER = "/placeholder-escudo.png";

export default function TransferCard({ transferencia: t }: { transferencia: Transferencia }) {
  return (
    <Link href={`/transferencias/${t.id}`}>
      <div className="group bg-bg-secundario border border-borde-sutil rounded-xl p-4 hover:border-apf-rojo/50 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <TipoBadge tipo={t.tipo} />
          <VerificationBadge level={t.verification_level} />
        </div>

        <div className="text-center mb-3">
          <p className="text-texto-principal font-semibold text-lg">{t.jugador_nombre}</p>
          {t.jugador_posicion && (
            <p className="text-texto-secundario text-sm">{t.jugador_posicion}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden">
              {t.club_origen_escudo ? (
                <Image src={t.club_origen_escudo} alt="" width={40} height={40} className="object-contain" />
              ) : (
                <span className="text-texto-secundario text-xs">?</span>
              )}
            </div>
            <p className="text-texto-secundario text-xs mt-1 max-w-[80px] truncate">{t.club_origen_nombre || "Libre"}</p>
          </div>

          <svg className="w-6 h-6 text-apf-rojo flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden">
              {t.club_destino_escudo ? (
                <Image src={t.club_destino_escudo} alt="" width={40} height={40} className="object-contain" />
              ) : (
                <span className="text-texto-secundario text-xs">?</span>
              )}
            </div>
            <p className="text-texto-secundario text-xs mt-1 max-w-[80px] truncate">{t.club_destino_nombre}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-texto-secundario">
          <span>{new Date(t.fecha).toLocaleDateString("es-PY")}</span>
          {t.monto && (
            <span className="text-apf-dorado font-semibold">${t.monto}M</span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/transferencia/
git commit -m "feat: add TransferCard, VerificationBadge, TipoBadge components"
```

---

### Task 9: Listado Principal Page

**Files:**
- Create: `frontend/src/components/transferencia/FiltrosTransferencias.tsx`
- Create: `frontend/src/app/transferencias/page.tsx`

**Interfaces:**
- Consumes: `TransferCard`, `Transferencia`, `TransferenciasPaginatedResponse`
- Produces: `/transferencias` page with filters, tabs, grid

- [ ] **Step 1: Create FiltrosTransferencias**

```tsx
// frontend/src/components/transferencia/FiltrosTransferencias.tsx
"use client";

import { useState } from "react";

interface Props {
  onFilter: (filters: Record<string, string>) => void;
}

const CLUBES = [
  { id: "", nombre: "Todos los clubes" },
  { id: "olimpia", nombre: "Olimpia" },
  { id: "cerro-porteno", nombre: "Cerro Porteño" },
  { id: "libertad", nombre: "Libertad" },
  { id: "nacional", nombre: "Nacional" },
  { id: "guarani", nombre: "Guaraní" },
  { id: "sol-de-america", nombre: "Sol de América" },
  { id: "sportivo-luqueno", nombre: "Sportivo Luqueño" },
];

const TIPOS = [
  { value: "", label: "Todos los tipos" },
  { value: "compra", label: "Compra" },
  { value: "prestamo", label: "Préstamo" },
  { value: "libre", label: "Libre" },
  { value: "cesion", label: "Cesión" },
  { value: "refuerzo", label: "Refuerzo" },
];

export default function FiltrosTransferencias({ onFilter }: Props) {
  const [filters, setFilters] = useState<Record<string, string>>({});

  function update(key: string, value: string) {
    const next = { ...filters, [key]: value };
    if (!value) delete next[key];
    setFilters(next);
    onFilter(next);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Buscar jugador..."
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal placeholder-texto-secundario focus:outline-none focus:border-apf-rojo/50 transition text-sm"
        onChange={(e) => update("jugador", e.target.value)}
      />
      <select
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm focus:outline-none focus:border-apf-rojo/50"
        onChange={(e) => update("club_id", e.target.value)}
      >
        {CLUBES.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
      <select
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm focus:outline-none focus:border-apf-rojo/50"
        onChange={(e) => update("tipo", e.target.value)}
      >
        {TIPOS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Create listado page**

```tsx
// frontend/src/app/transferencias/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { TransferenciasPaginatedResponse } from "@/types";
import TransferCard from "@/components/transferencia/TransferCard";
import FiltrosTransferencias from "@/components/transferencia/FiltrosTransferencias";

const TABS = [
  { key: "confirmada", label: "Confirmadas" },
  { key: "rumor", label: "Rumores" },
  { key: "all", label: "Todas" },
];

export default function TransferenciasPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("confirmada");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), per_page: "20" });
  if (tab !== "all") params.set("estado", tab);
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

  const { data, isLoading } = useQuery<TransferenciasPaginatedResponse>({
    queryKey: ["transferencias", tab, filters, page],
    queryFn: () => apiFetch(`/api/v1/transferencias?${params}`),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-texto-principal">Mercado de Fichajes</h1>
        <p className="text-texto-secundario mt-1">Transferencias de la Primera División paraguaya</p>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? "bg-apf-rojo text-white"
                : "bg-bg-secundario text-texto-secundario hover:text-texto-principal"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FiltrosTransferencias onFilter={(f) => { setFilters(f); setPage(1); }} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.transferencias.length === 0 ? (
        <p className="text-texto-secundario text-center py-12">No se encontraron transferencias</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.transferencias.map((t) => (
            <TransferCard key={t.id} transferencia={t} />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-bg-secundario text-texto-secundario disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-texto-secundario">
            {data.page} / {data.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
            className="px-4 py-2 rounded-lg bg-bg-secundario text-texto-secundario disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/transferencias/page.tsx frontend/src/components/transferencia/FiltrosTransferencias.tsx
git commit -m "feat: add Transferencias listado page with filters and tabs"
```

---

### Task 10: Detalle Page

**Files:**
- Create: `frontend/src/app/transferencias/[id]/page.tsx`

- [ ] **Step 1: Create detail page**

```tsx
// frontend/src/app/transferencias/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Transferencia } from "@/types";
import VerificationBadge from "@/components/transferencia/VerificationBadge";
import TipoBadge from "@/components/transferencia/TipoBadge";

export default function TransferenciaDetailPage() {
  const params = useParams();
  const { data: t, isLoading } = useQuery<Transferencia>({
    queryKey: ["transferencia", params.id],
    queryFn: () => apiFetch(`/api/v1/transferencias/${params.id}`),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-64 bg-bg-secundario rounded-xl animate-pulse" /></div>;
  if (!t) return <div className="max-w-3xl mx-auto px-4 py-8 text-texto-secundario">Transferencia no encontrada</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/transferencias" className="text-apf-rojo hover:underline text-sm mb-4 inline-block">
        ← Volver al mercado
      </Link>

      <div className="bg-bg-secundario border border-borde-sutil rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <TipoBadge tipo={t.tipo} />
          <VerificationBadge level={t.verification_level} />
        </div>

        <h1 className="text-3xl font-bold text-texto-principal text-center mb-2">{t.jugador_nombre}</h1>
        {t.jugador_posicion && (
          <p className="text-texto-secundario text-center mb-8">{t.jugador_posicion}</p>
        )}

        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden">
              {t.club_origen_escudo ? (
                <Image src={t.club_origen_escudo} alt="" width={64} height={64} className="object-contain" />
              ) : (
                <span className="text-texto-secundario text-lg">?</span>
              )}
            </div>
            <p className="text-texto-principal font-medium mt-2">{t.club_origen_nombre || "Libre"}</p>
          </div>

          <svg className="w-10 h-10 text-apf-rojo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-bg-noche flex items-center justify-center overflow-hidden">
              {t.club_destino_escudo ? (
                <Image src={t.club_destino_escudo} alt="" width={64} height={64} className="object-contain" />
              ) : (
                <span className="text-texto-secundario text-lg">?</span>
              )}
            </div>
            <p className="text-texto-principal font-medium mt-2">{t.club_destino_nombre}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-bg-noche rounded-lg p-4">
            <p className="text-texto-secundario">Fecha</p>
            <p className="text-texto-principal font-medium">{new Date(t.fecha).toLocaleDateString("es-PY")}</p>
          </div>
          {t.monto && (
            <div className="bg-bg-noche rounded-lg p-4">
              <p className="text-texto-secundario">Monto</p>
              <p className="text-apf-dorado font-bold text-lg">${t.monto}M USD</p>
            </div>
          )}
          {t.duracion_meses && (
            <div className="bg-bg-noche rounded-lg p-4">
              <p className="text-texto-secundario">Duración</p>
              <p className="text-texto-principal font-medium">{t.duracion_meses} meses</p>
            </div>
          )}
        </div>

        {t.fuente_url && (
          <div className="mt-6 text-center">
            <a href={t.fuente_url} target="_blank" rel="noopener noreferrer" className="text-apf-rojo hover:underline text-sm">
              Ver noticia original → {t.fuente_nombre || ""}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/transferencias/\[id\]/page.tsx
git commit -m "feat: add Transferencia detail page"
```

---

### Task 11: Mercado + Historial + Estadísticas Pages

**Files:**
- Create: `frontend/src/app/transferencias/mercado/page.tsx`
- Create: `frontend/src/app/transferencias/historial/page.tsx`
- Create: `frontend/src/app/transferencias/estadisticas/page.tsx`
- Create: `frontend/src/components/transferencia/EstadisticasDashboard.tsx`

- [ ] **Step 1: Create mercado page**

```tsx
// frontend/src/app/transferencias/mercado/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Transferencia } from "@/types";
import TransferCard from "@/components/transferencia/TransferCard";

export default function MercadoPage() {
  const { data, isLoading } = useQuery<Transferencia[]>({
    queryKey: ["mercado"],
    queryFn: () => apiFetch("/api/v1/transferencias/mercado?dias=30"),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-texto-principal mb-2">Mercado de Pases</h1>
      <p className="text-texto-secundario mb-8">Fichajes de los últimos 30 días</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-texto-secundario text-center py-12">No hay fichajes recientes</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((t) => (
            <TransferCard key={t.id} transferencia={t} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create historial page**

```tsx
// frontend/src/app/transferencias/historial/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Transferencia } from "@/types";
import TransferCard from "@/components/transferencia/TransferCard";

const CLUBES = [
  { id: "olimpia", nombre: "Olimpia" },
  { id: "cerro-porteno", nombre: "Cerro Porteño" },
  { id: "libertad", nombre: "Libertad" },
  { id: "nacional", nombre: "Nacional" },
  { id: "guarani", nombre: "Guaraní" },
  { id: "sol-de-america", nombre: "Sol de América" },
  { id: "sportivo-luqueno", nombre: "Sportivo Luqueño" },
];

export default function HistorialPage() {
  const [clubId, setClubId] = useState("olimpia");
  const { data, isLoading } = useQuery<Transferencia[]>({
    queryKey: ["historial", clubId],
    queryFn: () => apiFetch(`/api/v1/transferencias/historial/${clubId}`),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-texto-principal mb-2">Historial de Transferencias</h1>

      <select
        value={clubId}
        onChange={(e) => setClubId(e.target.value)}
        className="px-4 py-2 rounded-lg bg-bg-noche border border-borde-sutil text-texto-principal text-sm mb-8"
      >
        {CLUBES.map((c) => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-texto-secundario text-center py-12">Sin transferencias registradas</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((t) => (
            <TransferCard key={t.id} transferencia={t} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create EstadisticasDashboard**

```tsx
// frontend/src/components/transferencia/EstadisticasDashboard.tsx
"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { EstadisticasTransferencias } from "@/types";

const COLORS = ["#CC001C", "#00619E", "#FFCC00", "#1a4731", "#8B5CF6", "#F97316", "#06B6D4"];

export default function EstadisticasDashboard({ stats }: { stats: EstadisticasTransferencias }) {
  const tipoData = Object.entries(stats.distribucion_tipos).map(([name, value]) => ({ name, value }));
  const posData = Object.entries(stats.distribucion_posiciones).map(([name, value]) => ({ name, value }));
  const clubData = stats.gasto_total_por_club.slice(0, 10).map((c) => ({
    name: c.club_nombre.length > 12 ? c.club_nombre.slice(0, 12) + "…" : c.club_nombre,
    gastado: c.total_gastado,
    recibido: c.total_recibido,
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-apf-rojo">{stats.total_transferencias}</p>
          <p className="text-texto-secundario text-sm mt-1">Total transferencias</p>
        </div>
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-apf-dorado">
            ${stats.gasto_total_por_club.reduce((s, c) => s + c.total_gastado, 0).toFixed(1)}M
          </p>
          <p className="text-texto-secundario text-sm mt-1">Gasto total</p>
        </div>
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-400">
            ${stats.top_compras[0]?.monto?.toFixed(1) || 0}M
          </p>
          <p className="text-texto-secundario text-sm mt-1">Fichaje más caro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
          <h3 className="text-texto-principal font-semibold mb-4">Por tipo</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tipoData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {tipoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
          <h3 className="text-texto-principal font-semibold mb-4">Por posición</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={posData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {posData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {clubData.length > 0 && (
        <div className="bg-bg-secundario border border-borde-sutil rounded-xl p-6">
          <h3 className="text-texto-principal font-semibold mb-4">Gasto por club (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clubData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="gastado" fill="#CC001C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recibido" fill="#00619E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create estadísticas page**

```tsx
// frontend/src/app/transferencias/estadisticas/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { EstadisticasTransferencias } from "@/types";
import EstadisticasDashboard from "@/components/transferencia/EstadisticasDashboard";

export default function EstadisticasPage() {
  const { data: stats, isLoading } = useQuery<EstadisticasTransferencias>({
    queryKey: ["estadisticas-transferencias"],
    queryFn: () => apiFetch("/api/v1/transferencias/estadisticas"),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-texto-principal mb-2">Estadísticas del Mercado</h1>
      <p className="text-texto-secundario mb-8">Análisis de transferencias de la temporada</p>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-bg-secundario rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <EstadisticasDashboard stats={stats} />
      ) : (
        <p className="text-texto-secundario text-center py-12">Sin datos disponibles</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/transferencias/mercado/ frontend/src/app/transferencias/historial/ frontend/src/app/transferencias/estadisticas/ frontend/src/components/transferencia/EstadisticasDashboard.tsx
git commit -m "feat: add Mercado, Historial, Estadísticas pages + EstadisticasDashboard"
```

---

### Task 12: GSAP Animations

**Files:**
- Modify: `frontend/src/app/transferencias/page.tsx` (ScrollReveal)
- Modify: `frontend/src/app/transferencias/estadisticas/page.tsx` (CountUp)

- [ ] **Step 1: Add ScrollReveal to transfer grid**

In `frontend/src/app/transferencias/page.tsx`, wrap the grid with ScrollReveal:
```tsx
import ScrollReveal from "@/components/ui/ScrollReveal";

// Replace the grid div:
<ScrollReveal variant="slideUp" stagger={0.05}>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {data?.transferencias.map((t) => (
      <TransferCard key={t.id} transferencia={t} />
    ))}
  </div>
</ScrollReveal>
```

- [ ] **Step 2: Add CountUp to estadísticas cards**

In `EstadisticasDashboard.tsx`, import and use CountUp:
```tsx
import CountUp from "@/components/ui/CountUp";

// Replace static numbers:
<CountUp target={stats.total_transferencias} className="text-3xl font-bold text-apf-rojo" />
```

- [ ] **Step 3: Build verification**

Run: `cd frontend && npm run build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/transferencias/page.tsx frontend/src/components/transferencia/EstadisticasDashboard.tsx
git commit -m "feat: add GSAP animations to Transferencias (ScrollReveal + CountUp)"
```

---

### Task 13: Final Verification + Handoff Update

**Files:**
- Modify: `Handoff.md`

- [ ] **Step 1: Run full backend test suite**

Run: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol" ; python -m pytest backend/tests/ -v --tb=short`
Expected: All new tests pass, no regressions

- [ ] **Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: 0 errors, all routes generated

- [ ] **Step 3: Manual integration test**

1. Start backend: `$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Test flow:
   - Navigate to `/transferencias` — should show empty state
   - Login as admin
   - Create a transferencia via API or admin panel
   - Verify it appears in the list
   - Click to detail page
   - Check Mercado, Historial, Estadísticas pages
   - Verify filters work

- [ ] **Step 4: Update Handoff.md**

Add Transferencias section to `Handoff.md`:

```markdown
### Módulo Transferencias (Julio 2026)
- [x] Modelo `Transferencia` en SQLAlchemy
- [x] Migración 008_add_transferencias
- [x] Schemas Pydantic con validaciones
- [x] `TransferenciaService` — CRUD + filtros + estadísticas + mercado + historial
- [x] 9 API endpoints (list, detail, create, update, delete, mercado, historial, estadísticas, sync-rss)
- [x] RSS sync service para transferencias
- [x] Frontend types TypeScript
- [x] Navbar link a Transferencias
- [x] TransferCard, VerificationBadge, TipoBadge components
- [x] Páginas: /transferencias, /transferencias/[id], /transferencias/mercado, /transferencias/historial, /transferencias/estadisticas
- [x] EstadisticasDashboard con Recharts
- [x] GSAP: ScrollReveal + CountUp
- [x] 11/11 tests backend pasando
```

- [ ] **Step 5: Commit**

```bash
git add Handoff.md
git commit -m "docs: update Handoff.md with Transferencias module"
```

- [ ] **Step 6: Final push**

```bash
git push origin main
```
