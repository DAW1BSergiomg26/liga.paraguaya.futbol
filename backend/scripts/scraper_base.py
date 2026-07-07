import asyncio
import hashlib
import time
from pathlib import Path

from selectolax.parser import HTMLParser


class ScraperBase:
    def __init__(self, cache_dir: str | None = ".cache/scraper", min_interval: float = 1.0, use_impersonate: bool = False):
        self.cache_dir = cache_dir
        self.min_interval = min_interval
        self._last_request: float = 0
        if use_impersonate:
            from curl_cffi.requests import AsyncSession
            self._client = AsyncSession(impersonate="chrome131")
        else:
            import httpx
            self._client = httpx.AsyncClient(
                follow_redirects=True,
                timeout=30,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
                },
            )

    def _cache_path(self, url: str) -> Path | None:
        if self.cache_dir is None:
            return None
        key = hashlib.sha256(url.encode()).hexdigest()[:16]
        return Path(self.cache_dir) / f"{key}.html"

    def _cache_get(self, url: str) -> str | None:
        path = self._cache_path(url)
        if path and path.exists():
            return path.read_text(encoding="utf-8")
        return None

    def _cache_set(self, url: str, html: str):
        path = self._cache_path(url)
        if path:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(html, encoding="utf-8")

    async def fetch(self, url: str) -> str:
        cached = self._cache_get(url)
        if cached is not None:
            return cached

        now = time.monotonic()
        since_last = now - self._last_request
        if since_last < self.min_interval:
            await asyncio.sleep(self.min_interval - since_last)
        self._last_request = time.monotonic()

        response = await self._client.get(url)
        response.raise_for_status()
        html = response.text
        self._cache_set(url, html)
        return html

    async def fetch_bytes(self, url: str) -> bytes:
        now = time.monotonic()
        since_last = now - self._last_request
        if since_last < self.min_interval:
            await asyncio.sleep(self.min_interval - since_last)
        self._last_request = time.monotonic()

        response = await self._client.get(url)
        response.raise_for_status()
        return response.content

    @staticmethod
    def parse_html(html: str) -> HTMLParser:
        return HTMLParser(html)

    async def close(self):
        if hasattr(self._client, "aclose"):
            await self._client.aclose()
