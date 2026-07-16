import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.noticia import Noticia
from backend.app.schemas.noticia import NoticiaCreate, NoticiaUpdate


class NoticiaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: NoticiaCreate) -> Noticia:
        noticia = Noticia(
            id=str(uuid.uuid4()),
            titulo=data.titulo,
            resumen=data.resumen,
            contenido=data.contenido,
            imagen_url=data.imagen_url,
            video_url=data.video_url,
            fuente=data.fuente,
            origen=data.origen,
            url_original=data.url_original,
            pub_date=data.pub_date,
            is_published=data.is_published,
        )
        self.db.add(noticia)
        await self.db.commit()
        await self.db.refresh(noticia)
        return noticia

    async def get_by_id(self, noticia_id: str) -> Noticia | None:
        result = await self.db.execute(select(Noticia).where(Noticia.id == noticia_id))
        return result.scalar_one_or_none()

    async def list_noticias(
        self,
        page: int = 1,
        limit: int = 12,
        fuente: str | None = None,
        search: str | None = None,
    ) -> dict:
        query = select(Noticia).where(Noticia.is_published == True)

        if fuente:
            query = query.where(Noticia.fuente == fuente)
        if search:
            query = query.where(Noticia.titulo.ilike(f"%{search}%"))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0
        total_pages = max(1, math.ceil(total / limit))

        # Paginate
        query = query.order_by(Noticia.pub_date.desc())
        query = query.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(query)
        noticias = list(result.scalars().all())

        return {
            "noticias": noticias,
            "total": total,
            "page": page,
            "total_pages": total_pages,
        }

    async def update(self, noticia_id: str, data: NoticiaUpdate) -> Noticia | None:
        noticia = await self.get_by_id(noticia_id)
        if not noticia:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(noticia, key, value)
        await self.db.commit()
        await self.db.refresh(noticia)
        return noticia

    async def delete(self, noticia_id: str) -> bool:
        noticia = await self.get_by_id(noticia_id)
        if not noticia:
            return False
        await self.db.delete(noticia)
        await self.db.commit()
        return True
