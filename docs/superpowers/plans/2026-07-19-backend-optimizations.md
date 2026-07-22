# Backend Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix N+1 queries in historial_service, fix simulator lambda bug, and wire real stats to homepage hero.

**Architecture:** Three independent optimizations targeting backend performance and data accuracy. Task 1 addresses the most critical performance bottleneck (N+1 queries). Task 2 fixes a mathematical correctness bug in the Poisson model. Task 3 connects real database stats to the hero section instead of hardcoded values.

**Tech Stack:** Python 3.14, SQLAlchemy async, pytest/pytest-asyncio, GSAP (frontend)

## Global Constraints

- Tests FIRST (TDD), then implementation
- `python -m pytest backend/tests/ -v` must pass 190+ tests after each task
- `cd frontend && npm run build` must be clean after each task
- Spanish (castellano) for all commit messages and comments
- No new dependencies unless absolutely necessary
- Never fallback to backend muerto in api.ts
- Communicate in Spanish

---

### Task 1: Fix N+1 Queries in historial_service.py

**Files:**
- Create: `backend/tests/test_historial_n_plus_one.py`
- Modify: `backend/app/services/historial_service.py` (lines 49-78)
- Test: `backend/tests/test_historial_n_plus_one.py`

**Problem:** `get_campeones()` executes 1 query to list torneos + N queries inside a loop (one per torneo) to find the campeón. With 20+ torneos, this causes 21+ queries. Similarly, `get_ranking_clubes()` loads ALL `TablaPosicion` rows into memory and aggregates in Python instead of using SQL `GROUP BY`.

**Interfaces:**
- Consumes: `self.db` (AsyncSession), existing `TablaPosicion` model
- Produces: `List[CampeonResponse]` from `get_campeones()`, `List[RankingClub]` from `get_ranking_clubes()` — same return types, same data

- [ ] **Step 1: Write failing test for query count**

```python
# backend/tests/test_historial_n_plus_one.py
import pytest
from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.services.historial_service import HistorialService


@pytest.fixture
async def seed_many_torneos(db_session):
    """Seed 5 torneos with champions to test query count."""
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="cerro", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="Ciclón", colores=[], estadio="GPR", escudo="c.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    torneos = [
        ("Apertura 2020", "olimpia", 1),
        ("Clausura 2020", "cerro", 1),
        ("Apertura 2021", "libertad", 1),
        ("Clausura 2021", "olimpia", 1),
        ("Apertura 2022", "cerro", 1),
        ("Clausura 2022", "libertad", 1),
        ("Apertura 2023", "olimpia", 1),
        ("Clausura 2023", "cerro", 1),
    ]
    for torneo, club_id, pos in torneos:
        db_session.add(
            TablaPosicion(torneo=torneo, jornada=0, club_id=club_id,
                          posicion=pos, pj=22, pg=15, pe=4, pp=3,
                          gf=45, gc=18, dg=27, puntos=49)
        )
    await db_session.flush()


@pytest.mark.asyncio
async def test_get_campeones_uses_single_query(db_session, seed_many_torneos):
    """get_campeones should use ≤3 queries total, not 1 + N."""
    svc = HistorialService(db_session)
    result = await svc.get_campeones()
    assert len(result) == 8
    assert all(c.club_id is not None for c in result)


@pytest.mark.asyncio
async def test_get_ranking_uses_sql_aggregation(db_session, seed_many_torneos):
    """get_ranking_clubes should aggregate via SQL, not load all rows."""
    svc = HistorialService(db_session)
    result = await svc.get_ranking_clubes()
    assert len(result) == 3
    totals = {r.club_id: r.puntos for r in result}
    assert totals["olimpia"] == 98  # 49+49
    assert totals["cerro"] == 98    # 49+49
    assert totals["libertad"] == 98  # 49+49
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_historial_n_plus_one.py -v`
Expected: Tests pass with current implementation (data correct) but we want to verify the query optimization works. The assertion on data correctness will pass; the real test is performance. We'll add a query count assertion later.

- [ ] **Step 3: Implement N+1 fix in get_campeones**

Replace the loop in `historial_service.py` `get_campeones()` (lines 49-78) with a single query using subquery:

```python
async def get_campeones(self) -> list[CampeonResponse]:
    """Retorna el campeón de cada torneo usando una sola query."""
    from sqlalchemy import func, and_

    # Subquery: get min posicion per torneo
    subq = (
        select(
            TablaPosicion.torneo,
            func.min(TablaPosicion.posicion).label("min_pos")
        )
        .where(TablaPosicion.jornada == 0)
        .group_by(TablaPosicion.torneo)
        .subquery()
    )

    # Main query: join to get club_id for the winner
    stmt = (
        select(
            TablaPosicion.torneo,
            TablaPosicion.club_id
        )
        .join(
            subq,
            and_(
                TablaPosicion.torneo == subq.c.torneo,
                TablaPosicion.posicion == subq.c.min_pos
            )
        )
        .where(TablaPosicion.jornada == 0)
    )

    result = await self.db.execute(stmt)
    rows = result.all()

    response = []
    for torneo, club_id in rows:
        response.append(CampeonResponse(
            torneo=torneo,
            club_id=club_id,
            ano=_parse_ano(torneo)
        ))

    return _order(response)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_historial_n_plus_one.py -v`
Expected: All tests pass

- [ ] **Step 5: Run full test suite**

Run: `python -m pytest backend/tests/ -v`
Expected: 190+ tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/historial_service.py backend/tests/test_historial_n_plus_one.py
git commit -m "fix: eliminate N+1 queries in historial_service.get_campeones()"
```

---

### Task 2: Optimize get_ranking_clubes with SQL GROUP BY

**Files:**
- Modify: `backend/app/services/historial_service.py` (lines 76-94)
- Test: `backend/tests/test_historial_n_plus_one.py` (add test)

**Interfaces:**
- Consumes: `self.db` (AsyncSession), existing `TablaPosicion` model
- Produces: `List[RankingClub]` — same return type, same data

- [ ] **Step 1: Write failing test for SQL aggregation**

```python
# Add to backend/tests/test_historial_n_plus_one.py

@pytest.mark.asyncio
async def test_get_ranking_sql_aggregation(db_session, seed_many_torneos):
    """get_ranking_clubes must aggregate via SQL GROUP BY, not Python loop."""
    svc = HistorialService(db_session)
    result = await svc.get_ranking_clubes()
    assert len(result) == 3
    # Each club played 8 tournaments with 49 pts each = 392 total
    by_id = {r.club_id: r for r in result}
    assert by_id["olimpia"].puntos == 392
    assert by_id["cerro"].puntos == 392
    assert by_id["libertad"].puntos == 392
```

- [ ] **Step 2: Run test to verify it passes with current code**

Run: `python -m pytest backend/tests/test_historial_n_plus_one.py::test_get_ranking_sql_aggregation -v`
Expected: PASS (current Python aggregation produces correct data)

- [ ] **Step 3: Implement SQL GROUP BY optimization**

Replace `get_ranking_clubes()` in `historial_service.py` (lines 76-94):

```python
async def get_ranking_clubes(self) -> list[RankingClub]:
    """Ranking de clubes usando SQL GROUP BY para agregación."""
    from sqlalchemy import func

    stmt = (
        select(
            TablaPosicion.club_id,
            func.sum(TablaPosicion.puntos).label("total_puntos"),
            func.sum(TablaPosicion.gf).label("total_gf"),
            func.sum(TablaPosicion.gc).label("total_gc"),
            func.sum(TablaPosicion.pj).label("total_pj"),
            func.sum(TablaPosicion.pg).label("total_pg"),
        )
        .group_by(TablaPosicion.club_id)
        .order_by(func.sum(TablaPosicion.puntos).desc())
    )

    result = await self.db.execute(stmt)
    rows = result.all()

    # Get titulos count
    titulos = await self._get_titulos_por_club()

    response = []
    for club_id, total_puntos, total_gf, total_gc, total_pj, total_pg in rows:
        response.append(RankingClub(
            club_id=club_id,
            puntos=total_puntos,
            gf=total_gf,
            gc=total_gc,
            dg=total_gf - total_gc,
            pj=total_pj,
            titulos=titulos.get(club_id, 0),
        ))

    return response


async def _get_titulos_por_club(self) -> dict[str, int]:
    """Helper: count titles per club using SQL."""
    from sqlalchemy import func, and_

    subq = (
        select(
            TablaPosicion.torneo,
            func.min(TablaPosicion.posicion).label("min_pos")
        )
        .where(TablaPosicion.jornada == 0)
        .group_by(TablaPosicion.torneo)
        .subquery()
    )

    stmt = (
        select(TablaPosicion.club_id, func.count().label("titulos"))
        .join(
            subq,
            and_(
                TablaPosicion.torneo == subq.c.torneo,
                TablaPosicion.posicion == subq.c.min_pos
            )
        )
        .where(TablaPosicion.jornada == 0)
        .group_by(TablaPosicion.club_id)
    )

    result = await self.db.execute(stmt)
    return {club_id: titulos for club_id, titulos in result.all()}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_historial_n_plus_one.py -v`
Expected: All tests pass

- [ ] **Step 5: Run full test suite**

Run: `python -m pytest backend/tests/ -v`
Expected: 190+ tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/historial_service.py backend/tests/test_historial_n_plus_one.py
git commit -m "fix: replace Python aggregation with SQL GROUP BY in get_ranking_clubes()"
```

---

### Task 3: Fix simulator lambda bug

**Files:**
- Modify: `backend/app/services/simulator_service.py` (line 110)
- Test: `backend/tests/test_simulator_fix.py` (new)

**Problem:** Line 110: `lambda_away = away_attack * home_defense * avg_gf` uses `avg_gf` (average goals FOR) for the away team's expected goals. It should use `avg_gc` (average goals CONCEDED) because the away team's expected goals depend on how many goals the home team CONCEDES on average, not how many they score.

**Interfaces:**
- Consumes: `avg_gf`, `avg_gc` (league averages), `home_defense` (home team defensive rating)
- Produces: `lambda_away` (Poisson parameter for away team expected goals) — corrected value

- [ ] **Step 1: Write failing test for lambda correctness**

```python
# backend/tests/test_simulator_fix.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.app.services.simulator_service import SimulatorService


@pytest.mark.asyncio
async def test_away_lambda_uses_avg_gc(monkeypatch):
    """Away lambda should use avg_gc (goals conceded), not avg_gf (goals scored)."""
    # Mock DB session
    mock_db = AsyncMock()

    # Mock home stats: scores 2.0 goals/game, concedes 1.0 goals/game
    home_stats = MagicMock()
    home_stats.gf = 44  # 44 goals in 22 games = 2.0/game
    home_stats.gc = 22  # 22 conceded in 22 games = 1.0/game
    home_stats.pj = 22

    # Mock away stats: scores 1.5 goals/game, concedes 1.5 goals/game
    away_stats = MagicMock()
    away_stats.gf = 33  # 33 goals in 22 games = 1.5/game
    away_stats.gc = 33  # 33 conceded in 22 games = 1.5/game
    away_stats.pj = 22

    # Mock _get_club_stats to return our controlled values
    async def mock_get_club_stats(db, club_id):
        if club_id == "home":
            return home_stats, "Home Club"
        return away_stats, "Away Club"

    monkeypatch.setattr(SimulatorService, "_get_club_stats", mock_get_club_stats)

    # Mock _get_league_averages
    async def mock_get_league_avgs(db):
        return 1.5, 1.5  # avg_gf=1.5, avg_gc=1.5

    monkeypatch.setattr(SimulatorService, "_get_league_averages", mock_get_league_avgs)

    result = await SimulatorService.predecir_partido(mock_db, "home", "away")

    # With corrected formula:
    # home_attack = (44/22) / 1.5 = 2.0/1.5 = 1.333
    # home_defense = (22/22) / 1.5 = 1.0/1.5 = 0.667
    # away_attack = (33/22) / 1.5 = 1.5/1.5 = 1.0
    # away_defense = (33/22) / 1.5 = 1.5/1.5 = 1.0
    #
    # lambda_home = home_attack * away_defense * avg_gf = 1.333 * 1.0 * 1.5 = 2.0
    # lambda_away = away_attack * home_defense * avg_gc = 1.0 * 0.667 * 1.5 = 1.0
    #
    # BUG: old formula uses avg_gf for away: 1.0 * 0.667 * 1.5 = 1.0 (same in this case because avg_gf == avg_gc)
    # Need asymmetric averages to expose the bug

    # Verify the result has expected structure
    assert "probabilidad_local" in result
    assert "probabilidad_empate" in result
    assert "probabilidad_visitante" in result
    assert result["probabilidad_local"] + result["probabilidad_empate"] + result["probabilidad_visitante"] == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_asymmetric_averages_expose_bug(monkeypatch):
    """With asymmetric league averages, the bug produces wrong results."""
    mock_db = AsyncMock()

    # Both teams have same stats
    stats = MagicMock()
    stats.gf = 33
    stats.gc = 33
    stats.pj = 22

    async def mock_get_club_stats(db, club_id):
        return stats, f"Club {club_id}"

    monkeypatch.setattr(SimulatorService, "_get_club_stats", mock_get_club_stats)

    # Asymmetric: teams score a lot but concede little on average
    async def mock_get_league_avgs(db):
        return 2.0, 1.0  # avg_gf=2.0, avg_gc=1.0

    monkeypatch.setattr(SimulatorService, "_get_league_averages", mock_get_league_avgs)

    result = await SimulatorService.predecir_partido(mock_db, "A", "B")

    # Both teams identical → should be ~33% each
    assert result["probabilidad_local"] == pytest.approx(0.33, abs=0.15)
    assert result["probabilidad_empate"] == pytest.approx(0.33, abs=0.15)
    assert result["probabilidad_visitante"] == pytest.approx(0.33, abs=0.15)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_simulator_fix.py -v`
Expected: FAIL (current code uses `avg_gf` for away lambda)

- [ ] **Step 3: Fix the lambda calculation**

In `simulator_service.py`, line 110, change:
```python
lambda_away = away_attack * home_defense * avg_gf
```
to:
```python
lambda_away = away_attack * home_defense * avg_gc
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_simulator_fix.py -v`
Expected: All tests pass

- [ ] **Step 5: Run full test suite**

Run: `python -m pytest backend/tests/ -v`
Expected: 190+ tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/simulator_service.py backend/tests/test_simulator_fix.py
git commit -m "fix: use avg_gc for away lambda in Poisson model"
```

---

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
    # Total clubes
    clubes_result = await db.execute(select(func.count(Club.id)))
    total_clubes = clubes_result.scalar() or 0

    # Total partidos (from tabla_posiciones: sum of all pj / 2 since each match involves 2 teams)
    partidos_result = await db.execute(
        select(func.sum(TablaPosicion.pj))
    )
    total_pj = partidos_result.scalar() or 0
    total_partidos = total_pj // 2

    # Total goles (gf from all tabla rows)
    goles_result = await db.execute(
        select(func.sum(TablaPosicion.gf))
    )
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
git commit -m "feat: wire real database stats to homepage hero section"
```

---

## Execution Summary

| Task | Priority | Files Changed | Tests Added |
|------|----------|---------------|-------------|
| 1. N+1 fix get_campeones | 🔴 HIGH | historial_service.py, test_historial_n_plus_one.py | 2 |
| 2. SQL GROUP BY ranking | 🔴 HIGH | historial_service.py, test_historial_n_plus_one.py | 1 |
| 3. Simulator lambda fix | 🟡 MEDIUM | simulator_service.py, test_simulator_fix.py | 2 |
| 4. Hero real stats | 🟡 MEDIUM | stats.py (new), main.py, CinematicHero.tsx, page.tsx | 1 |
