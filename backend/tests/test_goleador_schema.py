from backend.app.schemas.goleador import GoleadorOut, GoleadoresListOut

def test_goleador_out_from_dict():
    data = {
        "id": "test-001",
        "nombre": "Juan Perez",
        "club_id": "olimpia",
        "club_nombre": "Club Olimpia",
        "goles": 10,
        "asistencias": 5,
        "torneo": "Apertura 2026",
        "temporada": "2026"
    }
    goleador = GoleadorOut(**data)
    assert goleador.id == "test-001"
    assert goleador.goles == 10

def test_goleadores_list_out():
    goleadores = [
        GoleadorOut(
            id=f"test-{i}",
            nombre=f"Jugador {i}",
            club_id="olimpia",
            club_nombre="Club Olimpia",
            goles=10 - i,
            asistencias=i,
            torneo="Apertura 2026",
            temporada="2026"
        )
        for i in range(3)
    ]
    result = GoleadoresListOut(goleadores=goleadores, total=3)
    assert result.total == 3
    assert len(result.goleadores) == 3
