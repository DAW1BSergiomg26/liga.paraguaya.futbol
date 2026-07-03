import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_listar_partidos(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


@pytest.mark.asyncio
async def test_detalle_partido(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos/p001")
    assert response.status_code == 200
    data = response.json()
    assert data["local_id"] == "olimpia"


@pytest.mark.asyncio
async def test_detalle_partido_no_existente(client):
    response = await client.get("/api/v1/partidos/no-existe")
    assert response.status_code == 404
