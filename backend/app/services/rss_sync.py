import uuid
import logging
from datetime import datetime, timezone, timedelta

import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.noticia import Noticia

logger = logging.getLogger(__name__)

FUENTES_RSS = [
    {"nombre": "ABC Color Deportes", "url": "https://www.abc.com.py/arc/outboundfeeds/rss/deportes/"},
    {"nombre": "ABC Color Fútbol", "url": "https://www.abc.com.py/arc/outboundfeeds/rss/deportes/futbol/"},
    {"nombre": "APF", "url": "https://apf.org.py/rss/"},
    {"nombre": "Noticias CDE", "url": "https://noticiascde.com.py/feed/"},
    {"nombre": "ESPN Paraguay", "url": "https://www.espn.com.py/rss/"},
    {"nombre": "Telefuturo", "url": "https://telefuturo.com.py/rss/"},
]

TIMEOUT = 10
RSS_MAX_AGE_DAYS = 30


class RssSyncService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _fetch_feed(self, nombre: str, url: str) -> list[dict]:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.get(url)
                resp.raise_for_status()
        except Exception as e:
            logger.warning(f"Error fetching {nombre}: {e}")
            return []

        feed = feedparser.parse(resp.text)
        items = []
        for entry in feed.entries[:10]:
            pub_date = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)

            imagen_url = None
            if hasattr(entry, "media_content") and entry.media_content:
                imagen_url = entry.media_content[0].get("url")
            elif hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                imagen_url = entry.media_thumbnail[0].get("url")
            elif hasattr(entry, "enclosures") and entry.enclosures:
                for enc in entry.enclosures:
                    if enc.get("type", "").startswith("image/"):
                        imagen_url = enc.get("href") or enc.get("url")
                        break
            if not imagen_url:
                import re
                summary = entry.get("summary", "")
                content_text = ""
                if hasattr(entry, "content") and entry.content:
                    content_text = entry.content[0].get("value", "")
                all_html = summary + content_text
                img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', all_html)
                if img_match:
                    imagen_url = img_match.group(1)
                else:
                    img_url_match = re.search(r'(https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp))', all_html)
                    if img_url_match:
                        imagen_url = img_url_match.group(1)

            items.append({
                "titulo": entry.get("title", ""),
                "fuente": nombre,
                "url_original": entry.get("link", ""),
                "pub_date": pub_date or datetime.now(timezone.utc),
                "resumen": entry.get("summary", "")[:500],
                "imagen_url": imagen_url,
            })
        return items

    async def sync_all(self) -> dict:
        total_new = 0
        total_skipped = 0

        for fuente in FUENTES_RSS:
            items = await self._fetch_feed(fuente["nombre"], fuente["url"])
            for item in items:
                existing = await self.db.execute(
                    select(Noticia).where(Noticia.url_original == item["url_original"])
                )
                if existing.scalar_one_or_none():
                    total_skipped += 1
                    continue

                noticia = Noticia(
                    id=str(uuid.uuid4()),
                    titulo=item["titulo"],
                    resumen=item["resumen"],
                    imagen_url=item["imagen_url"],
                    fuente=item["fuente"],
                    origen="rss",
                    url_original=item["url_original"],
                    pub_date=item["pub_date"],
                )
                self.db.add(noticia)
                total_new += 1

        await self.db.commit()
        return {"new": total_new, "skipped": total_skipped}

    async def cleanup_old(self) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(days=RSS_MAX_AGE_DAYS)
        result = await self.db.execute(
            select(Noticia).where(
                Noticia.origen == "rss",
                Noticia.pub_date < cutoff,
            )
        )
        old_noticias = list(result.scalars().all())
        for noticia in old_noticias:
            await self.db.delete(noticia)
        await self.db.commit()
        return len(old_noticias)
