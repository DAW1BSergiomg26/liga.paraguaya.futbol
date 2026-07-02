import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_listar_clubes(client):
    response = await client.get("/api/v1/clubes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_listar_clubes_con_datos(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes")
    data = response.json()
    assert len(data) == 2
    assert data[0]["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_detalle_club_existente(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes/olimpia")
    assert response.status_code == 200
    assert response.json()["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_detalle_club_no_existente(client):
    response = await client.get("/api/v1/clubes/no-existe")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_filtrar_por_ciudad(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes?ciudad=Asunción")
    assert response.status_code == 200
    assert len(response.json()) == 2
