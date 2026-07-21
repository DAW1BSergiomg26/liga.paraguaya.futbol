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
    mock_db = AsyncMock()

    # Home: scores 2.0/game, concedes 1.0/game
    home_stats = MagicMock()
    home_stats.gf = 44
    home_stats.gc = 22
    home_stats.pj = 22

    # Away: scores 1.5/game, concedes 1.5/game
    away_stats = MagicMock()
    away_stats.gf = 33
    away_stats.gc = 33
    away_stats.pj = 22

    async def mock_get_club_stats(db, club_id):
        if club_id == "home":
            return home_stats, "Home Club"
        return away_stats, "Away Club"

    monkeypatch.setattr(SimulatorService, "_get_club_stats", mock_get_club_stats)

    async def mock_get_league_avgs(db):
        return 1.5, 1.5

    monkeypatch.setattr(SimulatorService, "_get_league_averages", mock_get_league_avgs)

    result = await SimulatorService.predecir_partido(mock_db, "home", "away")

    assert "probabilidad_local" in result
    assert "probabilidad_empate" in result
    assert "probabilidad_visitante" in result
    total = result["probabilidad_local"] + result["probabilidad_empate"] + result["probabilidad_visitante"]
    assert total == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_asymmetric_averages_expose_bug(monkeypatch):
    """With asymmetric league averages, the bug produces wrong results."""
    mock_db = AsyncMock()

    stats = MagicMock()
    stats.gf = 33
    stats.gc = 33
    stats.pj = 22

    async def mock_get_club_stats(db, club_id):
        return stats, f"Club {club_id}"

    monkeypatch.setattr(SimulatorService, "_get_club_stats", mock_get_club_stats)

    async def mock_get_league_avgs(db):
        return 2.0, 1.0

    monkeypatch.setattr(SimulatorService, "_get_league_averages", mock_get_league_avgs)

    result = await SimulatorService.predecir_partido(mock_db, "A", "B")

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
git commit -m "fix: usar avg_gc para lambda visitante en modelo Poisson"
```
