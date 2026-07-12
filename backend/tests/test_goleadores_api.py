import pytest


@pytest.mark.asyncio
async def test_get_goleadores(client):
    response = await client.get("/api/goleadores")
    assert response.status_code == 200
    data = response.json()
    assert "goleadores" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_goleadores_with_torneo(client):
    response = await client.get("/api/goleadores?torneo=Apertura+2026")
    assert response.status_code == 200
