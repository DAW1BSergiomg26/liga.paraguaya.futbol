import pytest
from backend.app.services.cerezo.classifier import CerezoIntentClassifier


@pytest.mark.asyncio
async def test_classify_greeting():
    result = await CerezoIntentClassifier.classify("Hola Cerezo")
    assert result["intent"] == "greeting"
    assert result["confidence"] >= 0.5


@pytest.mark.asyncio
async def test_classify_club_info():
    result = await CerezoIntentClassifier.classify("Datos de Olimpia")
    assert result["intent"] == "club_info"
    assert result["confidence"] >= 0.5


@pytest.mark.asyncio
async def test_classify_table_position():
    result = await CerezoIntentClassifier.classify("Cómo viene la tabla")
    assert result["intent"] == "table_position"


@pytest.mark.asyncio
async def test_classify_prediction():
    result = await CerezoIntentClassifier.classify("Quién gana el próximo partido")
    assert result["intent"] == "prediction"


@pytest.mark.asyncio
async def test_classify_unknown():
    result = await CerezoIntentClassifier.classify("xyzzy flurbo garplax")
    assert result["intent"] == "unknown"
