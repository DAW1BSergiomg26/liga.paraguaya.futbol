# Task 4 Report: Backend tests for predictions

## Summary

Added 7 prediction-related tests and supporting infrastructure.

## Changes

### `backend/tests/conftest.py`
- Added `from sqlalchemy import select` import
- Added `from backend.app.models.prediction import Prediction` import
- Added `seed_test_user` async helper function

### `backend/tests/test_predicciones.py` (new)
7 tests:
1. `test_login_creates_user` — login creates a new user and returns token
2. `test_login_returns_same_user` — re-login returns a new token
3. `test_crear_prediccion` — creating a prediction returns 201 with correct data
4. `test_mis_predicciones` — listing user predictions returns at least 1
5. `test_leaderboard` — leaderboard shows at least 1 entry
6. `test_prediccion_sin_auth` — unauthenticated request returns 401
7. `test_calcular_puntos_exacto` — exact match scores 3 points

### `backend/app/services/prediction_service.py`
- Fixed lazy loading bug in `mis_predicciones`: added `selectinload` for `Partido.local` and `Partido.visitante` to prevent `MissingGreenlet` error when accessing `partido.local.nombre`

## Results

All 18 tests pass (11 existing + 7 new).

## Commit

`f84158c` — `feat: add prediction tests`
