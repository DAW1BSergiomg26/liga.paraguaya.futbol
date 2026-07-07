# Task 5: Push Triggers in Admin + Prediction Service

## Files to Modify
- `backend/app/api/admin.py`
- `backend/app/services/prediction_service.py`

## Exact Changes

### backend/app/api/admin.py
Find the `actualizar_partido` endpoint. After the partido update logic but before the response, add:

For gol push when `en_vivo`:
```python
from backend.app.services.push_service import PushService

# After partido update, send push for gol if en_vivo
if nuevo_estado == "en_vivo" and (nuevo_goles_local is not None and nuevo_goles_visitante is not None):
    await PushService.enviar_a_partido(
        db,
        partido_id,
        "⚽ Gol!",
        f"{partido.local.nombre} {nuevo_goles_local}-{nuevo_goles_visitante} {partido.visitante.nombre}",
        f"/partidos/{partido_id}",
    )
```

For finalizado, send result push:
```python
if nuevo_estado == "finalizado":
    result = await db.execute(select(Prediction).where(Prediction.partido_id == partido_id))
    preds = result.scalars().all()
    for pred in preds:
        await PushService.enviar_a_usuario(
            db,
            pred.user_id,
            "✅ Resultado de tu predicción",
            f"{partido.local.nombre} {nuevo_goles_local}-{nuevo_goles_visitante} {partido.visitante.nombre} — Obtuviste {pred.puntos} pts",
            f"/predicciones",
        )
```

### backend/app/services/prediction_service.py
In `calcular_puntos`, after assigning points, check for streak:

```python
from backend.app.services.push_service import PushService

# After calculating points, check streak for logro
if pred.puntos >= 2:
    streak_result = await db.execute(
        select(func.count(Prediction.id)).where(
            Prediction.user_id == pred.user_id,
            Prediction.puntos >= 2,
        )
    )
    streak_count = streak_result.scalar() or 0
    if streak_count > 0 and streak_count % 5 == 0:
        await PushService.enviar_a_usuario(
            db,
            pred.user_id,
            "🏆 Logro desbloqueado!",
            f"Acertaste {streak_count} predicciones seguidas!",
            f"/predicciones",
        )
```

Note: You'll need to add `from sqlalchemy import select, func` if not already imported.

## Global Constraints
- PushService.enviar_a_partido and enviar_a_usuario are already available (Task 4)
- Follow existing patterns in admin.py and prediction_service.py

## Commit
```bash
git add backend/app/api/admin.py backend/app/services/prediction_service.py
git commit -m "feat: trigger push notifications from admin and prediction service"
```

## Report File
`.superpowers/sdd/task-5-report.md`
