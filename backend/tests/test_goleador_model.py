import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from backend.app.core.database import Base
from backend.app.models.goleador import Goleador

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_goleador_creation(db_session):
    goleador = Goleador(
        id="test-001",
        nombre="Juan Perez",
        club_id="olimpia",
        goles=10,
        asistencias=5,
        torneo="Apertura 2026",
        temporada="2026"
    )
    db_session.add(goleador)
    db_session.commit()
    result = db_session.query(Goleador).filter_by(id="test-001").first()
    assert result is not None
    assert result.nombre == "Juan Perez"
    assert result.goles == 10

def test_goleador_defaults(db_session):
    goleador = Goleador(
        id="test-002",
        nombre="Maria Lopez",
        club_id="libertad",
        torneo="Apertura 2026",
        temporada="2026"
    )
    db_session.add(goleador)
    db_session.commit()
    result = db_session.query(Goleador).filter_by(id="test-002").first()
    assert result.goles == 0
    assert result.asistencias == 0
