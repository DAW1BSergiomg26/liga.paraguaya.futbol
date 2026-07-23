import pytest
from sqlalchemy import select

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion


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


@pytest.fixture
async def seed_tabla_multijornada(db_session):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="cerro", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="Ciclón", colores=[], estadio="GPR", escudo="c.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    # jornada==0: fila acumulada (una por club) - estas SÍ se cuentan
    # olimpia: 22 pj, 40 gf  |  cerro: 22 pj, 30 gf
    db_session.add(TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="olimpia", posicion=1, pj=22, pg=13, pe=5, pp=4, gf=40, gc=20, dg=20, puntos=44))
    db_session.add(TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="cerro", posicion=2, pj=22, pg=12, pe=5, pp=5, gf=30, gc=25, dg=10, puntos=41))
    # jornada==1: fila semanal (NO debe contar)
    db_session.add(TablaPosicion(torneo="Apertura 2024", jornada=1, club_id="olimpia", posicion=1, pj=1, pg=1, pe=0, pp=0, gf=2, gc=0, dg=2, puntos=3))
    db_session.add(TablaPosicion(torneo="Apertura 2024", jornada=1, club_id="cerro", posicion=2, pj=1, pg=0, pe=1, pp=0, gf=1, gc=1, dg=0, puntos=1))
    await db_session.flush()


@pytest.mark.asyncio
async def test_stats_global_filtra_jornada_0(client, db_session, seed_tabla_multijornada):
    """El hero solo debe contar la fila acumulada (jornada==0), no las semanales."""
    resp = await client.get("/api/v1/stats/global")
    assert resp.status_code == 200
    data = resp.json()

    # Solo jornada==0: olimpia(40) + cerro(30) = 70 goles totales
    assert data["total_goles"] == 70, (
        f"Debe contar solo goles de jornada==0 (70), no {data['total_goles']}"
    )
    # Solo jornada==0: (olimpia 22 + cerro 22) / 2 = 22 partidos
    assert data["total_partidos"] == 22, (
        f"Debe contar solo partidos de jornada==0 (22), no {data['total_partidos']}"
    )
