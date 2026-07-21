### Task 4: Wire real stats to homepage hero

**Files:**
- Modify: `frontend/src/app/page.tsx` (pass stats to CinematicHero)
- Modify: `frontend/src/components/hero/CinematicHero.tsx` (accept props, remove hardcoded values)
- Modify: `frontend/src/components/HeroStats.tsx` (accept dynamic values)
- Create: `backend/app/api/stats.py` (new endpoint for global stats)
- Modify: `backend/app/main.py` (register new router)

**Problem:** The hero section shows hardcoded stats (348 PARTIDOS, 892 GOLES, 19 EQUIPOS) instead of real data from the database.

**Interfaces:**
- Backend produces: `GET /api/v1/stats/global` → `{ total_partidos: int, total_goles: int, total_clubes: int }`
- Frontend consumes: `CinematicHeroProps` with `stats: { partidos: number, goles: number, clubes: number }`

- [ ] **Step 1: Write failing test for stats endpoint**

```python
# backend/tests/test_stats_endpoint.py
import pytest


@pytest.mark.asyncio
async def test_stats_global_returns_200(client):
    resp = await client.get("/api/v1/stats/global")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_partidos" in data
    assert "total_goles" in data
    assert "total_clubes" in data
    assert isinstance(data["total_partidos"], int)
    assert isinstance(data["total_goles"], int)
    assert isinstance(data["total_clubes"], int)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_stats_endpoint.py -v`
Expected: FAIL (endpoint doesn't exist)

- [ ] **Step 3: Create stats endpoint**

```python
# backend/app/api/stats.py
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion

router = APIRouter()


@router.get("/global")
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    """Retorna estadísticas globales para el hero."""
    clubes_result = await db.execute(select(func.count(Club.id)))
    total_clubes = clubes_result.scalar() or 0

    partidos_result = await db.execute(select(func.sum(TablaPosicion.pj)))
    total_pj = partidos_result.scalar() or 0
    total_partidos = total_pj // 2

    goles_result = await db.execute(select(func.sum(TablaPosicion.gf)))
    total_goles = goles_result.scalar() or 0

    return {
        "total_partidos": total_partidos,
        "total_goles": total_goles,
        "total_clubes": total_clubes,
    }
```

- [ ] **Step 4: Register router in main.py**

Add to `backend/app/main.py`:
```python
from backend.app.api.stats import router as stats_router
app.include_router(stats_router, prefix="/api/v1/stats", tags=["stats"])
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_stats_endpoint.py -v`
Expected: PASS

- [ ] **Step 6: Run full test suite**

Run: `python -m pytest backend/tests/ -v`
Expected: 190+ tests pass

- [ ] **Step 7: Update CinematicHero to accept stats props**

```typescript
// frontend/src/components/hero/CinematicHero.tsx
// Add to interface:
interface CinematicHeroProps {
  stats?: {
    partidos: number;
    goles: number;
    clubes: number;
  };
}

// Replace hardcoded values:
const statsItems = [
  { value: stats?.partidos ?? 348, label: 'PARTIDOS', suffix: '+' },
  { value: stats?.goles ?? 892, label: 'GOLES', suffix: '+' },
  { value: stats?.clubes ?? 19, label: 'EQUIPOS', suffix: '' },
];
```

- [ ] **Step 8: Update page.tsx to fetch and pass stats**

```typescript
// frontend/src/app/page.tsx
// Add to the parallel fetch:
const [clubes, partidos, torneos, stats] = await Promise.all([
  safeFetch<Club[]>('/api/v1/clubes'),
  safeFetch<Partido[]>('/api/v1/partidos'),
  safeFetch<Torneo[]>('/api/v1/torneos'),
  safeFetch<{ total_partidos: number; total_goles: number; total_clubes: number }>('/api/v1/stats/global'),
]);

// Pass to CinematicHero:
<CinematicHero
  stats={{
    partidos: stats?.total_partidos ?? 348,
    goles: stats?.total_goles ?? 892,
    clubes: stats?.total_clubes ?? 19,
  }}
/>
```

- [ ] **Step 9: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Clean build

- [ ] **Step 10: Run full test suite again**

Run: `python -m pytest backend/tests/ -v`
Expected: 190+ tests pass

- [ ] **Step 11: Commit**

```bash
git add backend/app/api/stats.py backend/app/main.py backend/tests/test_stats_endpoint.py frontend/src/components/hero/CinematicHero.tsx frontend/src/app/page.tsx
git commit -m "feat: conectar estadísticas reales de la base de datos al hero de la homepage"
```
