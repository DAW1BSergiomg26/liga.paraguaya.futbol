import time
from datetime import datetime, timezone

import feedparser
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/noticias", tags=["noticias"])

FUENTES = [
    {"nombre": "ABC Color", "url": "https://www.abc.com.py/arc/outboundfeeds/rss/deportes/futbol/"},
    {"nombre": "APF", "url": "https://apf.org.py/rss/"},
]

MAX_NOTICIAS = 6
TIMEOUT = 10
CACHE_TTL = 300  # 5 minutes

_cache: dict = {"data": None, "timestamp": 0.0}


async def _fetch_fuente(nombre: str, url: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url)
            resp.raise_for_status()
    except Exception:
        return []

    feed = feedparser.parse(resp.text)
    items = []
    for entry in feed.entries[:MAX_NOTICIAS]:
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
async def get_noticias() -> dict:
    now = time.monotonic()
    if _cache["data"] and (now - _cache["timestamp"]) < CACHE_TTL:
        return _cache["data"]

    todas = []
    seen_urls = set()
    for fuente in FUENTES:
        items = await _fetch_fuente(fuente["nombre"], fuente["url"])
        for item in items:
            if item["url"] not in seen_urls:
                seen_urls.add(item["url"])
                todas.append(item)

    todas.sort(key=lambda x: x.get("pub_date") or "", reverse=True)

    result = {
        "noticias": todas[:MAX_NOTICIAS],
        "fuentes": [f["nombre"] for f in FUENTES],
        "actualizado": datetime.now(timezone.utc).isoformat(),
    }

    _cache["data"] = result
    _cache["timestamp"] = now
    return result
