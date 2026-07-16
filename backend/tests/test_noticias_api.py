import pytest
from datetime import datetime, timezone
from httpx import AsyncClient


@pytest.fixture
def now():
    return datetime.now(timezone.utc).isoformat()


@pytest.mark.asyncio
async def test_list_noticias_empty(client: AsyncClient):
    resp = await client.get("/api/v1/noticias")
    assert resp.status_code == 200
    data = resp.json()
    assert data["noticias"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_create_noticia_requires_admin(client: AsyncClient):
    resp = await client.post("/api/v1/noticias", json={
        "titulo": "Test",
        "origen": "editorial",
        "pub_date": "2026-07-13T10:00:00Z",
    })
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_noticia_as_admin(client: AsyncClient, db_session):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "admin@test.com",
        "name": "Admin",
        "password": "secret123",
    })
    token = reg.json()["access_token"]

    resp = await client.post("/api/v1/noticias", json={
        "titulo": "Articulo de prueba",
        "contenido": "Contenido del articulo",
        "origen": "editorial",
        "pub_date": "2026-07-13T10:00:00Z",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["titulo"] == "Articulo de prueba"
    assert data["origen"] == "editorial"


@pytest.mark.asyncio
async def test_get_noticia_by_id(client: AsyncClient, db_session):
    from backend.app.models.noticia import Noticia

    noticia = Noticia(
        id="test-123",
        titulo="Test Noticia",
        fuente="test",
        origen="editorial",
        contenido="Content",
        pub_date=datetime.now(timezone.utc),
    )
    db_session.add(noticia)
    await db_session.commit()

    resp = await client.get("/api/v1/noticias/test-123")
    assert resp.status_code == 200
    assert resp.json()["titulo"] == "Test Noticia"


@pytest.mark.asyncio
async def test_get_noticia_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/noticias/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_noticias_pagination(client: AsyncClient, db_session):
    from backend.app.models.noticia import Noticia

    for i in range(15):
        noticia = Noticia(
            id=f"page-test-{i}",
            titulo=f"Noticia {i}",
            fuente="test",
            origen="rss",
            url_original=f"https://example.com/{i}",
            pub_date=datetime.now(timezone.utc),
        )
        db_session.add(noticia)
    await db_session.commit()

    resp = await client.get("/api/v1/noticias?page=1&limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["noticias"]) == 10
    assert data["total"] == 15
    assert data["total_pages"] == 2


@pytest.mark.asyncio
async def test_list_noticias_filter_by_fuente(client: AsyncClient, db_session):
    from backend.app.models.noticia import Noticia

    db_session.add(Noticia(id="f1", titulo="Editorial", fuente="editorial", origen="editorial", contenido="x", pub_date=datetime.now(timezone.utc)))
    db_session.add(Noticia(id="f2", titulo="RSS", fuente="ABC Color", origen="rss", url_original="https://x.com", pub_date=datetime.now(timezone.utc)))
    await db_session.commit()

    resp = await client.get("/api/v1/noticias?fuente=editorial")
    data = resp.json()
    assert data["total"] == 1
    assert data["noticias"][0]["origen"] == "editorial"


@pytest.mark.asyncio
async def test_delete_noticia(client: AsyncClient, db_session):
    from backend.app.models.noticia import Noticia

    db_session.add(Noticia(id="del-1", titulo="Borrar", fuente="test", origen="editorial", contenido="x", pub_date=datetime.now(timezone.utc)))
    await db_session.commit()

    reg = await client.post("/api/v1/auth/register", json={
        "email": "deladmin@test.com",
        "name": "Del",
        "password": "secret123",
    })
    token = reg.json()["access_token"]

    resp = await client.delete("/api/v1/noticias/del-1", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204
