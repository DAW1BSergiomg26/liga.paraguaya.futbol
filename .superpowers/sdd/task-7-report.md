# Task 7 Report: Backend — Tests

## Summary

Created the test suite for the backend API, covering clubes, partidos, and tabla endpoints with in-memory SQLite + aiosqlite.

## Files Created

| File | Purpose |
|------|---------|
| `backend/tests/__init__.py` | Empty package init |
| `backend/tests/conftest.py` | Fixtures: engine, db_session, client; + `seed_test_data` helper |
| `backend/tests/test_clubes.py` | 5 tests: list, list with data, detail (exists/404), filter by ciudad |
| `backend/tests/test_partidos.py` | 3 tests: list, detail (exists/404) |
| `backend/tests/test_tabla.py` | 1 test: obtener tabla |
| `backend/pytest.ini` | `asyncio_mode = auto` (required for pytest-asyncio strict mode) |

## Changes from Brief

- **Imported `get_db` from `backend.app.core.dependencies`** (not `backend.app.core.database`) — the brief had an incorrect import path
- **Added `pytest.ini`** with `asyncio_mode = auto` — required by pytest-asyncio 1.4.0 strict mode to allow sync fixtures to depend on async fixtures

## Results

```
tests/test_clubes.py::test_listar_clubes PASSED
tests/test_clubes.py::test_listar_clubes_con_datos PASSED
tests/test_clubes.py::test_detalle_club_existente PASSED
tests/test_clubes.py::test_detalle_club_no_existente PASSED
tests/test_clubes.py::test_filtrar_por_ciudad PASSED
tests/test_partidos.py::test_listar_partidos PASSED
tests/test_partidos.py::test_detalle_partido PASSED
tests/test_partidos.py::test_detalle_partido_no_existente PASSED
tests/test_tabla.py::test_obtener_tabla PASSED
9 passed in 0.16s
```

## Commit

```
7b41e1d feat(backend): test suite
```
