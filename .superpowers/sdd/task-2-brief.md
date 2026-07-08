# Task 2: EntityExtractor

## Files
- Create: `backend/app/services/cerezo/entity_extractor.py`
- Create: `backend/tests/test_cerezo_entity_extractor.py`

## Interface
- `CerezoEntityExtractor.extract(text: str, intent: str) -> dict`
  - Returns: `{ clubes: list[str], fecha: str | None, torneo: str | None }`

## Test Code

```python
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
```

## Implementation

```python
_CLUB_ALIASES: dict[str, str] = {
    "olimpia": "olimpia",
    "el decano": "olimpia",
    "decano": "olimpia",
    "cerro porteño": "cerro-porteno",
    "cerro porteno": "cerro-porteno",
    "cerro": "cerro-porteno",
    "el ciclón": "cerro-porteno",
    "el ciclon": "cerro-porteno",
    "ciclón": "cerro-porteno",
    "ciclon": "cerro-porteno",
    "libertad": "libertad",
    "gumarelo": "libertad",
    "guaraní": "guarani",
    "guarani": "guarani",
    "el aborigen": "guarani",
    "aborigen": "guarani",
    "nacional": "nacional",
    "tricolor": "nacional",
    "sol de américa": "sol-de-america",
    "sol de america": "sol-de-america",
    "sol": "sol-de-america",
    "luqueño": "sportivo-luqueno",
    "sportivo luqueño": "sportivo-luqueno",
    "sportivo luqueno": "sportivo-luqueno",
    "luque": "sportivo-luqueno",
    "capiatá": "deportivo-capiat",
    "deportivo capiatá": "deportivo-capiat",
    "tacuary": "tacuary",
    "tacua": "tacuary",
}

_FECHA_KEYWORDS: dict[str, str] = {
    "último": "ultimo",
    "ultimo": "ultimo",
    "última": "ultimo",
    "ultima": "ultimo",
    "próximo": "proximo",
    "proximo": "proximo",
    "próxima": "proximo",
    "proxima": "proximo",
    "ayer": "ayer",
    "pasado": "ultimo",
    "anterior": "ultimo",
}


class CerezoEntityExtractor:

    @staticmethod
    async def extract(text: str, intent: str) -> dict:
        text_lower = text.lower()
        clubes = []
        for alias, club_id in _CLUB_ALIASES.items():
            if alias in text_lower and club_id not in clubes:
                clubes.append(club_id)

        fecha = None
        for keyword, value in _FECHA_KEYWORDS.items():
            if keyword in text_lower:
                fecha = value
                break

        torneo = None
        for t in ["apertura", "clausura"]:
            if t in text_lower:
                import re
                match = re.search(rf"{t}\s*(\d{{4}})?", text_lower)
                if match:
                    year = match.group(1) or ""
                    torneo = f"{t.capitalize()} {year}".strip()

        return {"clubes": clubes, "fecha": fecha, "torneo": torneo}
```

## Steps

1. Write the test file
2. Run: `cd backend && $env:PYTHONPATH=".." && python -m pytest tests/test_cerezo_entity_extractor.py -v`
   Expected: FAIL (module not found)
3. Write the implementation
4. Run test again — Expected: 5 PASS
5. Commit:
```bash
git add backend/app/services/cerezo/entity_extractor.py backend/tests/test_cerezo_entity_extractor.py
git commit -m "feat: Cerezo EntityExtractor — club alias matching + fecha parsing"
```
