import json

import pytest

from backend.app.models.tabla import TablaPosicion


@pytest.fixture
def historico_data(tmp_path):
    """Create a temp partidos_historicos dir with one JSON file."""
    d = tmp_path / "partidos_historicos"
    d.mkdir()
    rows = [
        {
            "torneo": "Torneo Apertura 2024",
            "anio": "2024",
            "club_id": "olimpia",
            "club": "Club Olimpia",
            "posicion": 1,
            "pj": 22,
            "pg": 14,
            "pe": 6,
            "pp": 2,
            "gf": 42,
            "gc": 16,
            "dg": 26,
            "puntos": 48,
        },
        {
            "torneo": "Torneo Clausura 2024",
            "anio": "2024",
            "club_id": "cerro-porteno",
            "club": "Club Cerro Porteño",
            "posicion": 2,
            "pj": 22,
            "pg": 13,
            "pe": 5,
            "pp": 4,
            "gf": 35,
            "gc": 18,
            "dg": 17,
            "puntos": 44,
        },
    ]
    (d / "temporada_2024.json").write_text(json.dumps(rows), encoding="utf-8")
    return {"dir": d, "parent": tmp_path}


@pytest.mark.asyncio
async def test_seed_tabla_historico_inserts_rows(db_session, historico_data, monkeypatch):
    import backend.app.scripts.seed as seed_mod

    monkeypatch.setattr(seed_mod, "HISTORICO_DIR", historico_data["dir"])
    monkeypatch.setattr(seed_mod, "DATA_DIR", historico_data["parent"])

    await seed_mod.seed_tabla_historico(db_session)
    await db_session.commit()

    result = await db_session.execute(
        TablaPosicion.__table__.select().order_by(TablaPosicion.club_id)
    )
    rows = result.all()
    assert len(rows) == 2

    cerro = rows[0]
    assert cerro.torneo == "Torneo Clausura 2024"
    assert cerro.jornada == 0
    assert cerro.club_id == "cerro-porteno"
    assert cerro.puntos == 44

    olimpia = rows[1]
    assert olimpia.torneo == "Torneo Apertura 2024"
    assert olimpia.jornada == 0
    assert olimpia.club_id == "olimpia"
    assert olimpia.posicion == 1
    assert olimpia.pj == 22
    assert olimpia.pg == 14
    assert olimpia.pe == 6
    assert olimpia.pp == 2
    assert olimpia.gf == 42
    assert olimpia.gc == 16
    assert olimpia.dg == 26
    assert olimpia.puntos == 48


@pytest.mark.asyncio
async def test_seed_tabla_historico_dedup(db_session, historico_data, monkeypatch):
    import backend.app.scripts.seed as seed_mod

    monkeypatch.setattr(seed_mod, "HISTORICO_DIR", historico_data["dir"])
    monkeypatch.setattr(seed_mod, "DATA_DIR", historico_data["parent"])

    await seed_mod.seed_tabla_historico(db_session)
    await db_session.commit()

    await seed_mod.seed_tabla_historico(db_session)
    await db_session.commit()

    result = await db_session.execute(
        TablaPosicion.__table__.select()
    )
    rows = result.all()
    assert len(rows) == 2


@pytest.mark.asyncio
async def test_seed_tabla_historico_no_files(db_session, tmp_path, monkeypatch):
    import backend.app.scripts.seed as seed_mod

    empty_dir = tmp_path / "partidos_historicos"
    empty_dir.mkdir()
    monkeypatch.setattr(seed_mod, "HISTORICO_DIR", empty_dir)
    monkeypatch.setattr(seed_mod, "DATA_DIR", tmp_path)

    await seed_mod.seed_tabla_historico(db_session)
    await db_session.commit()

    result = await db_session.execute(
        TablaPosicion.__table__.select()
    )
    rows = result.all()
    assert len(rows) == 0
