# Task 6: Backend — Seed Script

## Status: ✅ Complete

## Files Created
- `backend/app/scripts/__init__.py` — empty package init
- `backend/app/scripts/seed.py` — seed script with `seed_clubes`, `seed_partidos`, `seed_tabla` functions

## Files Modified
- `backend/app/models/tabla.py` — added `club: Mapped[str]` column to `TablaPosicion` (needed by `TablaRowOut` schema)

## Verification

### First run (clean DB):
```
Clubes: 4 nuevos
Partidos: 2 nuevos
Tabla: 4 filas nuevas
```

### Second run (idempotent):
```
Clubes: 0 nuevos
Partidos: 0 nuevos
Tabla: 0 filas nuevas
```

### API verification (port 8004):
- `GET /api/v1/clubes` → 4 clubs ✅
- `GET /api/v1/partidos` → 2 partidos ✅
- `GET /api/v1/tabla` → 4 rows with `club` names ✅

## Notes
- Fixed idempotency for `TablaPosicion` by adding existence check on `(torneo, jornada, club_id)` composite
- Added `club` column to `TablaPosicion` model to satisfy `TablaRowOut` schema's required `club` field; seed now reads `item.get("club", "")` from JSON
- Seed script must be run from repo root: `python -m backend.app.scripts.seed`
