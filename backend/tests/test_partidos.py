import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_listar_partidos(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == 1
    assert data["total"] == 1


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


@pytest.mark.asyncio
async def test_listar_partidos_paginado(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos?page=1&per_page=10")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
    assert "page" in data
    assert "per_page" in data
    assert "total_pages" in data
    assert len(data["data"]) == 1
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["per_page"] == 10
    assert data["total_pages"] == 1


@pytest.mark.asyncio
async def test_listar_partidos_pagina_vacia(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos?page=99&per_page=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0
    assert data["page"] == 99
