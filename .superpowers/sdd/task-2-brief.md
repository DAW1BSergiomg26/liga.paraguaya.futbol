### Task 2: Backend service — get_h2h()

**Files:**
- Modify: `backend/app/services/partido_service.py`
- Test: `backend/tests/test_h2h.py` (append)

**Interfaces:**
- Consumes: `Partido` model, `Club` model (via eager loading), `H2HOut`, `ClubResumen`, `H2HPartidoItem`, `MayorGoleada`
- Produces: `PartidoService.get_h2h(db, club_a, club_b) -> H2HOut`

#### Step 1: Write the failing test

```python
# Add to backend/tests/test_h2h.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.partido_service import PartidoService
from backend.app.models.partido import Partido
from backend.app.models.club import Club


@pytest.mark.asyncio
async def test_get_h2h_empty():
    db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=mock_result)

    result = await PartidoService.get_h2h(db, "c1", "c2")
    assert result.club_a.id == "c1"
    assert result.club_b.id == "c2"
    assert result.partidos == []
    assert result.resumen["pj"] == 0
```

#### Step 2: Run test to verify it fails

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest backend/tests/test_h2h.py::test_get_h2h_empty -v
```
Expected: FAIL — `PartidoService.get_h2h` not defined.

#### Step 3: Implement get_h2h()

```python
# Add to backend/app/services/partido_service.py (after line 74 or last method)

@staticmethod
async def get_h2h(
    db: AsyncSession,
    club_a: str,
    club_b: str,
) -> "H2HOut":
    from backend.app.schemas.partido import ClubResumen, H2HOut, H2HPartidoItem, MayorGoleada

    # Fetch club info
    from backend.app.models.club import Club
    club_a_obj = await db.get(Club, club_a)
    club_b_obj = await db.get(Club, club_b)

    # Fetch matches between these two clubs
    stmt = (
        select(Partido)
        .where(
            ((Partido.local_id == club_a) & (Partido.visitante_id == club_b)) |
            ((Partido.local_id == club_b) & (Partido.visitante_id == club_a))
        )
        .order_by(Partido.fecha.desc())
    )
    result = await db.execute(stmt)
    partidos = result.scalars().all()

    # Build partido items
    items = []
    for p in partidos:
        items.append(H2HPartidoItem(
            id=p.id,
            torneo=p.torneo,
            jornada=p.jornada,
            fecha=p.fecha.isoformat() if p.fecha else "",
            estado=p.estado,
            goles_local=p.goles_local,
            goles_visitante=p.goles_visitante,
            local_id=p.local_id,
            visitante_id=p.visitante_id,
        ))

    # Compute summary
    victorias_a = 0
    victorias_b = 0
    empates = 0
    goles_a = 0
    goles_b = 0
    mayor_a_goles = 0
    mayor_a_recibidos = 0
    mayor_a_fecha = ""
    mayor_b_goles = 0
    mayor_b_recibidos = 0
    mayor_b_fecha = ""

    for p in partidos:
        if p.goles_local is None or p.goles_visitante is None:
            continue
        if p.estado != "finalizado":
            continue

        if p.local_id == club_a:
            ga, gb = p.goles_local, p.goles_visitante
        else:
            ga, gb = p.goles_visitante, p.goles_local

        goles_a += ga
        goles_b += gb

        if ga > gb:
            victorias_a += 1
            if ga > mayor_a_goles:
                mayor_a_goles = ga
                mayor_a_recibidos = gb
                mayor_a_fecha = p.fecha.isoformat() if p.fecha else ""
        elif gb > ga:
            victorias_b += 1
            if gb > mayor_b_goles:
                mayor_b_goles = gb
                mayor_b_recibidos = ga
                mayor_b_fecha = p.fecha.isoformat() if p.fecha else ""
        else:
            empates += 1

    mayor_goleada_a = None
    if mayor_a_goles > 0:
        mayor_goleada_a = MayorGoleada(goles=mayor_a_goles, fecha=mayor_a_fecha, goles_recibidos=mayor_a_recibidos)

    mayor_goleada_b = None
    if mayor_b_goles > 0:
        mayor_goleada_b = MayorGoleada(goles=mayor_b_goles, fecha=mayor_b_fecha, goles_recibidos=mayor_b_recibidos)

    resumen = {
        "pj": len(items),
        "victorias_a": victorias_a,
        "empates": empates,
        "victorias_b": victorias_b,
        "goles_a": goles_a,
        "goles_b": goles_b,
        "mayor_goleada_a": mayor_goleada_a,
        "mayor_goleada_b": mayor_goleada_b,
    }

    return H2HOut(
        club_a=ClubResumen(id=club_a, nombre=club_a_obj.nombre if club_a_obj else club_a, escudo=club_a_obj.escudo if club_a_obj else ""),
        club_b=ClubResumen(id=club_b, nombre=club_b_obj.nombre if club_b_obj else club_b, escudo=club_b_obj.escudo if club_b_obj else ""),
        resumen=resumen,
        partidos=items,
    )
```

#### Step 4: Run test to verify it passes

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest backend/tests/test_h2h.py::test_get_h2h_empty -v
```
Expected: PASS

#### Step 5: Commit

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add backend/app/services/partido_service.py backend/tests/test_h2h.py
git commit -m "feat(h2h): add PartidoService.get_h2h()"
```
