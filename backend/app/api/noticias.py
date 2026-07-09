from datetime import datetime, timezone

import feedparser
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/noticias", tags=["noticias"])

FUENTES = [
    {"nombre": "ABC Color", "url": "https://www.abc.com.py/rss/deportes.xml"},
    {"nombre": "Última Hora", "url": "https://www.ultimahora.com/rss/deportes.xml"},
]

MAX_NOTICIAS = 5
TIMEOUT = 10


async def _fetch_fuente(nombre: str, url: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url)
            resp.raise_for_status()
    except Exception:
        return []

    feed = feedparser.parse(resp.text)
    items = []
    for entry in feed.entries[:5]:
        pub_date = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
        items.append({
            "titulo": entry.get("title", ""),
            "fuente": nombre,
            "url": entry.get("link", ""),
            "pub_date": pub_date,
            "resumen": entry.get("summary", "")[:300],
        })
    return items


@router.get("")
async def get_noticias():
    todas = []
    for fuente in FUENTES:
        items = await _fetch_fuente(fuente["nombre"], fuente["url"])
        todas.extend(items)

    todas.sort(key=lambda x: x.get("pub_date") or "", reverse=True)

    return {
        "noticias": todas[:MAX_NOTICIAS],
        "fuentes": [f["nombre"] for f in FUENTES],
        "actualizado": datetime.now(timezone.utc).isoformat(),
    }
