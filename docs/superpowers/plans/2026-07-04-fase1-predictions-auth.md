# Fase 1: Live Predictions + OAuth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement OAuth login (Google/GitHub), prediction system, real-time scoring, and leaderboard.

**Architecture:** Backend: User + Prediction models, upsert auth endpoint (token-based), prediction CRUD, automatic scoring on partido finalizado, leaderboard query. Frontend: Google/GitHub Sign-In via next-auth, prediction modal on `/partidos`, prediction history on `/predicciones`, leaderboard on `/leaderboard`.

**Tech Stack:** FastAPI, SQLAlchemy async, Next.js 14+, next-auth v5 (Auth.js), Google OAuth, GitHub OAuth, @tanstack/react-query

---

## Global Constraints

- Follow existing backend patterns: SQLAlchemy async models, Pydantic schemas with `from_attributes`
- Backend tests use SQLite in-memory (`sqlite+aiosqlite://`)
- Frontend follows existing patterns: `useQuery` from `@tanstack/react-query`, Tailwind classes, dark theme
- Auth tokens are random strings stored in DB (simple, proven pattern matching admin API key)
- New npm deps allowed: `next-auth` (v5 beta for App Router), `@next-auth/google`, etc.
- New pip deps allowed: `pyjwt` if needed (but token approach avoids this)

---
## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/app/models/user.py` | Create | User SQLAlchemy model |
| `backend/app/models/prediction.py` | Create | Prediction SQLAlchemy model |
| `backend/app/models/__init__.py` | Modify | Add User, Prediction imports |
| `backend/app/core/database.py` | Modify | Add model imports to init_db |
| `backend/app/core/dependencies.py` | Modify | Add `get_current_user` dependency |
| `backend/app/schemas/user.py` | Create | UserOut, UserLogin schemas |
| `backend/app/schemas/prediction.py` | Create | PredictionOut, PredictionCreate, LeaderboardEntry schemas |
| `backend/app/services/user_service.py` | Create | User upsert, get_by_token |
| `backend/app/services/prediction_service.py` | Create | Prediction CRUD, scoring logic, leaderboard query |
| `backend/app/api/auth.py` | Create | POST /api/v1/auth/google, POST /api/v1/auth/github |
| `backend/app/api/predicciones.py` | Create | Prediction endpoints |
| `backend/app/api/leaderboard.py` | Create | GET /api/v1/leaderboard |
| `backend/app/main.py` | Modify | Register new routers |
| `backend/tests/test_predicciones.py` | Create | Prediction tests |
| `frontend/src/types/index.ts` | Modify | Add User, Prediction, LeaderboardEntry types |
| `frontend/src/lib/api.ts` | Modify | Add prediction API functions, auth header helper |
| `frontend/src/components/PredictionModal.tsx` | Create | Modal to enter score prediction |
| `frontend/src/app/predicciones/page.tsx` | Create | User's prediction history + leaderboard |
| `frontend/src/app/leaderboard/page.tsx` | Create | Global leaderboard page |
| `frontend/src/app/partidos/page.tsx` | Modify | Add "Predecir" button for logged-in users |
| `frontend/src/app/partidos/[id]/page.tsx` | Modify | Show user's prediction if exists |
| `frontend/src/app/layout.tsx` | Modify | Wrap with SessionProvider |

---

### Task 1: Backend User model + auth endpoint

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/services/user_service.py`
- Create: `backend/app/api/auth.py`
- Modify: `backend/app/core/dependencies.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Produces: `User` model, `UserOut` schema, `UserService.upsert()`, `get_current_user` dependency, `POST /api/v1/auth/google` and `POST /api/v1/auth/github`

- [ ] **Create `backend/app/models/user.py`**

```python
import secrets
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    image: Mapped[str] = mapped_column(String(500), default="")
    username: Mapped[str] = mapped_column(String(100), unique=True)
    provider: Mapped[str] = mapped_column(String(50), default="google")
    provider_id: Mapped[str] = mapped_column(String(200), default="")
    token: Mapped[str] = mapped_column(String(100), default="")
    puntos: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def generate_token(self):
        self.token = secrets.token_urlsafe(48)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
```

- [ ] **Create `backend/app/schemas/user.py`**

```python
from pydantic import BaseModel


class UserLogin(BaseModel):
    email: str
    name: str
    image: str = ""
    provider: str = "google"
    provider_id: str = ""


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    image: str
    username: str
    puntos: int
    token: str

    model_config = {"from_attributes": True}
```

- [ ] **Create `backend/app/services/user_service.py`**

```python
import re
import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from backend.app.schemas.user import UserLogin, UserOut


class UserService:

    @staticmethod
    def _generate_username(email: str) -> str:
        base = email.split("@")[0].lower()
        base = re.sub(r"[^a-z0-9]", "", base)[:20]
        return f"{base}_{secrets.token_hex(3)}"

    @staticmethod
    async def upsert(db: AsyncSession, data: UserLogin) -> UserOut:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()
        if user:
            user.name = data.name
            user.image = data.image
            user.generate_token()
        else:
            user_id = f"{data.provider}_{data.provider_id or data.email.split('@')[0]}"
            user = User(
                id=user_id,
                email=data.email,
                name=data.name,
                image=data.image,
                username=UserService._generate_username(data.email),
                provider=data.provider,
                provider_id=data.provider_id,
            )
            user.generate_token()
            db.add(user)
        await db.flush()
        return UserOut.model_validate(user)

    @staticmethod
    async def get_by_token(db: AsyncSession, token: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.token == token))
        return result.scalar_one_or_none()
```

- [ ] **Create `backend/app/api/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.user import UserLogin, UserOut
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=UserOut)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    if not body.email or not body.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email and name required")
    return await UserService.upsert(db, body)
```

- [ ] **Modify `backend/app/core/dependencies.py`** — add `get_current_user`

```python
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from backend.app.services.user_service import UserService


async def get_current_user(
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")
    token = authorization[7:]
    user = await UserService.get_by_token(db, token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user
```

- [ ] **Modify `backend/app/models/__init__.py`** — add imports

```python
from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion
from backend.app.models.user import User
from backend.app.models.prediction import Prediction

__all__ = ["Club", "Partido", "TablaPosicion", "User", "Prediction"]
```

- [ ] **Modify `backend/app/core/database.py`** — add models to init_db

```python
from backend.app.models import club, partido, tabla, user, prediction
```

- [ ] **Modify `backend/app/main.py`** — register auth router

```python
from backend.app.api import auth, clubes, partidos, predicciones, leaderboard, tabla, admin
```

Add router registration:

```python
app.include_router(auth.router)
app.include_router(predicciones.router)
app.include_router(leaderboard.router)
```

- [ ] **Run existing tests to verify nothing is broken**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: all existing tests pass

- [ ] **Commit**

```bash
git add backend/app/models/user.py backend/app/schemas/user.py backend/app/services/user_service.py backend/app/api/auth.py backend/app/core/dependencies.py backend/app/models/__init__.py backend/app/core/database.py backend/app/main.py
git commit -m "feat: add User model and auth endpoint"
```

---

### Task 2: Backend Prediction model + service

**Files:**
- Create: `backend/app/models/prediction.py`
- Create: `backend/app/schemas/prediction.py`
- Create: `backend/app/services/prediction_service.py`
- Modify: `backend/app/core/database.py` (prediction model already added in init_db import)

**Interfaces:**
- Consumes: `User` model, `Partido` model
- Produces: `Prediction` model, `PredictionOut`/`PredictionCreate`/`LeaderboardEntry` schemas, `PredictionService.crear()`, `PredictionService.mis_predicciones()`, `PredictionService.calcular_puntos()`, `PredictionService.leaderboard()`

- [ ] **Create `backend/app/models/prediction.py`**

```python
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id"))
    partido_id: Mapped[str] = mapped_column(String(50), ForeignKey("partidos.id"))
    goles_local: Mapped[int] = mapped_column(Integer)
    goles_visitante: Mapped[int] = mapped_column(Integer)
    puntos: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "partido_id", name="uq_user_partido"),)
```

- [ ] **Create `backend/app/schemas/prediction.py`**

```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PredictionCreate(BaseModel):
    partido_id: str
    goles_local: int
    goles_visitante: int


class PredictionOut(BaseModel):
    id: str
    user_id: str
    partido_id: str
    goles_local: int
    goles_visitante: int
    puntos: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionDetail(PredictionOut):
    torneo: str = ""
    jornada: int = 0
    local_id: str = ""
    visitante_id: str = ""
    local_nombre: str = ""
    visitante_nombre: str = ""
    goles_real_local: Optional[int] = None
    goles_real_visitante: Optional[int] = None
    estado: str = ""


class LeaderboardEntry(BaseModel):
    username: str
    name: str
    image: str
    puntos: int
    aciertos: int
    predicciones: int
```

- [ ] **Create `backend/app/services/prediction_service.py`**

```python
import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.partido import Partido
from backend.app.models.prediction import Prediction
from backend.app.models.user import User
from backend.app.schemas.prediction import (
    LeaderboardEntry,
    PredictionCreate,
    PredictionDetail,
    PredictionOut,
)


class PredictionService:

    @staticmethod
    async def crear(
        db: AsyncSession, user_id: str, data: PredictionCreate
    ) -> PredictionOut:
        pred_id = f"pred_{uuid.uuid4().hex[:12]}"
        pred = Prediction(
            id=pred_id,
            user_id=user_id,
            partido_id=data.partido_id,
            goles_local=data.goles_local,
            goles_visitante=data.goles_visitante,
        )
        db.add(pred)
        await db.flush()
        return PredictionOut.model_validate(pred)

    @staticmethod
    async def mis_predicciones(
        db: AsyncSession, user_id: str
    ) -> list[PredictionDetail]:
        stmt = (
            select(Prediction)
            .where(Prediction.user_id == user_id)
            .options(selectinload(Prediction.partido))
            .order_by(Prediction.created_at.desc())
        )
        result = await db.execute(stmt)
        preds = result.scalars().all()
        out = []
        for p in preds:
            partido = p.partido
            out.append(
                PredictionDetail(
                    id=p.id,
                    user_id=p.user_id,
                    partido_id=p.partido_id,
                    goles_local=p.goles_local,
                    goles_visitante=p.goles_visitante,
                    puntos=p.puntos,
                    created_at=p.created_at,
                    torneo=partido.torneo if partido else "",
                    jornada=partido.jornada if partido else 0,
                    local_id=partido.local_id if partido else "",
                    visitante_id=partido.visitante_id if partido else "",
                    local_nombre=partido.local.nombre if partido and partido.local else "",
                    visitante_nombre=partido.visitante.nombre if partido and partido.visitante else "",
                    goles_real_local=partido.goles_local if partido else None,
                    goles_real_visitante=partido.goles_visitante if partido else None,
                    estado=partido.estado if partido else "",
                )
            )
        return out

    @staticmethod
    async def calcular_puntos(db: AsyncSession, partido_id: str):
        """Recalculate points for all predictions on a finalized partido."""
        result = await db.execute(
            select(Prediction).where(Prediction.partido_id == partido_id)
        )
        preds = result.scalars().all()
        if not preds:
            return

        result = await db.execute(select(Partido).where(Partido.id == partido_id))
        partido = result.scalar_one_or_none()
        if not partido or partido.estado != "finalizado":
            return

        for pred in preds:
            puntos = 1  # participation
            if (pred.goles_local == partido.goles_local and
                pred.goles_visitante == partido.goles_visitante):
                puntos = 3  # exact score
            elif ((pred.goles_local - pred.goles_visitante) *
                  (partido.goles_local - partido.goles_visitante) > 0):
                puntos = 2  # correct winner
            elif pred.goles_local == pred.goles_visitante and partido.goles_local == partido.goles_visitante:
                puntos = 2  # correct draw
            pred.puntos = puntos
            await db.flush()

    @staticmethod
    async def recalcular_totales_usuario(db: AsyncSession, user_id: str):
        result = await db.execute(
            select(func.coalesce(func.sum(Prediction.puntos), 0)).where(
                Prediction.user_id == user_id
            )
        )
        total = result.scalar() or 0
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.puntos = total
            await db.flush()

    @staticmethod
    async def leaderboard(
        db: AsyncSession, limit: int = 50
    ) -> list[LeaderboardEntry]:
        stmt = (
            select(
                User.username,
                User.name,
                User.image,
                User.puntos,
                func.count(Prediction.id).label("predicciones"),
                func.sum(
                    Prediction.puntos == 3
                ).label("aciertos"),
            )
            .outerjoin(Prediction, Prediction.user_id == User.id)
            .group_by(User.id)
            .order_by(User.puntos.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [
            LeaderboardEntry(
                username=row.username,
                name=row.name,
                image=row.image,
                puntos=row.puntos or 0,
                predicciones=row.predicciones or 0,
                aciertos=row.aciertos or 0,
            )
            for row in rows
        ]
```

- [ ] **Modify `backend/app/models/partido.py`** — add prediction relationship

Add after `visitante` relationship:

```python
predicciones = relationship("Prediction", back_populates="partido", lazy="selectin")
```

- [ ] **Modify `backend/app/models/user.py`** — add predictions relationship

Add after columns:

```python
from sqlalchemy.orm import relationship
predicciones = relationship("Prediction", back_populates="user", lazy="selectin")
```

- [ ] **Modify `backend/app/models/prediction.py`** — add relationships

Add after table columns:

```python
from sqlalchemy.orm import relationship

user = relationship("User", back_populates="predicciones")
partido = relationship("Partido", back_populates="predicciones", lazy="selectin")
```

- [ ] **Run existing tests**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: all existing tests pass

- [ ] **Commit**

```bash
git add backend/app/models/prediction.py backend/app/schemas/prediction.py backend/app/services/prediction_service.py backend/app/models/partido.py backend/app/models/user.py
git commit -m "feat: add Prediction model and service"
```

---

### Task 3: Backend prediction + leaderboard endpoints

**Files:**
- Create: `backend/app/api/predicciones.py`
- Create: `backend/app/api/leaderboard.py`
- Modify: `backend/app/main.py` (routers already added in Task 1)
- Modify: `backend/app/api/partidos.py` (add endpoint to trigger scoring on finalize)

**Interfaces:**
- Consumes: `get_current_user` dependency, `PredictionService`, `PartidoService`
- Produces: REST endpoints for predictions and leaderboard

- [ ] **Create `backend/app/api/predicciones.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.prediction import PredictionCreate, PredictionDetail, PredictionOut
from backend.app.services.prediction_service import PredictionService

router = APIRouter(prefix="/api/v1/predicciones", tags=["predicciones"])


@router.post("", response_model=PredictionOut, status_code=201)
async def crear_prediccion(
    body: PredictionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService.crear(db, user.id, body)


@router.get("/mis", response_model=list[PredictionDetail])
async def mis_predicciones(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService.mis_predicciones(db, user.id)
```

- [ ] **Create `backend/app/api/leaderboard.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.prediction import LeaderboardEntry
from backend.app.services.prediction_service import PredictionService

router = APIRouter(prefix="/api/v1/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService.leaderboard(db, limit)
```

- [ ] **Modify `backend/app/api/partidos.py`** — add scoring trigger on update

In `actualizar_partido` (admin PUT endpoint), after saving changes, call:

```python
if partido.estado == "finalizado":
    from backend.app.services.prediction_service import PredictionService
    await PredictionService.calcular_puntos(db, partido_id)
    # Recalculate totals for all users who predicted this partido
    from backend.app.models.prediction import Prediction
    result = await db.execute(
        select(Prediction.user_id).where(Prediction.partido_id == partido_id).distinct()
    )
    user_ids = [r[0] for r in result.all()]
    for uid in user_ids:
        await PredictionService.recalcular_totales_usuario(db, uid)
```

- [ ] **Run tests**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: all existing tests pass

- [ ] **Commit**

```bash
git add backend/app/api/predicciones.py backend/app/api/leaderboard.py backend/app/api/partidos.py
git commit -m "feat: add prediction and leaderboard endpoints"
```

---

### Task 4: Backend tests for predictions

**Files:**
- Create: `backend/tests/test_predicciones.py`

- [ ] **Create `backend/tests/test_predicciones.py`**

```python
import pytest

from backend.tests.conftest import seed_test_data, seed_test_user


@pytest.mark.asyncio
async def test_login_creates_user(client, db_session):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "name": "Test User",
        "provider": "google",
        "provider_id": "google_123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["token"] != ""
    assert data["username"] != ""


@pytest.mark.asyncio
async def test_login_returns_same_user(client, db_session):
    r1 = await client.post("/api/v1/auth/login", json={
        "email": "same@example.com", "name": "User", "provider": "google", "provider_id": "g1",
    })
    token1 = r1.json()["token"]
    r2 = await client.post("/api/v1/auth/login", json={
        "email": "same@example.com", "name": "User Updated", "provider": "google", "provider_id": "g1",
    })
    assert r2.status_code == 200
    assert r2.json()["token"] != token1  # new token each time


@pytest.mark.asyncio
async def test_crear_prediccion(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await client.post("/api/v1/auth/login", json={
        "email": "pred@test.com", "name": "Pred User", "provider": "google", "provider_id": "gp1",
    })
    token = r.json()["token"]

    response = await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 2, "goles_visitante": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["partido_id"] == "p001"
    assert data["goles_local"] == 2


@pytest.mark.asyncio
async def test_mis_predicciones(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await client.post("/api/v1/auth/login", json={
        "email": "list@test.com", "name": "List User", "provider": "google", "provider_id": "gl1",
    })
    token = r.json()["token"]

    await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 1, "goles_visitante": 1},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.get(
        "/api/v1/predicciones/mis",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_leaderboard(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await client.post("/api/v1/auth/login", json={
        "email": "lb@test.com", "name": "LB User", "provider": "google", "provider_id": "glb1",
    })
    token = r.json()["token"]

    await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 0, "goles_visitante": 0},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.get("/api/v1/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_prediccion_sin_auth(client, db_session):
    await seed_test_data(db_session)
    response = await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 2, "goles_visitante": 1},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_calcular_puntos_exacto(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await client.post("/api/v1/auth/login", json={
        "email": "exact@test.com", "name": "Exact", "provider": "google", "provider_id": "ge1",
    })
    token = r.json()["token"]

    await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 2, "goles_visitante": 1},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Finalize the partido with same score
    from backend.app.services.prediction_service import PredictionService
    partido_result = await db_session.execute(
        select(Partido).where(Partido.id == "p001")
    )
    partido = partido_result.scalar_one()
    partido.goles_local = 2
    partido.goles_visitante = 1
    partido.estado = "finalizado"
    await db_session.flush()

    await PredictionService.calcular_puntos(db_session, "p001")
    result = await db_session.execute(
        select(Prediction).where(Prediction.partido_id == "p001")
    )
    pred = result.scalar_one()
    assert pred.puntos == 3
```

- [ ] **Add test helper `seed_test_user` to `backend/tests/conftest.py`**

```python
async def seed_test_user(db: AsyncSession):
    from backend.app.models.user import User
    user = User(id="test_user", email="test@test.com", name="Test", username="tester", token="test_token_123")
    db.add(user)
    await db.flush()
```

Add import at top of conftest.py:

```python
from sqlalchemy import select
from backend.app.models.partido import Partido
from backend.app.models.prediction import Prediction
```

- [ ] **Run all tests**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: 11 existing + 7 new = 18 passed

- [ ] **Commit**

```bash
git add backend/tests/test_predicciones.py backend/tests/conftest.py
git commit -m "feat: add prediction tests"
```

---

### Task 5: Frontend types + API functions

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Add types to `frontend/src/types/index.ts`**

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  image: string;
  username: string;
  puntos: number;
  token: string;
}

export interface PredictionCreate {
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
}

export interface PredictionDetail {
  id: string;
  user_id: string;
  partido_id: string;
  goles_local: number;
  goles_visitante: number;
  puntos: number;
  created_at: string;
  torneo: string;
  jornada: number;
  local_id: string;
  visitante_id: string;
  local_nombre: string;
  visitante_nombre: string;
  goles_real_local: number | null;
  goles_real_visitante: number | null;
  estado: string;
}

export interface LeaderboardEntry {
  username: string;
  name: string;
  image: string;
  puntos: number;
  aciertos: number;
  predicciones: number;
}
```

- [ ] **Add API functions to `frontend/src/lib/api.ts`**

Add to the import line:

```typescript
import type { Club, ClubDetail, Partido, PartidoDetail, PartidoPage, TablaRow, User, PredictionCreate, PredictionDetail, LeaderboardEntry } from "@/types";
```

Add before `updatePartido`:

```typescript
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("user_token", token);
  else localStorage.removeItem("user_token");
}

export function getSavedToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_token");
}

async function authFetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const token = authToken || getSavedToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function loginWithProvider(data: {
  email: string;
  name: string;
  image?: string;
  provider: string;
  provider_id: string;
}): Promise<User> {
  return authFetchJSON<User>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function crearPrediccion(data: PredictionCreate): Promise<PredictionDetail> {
  return authFetchJSON<PredictionDetail>("/api/v1/predicciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function misPredicciones(): Promise<PredictionDetail[]> {
  return authFetchJSON<PredictionDetail[]>("/api/v1/predicciones/mis");
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return fetchJSON<LeaderboardEntry[]>("/api/v1/leaderboard");
}
```

- [ ] **Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat: add user, prediction types and API functions"
```

---

### Task 6: Frontend PredictionModal component

**Files:**
- Create: `frontend/src/components/PredictionModal.tsx`

- [ ] **Create `frontend/src/components/PredictionModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { crearPrediccion } from "@/lib/api";
import type { Partido } from "@/types";

interface PredictionModalProps {
  partido: Partido;
  clubLocal: string;
  clubVisitante: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PredictionModal({
  partido,
  clubLocal,
  clubVisitante,
  onClose,
  onSuccess,
}: PredictionModalProps) {
  const [golesLocal, setGolesLocal] = useState("");
  const [golesVisitante, setGolesVisitante] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const gl = Number(golesLocal);
    const gv = Number(golesVisitante);
    if (!Number.isInteger(gl) || !Number.isInteger(gv) || gl < 0 || gv < 0) {
      setError("Los goles deben ser números enteros no negativos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await crearPrediccion({
        partido_id: partido.id,
        goles_local: gl,
        goles_visitante: gv,
      });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold mb-2">🔮 Tu predicción</h3>
        <p className="text-sm text-gray-400 mb-6">
          {partido.torneo} · Jornada {partido.jornada}
        </p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-right">
            <p className="text-white font-medium text-lg">{clubLocal}</p>
          </div>
          <input
            type="number"
            min="0"
            value={golesLocal}
            onChange={(e) => setGolesLocal(e.target.value)}
            className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center text-xl font-bold"
          />
          <span className="text-gray-400 text-lg">vs</span>
          <input
            type="number"
            min="0"
            value={golesVisitante}
            onChange={(e) => setGolesVisitante(e.target.value)}
            className="w-16 px-3 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white text-center text-xl font-bold"
          />
          <div className="text-left">
            <p className="text-white font-medium text-lg">{clubVisitante}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 text-red-300 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-[#76e4f7] text-black font-semibold hover:bg-[#5ac8df] transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar predicción"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Commit**

```bash
git add frontend/src/components/PredictionModal.tsx
git commit -m "feat: add PredictionModal component"
```

---

### Task 7: Frontend predictions + leaderboard pages

**Files:**
- Create: `frontend/src/app/predicciones/page.tsx`
- Create: `frontend/src/app/leaderboard/page.tsx`

- [ ] **Create `frontend/src/app/predicciones/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { misPredicciones, getLeaderboard, getSavedToken, setAuthToken } from "@/lib/api";
import type { PredictionDetail, LeaderboardEntry } from "@/types";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function PrediccionesPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = getSavedToken();
    if (token) {
      setAuthToken(token);
      setLoggedIn(true);
    }
  }, []);

  const { data: predicciones, isLoading, error } = useQuery<PredictionDetail[]>({
    queryKey: ["predicciones"],
    queryFn: () => misPredicciones(),
    enabled: loggedIn,
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
  });

  if (!loggedIn) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Mis Predicciones</h1>
        <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60">
          <p className="text-gray-400 mb-4">Iniciá sesión para ver tus predicciones</p>
          <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-[#76e4f7] text-black font-semibold">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner text="Cargando predicciones..." />;
  if (error) return <ErrorMessage message="Error al cargar predicciones" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mis Predicciones</h1>

      {(!predicciones || predicciones.length === 0) ? (
        <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center mb-8">
          <p className="text-gray-400">Todavía no hiciste predicciones.</p>
          <Link href="/partidos" className="text-[#76e4f7] hover:underline mt-2 inline-block">
            Ir a partidos →
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mb-12">
          {predicciones.map((p) => (
            <Link key={p.id} href={`/partidos/${p.partido_id}`}
              className="block p-4 rounded-xl border border-white/10 bg-[#0a1628]/60 hover:bg-[#0a1628] transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{p.torneo} · J{p.jornada}</p>
                  <p className="text-white font-medium mt-1">
                    {p.local_nombre} {p.goles_local}-{p.goles_visitante} {p.visitante_nombre}
                  </p>
                </div>
                <div className="text-right">
                  {p.estado === "finalizado" ? (
                    <span className={`text-sm font-bold ${p.puntos === 3 ? "text-green-400" : p.puntos === 2 ? "text-yellow-400" : "text-gray-500"}`}>
                      +{p.puntos} pts
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Pendiente</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <h2 className="text-2xl font-bold mb-4">🏆 Leaderboard</h2>
      {leaderboard && leaderboard.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a1628]/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Usuario</th>
                <th className="p-4 text-center">Pts</th>
                <th className="p-4 text-center">Aciertos</th>
                <th className="p-4 text-center">Predicciones</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.username} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-bold">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {entry.image && (
                        <img src={entry.image} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="text-white font-medium">{entry.name}</span>
                      <span className="text-gray-500 text-xs">@{entry.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-[#76e4f7]">{entry.puntos}</td>
                  <td className="p-4 text-center text-green-400">{entry.aciertos}</td>
                  <td className="p-4 text-center text-gray-400">{entry.predicciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center">
          <p className="text-gray-500">Todavía no hay participantes.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Create `frontend/src/app/leaderboard/page.tsx`** (simpler version — reuses the leaderboard table from above)

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard(),
  });

  if (isLoading) return <LoadingSpinner text="Cargando leaderboard..." />;
  if (error) return <ErrorMessage message="Error al cargar leaderboard" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">🏆 Leaderboard</h1>

      {!leaderboard || leaderboard.length === 0 ? (
        <div className="p-8 rounded-xl border border-white/10 bg-[#0a1628]/60 text-center">
          <p className="text-gray-500">Todavía no hay participantes.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a1628]/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase text-xs">
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Usuario</th>
                <th className="p-4 text-center">Pts</th>
                <th className="p-4 text-center">Aciertos</th>
                <th className="p-4 text-center">Predicciones</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.username} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-bold">{i + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {entry.image && (
                        <img src={entry.image} alt="" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="text-white font-medium">{entry.name}</span>
                      <span className="text-gray-500 text-xs">@{entry.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-[#76e4f7]">{entry.puntos}</td>
                  <td className="p-4 text-center text-green-400">{entry.aciertos}</td>
                  <td className="p-4 text-center text-gray-400">{entry.predicciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Commit**

```bash
git add frontend/src/app/predicciones/page.tsx frontend/src/app/leaderboard/page.tsx
git commit -m "feat: add predicciones and leaderboard pages"
```

---

### Task 8: Frontend partidos pages — prediction integration

**Files:**
- Modify: `frontend/src/app/partidos/page.tsx`
- Modify: `frontend/src/app/partidos/[id]/page.tsx`

- [ ] **Modify `frontend/src/app/partidos/page.tsx`** — add "Predecir" button to each partido

After the import line, add:

```typescript
import { useState, useEffect } from "react";
import { getSavedToken, setAuthToken } from "@/lib/api";
import PredictionModal from "@/components/PredictionModal";
```

Add state variables:

```typescript
const [userToken, setUserToken] = useState<string | null>(null);
const [predictionPartido, setPredictionPartido] = useState<Partido | null>(null);

useEffect(() => {
  const token = getSavedToken();
  if (token) {
    setAuthToken(token);
    setUserToken(token);
  }
}, []);
```

After the `<EstadoBadge>` column, before `<td className="text-center py-3 px-2 text-gray-400">{p.jornada}</td>`, add:

```typescript
<td className="py-3 px-2 text-center">
  {userToken && p.estado === "programado" && (
    <button
      onClick={() => setPredictionPartido(p)}
      className="text-xs px-2 py-1 rounded-lg bg-[#1a2a3a] border border-white/10 text-[#76e4f7] hover:bg-[#76e4f7] hover:text-black transition"
    >
      🔮 Predecir
    </button>
  )}
</td>
```

Add the modal before closing `</div>` of the table section:

```tsx
{predictionPartido && (
  <PredictionModal
    partido={predictionPartido}
    clubLocal={clubMap.get(predictionPartido.local_id) || predictionPartido.local_id}
    clubVisitante={clubMap.get(predictionPartido.visitante_id) || predictionPartido.visitante_id}
    onClose={() => setPredictionPartido(null)}
    onSuccess={() => {
      setPredictionPartido(null);
      queryClient.invalidateQueries({ queryKey: ["predicciones"] });
    }}
  />
)}
```

Note: Need to add `queryClient`:

```typescript
const queryClient = useQueryClient();
```

- [ ] **Modify `frontend/src/app/partidos/[id]/page.tsx`** — show user's prediction

Add imports:
```typescript
import { useEffect, useState } from "react";
import { getSavedToken, setAuthToken, misPredicciones } from "@/lib/api";
import type { PredictionDetail } from "@/types";
```

Add state after `useParams`:
```typescript
const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
const [loggedIn, setLoggedIn] = useState(false);

useEffect(() => {
  const token = getSavedToken();
  if (token) {
    setAuthToken(token);
    setLoggedIn(true);
    misPredicciones().then((preds) => {
      const found = preds.find((p) => p.partido_id === id);
      if (found) setPrediction(found);
    }).catch(() => {});
  }
}, [id]);
```

After the "Próximos Partidos" section, add prediction display:
```tsx
{prediction && (
  <section className="mt-10">
    <h2 className="text-2xl font-bold mb-4">🔮 Tu predicción</h2>
    <div className={`p-4 rounded-xl border ${
      prediction.puntos === 3 ? "border-green-500/50 bg-green-900/20" :
      prediction.puntos === 2 ? "border-yellow-500/50 bg-yellow-900/20" :
      prediction.puntos === 0 && prediction.estado === "finalizado" ? "border-red-500/50 bg-red-900/20" :
      "border-white/10 bg-[#0a1628]/60"
    }`}>
      <div className="flex items-center justify-center gap-4 text-2xl font-bold">
        <span>{club.nombre}</span>
        <span className="text-[#76e4f7]">{prediction.goles_local} - {prediction.goles_visitante}</span>
        <span>{prediction.visitante_nombre || prediction.visitante_id}</span>
      </div>
      {prediction.puntos > 0 && (
        <p className="text-center mt-2 font-semibold text-green-400">+{prediction.puntos} pts</p>
      )}
    </div>
  </section>
)}

- [ ] **Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Commit**

```bash
git add frontend/src/app/partidos/page.tsx frontend/src/app/partidos/[id]/page.tsx
git commit -m "feat: integrate prediction button and display in partidos"
```

---

### Task 9: Run full test suite

- [ ] **Run backend tests**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: all tests pass

- [ ] **Frontend type check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Commit any fixes**

```bash
git add -A && git commit -m "chore: fix test and type issues"
```
