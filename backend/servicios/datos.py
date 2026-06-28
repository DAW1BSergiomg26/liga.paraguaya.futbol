import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"


def cargar_json(nombre_archivo: str):
    ruta = DATA_DIR / nombre_archivo

    if not ruta.exists():
        return {
            "error": True,
            "mensaje": f"No existe el archivo: {nombre_archivo}"
        }

    with open(ruta, "r", encoding="utf-8-sig") as archivo:
        return json.load(archivo)


def obtener_clubes():
    return cargar_json("clubes_paraguay.json")


def obtener_partidos():
    return cargar_json("partidos_demo.json")


def obtener_tabla():
    return cargar_json("tabla_posiciones_demo.json")


def buscar_club_por_id(club_id: str):
    clubes = obtener_clubes()

    if isinstance(clubes, dict) and clubes.get("error"):
        return clubes

    for club in clubes:
        if club["id"] == club_id:
            return club

    return {
        "error": True,
        "mensaje": f"No se encontró el club con id: {club_id}"
    }


def buscar_partido_por_id(partido_id: str):
    partidos = obtener_partidos()

    if isinstance(partidos, dict) and partidos.get("error"):
        return partidos

    for partido in partidos:
        if partido["id"] == partido_id:
            return partido

    return {
        "error": True,
        "mensaje": f"No se encontró el partido con id: {partido_id}"
    }
