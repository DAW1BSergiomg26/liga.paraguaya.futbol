# Task 1 Report: Backend schemas — H2HOut

## What I implemented

Added four Pydantic v2 models to `backend/app/schemas/partido.py`:
- **ClubResumen** — id, nombre, escudo
- **MayorGoleada** — goles, fecha, goles_recibidos
- **H2HPartidoItem** — id, torneo, jornada, fecha, estado, goles_local (Optional[int]), goles_visitante (Optional[int]), local_id, visitante_id
- **H2HOut** — club_a, club_b (ClubResumen), resumen (dict), partidos (list[H2HPartidoItem])

Created `backend/tests/test_h2h.py` with `TestH2HSchemas` (4 tests).

## TDD Evidence

**RED** — before schemas existed:
```
ImportError: cannot import name 'H2HOut' from 'backend.app.schemas.partido'
```

**GREEN** — after adding schemas:
```
backend/tests/test_h2h.py::TestH2HSchemas::test_club_resumen_fields PASSED
backend/tests/test_h2h.py::TestH2HSchemas::test_mayor_goleada_fields PASSED
backend/tests/test_h2h.py::TestH2HSchemas::test_h2h_partido_item_fields PASSED
backend/tests/test_h2h.py::TestH2HSchemas::test_h2h_out_structure PASSED
============================== 4 passed in 0.03s
```

## Files changed

| File | Action |
|------|--------|
| `backend/app/schemas/partido.py` | Modified — added 4 new schema classes (52 lines) |
| `backend/tests/test_h2h.py` | Created — TestH2HSchemas with 4 test methods (48 lines) |

## Self-review findings

- Match existing conventions: used `Optional[int]` (already imported), `BaseModel` (already imported), no `model_config`.
- `H2HOut.resumen` uses `dict` (generic) as specified — intentionally loose to accommodate computed stats.
- Tests cover field access and structural composition (nested dict with `MayorGoleada`).
- `MayorGoleada.fecha` is `str` not `date` — matches the brief; could be refined later if date formatting is needed.

## Issues/Concerns

None.
