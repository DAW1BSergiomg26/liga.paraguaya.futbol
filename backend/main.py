from fastapi import FastAPI, HTTPException
from backend.servicios.datos import (
    obtener_clubes,
    obtener_partidos,
    buscar_club_por_id,
    buscar_partido_por_id,
)

app = FastAPI(
    title="liga.paraguaya.futbol API",
    description="API inicial para clubes, partidos y datos base de la Liga Paraguaya de Fútbol.",
    version="0.4.0"
)


def validar_respuesta(resultado):
    if isinstance(resultado, dict) and resultado.get("error"):
        raise HTTPException(
            status_code=404,
            detail=resultado["mensaje"]
        )

    return resultado


@app.get("/")
def inicio():
    return {
        "proyecto": "liga.paraguaya.futbol",
        "estado": "API funcionando",
        "version": "0.4.0",
        "endpoints": [
            "/health",
            "/clubes",
            "/clubes/{club_id}",
            "/partidos",
            "/partidos/{partido_id}"
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


@app.get("/clubes/{club_id}")
def detalle_club(club_id: str):
    resultado = buscar_club_por_id(club_id)
    return validar_respuesta(resultado)


@app.get("/partidos")
def listar_partidos():
    return obtener_partidos()


@app.get("/partidos/{partido_id}")
def detalle_partido(partido_id: str):
    resultado = buscar_partido_por_id(partido_id)
    return validar_respuesta(resultado)
