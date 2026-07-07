# Task 6: Cron Endpoint for Recordatorios

## Files
- Create: `backend/app/api/cron.py` (overwrite existing stub from Task 3)
- Modify: `.github/workflows/keep-alive.yml`

## Exact Code

### backend/app/api/cron.py
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.services.push_service import PushService

router = APIRouter(prefix="/api/v1/cron", tags=["cron"])


@router.post("/recordatorios")
async def enviar_recordatorios(
    db: AsyncSession = Depends(get_db),
):
    partidos = await PushService.obtener_recordatorios(db)
    enviados = 0
    for partido in partidos:
        await PushService.enviar_a_partido(
            db,
            partido.id,
            "🔔 Recordatorio de predicción",
            f"{partido.local.nombre} vs {partido.visitante.nombre} comienza en 30 min!",
            f"/partidos/{partido.id}",
        )
        enviados += 1
    return {"recordatorios_enviados": enviados}
```

### .github/workflows/keep-alive.yml
Find the keep-alive workflow and add a step to hit the cron endpoint:
```yaml
      - name: Recordatorios predicciones
        run: curl -s -X POST "https://backend-production-0b7d.up.railway.app/api/v1/cron/recordatorios"
```

## Global Constraints
- `PushService.obtener_recordatorios` already exists (Task 4)
- Stub `cron.py` exists from Task 3 — overwrite it

## Commit
```bash
git add backend/app/api/cron.py
git commit -m "feat: add cron endpoint for prediction reminders"
```

## Report File
`.superpowers/sdd/task-6-report.md`
