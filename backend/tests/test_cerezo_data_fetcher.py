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
