### Task 1: Backend service method + endpoint + tests

**Files:**
- Modify: `backend/app/services/partido_service.py` (add `get_en_vivo`)
- Modify: `backend/app/api/partidos.py` (add `GET /marcadores`)
- Create: `backend/tests/test_marcadores.py`

**Interfaces:**
- Consumes: `Partido` model with `estado`, `goles_local`, `goles_visitante`, `fecha`, `id` fields
- Produces: `PartidoService.get_en_vivo(db) -> list[Partido]` (scalar list, raw ORM objects), `GET /api/v1/partidos/marcadores -> dict[str, MarcadorOut]`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_marcadores.py`:

```python
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timezone

from backend.app.services.partido_service import PartidoService


class TestMarcadorEndpoint:
    @pytest.mark.asyncio
    async def test_marcadores_empty_when_no_en_vivo(self, client: AsyncClient):
        resp = await client.get("/api/v1/partidos/marcadores")
        assert resp.status_code == 200
        assert resp.json() == {}


class TestGetEnVivo:
    @pytest.mark.asyncio
    async def test_get_en_vivo_empty(self):
        db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=mock_result)

        result = await PartidoService.get_en_vivo(db)
        assert result == []

    @pytest.mark.asyncio
    async def test_get_en_vivo_filters_only_en_vivo(self):
        from backend.app.models.partido import Partido

        db = AsyncMock(spec=AsyncSession)
        live = MagicMock(spec=Partido, id="p1", estado="en_vivo", goles_local=1, goles_visitante=0,
                         fecha=date.today())
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [live]
        db.execute = AsyncMock(return_value=mock_result)

        result = await PartidoService.get_en_vivo(db)
        assert len(result) == 1
        assert result[0].id == "p1"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && $env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_marcadores.py -v`
Expected: FAIL with "PartidoService has no attribute 'get_en_vivo'"

- [ ] **Step 3: Write minimal implementation**

Add `get_en_vivo` to `PartidoService` in `backend/app/services/partido_service.py` before `get_h2h`:

```python
@staticmethod
async def get_en_vivo(db: AsyncSession) -> list[Partido]:
    stmt = select(Partido).where(Partido.estado == "en_vivo")
    result = await db.execute(stmt)
    return list(result.scalars().all())
```

Add to `backend/app/api/partidos.py` before `h2h_partidos`:

```python
@router.get("/marcadores")
async def marcadores_en_vivo(db: AsyncSession = Depends(get_db)):
    partidos = await PartidoService.get_en_vivo(db)
    now = datetime.now(timezone.utc)
    result = {}
    for p in partidos:
        minuto = 0
        if isinstance(p.fecha, date):
            match_start = datetime.combine(p.fecha, datetime.min.time(), tzinfo=timezone.utc)
            delta = now - match_start
            minuto = min(max(int(delta.total_seconds() // 60), 0), 120)
        result[p.id] = MarcadorOut(
            goles_local=p.goles_local,
            goles_visitante=p.goles_visitante,
            minuto=minuto,
        )
    return result
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && $env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest tests/test_marcadores.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/partido_service.py backend/app/api/partidos.py backend/tests/test_marcadores.py
git commit -m "feat: add GET /api/v1/partidos/marcadores batch endpoint"
```
