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


@pytest.mark.asyncio
async def test_defensa_mayor_con_menos_goles(db_session):
    """El club que concede MENOS goles por partido debe tener MAYOR defensa.

    Reproduce el bug exacto: cuando gc ≥ pj para un club (gc/pj ≥ 1),
    la fórmula 1-(gc/pj) da ≤ 0 → se clampea a 0. Si el otro club
    tiene gc < pj, ese queda como máximo → 100. Resultado invertido.
    """
    clubs = [
        Club(id="buena", nombre="Buena Defensa", ciudad="Test", apodo="BD", colores=[], estadio="Test", escudo="bd.png"),
        Club(id="mala", nombre="Mala Defensa", ciudad="Test", apodo="MD", colores=[], estadio="Test", escudo="md.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    # Buena defensa: concede 0.45 goles/partido (10/22) → gc < pj ✓
    # Mala defensa: concede 1.82 goles/partido (40/22) → gc > pj ✓
    tabla_rows = [
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="buena", posicion=1, pj=22, pg=15, pe=5, pp=2, gf=40, gc=10, dg=30, puntos=50),
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="mala", posicion=3, pj=22, pg=8, pe=4, pp=10, gf=25, gc=40, dg=-15, puntos=28),
    ]
    for r in tabla_rows:
        db_session.add(r)
    await db_session.flush()

    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("buena", "mala")
    buena_def = result.club_a.metricas.defensa
    mala_def = result.club_b.metricas.defensa

    # Ambas deben estar en rango válido
    assert 0 <= buena_def <= 100, f"buena_def fuera de rango: {buena_def}"
    assert 0 <= mala_def <= 100, f"mala_def fuera de rango: {mala_def}"

    # FIX esperado: buena_def > mala_def (menos goles = mejor defensa)
    assert buena_def > mala_def, (
        f"Defensa invertida: club con MENOS goles ({buena_def}) "
        f"<= club con MÁS goles ({mala_def})"
    )
    # Club con 10 gc en 22 pj no puede tener defensa=0
    assert buena_def > 0, "Club con datos defensivos reales no puede tener defensa=0"
    # Club con gc > pj (40>22) no debe arrastrar la normalización a 0
    # BUG: mala_def actualmente = 0.0 por clamp, el fix debe dar un valor > 0
    assert mala_def > 0, (
        f"Club con gc/pj=1.82 debería tener defensa > 0 (tiene datos reales), "
        f"no {mala_def}"
    )


@pytest.mark.asyncio
async def test_defensa_no_cero_si_gc_menor_que_pj(db_session):
    """Un club con gc < pj no puede tener defensa=0.

    Reproduce bug de Olimpia: gc=38, pj=44 → fórmula actual da
    1-(38/44)=0.136, que tras normalización puede dar 0 si el máximo
    es mucho mayor (otro club con gc/pj muy bajo).
    """
    clubs = [
        Club(id="olimpia_t", nombre="Olimpia Test", ciudad="Test", apodo="O", colores=[], estadio="Test", escudo="o.png"),
        Club(id="cerro_t", nombre="Cerro Test", ciudad="Test", apodo="C", colores=[], estadio="Test", escudo="c.png"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()

    # Olimpia: gc=38, pj=44 → gc/pj=0.86 → 1-(gc/pj)=0.136
    # Cerro: gc=53, pj=44 → gc/pj=1.20 → 1-(gc/pj)=-0.20 → clamp 0
    tabla_rows = [
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="olimpia_t", posicion=1, pj=22, pg=13, pe=5, pp=4, gf=40, gc=19, dg=21, puntos=44),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="olimpia_t", posicion=2, pj=22, pg=14, pe=4, pp=4, gf=38, gc=19, dg=19, puntos=46),
        TablaPosicion(torneo="Apertura 2024", jornada=0, club_id="cerro_t", posicion=3, pj=22, pg=10, pe=6, pp=6, gf=30, gc=26, dg=4, puntos=36),
        TablaPosicion(torneo="Clausura 2024", jornada=0, club_id="cerro_t", posicion=4, pj=22, pg=9, pe=5, pp=8, gf=28, gc=27, dg=1, puntos=32),
    ]
    for r in tabla_rows:
        db_session.add(r)
    await db_session.flush()

    svc = HistorialService(db_session)
    result = await svc.comparar_clubes("olimpia_t", "cerro_t")
    olimpia_def = result.club_a.metricas.defensa
    cerro_def = result.club_b.metricas.defensa

    # Olimpia (gc/pj=0.86) > Cerro (gc/pj=1.20) en defensa
    assert olimpia_def > cerro_def, (
        f"Olimpia (gc/pj=0.86) debería > Cerro (gc/pj=1.20): "
        f"Olimpia={olimpia_def}, Cerro={cerro_def}"
    )
    # Olimpia con gc < pj no puede tener defensa=0
    assert olimpia_def > 0, (
        f"Olimpia con gc=38, pj=44 no puede tener defensa=0.0"
    )
