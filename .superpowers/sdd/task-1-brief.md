# Task 1: IntentClassifier

## Files
- Create: `backend/app/services/cerezo/__init__.py` (empty)
- Create: `backend/app/services/cerezo/classifier.py`
- Create: `backend/tests/test_cerezo_classifier.py`

## Interface
- `CerezoIntentClassifier.classify(message: str) -> dict`
  - Returns `{ intent: str, confidence: float, entities: dict }`
  - intent is one of: club_info, match_result, head_to_head, table_position, prediction, top_scorer, greeting, unknown
  - confidence is 0.0–1.0

## Test Code

```python
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
```

## Implementation

**Important:** There is NO ONNX embedding infrastructure in this project. Use a **keyword-based classifier** instead. Each intent has a list of trigger keywords. Score by counting keyword matches per intent.

```python
_KEYWORDS: dict[str, list[str]] = {
    "club_info": ["datos", "información", "informacion", "cómo es", "como es", "historia", "detalles", "informacion del club"],
    "match_result": ["ganó", "gano", "resultado", "cómo quedó", "como quedo", "último partido", "ultimo partido", "último clásico", "ultimo clasico"],
    "head_to_head": ["historial", "cómo le fue", "como le fue", "contra", "versus", "enfrentaron", "clásicos", "clasicos"],
    "table_position": ["tabla", "posiciones", "lidera", "posición", "posicion", "campeonato"],
    "prediction": ["gana", "próximo", "proximo", "predicción", "prediccion", "pronóstico", "pronostico", "va a ganar"],
    "top_scorer": ["goleador", "artillero", "máximo", "maximo", "goleadores"],
    "greeting": ["hola", "buenas", "buen", "cómo estás", "como estas", "buen día", "buen dia", "qué tal", "que tal"],
}


class CerezoIntentClassifier:

    @staticmethod
    async def classify(message: str) -> dict:
        text_lower = message.lower()
        scores: dict[str, int] = {}
        for intent, keywords in _KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in text_lower)
            if count > 0:
                scores[intent] = count

        if not scores:
            return {"intent": "unknown", "confidence": 0.0, "entities": {}}

        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]

        confidence = min(round(best_score * 0.35, 4), 0.95)

        return {"intent": best_intent, "confidence": confidence, "entities": {}}
```

The confidence formula ensures:
- 1 match → confidence ≈ 0.35 < 0.5 ❌
- 2 matches → confidence ≈ 0.7 ≥ 0.5 ✓
- 3+ matches → caps at 0.95

Wait — test_classify_greeting expects confidence >= 0.5 for "Hola Cerezo" which has only 1 keyword match ("hola"). So we need a higher base confidence.

Let me use a formula that gives >= 0.5 for a single match:
- 1 match → 0.55
- 2 matches → 0.75
- 3+ matches → 0.9

```python
confidence_map = {1: 0.55, 2: 0.75, 3: 0.85}
confidence = confidence_map.get(best_score, min(best_score * 0.3, 0.95))
# But if best_score > 3, cap at 0.95
```

Actually simpler: `min(0.5 + (best_score - 1) * 0.2, 0.95)`:
- 1 match → 0.5
- 2 matches → 0.7
- 3 matches → 0.9
- 4+ matches → 0.95

This meets all test criteria.

## Steps

1. Create `__init__.py` (empty file)
2. Write the test file above
3. Run: `cd backend && $env:PYTHONPATH=".." && python -m pytest tests/test_cerezo_classifier.py -v`
   Expected: FAIL (no module named classifier)
4. Write the implementation with keyword-based classifier
5. Run the test again — Expected: 5 PASS
6. Commit both files:

```bash
git add backend/app/services/cerezo/__init__.py backend/app/services/cerezo/classifier.py backend/tests/test_cerezo_classifier.py
git commit -m "feat: Cerezo IntentClassifier — keyword-based intent classification"
```
