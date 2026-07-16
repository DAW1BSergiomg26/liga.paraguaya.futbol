import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timezone

from backend.app.services.partido_service import PartidoService


class TestMarcadorEndpoint:
    @pytest.mark.asyncio
    async def test_marcadores_empty_when_no_en_vivo(self, client: AsyncClient):
        resp = await client.get("/api/v1/partidos/marcadores")
        assert resp.status_code == 200
        assert resp.json() == {}


class TestGetEnVivo:
    @pytest.mark.asyncio
    async def test_get_en_vivo_empty(self):
        db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        db.execute = AsyncMock(return_value=mock_result)

        result = await PartidoService.get_en_vivo(db)
        assert result == []

    @pytest.mark.asyncio
    async def test_get_en_vivo_filters_only_en_vivo(self):
        from backend.app.models.partido import Partido

        db = AsyncMock(spec=AsyncSession)
        live = MagicMock(spec=Partido, id="p1", estado="en_vivo", goles_local=1, goles_visitante=0,
                         fecha=date.today())
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [live]
        db.execute = AsyncMock(return_value=mock_result)

        result = await PartidoService.get_en_vivo(db)
        assert len(result) == 1
        assert result[0].id == "p1"
