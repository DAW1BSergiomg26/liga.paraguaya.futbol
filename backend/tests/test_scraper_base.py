import pytest


@pytest.mark.asyncio
async def test_scraper_base_fetch_caches(respx_mock):
    from backend.scripts.scraper_base import ScraperBase
    from httpx import Response

    route = respx_mock.get("https://example.com/test").mock(return_value=Response(200, text="<html><body>ok</body></html>"))

    scraper = ScraperBase(cache_dir=None)
    html = await scraper.fetch("https://example.com/test")
    assert "ok" in html
    assert route.called


@pytest.mark.asyncio
async def test_scraper_base_rate_limit(respx_mock):
    from backend.scripts.scraper_base import ScraperBase
    from httpx import Response

    respx_mock.get("https://example.com/rate").mock(return_value=Response(200, text="<html>ok</html>"))

    scraper = ScraperBase(cache_dir=None, min_interval=0.5)
    import time
    t0 = time.monotonic()
    await scraper.fetch("https://example.com/rate")
    await scraper.fetch("https://example.com/rate")
    elapsed = time.monotonic() - t0
    assert elapsed >= 0.45


@pytest.mark.asyncio
async def test_scraper_base_parse_html():
    from backend.scripts.scraper_base import ScraperBase

    scraper = ScraperBase(cache_dir=None)
    html = "<html><body><h1>Título</h1><p>Párrafo</p></body></html>"
    root = scraper.parse_html(html)
    assert root.css_first("h1").text() == "Título"
    assert root.css_first("p").text() == "Párrafo"


@pytest.mark.asyncio
async def test_scraper_base_cache_dir(tmp_path, respx_mock):
    from backend.scripts.scraper_base import ScraperBase
    from httpx import Response

    cache = tmp_path / ".cache"
    scraper = ScraperBase(cache_dir=str(cache))
    url = "https://example.com/cached"
    respx_mock.get(url).mock(return_value=Response(200, text="<html>cached</html>"))

    html1 = await scraper.fetch(url)
    assert html1 == "<html>cached</html>"

    respx_mock.get(url).mock(return_value=Response(500, text="should not reach"))
    html2 = await scraper.fetch(url)
    assert html2 == "<html>cached</html>"
