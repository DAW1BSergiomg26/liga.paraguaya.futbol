import pytest


@pytest.mark.asyncio
async def test_health_returns_200(client, db_session):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_returns_ok_status(client, db_session):
    response = await client.get("/api/v1/health")
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_includes_database_check(client, db_session):
    response = await client.get("/api/v1/health")
    data = response.json()
    assert "database" in data
    assert data["database"] in ("ok", "error")


@pytest.mark.asyncio
async def test_health_includes_timestamp(client, db_session):
    response = await client.get("/api/v1/health")
    data = response.json()
    assert "timestamp" in data
    assert isinstance(data["timestamp"], str)
