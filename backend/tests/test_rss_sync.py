import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

from backend.app.services.rss_sync import RssSyncService


@pytest.mark.asyncio
async def test_sync_all_inserts_new_items(db_session):
    svc = RssSyncService(db_session)

    mock_entry = MagicMock()
    mock_entry.title = "Test Noticia"
    mock_entry.link = "https://example.com/test"
    mock_entry.summary = "Resumen de prueba"
    mock_entry.published_parsed = (2026, 7, 13, 10, 0, 0, 0, 0, 0)
    mock_entry.media_content = None
    mock_entry.media_thumbnail = None
    mock_entry.get = lambda key, default="": getattr(mock_entry, key, default)

    mock_feed = MagicMock()
    mock_feed.entries = [mock_entry]

    mock_resp = MagicMock()
    mock_resp.text = "fake xml"
    mock_resp.raise_for_status = MagicMock()

    with patch("backend.app.services.rss_sync.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        with patch("backend.app.services.rss_sync.feedparser.parse", return_value=mock_feed):
            with patch("backend.app.services.rss_sync.FUENTES_RSS", [{"nombre": "Test", "url": "https://test.com/rss"}]):
                result = await svc.sync_all()

    assert result["new"] >= 1


@pytest.mark.asyncio
async def test_sync_all_skips_duplicates(db_session):
    from backend.app.models.noticia import Noticia

    existing = Noticia(
        id="existing-1",
        titulo="Existing",
        fuente="Test",
        origen="rss",
        url_original="https://example.com/dup",
        pub_date=datetime.now(timezone.utc),
    )
    db_session.add(existing)
    await db_session.commit()

    svc = RssSyncService(db_session)

    mock_entry = MagicMock()
    mock_entry.title = "Existing"
    mock_entry.link = "https://example.com/dup"
    mock_entry.summary = "Same"
    mock_entry.published_parsed = (2026, 7, 13, 10, 0, 0, 0, 0, 0)
    mock_entry.media_content = None
    mock_entry.media_thumbnail = None
    mock_entry.get = lambda key, default="": getattr(mock_entry, key, default)

    mock_feed = MagicMock()
    mock_feed.entries = [mock_entry]

    mock_resp = MagicMock()
    mock_resp.text = "fake xml"
    mock_resp.raise_for_status = MagicMock()

    with patch("backend.app.services.rss_sync.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        with patch("backend.app.services.rss_sync.feedparser.parse", return_value=mock_feed):
            with patch("backend.app.services.rss_sync.FUENTES_RSS", [{"nombre": "Test", "url": "https://test.com/rss"}]):
                result = await svc.sync_all()

    assert result["skipped"] == 1
    assert result["new"] == 0
