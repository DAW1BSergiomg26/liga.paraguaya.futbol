from fastapi.testclient import TestClient
from backend.app.main import app


client = TestClient(app)


def test_tactico_equipo_returns_200():
    response = client.get("/api/v1/tactico/equipo/cerro")
    assert response.status_code == 200


def test_tactico_equipo_returns_expected_fields():
    response = client.get("/api/v1/tactico/equipo/cerro")
    data = response.json()
    assert "equipo_id" in data
    assert "nombre" in data
    assert "formacion_principal" in data
    assert "jugadores" in data
    assert "stats" in data
    assert "tendencias" in data


def test_tactico_equipo_jugadores_count():
    response = client.get("/api/v1/tactico/equipo/cerro")
    data = response.json()
    assert len(data["jugadores"]) == 11


def test_tactico_equipo_stats_fields():
    response = client.get("/api/v1/tactico/equipo/cerro")
    stats = response.json()["stats"]
    required_fields = ["xg", "posesion", "tiros_puerta", "pases_completados", "duelos_ganados", "corners"]
    for field in required_fields:
        assert field in stats


def test_tactico_equipo_invalid_id_returns_404():
    response = client.get("/api/v1/tactico/equipo/equipo_inexistente")
    assert response.status_code == 404
