# Task 3: Backend prediction + leaderboard endpoints

**Files:**
- Create: `backend/app/api/predicciones.py`
- Create: `backend/app/api/leaderboard.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/api/admin.py`

**Interfaces:**
- Consumes: `get_current_user` dependency, `PredictionService`, `PartidoService`
- Produces: REST endpoints for predictions and leaderboard

## Steps

- [ ] **Create `backend/app/api/predicciones.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.prediction import PredictionCreate, PredictionDetail, PredictionOut
from backend.app.services.prediction_service import PredictionService

router = APIRouter(prefix="/api/v1/predicciones", tags=["predicciones"])


@router.post("", response_model=PredictionOut, status_code=201)
async def crear_prediccion(
    body: PredictionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService.crear(db, user.id, body)


@router.get("/mis", response_model=list[PredictionDetail])
async def mis_predicciones(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService.mis_predicciones(db, user.id)
```

- [ ] **Create `backend/app/api/leaderboard.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.prediction import LeaderboardEntry
from backend.app.services.prediction_service import PredictionService

router = APIRouter(prefix="/api/v1/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await PredictionService.leaderboard(db, limit)
```

- [ ] **Modify `backend/app/main.py`**

Add `predicciones` and `leaderboard` to imports (line 7):
```python
from backend.app.api import admin, auth, clubes, health, leaderboard, partidos, predicciones, tabla
```

Add router registrations after `app.include_router(auth.router)` (after line 46):
```python
app.include_router(predicciones.router)
app.include_router(leaderboard.router)
```

Also add the new endpoints to the root endpoint list (line 56-63):
```python
"/api/v1/auth/login",
"/api/v1/predicciones",
"/api/v1/leaderboard",
```

- [ ] **Modify `backend/app/api/admin.py`** — add scoring trigger in `actualizar_partido`

After the estado update (line 37-38) and before `await db.commit()` (line 39), add:
```python
    was_finalized = partido.estado == "finalizado"
```

After `await db.commit()` (line 39), add the scoring logic:
```python
    if was_finalized:
        from backend.app.services.prediction_service import PredictionService
        await PredictionService.calcular_puntos(db, partido_id)
        from backend.app.models.prediction import Prediction
        result = await db.execute(
            select(Prediction.user_id).where(Prediction.partido_id == partido_id).distinct()
        )
        user_ids = [r[0] for r in result.all()]
        for uid in user_ids:
            await PredictionService.recalcular_totales_usuario(db, uid)
        await db.commit()
```

Add `from sqlalchemy import select` to imports if not already there (it is — line 2).

- [ ] **Run tests**

```powershell
$env:PYTHONPATH="C:\Users\astur\Desktop\liga.paraguaya.futbol"; cd C:\Users\astur\Desktop\liga.paraguaya.futbol; python -m pytest backend/tests/ -v
```
Expected: 11 existing tests pass

- [ ] **Commit**

```powershell
git add backend/app/api/predicciones.py backend/app/api/leaderboard.py backend/app/main.py backend/app/api/admin.py
git commit -m "feat: add prediction and leaderboard endpoints"
```
