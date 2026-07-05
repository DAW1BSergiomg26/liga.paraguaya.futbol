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
