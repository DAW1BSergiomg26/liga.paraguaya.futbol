import pytest


@pytest.mark.asyncio
async def test_stats_global_returns_200(client):
    resp = await client.get("/api/v1/stats/global")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_partidos" in data
    assert "total_goles" in data
    assert "total_clubes" in data
    assert isinstance(data["total_partidos"], int)
    assert isinstance(data["total_goles"], int)
    assert isinstance(data["total_clubes"], int)
