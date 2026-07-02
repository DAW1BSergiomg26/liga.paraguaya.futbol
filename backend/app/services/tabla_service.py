from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.tabla import TablaPosicion
from backend.app.schemas.tabla import TablaRowOut


class TablaService:

    @staticmethod
    async def get_table(
        db: AsyncSession,
        torneo: Optional[str] = None,
    ) -> list[TablaRowOut]:
        stmt = select(TablaPosicion).order_by(TablaPosicion.posicion)
        if torneo:
            stmt = stmt.where(TablaPosicion.torneo == torneo)
        result = await db.execute(stmt)
        rows = result.scalars().all()
        return [TablaRowOut.model_validate(r) for r in rows]
