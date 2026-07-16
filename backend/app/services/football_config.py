import os

API_BASE_URL = "https://api.football-data.org/v4"
COMPETITION_CODE = "PA1"

TEAM_MAP = {
    "Club Olimpia": "olimpia",
    "Cerro Porteno": "cerro-porteno",
    "Club Libertad": "libertad",
    "Club Guarani": "guarani",
    "Club Nacional": "nacional",
    "Sportivo Luqueno": "luqueno",
    "Club Sportivo San Lorenzo": "san-lorenzo",
    "Deportivo Santani": "santani",
    "Sportivo Trinidense": "trinidense",
    "General Diaz": "general-diaz",
    "Deportivo Capiata": "deportivo-capiata",
    "Ameliano": "ameliano",
}

ENDPOINTS = {
    "matches": f"/competitions/{COMPETITION_CODE}/matches",
    "standings": f"/competitions/{COMPETITION_CODE}/standings",
    "scorers": f"/competitions/{COMPETITION_CODE}/scorers",
}

def get_api_key() -> str:
    key = os.environ.get("FOOTBALL_DATA_API_KEY")
    if not key:
        raise ValueError(
            "FOOTBALL_DATA_API_KEY no esta configurada. "
            "Obteni tu key gratis en https://www.football-data.org/client/register"
        )
    return key
