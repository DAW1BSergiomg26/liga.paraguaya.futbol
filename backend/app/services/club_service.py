from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.club import Club
from backend.app.schemas.club import ClubOut


class ClubService:

    @staticmethod
    async def get_all(db: AsyncSession, ciudad: Optional[str] = None) -> list[ClubOut]:
        stmt = select(Club)
        if ciudad:
            stmt = stmt.where(Club.ciudad == ciudad)
        result = await db.execute(stmt)
        clubs = result.scalars().all()
        return [ClubOut.model_validate(c) for c in clubs]

    @staticmethod
    async def get_by_id(db: AsyncSession, club_id: str) -> Optional[ClubOut]:
        result = await db.execute(select(Club).where(Club.id == club_id))
        club = result.scalar_one_or_none()
        return ClubOut.model_validate(club) if club else None
