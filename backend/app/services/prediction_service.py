import uuid
from typing import Optional

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.partido import Partido
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import (
    LeaderboardEntry,
    PredictionCreate,
    PredictionDetail,
    PredictionOut,
)


class PredictionService:

    @staticmethod
    async def crear(
        db: AsyncSession, user_id: str, data: PredictionCreate
    ) -> PredictionOut:
        pred_id = f"pred_{uuid.uuid4().hex[:12]}"
        pred = Prediction(
            id=pred_id,
            user_id=user_id,
            partido_id=data.partido_id,
            goles_local=data.goles_local,
            goles_visitante=data.goles_visitante,
        )
        db.add(pred)
        await db.flush()
        return PredictionOut.model_validate(pred)

    @staticmethod
    async def mis_predicciones(
        db: AsyncSession, user_id: str
    ) -> list[PredictionDetail]:
        stmt = (
            select(Prediction)
            .where(Prediction.user_id == user_id)
            .options(
                selectinload(Prediction.partido).selectinload(Partido.local),
                selectinload(Prediction.partido).selectinload(Partido.visitante),
            )
            .order_by(Prediction.created_at.desc())
        )
        result = await db.execute(stmt)
        preds = result.scalars().all()
        out = []
        for p in preds:
            partido = p.partido
            out.append(
                PredictionDetail(
                    id=p.id,
                    user_id=p.user_id,
                    partido_id=p.partido_id,
                    goles_local=p.goles_local,
                    goles_visitante=p.goles_visitante,
                    puntos=p.puntos,
                    created_at=p.created_at,
                    torneo=partido.torneo if partido else "",
                    jornada=partido.jornada if partido else 0,
                    local_id=partido.local_id if partido else "",
                    visitante_id=partido.visitante_id if partido else "",
                    local_nombre=partido.local.nombre if partido and partido.local else "",
                    visitante_nombre=partido.visitante.nombre if partido and partido.visitante else "",
                    goles_real_local=partido.goles_local if partido else None,
                    goles_real_visitante=partido.goles_visitante if partido else None,
                    estado=partido.estado if partido else "",
                )
            )
        return out

    @staticmethod
    async def calcular_puntos(db: AsyncSession, partido_id: str):
        result = await db.execute(
            select(Prediction).where(Prediction.partido_id == partido_id)
        )
        preds = result.scalars().all()
        if not preds:
            return

        result = await db.execute(select(Partido).where(Partido.id == partido_id))
        partido = result.scalar_one_or_none()
        if not partido or partido.estado != "finalizado":
            return

        for pred in preds:
            puntos = 1
            if (pred.goles_local == partido.goles_local and
                pred.goles_visitante == partido.goles_visitante):
                puntos = 3
            elif ((pred.goles_local - pred.goles_visitante) *
                  (partido.goles_local - partido.goles_visitante) > 0):
                puntos = 2
            elif pred.goles_local == pred.goles_visitante and partido.goles_local == partido.goles_visitante:
                puntos = 2
            pred.puntos = puntos
            await db.flush()

        for pred in preds:
            if pred.puntos >= 2:
                from app.services.push_service import PushService
                streak_result = await db.execute(
                    select(func.count(Prediction.id)).where(
                        Prediction.user_id == pred.user_id,
                        Prediction.puntos >= 2,
                    )
                )
                streak_count = streak_result.scalar() or 0
                if streak_count > 0 and streak_count % 5 == 0:
                    await PushService.enviar_a_usuario(
                        db,
                        pred.user_id,
                        "ðŸ† Logro desbloqueado!",
                        f"Acertaste {streak_count} predicciones seguidas!",
                        f"/predicciones",
                    )

    @staticmethod
    async def recalcular_totales_usuario(db: AsyncSession, user_id: str):
        result = await db.execute(
            select(func.coalesce(func.sum(Prediction.puntos), 0)).where(
                Prediction.user_id == user_id
            )
        )
        total = result.scalar() or 0
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.puntos = total
            await db.flush()

    @staticmethod
    async def leaderboard(
        db: AsyncSession, limit: int = 50
    ) -> list[LeaderboardEntry]:
        stmt = (
            select(
                User.username,
                User.name,
                User.image,
                User.puntos,
                func.count(Prediction.id).label("predicciones"),
                func.sum(
                    case((Prediction.puntos == 3, 1), else_=0)
                ).label("aciertos"),
            )
            .outerjoin(Prediction, Prediction.user_id == User.id)
            .group_by(User.id)
            .order_by(User.puntos.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [
            LeaderboardEntry(
                username=row.username,
                name=row.name,
                image=row.image,
                puntos=row.puntos or 0,
                predicciones=row.predicciones or 0,
                aciertos=row.aciertos or 0,
            )
            for row in rows
        ]
