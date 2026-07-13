from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.services.goleador_service import GoleadorService

router = APIRouter(prefix="/api/v1", tags=["goleadores"])


@router.get("/goleadores")
async def get_goleadores(
    torneo: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await GoleadorService.get_all(db, torneo=torneo, limit=limit)


@router.get("/sync/status")
async def get_sync_status():
    return {"status": "not_implemented"}


@router.post("/sync/force")
async def force_sync():
    return {"status": "not_implemented"}
