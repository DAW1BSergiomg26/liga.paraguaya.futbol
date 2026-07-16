import pytest

from backend.app.models.goleador import Goleador
from tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_get_goleadores(client):
    response = await client.get("/api/v1/goleadores")
    assert response.status_code == 200
    data = response.json()
    assert "goleadores" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_goleadores_with_torneo(client):
    response = await client.get("/api/v1/goleadores?torneo=Apertura+2026")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_goleadores_historial_agrupa_por_jugador(client, db_session):
    await seed_test_data(db_session)
    db_session.add(Goleador(id="g1", nombre="Derlis Gonzalez", club_id="olimpia", goles=14, asistencias=5, torneo="Apertura 2026", temporada="2026"))
    db_session.add(Goleador(id="g2", nombre="Derlis Gonzalez", club_id="olimpia", goles=10, asistencias=2, torneo="Clausura 2026", temporada="2026"))
    db_session.add(Goleador(id="g3", nombre="Oscar Cardozo", club_id="libertad", goles=12, asistencias=3, torneo="Apertura 2026", temporada="2026"))
    await db_session.commit()

    response = await client.get("/api/v1/goleadores/historial")
    assert response.status_code == 200
    data = response.json()
    goleadores = data["goleadores"]
    # Derlis aparece una sola vez con goles acumulados (14 + 10 = 24)
    derlis = [g for g in goleadores if g["nombre"] == "Derlis Gonzalez"]
    assert len(derlis) == 1
    assert derlis[0]["goles"] == 24
    # Esta ordenado por goles descendente: Derlis (24) lidera sobre Oscar (12)
    assert goleadores[0]["nombre"] == "Derlis Gonzalez"
    assert goleadores[0]["torneo"] == "2 torneo(s)"

