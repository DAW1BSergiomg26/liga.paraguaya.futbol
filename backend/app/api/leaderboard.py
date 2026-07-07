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
