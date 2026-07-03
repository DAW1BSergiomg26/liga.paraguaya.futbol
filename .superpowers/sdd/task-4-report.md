# Task 4: Backend — Services Layer

## Status: Complete

## Files Created
- `backend/app/services/__init__.py` — empty package init
- `backend/app/services/club_service.py` — `ClubService` with `get_all(ciudad)` and `get_by_id`
- `backend/app/services/partido_service.py` — `PartidoService` with `get_all(torneo, estado)` and `get_by_id` (returns `PartidoDetailOut` with eager-loaded club names)
- `backend/app/services/tabla_service.py` — `TablaService` with `get_table(torneo)`

## Verification
- All imports resolve correctly (`python -c "from backend.app.services.* import ..."`)
- Committed as `feat(backend): services layer`
