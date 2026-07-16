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


@pytest.mark.asyncio
async def test_fetch_club_comparison(db_session):
    await seed_test_data(db_session)
    result = await CerezoDataFetcher.fetch(
        "club_comparison", {"clubes": ["olimpia", "cerro-porteno"], "fecha": None, "torneo": None}, db_session
    )
    assert result is not None
    assert "club_a" in result
    assert "club_b" in result
    assert result["club_a"]["nombre"] == "Club Olimpia"
    assert result["club_b"]["nombre"] == "Club Cerro Porteño"


@pytest.mark.asyncio
async def test_fetch_next_match(db_session):
    await seed_test_data(db_session)
    result = await CerezoDataFetcher.fetch(
        "next_match", {"clubes": ["olimpia"], "fecha": "proximo", "torneo": None}, db_session
    )
    assert result is not None
    assert "proximos" in result
    assert len(result["proximos"]) > 0
    assert result["proximos"][0]["torneo"] == "Apertura 2026"


@pytest.mark.asyncio
async def test_fetch_match_result_form(db_session):
    await seed_test_data(db_session)
    result = await CerezoDataFetcher.fetch(
        "match_result", {"clubes": ["olimpia"], "fecha": None, "torneo": None}, db_session
    )
    assert result is not None
    assert "forma" in result
    assert "wins" in result["forma"]
    assert "draws" in result["forma"]
    assert "losses" in result["forma"]
