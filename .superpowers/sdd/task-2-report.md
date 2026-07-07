# Task 2 Report: Backend Prediction model + service

## Created

- `backend/app/models/prediction.py` — `Prediction` model with FK references to `users` and `partidos`, `UniqueConstraint` on `(user_id, partido_id)`, and `predicciones` relationship mappings.
- `backend/app/schemas/prediction.py` — `PredictionCreate`, `PredictionOut`, `PredictionDetail`, `LeaderboardEntry` Pydantic v2 schemas with `from_attributes`.
- `backend/app/services/prediction_service.py` — `PredictionService` with `crear`, `mis_predicciones`, `calcular_puntos`, `recalcular_totales_usuario`, `leaderboard` static methods.

## Modified

- `backend/app/models/partido.py` — Added `predicciones = relationship("Prediction", back_populates="partido", lazy="selectin")`.
- `backend/app/models/user.py` — Added `relationship` import and `predicciones = relationship("Prediction", back_populates="user", lazy="selectin")`.

## Additional changes (required for SQLAlchemy mapper resolution)

- `backend/app/models/__init__.py` — Added `Prediction` import and `__all__` entry so the model is registered with the shared `Base` registry before mappers are configured.
- `backend/app/core/database.py` — Added `prediction` import in `init_db()` so the table is created when `init_db` is called.

## Test results

All 11 existing tests pass:
```
backend\tests\test_clubes.py::test_listar_clubes PASSED
backend\tests\test_clubes.py::test_listar_clubes_con_datos PASSED
backend\tests\test_clubes.py::test_detalle_club_existente PASSED
backend\tests\test_clubes.py::test_detalle_club_no_existente PASSED
backend\tests\test_clubes.py::test_filtrar_por_ciudad PASSED
backend\tests\test_partidos.py::test_listar_partidos PASSED
backend\tests\test_partidos.py::test_detalle_partido PASSED
backend\tests\test_partidos.py::test_detalle_partido_no_existente PASSED
backend\tests\test_partidos.py::test_listar_partidos_paginado PASSED
backend\tests\test_partidos.py::test_listar_partidos_pagina_vacia PASSED
backend\tests\test_tabla.py::test_obtener_tabla PASSED
```

## Decisions & self-review notes

- **SQLAlchemy mapper ordering**: When adding `relationship("Prediction", ...)` to `Partido` and `User`, SQLAlchemy's lazy mapper configuration fails to resolve the string `"Prediction"` unless the `Prediction` model is imported (and thus registered in the shared `Base` registry) before any model instance is created. This required adding the import in `backend/app/models/__init__.py` — a necessary change outside the original brief's file list, but consistent with the existing pattern (other models were already imported there).

- **`database.py` import**: Added `prediction` to the `init_db()` function's model imports so that `create_all` creates the `predictions` table. This matches the existing pattern for all other models.

- **Scoring logic**: Followed the brief exactly — 3 points for exact score, 2 points for correct winner/draw, 1 point otherwise. The `calcular_puntos` method also calls `recalcular_totales_usuario` for each affected user in a separate method (not yet wired to the API).

- **No API wiring**: The brief explicitly defers API wiring to Task 3, so no routes or main.py changes were made.
