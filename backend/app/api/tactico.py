from fastapi import APIRouter, HTTPException

from app.schemas.tactico import AnalisisPartido, EquipoTactico
from app.services.tactico_service import TacticoService


router = APIRouter(prefix="/api/v1/tactico", tags=["tactico"])


@router.get("/equipos")
async def get_equipos():
    """Lista todos los equipos disponibles para anÃ¡lisis tÃ¡ctico."""
    return await TacticoService.get_equipos_disponibles()


@router.get("/equipo/{equipo_id}", response_model=EquipoTactico)
async def get_analisis_equipo(equipo_id: str):
    """Obtiene el anÃ¡lisis tÃ¡ctico completo de un equipo."""
    equipo = await TacticoService.get_equipo(equipo_id)
    if not equipo:
        raise HTTPException(status_code=404, detail=f"Equipo '{equipo_id}' no encontrado")
    return equipo


@router.get("/partido/{partido_id}", response_model=AnalisisPartido)
async def get_analisis_partido(partido_id: str):
    """Obtiene el anÃ¡lisis tÃ¡ctico de un partido especÃ­fico."""
    partido = await TacticoService.get_partido(partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail=f"Partido '{partido_id}' no encontrado")
    return partido
