import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app


@pytest.mark.asyncio
async def test_noticias_endpoint_returns_ok():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/noticias")
    assert resp.status_code == 200
    data = resp.json()
    assert "noticias" in data
    assert "fuentes" in data
    assert "actualizado" in data
    assert isinstance(data["noticias"], list)
    assert isinstance(data["fuentes"], list)
