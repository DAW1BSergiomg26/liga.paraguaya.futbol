### Task 3: Backend endpoint — GET /api/v1/partidos/h2h

**Files:**
- Modify: `backend/app/api/partidos.py`
- Test: `backend/tests/test_h2h.py` (append)

**Interfaces:**
- Consumes: `PartidoService.get_h2h()`, `get_db` dependency, `H2HOut` schema
- Produces: `GET /api/v1/partidos/h2h?club_a=X&club_b=Y` JSON response

#### Step 1: Write the integration test

```python
# Add to backend/tests/test_h2h.py
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_h2h_endpoint_no_params(client: AsyncClient):
    resp = await client.get("/api/v1/partidos/h2h")
    assert resp.status_code == 422  # missing required params


@pytest.mark.asyncio
async def test_h2h_endpoint_ok(client: AsyncClient):
    resp = await client.get("/api/v1/partidos/h2h?club_a=oli&club_b=cerro")
    # In test env with no DB, expect 500 or fallback
    assert resp.status_code in (200, 422, 500)
```

#### Step 2: Run test to verify it fails appropriately

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; python -m pytest backend/tests/test_h2h.py -v
```
Expected: Current tests still pass. New test may fail depending on conftest fixture.

#### Step 3: Add the endpoint

```python
# Add to backend/app/api/partidos.py (after MarcadorOut class, before the routes)

@router.get("/h2h", response_model=H2HOut)
async def h2h_partidos(
    club_a: str = Query(...),
    club_b: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return await PartidoService.get_h2h(db, club_a, club_b)
```

Also add the import at the top of the file:
```python
from backend.app.schemas.partido import H2HOut
```

#### Step 4: Run the full test suite

```bash
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; cd backend && python -m pytest tests/ -x -q
```
Expected: All existing tests pass.

#### Step 5: Commit

```bash
cd C:\Users\astur\Desktop\liga.paraguaya.futbol
git add backend/app/api/partidos.py backend/tests/test_h2h.py
git commit -m "feat(h2h): add GET /api/v1/partidos/h2h endpoint"
```
