from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.dependencies import get_db
from ..schemas.simulator import SimulationInput, SimulationResultOut
from ..services.simulator_service import SimulatorService

router = APIRouter(prefix="/api/v1/simulador", tags=["simulador"])


@router.post("/prediccion", response_model=SimulationResultOut)
async def predecir_partido(
    body: SimulationInput,
    db: AsyncSession = Depends(get_db),
):
    """Simula un partido y retorna probabilidades de victoria/empate/derrota
    junto con los 3 resultados exactos más probables."""

    if body.home_club_id == body.away_club_id:
        raise HTTPException(
            status_code=400,
            detail="Los IDs de local y visitante deben ser distintos",
        )

    try:
        return await SimulatorService.simulate_match(
            db, body.home_club_id, body.away_club_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
