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


