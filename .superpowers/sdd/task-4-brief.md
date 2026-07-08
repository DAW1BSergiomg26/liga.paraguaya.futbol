# Task 4: PredictionEngine

## Files
- Create: `backend/app/services/cerezo/prediction_engine.py`
- Create: `backend/tests/test_cerezo_prediction_engine.py`

## Interface
- `CerezoPredictionEngine.predict(db: AsyncSession, entities: dict) -> dict`
  - Returns: `{ local_win_pct: float, draw_pct: float, visitor_win_pct: float, confidence: str }`

## Test Code

```python
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
```

## Implementation

```python
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.partido import Partido


class CerezoPredictionEngine:

    @staticmethod
    async def predict(db: AsyncSession, entities: dict) -> dict:
        clubes = entities.get("clubes", [])
        if len(clubes) < 2:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_id, visitante_id = clubes[0], clubes[1]

        # Get H2H matches
        result = await db.execute(
            select(Partido).where(
                Partido.estado == "finalizado",
                (
                    (Partido.local_id == local_id) & (Partido.visitante_id == visitante_id)
                ) | (
                    (Partido.local_id == visitante_id) & (Partido.visitante_id == local_id)
                ),
            ).order_by(Partido.fecha.desc()).limit(5)
        )
        h2h = result.scalars().all()

        if not h2h:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_wins = 0
        visitor_wins = 0
        draws = 0

        for p in h2h:
            if p.goles_local is None or p.goles_visitante is None:
                continue
            if p.goles_local > p.goles_visitante:
                if p.local_id == local_id:
                    local_wins += 1
                else:
                    visitor_wins += 1
            elif p.goles_visitante > p.goles_local:
                if p.visitante_id == visitante_id:
                    visitor_wins += 1
                else:
                    local_wins += 1
            else:
                draws += 1

        total = local_wins + visitor_wins + draws
        if total == 0:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_pct = round((local_wins / total) * 100, 1)
        draw_pct = round((draws / total) * 100, 1)
        visitor_pct = round((visitor_wins / total) * 100, 1)

        if total >= 5:
            confidence = "alta"
        elif total >= 3:
            confidence = "media"
        else:
            confidence = "baja"

        return {
            "local_win_pct": local_pct,
            "draw_pct": draw_pct,
            "visitor_win_pct": visitor_pct,
            "confidence": confidence,
            "total_partidos": total,
        }
```

## Steps

1. Write test file
2. Run: `cd backend && $env:PYTHONPATH=".." && python -m pytest tests/test_cerezo_prediction_engine.py -v`
   Expected: FAIL
3. Write implementation
4. Run test again — Expected: 3 PASS
5. Commit:
```bash
git add backend/app/services/cerezo/prediction_engine.py backend/tests/test_cerezo_prediction_engine.py
git commit -m "feat: Cerezo PredictionEngine — H2H statistical predictions"
```
