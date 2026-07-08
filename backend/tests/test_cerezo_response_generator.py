import pytest
from backend.app.services.cerezo.response_generator import CerezoResponseGenerator


@pytest.mark.asyncio
async def test_generate_greeting():
    answer = await CerezoResponseGenerator.generate("greeting", {}, None, "Hola")
    assert isinstance(answer, str)
    assert len(answer) > 0


@pytest.mark.asyncio
async def test_generate_club_info():
    data = {
        "club": {
            "nombre": "Club Olimpia",
            "fundacion": "1902",
            "titulos_liga": 46,
            "titulos_internacionales": [{"torneo": "Copa Libertadores", "cantidad": 3}],
        }
    }
    answer = await CerezoResponseGenerator.generate("club_info", data, None, "Datos de Olimpia")
    assert "Olimpia" in answer
    assert "46" in answer or "1902" in answer


@pytest.mark.asyncio
async def test_generate_prediction():
    data = {"proximos": [{"local_id": "olimpia", "visitante_id": "cerro-porteno"}]}
    prediction = {"local_win_pct": 55.0, "draw_pct": 25.0, "visitor_win_pct": 20.0, "confidence": "media"}
    answer = await CerezoResponseGenerator.generate("prediction", data, prediction, "Quién gana")
    assert isinstance(answer, str)
    assert len(answer) > 0
