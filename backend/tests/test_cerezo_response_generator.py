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


@pytest.mark.asyncio
async def test_generate_club_comparison():
    data = {
        "club_a": {"nombre": "Club Olimpia", "fundacion": 1902, "titulos_liga": 46, "titulos_internacionales": [{"torneo": "Copa Libertadores", "cantidad": 3}]},
        "club_b": {"nombre": "Club Cerro Porteño", "fundacion": 1912, "titulos_liga": 34, "titulos_internacionales": []},
        "comparison": {"ventaja_ligas": 12, "total_intl_a": 1, "total_intl_b": 0, "ventaja_intl": 1, "a_mas_viejo": True},
    }
    answer = await CerezoResponseGenerator.generate("club_comparison", data, None, "Quién tiene más títulos")
    assert isinstance(answer, str)
    assert len(answer) > 0
    assert "Olimpia" in answer
    assert "Cerro" in answer


@pytest.mark.asyncio
async def test_generate_next_match():
    data = {
        "proximos": [
            {"fecha": "2026-02-15", "torneo": "Apertura 2026", "es_local": True, "rival_nombre": "Club Libertad", "local_id": "olimpia", "visitante_id": "libertad"},
        ]
    }
    answer = await CerezoResponseGenerator.generate("next_match", data, None, "Cuándo juega Olimpia")
    assert isinstance(answer, str)
    assert len(answer) > 0
    assert "fecha" in answer.lower() or "juega" in answer.lower() or "contra" in answer.lower()


@pytest.mark.asyncio
async def test_generate_match_result_form():
    data = {"partidos": [], "forma": {"wins": 3, "draws": 1, "losses": 1, "total": 5}}
    answer = await CerezoResponseGenerator.generate("match_result", data, None, "Últimos resultados")
    assert isinstance(answer, str)
    assert len(answer) > 0
    assert "3" in answer
