import os
import pytest
from backend.app.services.football_config import TEAM_MAP, API_BASE_URL, COMPETITION_CODE, get_api_key

def test_team_map_has_12_clubs():
    assert len(TEAM_MAP) == 12

def test_team_map_values_are_strings():
    for key, value in TEAM_MAP.items():
        assert isinstance(value, str)

def test_api_base_url_is_valid():
    assert API_BASE_URL.startswith("https://")

def test_competition_code_is_string():
    assert isinstance(COMPETITION_CODE, str)
    assert len(COMPETITION_CODE) > 0

def test_get_api_key_reads_env(monkeypatch):
    monkeypatch.setenv("FOOTBALL_DATA_API_KEY", "test-key-123")
    assert get_api_key() == "test-key-123"

def test_get_api_key_raises_if_missing(monkeypatch):
    monkeypatch.delenv("FOOTBALL_DATA_API_KEY", raising=False)
    with pytest.raises(ValueError):
        get_api_key()
