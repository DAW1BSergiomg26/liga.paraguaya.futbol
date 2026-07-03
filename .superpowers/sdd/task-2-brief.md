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


