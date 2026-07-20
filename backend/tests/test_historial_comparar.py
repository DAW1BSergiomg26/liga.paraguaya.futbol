from datetime import date

import pytest
from sqlalchemy import select

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.models.goleador import Goleador
from backend.app.models.transferencia import Transferencia
from backend.app.services.historial_service import HistorialService


@pytest.fixture
async def seed_comparar(db_session):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="Decano", colores=[], estadio="MF", escudo="o.png"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=[], estadio="NL", escudo="l.png"),
        Club(id="cerro", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="Ciclón", colores=[], estadio="GPR", escudo="c.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    tabla_rows = [
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="olimpia", posicion=2, pj=22, pg=13, pe=5, pp=4, gf=40, gc=20, dg=20, puntos=44),
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="libertad", posicion=1, pj=22, pg=14, pe=6, pp=2, gf=42, gc=16, dg=26, puntos=48),
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=12, pe=5, pp=5, gf=35, gc=25, dg=10, puntos=41),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="olimpia", posicion=1, pj=22, pg=15, pe=4, pp=3, gf=45, gc=18, dg=27, puntos=49),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="libertad", posicion=2, pj=22, pg=14, pe=4, pp=4, gf=40, gc=20, dg=20, puntos=46),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="cerro", posicion=3, pj=22, pg=10, pe=6, pp=6, gf=30, gc=28, dg=2, puntos=36),
    ]
    for r in tabla_rows:
        db_session.add(r)
    await db_session.flush()

    goleadores = [
        Goleador(id="g1", nombre="Golero A", club_id="olimpia", goles=15, asistencias=3, torneo="Apertura 2024", temporada="2024"),
        Goleador(id="g2", nombre="Golero B", club_id="olimpia", goles=10, asistencias=5, torneo="Clausura 2024", temporada="2024"),
        Goleador(id="g3", nombre="Golero C", club_id="libertad", goles=12, asistencias=2, torneo="Apertura 2024", temporada="2024"),
        Goleador(id="g4", nombre="Golero D", club_id="libertad", goles=8, asistencias=1, torneo="Clausura 2024", temporada="2024"),
    ]
    for g in goleadores:
        db_session.add(g)
    await db_session.flush()

    transferencias = [
        Transferencia(jugador_nombre="Ref1", club_destino_id="olimpia", fecha=date(2024, 1, 15), tipo="compra", estado="confirmada", monto=500000),
        Transferencia(jugador_nombre="Ref2", club_destino_id="libertad", fecha=date(2024, 2, 1), tipo="compra", estado="confirmada", monto=300000),
        Transferencia(jugador_nombre="Ref3", club_destino_id="libertad", fecha=date(2024, 3, 1), tipo="compra", estado="confirmada", monto=200000),
    ]
    for t in transferencias:
        db_session.add(t)
    await db_session.flush()


@pytest.mark.asyncio
async def test_comparar_clubes_normalizacion(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "libertad")
    for metrica in [result.club_a.metricas, result.club_b.metricas]:
        assert 0 <= metrica.ataque <= 100
        assert 0 <= metrica.defensa <= 100
        assert 0 <= metrica.rendimiento <= 100
        assert 0 <= metrica.palmares <= 100
        assert 0 <= metrica.gol_individual <= 100
        assert 0 <= metrica.actividad_mercado <= 100


@pytest.mark.asyncio
async def test_comparar_clubes_diferentes(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "libertad")
    assert result.club_a.club_id == "olimpia"
    assert result.club_b.club_id == "libertad"
    assert result.club_a.metricas.ataque != result.club_b.metricas.ataque


@pytest.mark.asyncio
async def test_comparar_clubes_palmares(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "libertad")
    assert result.club_a.metricas.palmares == 100.0
    assert result.club_b.metricas.palmares == 100.0


@pytest.mark.asyncio
async def test_comparar_clubes_sin_goleadores(db_session, seed_comparar):
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia", "cerro")
    assert result.club_b.metricas.gol_individual == 0.0


@pytest.mark.asyncio
async def test_comparar_clubes_pj_zero(db_session):
    clubs = [
        Club(id="nuevo", nombre="Club Nuevo", ciudad="Test", apodo="Test", colores=[], estadio="Test", escudo="t.png"),
        Club(id="otro", nombre="Club Otro", ciudad="Test", apodo="Test", colores=[], estadio="Test", escudo="t2.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()
    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("nuevo", "otro")
    assert result.club_a.metricas.ataque == 0.0
    assert result.club_a.metricas.defensa == 0.0
    assert result.club_a.metricas.rendimiento == 0.0


@pytest.mark.asyncio
async def test_comparar_clubes_endpoint(client, db_session, seed_comparar):
    resp = await client.get("/api/v1/historial/comparar?club_a=olimpia&club_b=libertad")
    assert resp.status_code == 200
    data = resp.json()
    assert "club_a" in data
    assert "club_b" in data
    assert data["club_a"]["club_id"] == "olimpia"
    assert "metricas" in data["club_a"]
    assert "ataque" in data["club_a"]["metricas"]


@pytest.mark.asyncio
async def test_comparar_clubes_endpoint_missing_param(client, db_session, seed_comparar):
    resp = await client.get("/api/v1/historial/comparar?club_a=olimpia")
    assert resp.status_code == 422
