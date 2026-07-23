from sqlalchemy.ext.asyncio import AsyncSession

from ...services.club_service import ClubService
from ...services.partido_service import PartidoService
from ...services.tabla_service import TablaService


class CerezoDataFetcher:

    @staticmethod
    async def fetch(intent: str, entities: dict, db: AsyncSession) -> dict:
        if intent == "club_info" and entities.get("clubes"):
            club_id = entities["clubes"][0]
            club = await ClubService.get_by_id(db, club_id)
            return {"club": club.model_dump() if club else None}

        if intent == "match_result" and entities.get("clubes"):
            clubes = entities["clubes"]
            local_id = clubes[0]
            visitante_id = clubes[1] if len(clubes) > 1 else None
            partidos = await PartidoService.get_all(db)
            matches = [
                p.model_dump() for p in partidos
                if (p.local_id == local_id or p.visitante_id == local_id)
            ]
            last5 = sorted(
                [p for p in partidos if p.estado == "finalizado"
                 and (p.local_id == local_id or p.visitante_id == local_id)],
                key=lambda p: p.fecha, reverse=True
            )[:5]
            wins = sum(1 for p in last5 if (p.local_id == local_id and p.goles_local is not None and p.goles_local > (p.goles_visitante or 0)) or (p.visitante_id == local_id and p.goles_visitante is not None and p.goles_visitante > (p.goles_local or 0)))
            losses = sum(1 for p in last5 if (p.local_id == local_id and p.goles_local is not None and p.goles_local < (p.goles_visitante or 0)) or (p.visitante_id == local_id and p.goles_visitante is not None and p.goles_visitante < (p.goles_local or 0)))
            draws = len(last5) - wins - losses
            return {"partidos": matches, "forma": {"wins": wins, "draws": draws, "losses": losses, "total": len(last5)}}

        if intent == "head_to_head" and len(entities.get("clubes", [])) >= 2:
            club_a, club_b = entities["clubes"][0], entities["clubes"][1]
            partidos = await PartidoService.get_all(db)
            h2h = [
                p.model_dump() for p in partidos
                if (p.local_id == club_a and p.visitante_id == club_b)
                or (p.local_id == club_b and p.visitante_id == club_a)
            ]
            return {"head_to_head": h2h}

        if intent == "table_position":
            tabla = await TablaService.get_table(db)
            tabla_data = [t.model_dump() for t in tabla]
            club_posicion = None
            if entities.get("clubes"):
                club_id = entities["clubes"][0]
                for i, row in enumerate(tabla_data):
                    if row.get("club_id") == club_id or row.get("id") == club_id:
                        club_posicion = {"posicion": i + 1, **row}
                        break
            return {"tabla": tabla_data, "club_posicion": club_posicion}

        if intent == "prediction" and entities.get("clubes"):
            clubes_ids = entities["clubes"]
            partidos = await PartidoService.get_all(db)
            upcoming = [
                p for p in partidos
                if p.estado == "programado"
                and (not clubes_ids or p.local_id in clubes_ids or p.visitante_id in clubes_ids)
            ]
            return {"proximos": [p.model_dump() for p in upcoming]}

        if intent == "club_comparison" and len(entities.get("clubes", [])) >= 2:
            club_a_id, club_b_id = entities["clubes"][0], entities["clubes"][1]
            club_a = await ClubService.get_by_id(db, club_a_id)
            club_b = await ClubService.get_by_id(db, club_b_id)
            if not club_a or not club_b:
                return {"club_a": club_a.model_dump() if club_a else None, "club_b": club_b.model_dump() if club_b else None}
            a_data, b_data = club_a.model_dump(), club_b.model_dump()
            return {
                "club_a": a_data, "club_b": b_data,
                "comparison": {
                    "ventaja_ligas": a_data["titulos_liga"] - b_data["titulos_liga"],
                    "total_intl_a": len(a_data.get("titulos_internacionales", [])),
                    "total_intl_b": len(b_data.get("titulos_internacionales", [])),
                    "ventaja_intl": len(a_data.get("titulos_internacionales", [])) - len(b_data.get("titulos_internacionales", [])),
                    "a_mas_viejo": a_data["fundacion"] < b_data["fundacion"],
                }
            }

        if intent == "next_match" and entities.get("clubes"):
            club_id = entities["clubes"][0]
            partidos = await PartidoService.get_all(db)
            upcoming = sorted(
                [p for p in partidos if p.estado == "programado" and (p.local_id == club_id or p.visitante_id == club_id)],
                key=lambda p: p.fecha
            )[:3]
            matches = []
            for p in upcoming:
                pd = p.model_dump()
                es_local = pd["local_id"] == club_id
                rival_id = pd["visitante_id"] if es_local else pd["local_id"]
                rival = await ClubService.get_by_id(db, rival_id)
                pd["rival_nombre"] = rival.nombre if rival else "desconocido"
                pd["es_local"] = es_local
                matches.append(pd)
            return {"proximos": matches}

        return {}
