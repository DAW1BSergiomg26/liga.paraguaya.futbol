# Task 3 Report: Backend — Pydantic Schemas

## Status
✅ Complete

## Commits
- `0f2ce9d` — feat(backend): Pydantic schemas

## Files Created
- `backend/app/schemas/__init__.py` — Empty package init
- `backend/app/schemas/club.py` — `ClubOut`, `ClubDetailOut`
- `backend/app/schemas/partido.py` — `PartidoOut`, `PartidoDetailOut`
- `backend/app/schemas/tabla.py` — `TablaRowOut`

## Verification
```
Schemas OK
```

## Notes
- Import command adjusted: used `from app.schemas...` (with `cd backend`) instead of `from backend.app.schemas...` since `backend/` is not a Python package (no `__init__.py`).
