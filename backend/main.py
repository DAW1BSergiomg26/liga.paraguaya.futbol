from fastapi import FastAPI
from backend.servicios.datos import obtener_clubes, obtener_partidos

app = FastAPI(
    title="liga.paraguaya.futbol API",
    description="API inicial para clubes, partidos y datos base de la Liga Paraguaya de Fútbol.",
    version="0.2.0"
)


@app.get("/")
def inicio():
    return {
        "proyecto": "liga.paraguaya.futbol",
        "estado": "API funcionando",
        "version": "0.2.0",
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
def listar_clubes():
    return obtener_clubes()


@app.get("/partidos")
def listar_partidos():
    return obtener_partidos()
