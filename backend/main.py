from fastapi import FastAPI
from pathlib import Path
import json

app = FastAPI(
    title="liga.paraguaya.futbol API",
    description="API inicial para clubes, partidos y datos base de la Liga Paraguaya de Fútbol.",
    version="0.1.0"
)

BASE_DIR = Path(__file__).resolve().parent.parent
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


@app.get("/")
def inicio():
    return {
        "proyecto": "liga.paraguaya.futbol",
        "estado": "API funcionando",
        "version": "0.1.0",
        "endpoints": [
            "/health",
            "/clubes",
            "/partidos"
        ]
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mensaje": "Backend activo correctamente"
    }


@app.get("/clubes")
def obtener_clubes():
    return cargar_json("clubes_paraguay.json")


@app.get("/partidos")
def obtener_partidos():
    return cargar_json("partidos_demo.json")
