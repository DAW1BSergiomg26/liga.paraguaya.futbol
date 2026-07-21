# backend/app/services/transferencia_service.py
import math
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.club import Club
from app.models.transferencia import Transferencia
from app.schemas.transferencia import (
    EstadisticasTransferencias,
    GastoPorClub,
    TransferenciaCreate,
    TransferenciaOut,
    TransferenciaUpdate,
    TransferenciasPaginatedResponse,
)


class TransferenciaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _enrich(self, t: Transferencia, clubs: dict[str, Club] | None = None) -> TransferenciaOut:
        out = TransferenciaOut.model_validate(t)
        if clubs:
            if t.club_origen_id and t.club_origen_id in clubs:
                c = clubs[t.club_origen_id]
                out.club_origen_nombre = c.nombre
                out.club_origen_escudo = c.escudo
            if t.club_destino_id in clubs:
                c = clubs[t.club_destino_id]
                out.club_destino_nombre = c.nombre
                out.club_destino_escudo = c.escudo
        return out

    async def _get_clubs_map(self) -> dict[str, Club]:
        result = await self.db.execute(select(Club))
        return {c.id: c for c in result.scalars().all()}

    async def create(self, data: TransferenciaCreate) -> TransferenciaOut:
        t = Transferencia(**data.model_dump())
        self.db.add(t)
        await self.db.flush()
        await self.db.refresh(t)
        clubs = await self._get_clubs_map()
        return self._enrich(t, clubs)

    async def get_by_id(self, transferencia_id: str) -> TransferenciaOut | None:
        result = await self.db.execute(
            select(Transferencia).where(Transferencia.id == transferencia_id)
        )
        t = result.scalar_one_or_none()
        if not t:
            return None
        clubs = await self._get_clubs_map()
        return self._enrich(t, clubs)

    async def get_all(
        self,
        club_id: str | None = None,
        tipo: str | None = None,
        estado: str | None = None,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
        jugador: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> TransferenciasPaginatedResponse:
        query = select(Transferencia)
        count_query = select(func.count(Transferencia.id))

        if club_id:
            query = query.where(
                (Transferencia.club_origen_id == club_id) | (Transferencia.club_destino_id == club_id)
            )
            count_query = count_query.where(
                (Transferencia.club_origen_id == club_id) | (Transferencia.club_destino_id == club_id)
            )
        if tipo:
            query = query.where(Transferencia.tipo == tipo)
            count_query = count_query.where(Transferencia.tipo == tipo)
        if estado:
            query = query.where(Transferencia.estado == estado)
            count_query = count_query.where(Transferencia.estado == estado)
        if fecha_desde:
            query = query.where(Transferencia.fecha >= fecha_desde)
            count_query = count_query.where(Transferencia.fecha >= fecha_desde)
        if fecha_hasta:
            query = query.where(Transferencia.fecha <= fecha_hasta)
            count_query = count_query.where(Transferencia.fecha <= fecha_hasta)
        if jugador:
            query = query.where(Transferencia.jugador_nombre.ilike(f"%{jugador}%"))
            count_query = count_query.where(Transferencia.jugador_nombre.ilike(f"%{jugador}%"))

        total = (await self.db.execute(count_query)).scalar() or 0
        total_pages = math.ceil(total / per_page) if total > 0 else 1

        query = query.order_by(Transferencia.fecha.desc())
        query = query.offset((page - 1) * per_page).limit(per_page)

        result = await self.db.execute(query)
        transferencias = result.scalars().all()

        clubs = await self._get_clubs_map()
        enriched = [self._enrich(t, clubs) for t in transferencias]

        return TransferenciasPaginatedResponse(
            transferencias=enriched,
            total=total,
            page=page,
            total_pages=total_pages,
        )

    async def update(self, transferencia_id: str, data: TransferenciaUpdate) -> TransferenciaOut | None:
        result = await self.db.execute(
            select(Transferencia).where(Transferencia.id == transferencia_id)
        )
        t = result.scalar_one_or_none()
        if not t:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(t, key, value)
        await self.db.flush()
        await self.db.refresh(t)
        clubs = await self._get_clubs_map()
        return self._enrich(t, clubs)

    async def delete(self, transferencia_id: str) -> bool:
        result = await self.db.execute(
            select(Transferencia).where(Transferencia.id == transferencia_id)
        )
        t = result.scalar_one_or_none()
        if not t:
            return False
        await self.db.delete(t)
        return True

    async def get_historial(self, club_id: str) -> list[TransferenciaOut]:
        result = await self.db.execute(
            select(Transferencia)
            .where(
                (Transferencia.club_origen_id == club_id) | (Transferencia.club_destino_id == club_id)
            )
            .order_by(Transferencia.fecha.desc())
        )
        transferencias = result.scalars().all()
        clubs = await self._get_clubs_map()
        return [self._enrich(t, clubs) for t in transferencias]

    async def get_mercado(self, dias: int = 30) -> list[TransferenciaOut]:
        from datetime import timedelta
        desde = date.today() - timedelta(days=dias)
        result = await self.db.execute(
            select(Transferencia)
            .where(Transferencia.fecha >= desde)
            .where(Transferencia.estado.in_(["confirmada", "oficial"]))
            .order_by(Transferencia.fecha.desc())
        )
        transferencias = result.scalars().all()
        clubs = await self._get_clubs_map()
        return [self._enrich(t, clubs) for t in transferencias]

    async def get_estadisticas(self) -> EstadisticasTransferencias:
        result = await self.db.execute(select(Transferencia))
        all_t = result.scalars().all()
        clubs = await self._get_clubs_map()

        total = len(all_t)

        gasto_map: dict[str, dict] = {}
        for t in all_t:
            if t.monto and t.monto > 0:
                if t.club_destino_id not in gasto_map:
                    c = clubs.get(t.club_destino_id)
                    gasto_map[t.club_destino_id] = {
                        "club_id": t.club_destino_id,
                        "club_nombre": c.nombre if c else t.club_destino_id,
                        "total_gastado": 0.0,
                        "total_recibido": 0.0,
                    }
                gasto_map[t.club_destino_id]["total_gastado"] += t.monto

                if t.club_origen_id:
                    if t.club_origen_id not in gasto_map:
                        c = clubs.get(t.club_origen_id)
                        gasto_map[t.club_origen_id] = {
                            "club_id": t.club_origen_id,
                            "club_nombre": c.nombre if c else t.club_origen_id,
                            "total_gastado": 0.0,
                            "total_recibido": 0.0,
                        }
                    gasto_map[t.club_origen_id]["total_recibido"] += t.monto

        gasto_list = sorted(gasto_map.values(), key=lambda x: x["total_gastado"], reverse=True)

        top_compras = sorted(
            [t for t in all_t if t.monto and t.monto > 0],
            key=lambda t: t.monto,
            reverse=True,
        )[:10]
        top_compras_out = [self._enrich(t, clubs) for t in top_compras]

        posiciones: dict[str, int] = {}
        tipos: dict[str, int] = {}
        for t in all_t:
            pos = t.jugador_posicion or "No especificada"
            posiciones[pos] = posiciones.get(pos, 0) + 1
            tipos[t.tipo] = tipos.get(t.tipo, 0) + 1

        return EstadisticasTransferencias(
            total_transferencias=total,
            gasto_total_por_club=[GastoPorClub(**g) for g in gasto_list],
            top_compras=top_compras_out,
            distribucion_posiciones=posiciones,
            distribucion_tipos=tipos,
        )
