import re
import logging
from datetime import datetime, timezone

import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.transferencia import Transferencia
from ..services.transferencia_service import TransferenciaService
from ..schemas.transferencia import TransferenciaCreate

logger = logging.getLogger(__name__)

_RSS_FEEDS = [
    {"nombre": "ABC Color Deportes", "url": "https://www.abc.com.py/deportes/"},
    {"nombre": "APF", "url": "https://www.apf.org.py"},
    {"nombre": "ESPN Paraguay", "url": "https://www.espn.com.py/futbol/"},
    {"nombre": "Diario Popular", "url": "https://www.popular.com.py/deportes/"},
    {"nombre": "1000 Noticias", "url": "https://1000noticias.com/deportes/"},
]

_TRANSFER_KEYWORDS = [
    "fichaje", "firma", "refuerzo", "refuerza", "reforzó",
    "se desvincula", "desvinculado", "se va", "abandona",
    "préstamo", "prestado", "cesión", "cesido",
    "transferencia", "traspaso", "compra", "adquiere",
    "regresa", "vuelve", "retorna", "regresó", "volvió",
]

_CLUB_ALIASES = {
    "olimpia": "olimpia", "decano": "olimpia",
    "cerro": "cerro-porteno", "cerro porteño": "cerro-porteno", "ciclón": "cerro-porteno",
    "libertad": "libertad", "gumarelo": "libertad",
    "nacional": "nacional", "tricolor": "nacional",
    "guaraní": "guarani", "guarani": "guarani", "aborigen": "guarani",
    "sol de américa": "sol-de-america", "sol": "sol-de-america",
    "luqueño": "sportivo-luqueno", "luqueno": "sportivo-luqueno",
    "tacuary": "tacuary",
    "2 de mayo": "2-de-mayo",
    "general díaz": "general-diaz", "general diaz": "general-diaz",
    "deportivo capiata": "deportivo-capiata",
    "3 de febrero": "3-de-febrero",
}


class TransferenciaRssSync:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.svc = TransferenciaService(db)

    async def sync_all(self) -> dict:
        created = 0
        skipped = 0
        errors = []

        for feed_info in _RSS_FEEDS:
            try:
                items = await self._fetch_and_parse(feed_info["nombre"], feed_info["url"])
                for item in items:
                    result = await self._process_item(item, feed_info["nombre"])
                    if result == "created":
                        created += 1
                    else:
                        skipped += 1
            except Exception as e:
                logger.warning("RSS sync error for %s: %s", feed_info["nombre"], e)
                errors.append(f"{feed_info['nombre']}: {str(e)}")

        return {"created": created, "skipped": skipped, "errors": errors}

    async def _fetch_and_parse(self, nombre: str, url: str) -> list[dict]:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "LigaParaguayaBot/1.0"})
            resp.raise_for_status()
        feed = feedparser.parse(resp.text)
        results = []
        for entry in feed.entries[:20]:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            link = entry.get("link", "")
            all_text = f"{title} {summary}".lower()
            has_keyword = any(kw in all_text for kw in _TRANSFER_KEYWORDS)
            if not has_keyword:
                continue
            results.append({"title": title, "summary": summary, "link": link, "text": all_text})
        return results

    async def _process_item(self, item: dict, fuente_nombre: str) -> str:
        existing = await self.db.execute(
            select(Transferencia).where(Transferencia.fuente_url == item["link"])
        )
        if existing.scalar_one_or_none():
            return "skipped"

        clubs_found = []
        for alias, club_id in _CLUB_ALIASES.items():
            if alias in item["text"] and club_id not in clubs_found:
                clubs_found.append(club_id)

        club_destino = clubs_found[0] if clubs_found else None
        club_origen = clubs_found[1] if len(clubs_found) > 1 else None

        if not club_destino:
            return "skipped"

        tipo = "confirmada"
        if any(w in item["text"] for w in ["préstamo", "prestado", "cesión"]):
            tipo = "prestamo"
        elif any(w in item["text"] for w in ["libre", "agente libre"]):
            tipo = "libre"

        t = Transferencia(
            jugador_nombre=item["title"][:200],
            jugador_posicion=None,
            club_origen_id=club_origen,
            club_destino_id=club_destino,
            fecha=datetime.now(timezone.utc).date(),
            tipo=tipo,
            estado="rumor",
            monto=None,
            fuente_url=item["link"],
            fuente_nombre=fuente_nombre,
            verification_level=1,
            is_active=True,
        )
        self.db.add(t)
        await self.db.flush()
        return "created"
