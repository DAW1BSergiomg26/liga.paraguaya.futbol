import pytest

from sqlalchemy import select

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.services.historial_service import HistorialService


@pytest.fixture
async def seed_historial(db_session):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="cerro", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="Ciclón", colores=[], estadio="GPR", escudo="c.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    rows = [
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="libertad", posicion=1, pj=22, pg=14, pe=6, pp=2, gf=42, gc=16, dg=26, puntos=48),
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="olimpia", posicion=2, pj=22, pg=13, pe=5, pp=4, gf=40, gc=20, dg=20, puntos=44),
        TablaPosicion(torneo="Torneo Apertura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=12, pe=5, pp=5, gf=35, gc=25, dg=10, puntos=41),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="olimpia", posicion=1, pj=22, pg=15, pe=4, pp=3, gf=45, gc=18, dg=27, puntos=49),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="libertad", posicion=2, pj=22, pg=14, pe=4, pp=4, gf=40, gc=20, dg=20, puntos=46),
        TablaPosicion(torneo="Torneo Clausura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=10, pe=6, pp=6, gf=30, gc=28, dg=2, puntos=36),
    ]
    for r in rows:
        db_session.add(r)
    await db_session.flush()


@pytest.mark.asyncio
async def test_get_campeones(db_session, seed_historial):
    svc = HistorialService(db_session)
    camp = await svc.get_campeones()
    assert len(camp) == 2
    assert camp[0].torneo == "Torneo Clausura 2024"
    assert camp[0].club_id == "olimpia"
    assert camp[0].ano == 2024
    assert camp[1].torneo == "Torneo Apertura 2024"
    assert camp[1].club_id == "libertad"


@pytest.mark.asyncio
async def test_get_ranking_clubes(db_session, seed_historial):
    svc = HistorialService(db_session)
    ranking = await svc.get_ranking_clubes()
    by_id = {r.club_id: r for r in ranking}
    assert by_id["libertad"].puntos == 94  # 48 + 46
    assert by_id["olimpia"].puntos == 93   # 44 + 49
    assert by_id["libertad"].titulos == 1
    assert by_id["olimpia"].titulos == 1
    assert by_id["cerro"].titulos == 0
    assert ranking[0].club_id == "libertad"


@pytest.mark.asyncio
async def test_get_club_historial(db_session, seed_historial):
    svc = HistorialService(db_session)
    hist = await svc.get_club_historial("olimpia")
    assert len(hist) == 2
    assert hist[0].torneo == "Torneo Clausura 2024"
    assert hist[1].torneo == "Torneo Apertura 2024"


@pytest.mark.asyncio
async def test_get_club_historial_inexistente(db_session):
    svc = HistorialService(db_session)
    assert await svc.get_club_historial("no-existe") == []
