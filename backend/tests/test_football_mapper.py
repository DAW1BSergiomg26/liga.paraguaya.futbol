from backend.app.services.football_mapper import FootballMapper

def test_map_partido():
    raw = {
        "id_api": 12345,
        "local": "olimpia",
        "visitante": "cerro-porteno",
        "goles_local": 2,
        "goles_visitante": 1,
        "estado": "finalizado",
        "jornada": 1,
        "fecha": "2026-01-31T20:00:00Z",
    }
    result = FootballMapper.map_partido(raw)
    assert result["id"] == "fd-12345"
    assert result["local_id"] == "olimpia"
    assert result["torneo"] == "Primera Division Paraguaya"

def test_map_tabla():
    raw = {
        "stage": "REGULAR_SEASON",
        "table": [
            {
                "position": 1,
                "team": {"name": "Club Olimpia", "id": 1001},
                "playedGames": 10,
                "won": 7,
                "draw": 2,
                "lost": 1,
                "goalsFor": 20,
                "goalsAgainst": 8,
                "points": 23,
            }
        ]
    }
    result = FootballMapper.map_tabla(raw)
    assert len(result) == 1
    assert result[0]["posicion"] == 1
    assert result[0]["club_id"] == "olimpia"
    assert result[0]["puntos"] == 23

def test_map_goleador():
    raw = {
        "player": {"name": "Juan Perez", "id": 2001},
        "team": {"name": "Club Olimpia", "id": 1001},
        "goals": 10,
        "assists": 5,
    }
    result = FootballMapper.map_goleador(raw, "Apertura 2026")
    assert result["id"] == "fd-2001"
    assert result["nombre"] == "Juan Perez"
    assert result["goles"] == 10
