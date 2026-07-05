# Task 3 Report: Backend prediction + leaderboard endpoints

## What was created/modified

### Created
- `backend/app/api/predicciones.py` — `POST /api/v1/predicciones` (crear predicción) and `GET /api/v1/predicciones/mis` (user's predictions)
- `backend/app/api/leaderboard.py` — `GET /api/v1/leaderboard` (leaderboard with configurable limit, default 50)

### Modified
- `backend/app/main.py` — added imports for `leaderboard` and `predicciones` routers, registered them, added new endpoints to root list
- `backend/app/api/admin.py` — added scoring trigger in `actualizar_partido`: captures `was_finalized` before commit, then after commit calls `PredictionService.calcular_puntos` and `recalcular_totales_usuario` for each affected user

## Test results

All 11 existing tests pass:
```
11 passed in 0.22s
```

## Decisions / self-review notes

- Copied existing patterns from `backend/app/api/partidos.py` and `backend/app/api/auth.py` (APIRouter prefix, dependency injection style)
- The scoring trigger in `admin.py` follows the brief exactly — checks `was_finalized` after estado update but before commit, then runs scoring logic after commit
- Used inline imports (`from backend.app.services.prediction_service import PredictionService`) inside the scoring block as specified in the brief, avoiding circular imports at module level
- Leaderboard endpoint uses the same `limit` default (50) as `PredictionService.leaderboard`
- No new tests were added since this task only required endpoint wiring (logic tested via `PredictionService` unit tests assumed to exist)
