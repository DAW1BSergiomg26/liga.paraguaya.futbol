### Task 1: Backend schemas — H2HOut

**Files:**
- Modify: `backend/app/schemas/partido.py`
- Test: `backend/tests/test_h2h.py`

**Interfaces:**
- Consumes: `Partido` model fields, `Club.nombre`, `Club.escudo`
- Produces: `ClubResumen`, `MayorGoleada`, `H2HPartidoItem`, `H2HOut` Pydantic models

#### Step 1: Write the failing test

```python
# backend/tests/test_h2h.py
import pytest
from backend.app.schemas.partido import H2HOut, ClubResumen, MayorGoleada, H2HPartidoItem


class TestH2HSchemas:
    def test_club_resumen_fields(self):
        c = ClubResumen(id="c1", nombre="Olimpia", escudo="https://example.com/escudo.svg")
        assert c.id == "c1"
        assert c.nombre == "Olimpia"
        assert c.escudo == "https://example.com/escudo.svg"

    def test_mayor_goleada_fields(self):
        m = MayorGoleada(goles=5, fecha="2024-03-10", goles_recibidos=1)
        assert m.goles == 5
        assert m.goles_recibidos == 1

    def test_h2h_partido_item_fields(self):
        p = H2HPartidoItem(
            id="p1", torneo="Apertura", jornada=5, fecha="2024-03-10",
            estado="finalizado", goles_local=2, goles_visitante=1,
            local_id="c1", visitante_id="c2"
        )
        assert p.goles_local == 2

    def test_h2h_out_structure(self):
        ca = ClubResumen(id="c1", nombre="Olimpia", escudo="")
        cb = ClubResumen(id="c2", nombre="Cerro", escudo="")
        resumen = {"pj": 10, "victorias_a": 4, "empates": 2, "victorias_b": 4,
                    "goles_a": 12, "goles_b": 11,
                    "mayor_goleada_a": MayorGoleada(goles=3, fecha="2024-01-01", goles_recibidos=0),
                    "mayor_goleada_b": None}
        h2h = H2HOut(club_a=ca, club_b=cb, resumen=resumen, partidos=[])
        assert h2h.club_a.nombre == "Olimpia"
        assert h2h.resumen["pj"] == 10
```

#### Step 2: Run test to verify it fails

Run from `C:\Users\astur\Desktop\liga.paraguaya.futbol\backend`:
```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_h2h.py -v
```
Expected: FAIL — `H2HOut` not defined.

#### Step 3: Write schemas

```python
# Add to backend/app/schemas/partido.py (after line 38)
class ClubResumen(BaseModel):
    id: str
    nombre: str
    escudo: str


class MayorGoleada(BaseModel):
    goles: int
    fecha: str
    goles_recibidos: int


class H2HPartidoItem(BaseModel):
    id: str
    torneo: str
    jornada: int
    fecha: str
    estado: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    local_id: str
    visitante_id: str


class H2HOut(BaseModel):
    club_a: ClubResumen
    club_b: ClubResumen
    resumen: dict
    partidos: list[H2HPartidoItem]
```

#### Step 4: Run test to verify it passes

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_h2h.py::TestH2HSchemas -v
```
Expected: PASS

#### Step 5: Commit

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add backend/app/schemas/partido.py backend/tests/test_h2h.py
git commit -m "feat(h2h): add H2HOut schemas"
```
