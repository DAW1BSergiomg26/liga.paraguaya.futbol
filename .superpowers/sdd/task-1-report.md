# Task 1 Report: Backend service method + endpoint + tests for live scores

## What was implemented

- **`PartidoService.get_en_vivo(db)`** in `backend/app/services/partido_service.py` — static method that queries `Partido` rows with `estado == "en_vivo"` and returns a scalar list of ORM objects.
- **`GET /api/v1/partidos/marcadores`** in `backend/app/api/partidos.py` — returns a `dict[str, MarcadorOut]` mapping match IDs to their live score (goles_local, goles_visitante, minuto calculated from fecha).

## What was tested and test results

All 111 tests pass (including the 3 new ones):
- `test_marcadores_empty_when_no_en_vivo` — endpoint returns `{}` when no live matches exist
- `test_get_en_vivo_empty` — service returns empty list when no matches
- `test_get_en_vivo_filters_only_en_vivo` — service only returns matches with `estado == "en_vivo"`

## TDD Evidence

**RED:**
```
> python -m pytest tests/test_marcadores.py -v
tests/test_marcadores.py::TestMarcadorEndpoint::test_marcadores_empty_when_no_en_vivo FAILED [404]
tests/test_marcadores.py::TestGetEnVivo::test_get_en_vivo_empty FAILED [AttributeError: no attribute 'get_en_vivo']
tests/test_marcadores.py::TestGetEnVivo::test_get_en_vivo_filters_only_en_vivo FAILED [AttributeError: no attribute 'get_en_vivo']
```

**GREEN:**
```
> python -m pytest tests/test_marcadores.py -v
tests/test_marcadores.py::TestMarcadorEndpoint::test_marcadores_empty_when_no_en_vivo PASSED
tests/test_marcadores.py::TestGetEnVivo::test_get_en_vivo_empty PASSED
tests/test_marcadores.py::TestGetEnVivo::test_get_en_vivo_filters_only_en_vivo PASSED
```

## Files changed

- `backend/app/services/partido_service.py` — added `get_en_vivo` static method (6 lines)
- `backend/app/api/partidos.py` — added `marcadores_en_vivo` endpoint (16 lines)
- `backend/tests/test_marcadores.py` — created with 3 tests (58 lines)

## Self-review findings

- The `MarcadorOut` schema was already defined at `backend/app/api/partidos.py:15-19` and reused directly
- `date`, `datetime`, `timezone` imports were already present in `partidos.py`
- `select` is already imported in `partido_service.py`
- All existing tests continue to pass (111 total)
- No concerns — implementation is minimal and follows existing patterns

## Issues or concerns

None.
