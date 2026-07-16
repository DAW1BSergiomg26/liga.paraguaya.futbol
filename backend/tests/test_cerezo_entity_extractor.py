import pytest
from backend.app.services.cerezo.entity_extractor import CerezoEntityExtractor


@pytest.mark.asyncio
async def test_extract_club_by_name():
    result = await CerezoEntityExtractor.extract("Datos de Olimpia", "club_info")
    assert "olimpia" in result["clubes"]


@pytest.mark.asyncio
async def test_extract_club_by_alias():
    result = await CerezoEntityExtractor.extract("Cómo le fue al Ciclón", "head_to_head")
    assert "cerro-porteno" in result["clubes"]


@pytest.mark.asyncio
async def test_extract_two_clubs():
    result = await CerezoEntityExtractor.extract("Olimpia vs Cerro Porteño", "match_result")
    assert "olimpia" in result["clubes"]
    assert "cerro-porteno" in result["clubes"]


@pytest.mark.asyncio
async def test_extract_fecha_keyword():
    result = await CerezoEntityExtractor.extract("Quién ganó el último partido", "match_result")
    assert result["fecha"] == "ultimo"


@pytest.mark.asyncio
async def test_extract_no_clubes():
    result = await CerezoEntityExtractor.extract("Cómo viene la tabla", "table_position")
    assert result["clubes"] == []


@pytest.mark.asyncio
async def test_extract_siguiente_keyword():
    result = await CerezoEntityExtractor.extract("Próximos partidos", "next_match")
    assert result["fecha"] == "proximo"


@pytest.mark.asyncio
async def test_extract_hoy_keyword():
    result = await CerezoEntityExtractor.extract("Partido de hoy", "match_result")
    assert result["fecha"] == "hoy"


@pytest.mark.asyncio
async def test_extract_copa_keyword():
    result = await CerezoEntityExtractor.extract("Copa Libertadores", "club_info")
    assert result["torneo"] is not None
