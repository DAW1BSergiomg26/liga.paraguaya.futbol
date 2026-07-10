import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.schemas.partido import H2HOut, ClubResumen, MayorGoleada, H2HPartidoItem
from backend.app.services.partido_service import PartidoService


class TestH2HSchemas:
    def test_club_resumen_fields(self):
        c = ClubResumen(id="c1", nombre="Olimpia", escudo="https://example.com/escudo.svg")
        assert c.id == "c1"
        assert c.nombre == "Olimpia"
        assert c.escudo == "https://example.com/escudo.svg"

    def test_mayor_goleada_fields(self):
        m = MayorGoleada(goles=5, fecha="2024-03-10", goles_recibidos=1)
        assert m.goles == 5
        assert m.goles_recibidos == 1

    def test_h2h_partido_item_fields(self):
        p = H2HPartidoItem(
            id="p1", torneo="Apertura", jornada=5, fecha="2024-03-10",
            estado="finalizado", goles_local=2, goles_visitante=1,
            local_id="c1", visitante_id="c2"
        )
        assert p.goles_local == 2

    def test_h2h_out_structure(self):
        ca = ClubResumen(id="c1", nombre="Olimpia", escudo="")
        cb = ClubResumen(id="c2", nombre="Cerro", escudo="")
        resumen = {"pj": 10, "victorias_a": 4, "empates": 2, "victorias_b": 4,
                    "goles_a": 12, "goles_b": 11,
                    "mayor_goleada_a": MayorGoleada(goles=3, fecha="2024-01-01", goles_recibidos=0),
                    "mayor_goleada_b": None}
        h2h = H2HOut(club_a=ca, club_b=cb, resumen=resumen, partidos=[])
        assert h2h.club_a.nombre == "Olimpia"
        assert h2h.resumen["pj"] == 10


class TestH2HService:
    @pytest.mark.asyncio
    async def test_get_h2h_empty(self):
        db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=mock_result)
        db.get = AsyncMock(return_value=None)

        result = await PartidoService.get_h2h(db, "c1", "c2")
        assert result.club_a.id == "c1"
        assert result.club_b.id == "c2"
        assert result.partidos == []
        assert result.resumen["pj"] == 0
        assert result.resumen["victorias_a"] == 0
        assert result.resumen["empates"] == 0
        assert result.resumen["victorias_b"] == 0
        assert result.resumen["goles_a"] == 0
        assert result.resumen["goles_b"] == 0
        assert result.resumen["mayor_goleada_a"] is None
        assert result.resumen["mayor_goleada_b"] is None
