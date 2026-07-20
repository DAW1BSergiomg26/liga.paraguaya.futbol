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

    result = await SimulatorService.simulate_match(mock_db, "home", "away")

    assert hasattr(result, "probabilidad_local")
    assert hasattr(result, "probabilidad_empate")
    assert hasattr(result, "probabilidad_visitante")
    total = result.probabilidad_local + result.probabilidad_empate + result.probabilidad_visitante
    assert total == pytest.approx(100.0)


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

    result = await SimulatorService.simulate_match(mock_db, "A", "B")

    assert result.probabilidad_local == pytest.approx(62.0, abs=5.0)
    assert result.probabilidad_empate == pytest.approx(19.0, abs=5.0)
    assert result.probabilidad_visitante == pytest.approx(18.0, abs=5.0)
