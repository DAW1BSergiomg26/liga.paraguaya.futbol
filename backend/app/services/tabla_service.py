from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.tabla import TablaPosicion
from backend.app.schemas.tabla import TablaRowOut


class TablaService:

    @staticmethod
    async def get_table(
        db: AsyncSession,
        torneo: Optional[str] = None,
    ) -> list[TablaRowOut]:
        stmt = (
            select(TablaPosicion)
            .options(selectinload(TablaPosicion.club_rel))
            .order_by(TablaPosicion.posicion)
        )
        if torneo:
            stmt = stmt.where(TablaPosicion.torneo == torneo)
        result = await db.execute(stmt)
        rows = result.scalars().all()
        return [
            TablaRowOut(
                posicion=r.posicion,
                club_id=r.club_id,
                club=r.club_rel.nombre if r.club_rel else "",
                escudo=r.club_rel.escudo if r.club_rel else "",
                pj=r.pj,
                pg=r.pg,
                pe=r.pe,
                pp=r.pp,
                gf=r.gf,
                gc=r.gc,
                dg=r.dg,
                puntos=r.puntos,
            )
            for r in rows
        ]
