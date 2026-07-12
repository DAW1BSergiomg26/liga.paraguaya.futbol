import logging
from datetime import datetime
from typing import Optional
import httpx
from backend.app.services.football_config import API_BASE_URL, ENDPOINTS, TEAM_MAP, get_api_key

logger = logging.getLogger(__name__)

class FootballDataError(Exception):
    pass

class RateLimitError(FootballDataError):
    pass

class DataNotFoundError(FootballDataError):
    pass

class FootballDataService:

    @staticmethod
    def _make_request(endpoint: str) -> dict:
        api_key = get_api_key()
        url = f"{API_BASE_URL}{endpoint}"
        headers = {"X-Auth-Token": api_key}
        try:
            response = httpx.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise RateLimitError("Rate limit excedido.")
            elif e.response.status_code == 404:
                raise DataNotFoundError(f"No se encontraron datos para: {endpoint}")
            else:
                raise FootballDataError(f"Error HTTP {e.response.status_code}")

    @staticmethod
    def fetch_partidos() -> list[dict]:
        data = FootballDataService._make_request(ENDPOINTS["matches"])
        partidos = []
        for match in data.get("matches", []):
            home_name = match["homeTeam"]["name"]
            away_name = match["awayTeam"]["name"]
            local_id = TEAM_MAP.get(home_name, home_name.lower().replace(" ", "-"))
            visitante_id = TEAM_MAP.get(away_name, away_name.lower().replace(" ", "-"))
            score = match.get("score", {}).get("fullTime", {})
            status_map = {
                "FINISHED": "finalizado",
                "IN_PLAY": "en_vivo",
                "PAUSED": "en_vivo",
                "SCHEDULED": "programado",
                "TIMED": "programado",
            }
            partidos.append({
                "id_api": match["id"],
                "local": local_id,
                "visitante": visitante_id,
                "goles_local": score.get("home"),
                "goles_visitante": score.get("away"),
                "estado": status_map.get(match.get("status", ""), "programado"),
                "jornada": match.get("matchday", 1),
                "fecha": match.get("utcDate", ""),
            })
        return partidos
