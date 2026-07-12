from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.goleador import Goleador
from backend.app.schemas.goleador import GoleadorOut, GoleadoresListOut


class GoleadorService:

    @staticmethod
    async def get_all(
        db: AsyncSession,
        torneo: Optional[str] = None,
        limit: int = 20,
    ) -> GoleadoresListOut:
        stmt = select(Goleador)
        if torneo:
            stmt = stmt.where(Goleador.torneo == torneo)
        stmt = stmt.order_by(Goleador.goles.desc()).limit(limit)
        result = await db.execute(stmt)
        goleadores = result.scalars().all()
        return GoleadoresListOut(
            goleadores=[GoleadorOut.model_validate(g) for g in goleadores],
            total=len(goleadores),
        )
