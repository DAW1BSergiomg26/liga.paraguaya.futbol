import os
import pytest
import respx
import httpx
from backend.app.services.football_data_service import FootballDataService

@pytest.fixture(autouse=True)
def set_api_key(monkeypatch):
    monkeypatch.setenv("FOOTBALL_DATA_API_KEY", "test-key")

@pytest.fixture
def mock_api():
    with respx.mock:
        yield

def test_fetch_partidos_success(mock_api):
    mock_response = {
        "matches": [
            {
                "id": 12345,
                "homeTeam": {"name": "Club Olimpia"},
                "awayTeam": {"name": "Cerro Porteno"},
                "score": {"fullTime": {"home": 2, "away": 1}},
                "status": "FINISHED",
                "matchday": 1,
                "utcDate": "2026-01-31T20:00:00Z"
            }
        ]
    }
    respx.get("https://api.football-data.org/v4/competitions/PA1/matches").mock(
        return_value=httpx.Response(200, json=mock_response)
    )
    result = FootballDataService.fetch_partidos()
    assert len(result) == 1
    assert result[0]["local"] == "olimpia"
    assert result[0]["visitante"] == "cerro-porteno"
    assert result[0]["goles_local"] == 2

def test_fetch_partidos_maps_team_names(mock_api):
    mock_response = {
        "matches": [
            {
                "id": 12346,
                "homeTeam": {"name": "Club Libertad"},
                "awayTeam": {"name": "Sportivo Luqueno"},
                "score": {"fullTime": {"home": 0, "away": 0}},
                "status": "FINISHED",
                "matchday": 1,
                "utcDate": "2026-01-31T22:00:00Z"
            }
        ]
    }
    respx.get("https://api.football-data.org/v4/competitions/PA1/matches").mock(
        return_value=httpx.Response(200, json=mock_response)
    )
    result = FootballDataService.fetch_partidos()
    assert result[0]["local"] == "libertad"
    assert result[0]["visitante"] == "luqueno"
