import pytest
from backend.app.services.cerezo.prediction_engine import CerezoPredictionEngine
from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_predict_with_entities(db_session):
    await seed_test_data(db_session)
    result = await CerezoPredictionEngine.predict(
        db_session, {"clubes": ["olimpia", "cerro-porteno"], "fecha": None, "torneo": None}
    )
    assert "local_win_pct" in result
    assert "draw_pct" in result
    assert "visitor_win_pct" in result
    assert result["confidence"] in ("alta", "media", "baja")


@pytest.mark.asyncio
async def test_predict_no_data_returns_low_confidence(db_session):
    result = await CerezoPredictionEngine.predict(
        db_session, {"clubes": ["olimpia"], "fecha": None, "torneo": None}
    )
    assert result["confidence"] == "baja"


@pytest.mark.asyncio
async def test_predict_sums_to_100(db_session):
    await seed_test_data(db_session)
    result = await CerezoPredictionEngine.predict(
        db_session, {"clubes": ["olimpia", "cerro-porteno"], "fecha": None, "torneo": None}
    )
    total = result["local_win_pct"] + result["draw_pct"] + result["visitor_win_pct"]
    assert abs(total - 100) < 1
