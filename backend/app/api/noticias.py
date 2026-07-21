from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_admin
from app.schemas.noticia import NoticiaCreate, NoticiaUpdate, NoticiaOut, NoticiasPaginatedResponse
from app.services.noticia_service import NoticiaService
from app.services.rss_sync import RssSyncService

router = APIRouter(prefix="/api/v1/noticias", tags=["noticias"])


@router.get("", response_model=NoticiasPaginatedResponse)
async def list_noticias(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    fuente: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    svc = NoticiaService(db)
    result = await svc.list_noticias(page=page, limit=limit, fuente=fuente, search=search)
    fuentes = sorted({n.fuente for n in result["noticias"]})
    return NoticiasPaginatedResponse(
        noticias=[NoticiaOut.model_validate(n) for n in result["noticias"]],
        total=result["total"],
        page=result["page"],
        total_pages=result["total_pages"],
        fuentes=fuentes,
        actualizado=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/{noticia_id}", response_model=NoticiaOut)
async def get_noticia(noticia_id: str, db: AsyncSession = Depends(get_db)):
    svc = NoticiaService(db)
    noticia = await svc.get_by_id(noticia_id)
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    return NoticiaOut.model_validate(noticia)


@router.post("", response_model=NoticiaOut, status_code=201)
async def create_noticia(
    body: NoticiaCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    svc = NoticiaService(db)
    noticia = await svc.create(body)
    return NoticiaOut.model_validate(noticia)


@router.put("/{noticia_id}", response_model=NoticiaOut)
async def update_noticia(
    noticia_id: str,
    body: NoticiaUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    svc = NoticiaService(db)
    noticia = await svc.update(noticia_id, body)
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    return NoticiaOut.model_validate(noticia)


@router.delete("/{noticia_id}", status_code=204)
async def delete_noticia(
    noticia_id: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    svc = NoticiaService(db)
    deleted = await svc.delete(noticia_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")


@router.post("/sync-rss")
async def sync_rss(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    svc = RssSyncService(db)
    result = await svc.sync_all()
    return {"message": "Sync completado", "new": result["new"], "skipped": result["skipped"]}
