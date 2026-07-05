# Task 2: Backend Prediction model + service

**Files:**
- Create: `backend/app/models/prediction.py`
- Create: `backend/app/schemas/prediction.py`
- Create: `backend/app/services/prediction_service.py`
- Modify: `backend/app/models/partido.py`
- Modify: `backend/app/models/user.py`

**Interfaces:**
- Consumes: `User` model (from Task 1), `Partido` model (existing)
- Produces: `Prediction` model, `PredictionOut`/`PredictionCreate`/`LeaderboardEntry` schemas, `PredictionService.crear()`, `PredictionService.mis_predicciones()`, `PredictionService.calcular_puntos()`, `PredictionService.leaderboard()`

## Steps

- [ ] **Create `backend/app/models/prediction.py`**

```python
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    user = relationship("User", back_populates="predicciones")
    partido = relationship("Partido", back_populates="predicciones", lazy="selectin")

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
            puntos = 1
            if (pred.goles_local == partido.goles_local and
                pred.goles_visitante == partido.goles_visitante):
                puntos = 3
            elif ((pred.goles_local - pred.goles_visitante) *
                  (partido.goles_local - partido.goles_visitante) > 0):
                puntos = 2
            elif pred.goles_local == pred.goles_visitante and partido.goles_local == partido.goles_visitante:
                puntos = 2
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

- [ ] **Modify `backend/app/models/partido.py`** — add `predicciones` relationship

Open the file and add this line after the existing `visitante` relationship:
```python
predicciones = relationship("Prediction", back_populates="partido", lazy="selectin")
```

You'll also need to ensure `from sqlalchemy.orm import relationship` is already imported (check the file first — if not, add it).

- [ ] **Modify `backend/app/models/user.py`** — add `predicciones` relationship

Open the file created in Task 1 (it currently has no relationships). Add at the top:
```python
from sqlalchemy.orm import relationship
```

Add after the columns:
```python
predicciones = relationship("Prediction", back_populates="user", lazy="selectin")
```

- [ ] **Run existing tests**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: 11 existing tests pass (no prediction tests yet — they come in Task 4)

- [ ] **Commit**

```bash
git add backend/app/models/prediction.py backend/app/schemas/prediction.py backend/app/services/prediction_service.py backend/app/models/partido.py backend/app/models/user.py
git commit -m "feat: add Prediction model and service"
```
