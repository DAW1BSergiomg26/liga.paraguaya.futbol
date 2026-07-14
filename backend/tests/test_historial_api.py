import pytest

from sqlalchemy import select

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion


@pytest.fixture
async def seed_historial(db_session):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()
    rows = [
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="libertad", posicion=1, pj=22, pg=14, pe=6, pp=2, gf=42, gc=16, dg=26, puntos=48),
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="olimpia", posicion=2, pj=22, pg=13, pe=5, pp=4, gf=40, gc=20, dg=20, puntos=44),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="olimpia", posicion=1, pj=22, pg=15, pe=4, pp=3, gf=45, gc=18, dg=27, puntos=49),
    ]
    for r in rows:
        db_session.add(r)
    await db_session.flush()


@pytest.mark.asyncio
async def test_campeones_endpoint(client, db_session, seed_historial):
    resp = await client.get("/api/v1/historial/campeones")
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["torneo"] == "Torneo Clausura 2024"
    assert data[0]["club"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_ranking_endpoint(client, db_session, seed_historial):
    resp = await client.get("/api/v1/historial/ranking-clubes")
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["club_id"] == "olimpia"  # 49+44=93 vs libertad 48
    assert data[0]["titulos"] == 1


@pytest.mark.asyncio
async def test_club_historial_endpoint(client, db_session, seed_historial):
    resp = await client.get("/api/v1/historial/club/olimpia")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["torneo"] == "Torneo Clausura 2024"


@pytest.mark.asyncio
async def test_club_historial_inexistente(client, db_session):
    resp = await client.get("/api/v1/historial/club/xyz")
    assert resp.status_code == 200
    assert resp.json() == []
