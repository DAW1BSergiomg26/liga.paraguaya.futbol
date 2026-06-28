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
