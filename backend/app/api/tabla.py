from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.dependencies import get_db
from ..schemas.tabla import TablaRowOut
from ..services.tabla_service import TablaService

router = APIRouter(prefix="/api/v1/tabla", tags=["tabla"])


@router.get("", response_model=list[TablaRowOut])
async def obtener_tabla(
    torneo: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await TablaService.get_table(db, torneo=torneo)


@router.get("/torneos", response_model=list[str])
async def listar_torneos(db: AsyncSession = Depends(get_db)):
    return await TablaService.get_torneos(db)
