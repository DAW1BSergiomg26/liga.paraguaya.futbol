import re

_CLUB_ALIASES: dict[str, str] = {
    "olimpia": "olimpia",
    "olimpi": "olimpia",
    "el decano": "olimpia",
    "decano": "olimpia",
    "cerro porteÃ±o": "cerro-porteno",
    "cerro porteno": "cerro-porteno",
    "cerro": "cerro-porteno",
    "cerri": "cerro-porteno",
    "el ciclÃ³n": "cerro-porteno",
    "el ciclon": "cerro-porteno",
    "ciclÃ³n": "cerro-porteno",
    "ciclon": "cerro-porteno",
    "libertad": "libertad",
    "liberta": "libertad",
    "gumarelo": "libertad",
    "guaranÃ­": "guarani",
    "guarani": "guarani",
    "guara": "guarani",
    "el aborigen": "guarani",
    "aborigen": "guarani",
    "nacional": "nacional",
    "naciona": "nacional",
    "tricolor": "nacional",
    "sol de amÃ©rica": "sol-de-america",
    "sol de america": "sol-de-america",
    "sol": "sol-de-america",
    "luqueÃ±o": "sportivo-luqueno",
    "sportivo luqueÃ±o": "sportivo-luqueno",
    "sportivo luqueno": "sportivo-luqueno",
    "luque": "sportivo-luqueno",
    "luqueno": "sportivo-luqueno",
    "capiatÃ¡": "deportivo-capiat",
    "deportivo capiatÃ¡": "deportivo-capiat",
    "capia": "deportivo-capiat",
    "tacuary": "tacuary",
    "tacua": "tacuary",
    "2 de mayo": "2-de-mayo",
    "dos de mayo": "2-de-mayo",
}

_FECHA_KEYWORDS: dict[str, str] = {
    "Ãºltimo": "ultimo",
    "ultimo": "ultimo",
    "Ãºltima": "ultimo",
    "ultima": "ultimo",
    "prÃ³ximo": "proximo",
    "proximo": "proximo",
    "prÃ³xima": "proximo",
    "proxima": "proximo",
    "ayer": "ayer",
    "pasado": "ultimo",
    "anterior": "ultimo",
    "hoy": "hoy",
    "ahora": "proximo",
    "siguiente": "proximo",
    "prÃ³ximos": "proximo",
    "proximos": "proximo",
    "prÃ³ximas": "proximo",
    "proximas": "proximo",
}

_TORNEO_KEYWORDS = ["apertura", "clausura", "torneo", "liga", "campeonato", "copa", "copas"]


class CerezoEntityExtractor:

    @staticmethod
    async def extract(text: str, intent: str) -> dict:
        text_lower = text.lower()
        clubes = []
        for alias, club_id in _CLUB_ALIASES.items():
            if alias in text_lower and club_id not in clubes:
                clubes.append(club_id)

        fecha = None
        for keyword, value in _FECHA_KEYWORDS.items():
            if keyword in text_lower:
                fecha = value
                break

        torneo = None
        for t in _TORNEO_KEYWORDS:
            if t in text_lower:
                match = re.search(rf"{t}\s*(\d{{4}})?", text_lower)
                if match:
                    year = match.group(1) or ""
                    torneo = f"{t.capitalize()} {year}".strip()

        return {"clubes": clubes, "fecha": fecha, "torneo": torneo}
