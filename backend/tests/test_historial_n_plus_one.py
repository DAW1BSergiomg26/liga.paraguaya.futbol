import pytest
import sqlalchemy
from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.services.historial_service import HistorialService


@pytest.fixture
async def seed_many_torneos(db_session):
    """Seed 8 torneos with champions to test query count."""
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="cerro", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="Ciclón", colores=[], estadio="GPR", escudo="c.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    torneos = [
        ("Apertura 2020", "olimpia", 1),
        ("Clausura 2020", "cerro", 1),
        ("Apertura 2021", "libertad", 1),
        ("Clausura 2021", "olimpia", 1),
        ("Apertura 2022", "cerro", 1),
        ("Clausura 2022", "libertad", 1),
        ("Apertura 2023", "olimpia", 1),
        ("Clausura 2023", "cerro", 1),
    ]
    for torneo, club_id, pos in torneos:
        db_session.add(
            TablaPosicion(torneo=torneo, jornada=0, club_id=club_id,
                          posicion=pos, pj=22, pg=15, pe=4, pp=3,
                          gf=45, gc=18, dg=27, puntos=49)
        )
    await db_session.flush()


@pytest.mark.asyncio
async def test_get_campeones_uses_single_query(db_session, seed_many_torneos):
    """get_campeones should use ≤3 queries total, not 1 + N."""
    query_count = 0

    def count_queries(conn, cursor, statement, parameters, context, executemany):
        nonlocal query_count
        query_count += 1

    sqlalchemy.event.listen(db_session.get_bind(), "before_cursor_execute", count_queries)

    svc = HistorialService(db_session)
    result = await svc.get_campeones()
    assert len(result) == 8
    assert all(c.club_id is not None for c in result)
    assert query_count <= 3, f"Expected ≤3 queries, got {query_count}"


@pytest.mark.asyncio
async def test_get_ranking_uses_sql_aggregation(db_session, seed_many_torneos):
    """get_ranking_clubes should aggregate via SQL, not load all rows."""
    query_count = 0

    def count_queries(conn, cursor, statement, parameters, context, executemany):
        nonlocal query_count
        query_count += 1

    sqlalchemy.event.listen(db_session.get_bind(), "before_cursor_execute", count_queries)

    svc = HistorialService(db_session)
    result = await svc.get_ranking_clubes()
    assert len(result) == 3
    totals = {r.club_id: r.puntos for r in result}
    assert totals["olimpia"] == 147  # 49*3
    assert totals["cerro"] == 147    # 49*3
    assert totals["libertad"] == 98  # 49*2
    assert query_count <= 3, f"Expected ≤3 queries, got {query_count}"
