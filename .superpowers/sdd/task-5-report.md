# Task 5: Push Triggers in Admin + Prediction Service

## What I Implemented

1. **Gol push in `admin.py`** — When a partido is updated to `en_vivo` state with goals set, sends a push notification to the partido's subscribers via `PushService.enviar_a_partido`. Placed after the `was_finalized` check, before `db.commit()`.

2. **Result push in `admin.py`** — When a partido is finalized (`was_finalized` block), iterates over all predictions for that partido and sends each user a personalized result notification via `PushService.enviar_a_usuario`. Placed after the `recalcular_totales_usuario` loop, before the final `db.commit()` inside the block.

3. **Logro streak push in `prediction_service.py`** — In `calcular_puntos`, after the points assignment loop, checks each prediction that scored >= 2 for streak milestones (multiples of 5). Sends achievement notification via `PushService.enviar_a_usuario`.

## Tests and Results

All 18 existing tests pass:
- test_clubes: 5/5
- test_partidos: 5/5
- test_predicciones: 7/7
- test_tabla: 1/1

## Files Changed

- `backend/app/api/admin.py` — Added gol push (lines 41-49) and result push (lines 63-73)
- `backend/app/services/prediction_service.py` — Added streak check (lines 104-121)

## Self-Review Findings

- Imports use inline style (`from backend.app.services.push_service import PushService`) consistent with existing pattern in `admin.py`
- `select` and `func` are already imported in both files, no additional imports needed
- `Prediction` model inline import in `admin.py` was already present and reused by the new code
- Push timing is correct: gol push fires before commit (partido relationships still accessible), result push fires after prediction calculation (puntos already assigned)
- `partido.local.nombre` and `partido.visitante.nombre` are accessed before expiry in the gol push; in the result push they are accessed after commit but the session is still open (lazy load available)
- The streak check in `calcular_puntos` correctly uses `func.count` which was already imported

## Concerns

None. All changes follow the brief exactly and integrate cleanly with the existing code.
