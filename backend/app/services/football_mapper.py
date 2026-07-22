from ..services.football_config import TEAM_MAP

class FootballMapper:

    @staticmethod
    def map_partido(raw: dict) -> dict:
        return {
            "id": f"fd-{raw['id_api']}",
            "torneo": "Primera Division Paraguaya",
            "local_id": raw["local"],
            "visitante_id": raw["visitante"],
            "goles_local": raw.get("goles_local"),
            "goles_visitante": raw.get("goles_visitante"),
            "estado": raw.get("estado", "programado"),
            "jornada": raw.get("jornada", 1),
            "fecha": raw.get("fecha", ""),
            "temporada": "2026",
        }

    @staticmethod
    def map_tabla(raw: dict) -> list[dict]:
        rows = []
        for entry in raw.get("table", []):
            team_name = entry["team"]["name"]
            club_id = TEAM_MAP.get(team_name, team_name.lower().replace(" ", "-"))
            rows.append({
                "posicion": entry["position"],
                "club_id": club_id,
                "torneo": "Primera Division Paraguaya",
                "temporada": "2026",
                "pj": entry.get("playedGames", 0),
                "pg": entry.get("won", 0),
                "pe": entry.get("draw", 0),
                "pp": entry.get("lost", 0),
                "gf": entry.get("goalsFor", 0),
                "gc": entry.get("goalsAgainst", 0),
                "dg": entry.get("goalsFor", 0) - entry.get("goalsAgainst", 0),
                "puntos": entry.get("points", 0),
            })
        return rows

    @staticmethod
    def map_goleador(raw: dict, torneo: str) -> dict:
        player = raw.get("player", {})
        team = raw.get("team", {})
        team_name = team.get("name", "")
        club_id = TEAM_MAP.get(team_name, team_name.lower().replace(" ", "-"))
        return {
            "id": f"fd-{player.get('id', 0)}",
            "nombre": player.get("name", ""),
            "club_id": club_id,
            "goles": raw.get("goals", 0),
            "asistencias": raw.get("assists", 0) or 0,
            "torneo": torneo,
            "temporada": "2026",
        }
