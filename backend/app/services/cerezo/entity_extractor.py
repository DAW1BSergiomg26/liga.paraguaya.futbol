import re

_CLUB_ALIASES: dict[str, str] = {
    "olimpia": "olimpia",
    "el decano": "olimpia",
    "decano": "olimpia",
    "cerro porteño": "cerro-porteno",
    "cerro porteno": "cerro-porteno",
    "cerro": "cerro-porteno",
    "el ciclón": "cerro-porteno",
    "el ciclon": "cerro-porteno",
    "ciclón": "cerro-porteno",
    "ciclon": "cerro-porteno",
    "libertad": "libertad",
    "gumarelo": "libertad",
    "guaraní": "guarani",
    "guarani": "guarani",
    "el aborigen": "guarani",
    "aborigen": "guarani",
    "nacional": "nacional",
    "tricolor": "nacional",
    "sol de américa": "sol-de-america",
    "sol de america": "sol-de-america",
    "sol": "sol-de-america",
    "luqueño": "sportivo-luqueno",
    "sportivo luqueño": "sportivo-luqueno",
    "sportivo luqueno": "sportivo-luqueno",
    "luque": "sportivo-luqueno",
    "capiatá": "deportivo-capiat",
    "deportivo capiatá": "deportivo-capiat",
    "tacuary": "tacuary",
    "tacua": "tacuary",
}

_FECHA_KEYWORDS: dict[str, str] = {
    "último": "ultimo",
    "ultimo": "ultimo",
    "última": "ultimo",
    "ultima": "ultimo",
    "próximo": "proximo",
    "proximo": "proximo",
    "próxima": "proximo",
    "proxima": "proximo",
    "ayer": "ayer",
    "pasado": "ultimo",
    "anterior": "ultimo",
}


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
        for t in ["apertura", "clausura"]:
            if t in text_lower:
                match = re.search(rf"{t}\s*(\d{{4}})?", text_lower)
                if match:
                    year = match.group(1) or ""
                    torneo = f"{t.capitalize()} {year}".strip()

        return {"clubes": clubes, "fecha": fecha, "torneo": torneo}
