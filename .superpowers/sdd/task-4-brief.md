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


