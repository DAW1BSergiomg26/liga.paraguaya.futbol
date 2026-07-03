from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.club import ClubOut
from backend.app.services.club_service import ClubService

router = APIRouter(prefix="/api/v1/clubes", tags=["clubes"])


@router.get("", response_model=list[ClubOut])
async def listar_clubes(
    ciudad: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await ClubService.get_all(db, ciudad=ciudad)


@router.get("/{club_id}", response_model=ClubOut)
async def detalle_club(
    club_id: str,
    db: AsyncSession = Depends(get_db),
):
    club = await ClubService.get_by_id(db, club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el club con id: {club_id}",
        )
    return club
