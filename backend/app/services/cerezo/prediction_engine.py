from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.partido import Partido


class CerezoPredictionEngine:

    @staticmethod
    async def predict(db: AsyncSession, entities: dict) -> dict:
        clubes = entities.get("clubes", [])
        if len(clubes) < 2:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_id, visitante_id = clubes[0], clubes[1]

        result = await db.execute(
            select(Partido).where(
                Partido.estado == "finalizado",
                (
                    (Partido.local_id == local_id) & (Partido.visitante_id == visitante_id)
                ) | (
                    (Partido.local_id == visitante_id) & (Partido.visitante_id == local_id)
                ),
            ).order_by(Partido.fecha.desc()).limit(5)
        )
        h2h = result.scalars().all()

        if not h2h:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_wins = 0
        visitor_wins = 0
        draws = 0

        for p in h2h:
            if p.goles_local is None or p.goles_visitante is None:
                continue
            if p.goles_local > p.goles_visitante:
                if p.local_id == local_id:
                    local_wins += 1
                else:
                    visitor_wins += 1
            elif p.goles_visitante > p.goles_local:
                if p.visitante_id == visitante_id:
                    visitor_wins += 1
                else:
                    local_wins += 1
            else:
                draws += 1

        total = local_wins + visitor_wins + draws
        if total == 0:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_pct = round((local_wins / total) * 100, 1)
        draw_pct = round((draws / total) * 100, 1)
        visitor_pct = round((visitor_wins / total) * 100, 1)

        if total >= 5:
            confidence = "alta"
        elif total >= 3:
            confidence = "media"
        else:
            confidence = "baja"

        return {
            "local_win_pct": local_pct,
            "draw_pct": draw_pct,
            "visitor_win_pct": visitor_pct,
            "confidence": confidence,
            "total_partidos": total,
        }
