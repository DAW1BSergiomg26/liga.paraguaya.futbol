# Task 3: DataFetcher

## Files
- Create: `backend/app/services/cerezo/data_fetcher.py`
- Create: `backend/tests/test_cerezo_data_fetcher.py`

## Interface
- `CerezoDataFetcher.fetch(intent: str, entities: dict, db: AsyncSession) -> dict`
  - Returns data relevant to the intent (club detail, match results, table, etc.)
- Consumes: ClubService, PartidoService, TablaService

## Test Code

```python
import pytest
from backend.app.services.cerezo.data_fetcher import CerezoDataFetcher
from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_fetch_club_info(db_session):
    await seed_test_data(db_session)
    result = await CerezoDataFetcher.fetch(
        "club_info", {"clubes": ["olimpia"], "fecha": None, "torneo": None}, db_session
    )
    assert result is not None
    assert result.get("club") is not None
    assert result["club"]["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_fetch_table_position(db_session):
    await seed_test_data(db_session)
    result = await CerezoDataFetcher.fetch(
        "table_position", {"clubes": [], "fecha": None, "torneo": None}, db_session
    )
    assert result is not None
    assert "tabla" in result


@pytest.mark.asyncio
async def test_fetch_unknown_intent(db_session):
    result = await CerezoDataFetcher.fetch(
        "greeting", {"clubes": [], "fecha": None, "torneo": None}, db_session
    )
    assert result == {}
```

## Implementation

**IMPORTANT CORRECTIONS to the plan:**
1. `TablaService` has `get_table()`, NOT `get_all()`.
2. All services use `@staticmethod` — call them as `ClubService.get_by_id(db, id)`, NOT `ClubService().get_by_id(db, id)`.
3. `PartidoService.get_all(db)` returns `list[PartidoOut]` which has `.model_dump()` method.

```python
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.club_service import ClubService
from backend.app.services.partido_service import PartidoService
from backend.app.services.tabla_service import TablaService


class CerezoDataFetcher:

    @staticmethod
    async def fetch(intent: str, entities: dict, db: AsyncSession) -> dict:
        if intent == "club_info" and entities.get("clubes"):
            club_id = entities["clubes"][0]
            club = await ClubService.get_by_id(db, club_id)
            return {"club": club.model_dump() if club else None}

        if intent == "match_result" and entities.get("clubes"):
            clubes = entities["clubes"]
            local_id = clubes[0]
            visitante_id = clubes[1] if len(clubes) > 1 else None
            partidos = await PartidoService.get_all(db)
            matches = [
                p.model_dump() for p in partidos
                if (p.local_id == local_id or p.visitante_id == local_id)
            ]
            return {"partidos": matches}

        if intent == "head_to_head" and len(entities.get("clubes", [])) >= 2:
            club_a, club_b = entities["clubes"][0], entities["clubes"][1]
            partidos = await PartidoService.get_all(db)
            h2h = [
                p.model_dump() for p in partidos
                if (p.local_id == club_a and p.visitante_id == club_b)
                or (p.local_id == club_b and p.visitante_id == club_a)
            ]
            return {"head_to_head": h2h}

        if intent == "table_position":
            tabla = await TablaService.get_table(db)
            return {"tabla": [t.model_dump() for t in tabla]}

        if intent == "prediction" and entities.get("clubes"):
            clubes_ids = entities["clubes"]
            partidos = await PartidoService.get_all(db)
            upcoming = [
                p for p in partidos
                if p.estado == "programado"
                and (not clubes_ids or p.local_id in clubes_ids or p.visitante_id in clubes_ids)
            ]
            return {"proximos": [p.model_dump() for p in upcoming]}

        return {}
```

## Steps

1. Write test file
2. Run: `cd backend && $env:PYTHONPATH=".." && python -m pytest tests/test_cerezo_data_fetcher.py -v`
   Expected: FAIL (module not found)
3. Write implementation (use the corrected code above)
4. Run test again — Expected: 3 PASS
5. Commit:
```bash
git add backend/app/services/cerezo/data_fetcher.py backend/tests/test_cerezo_data_fetcher.py
git commit -m "feat: Cerezo DataFetcher — integrate club/partido/tabla services"
```
