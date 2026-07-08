import pytest
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.models.api_key import APIKey
from backend.app.models.partido import Partido


ADMIN_KEY = settings.admin_api_key


@pytest.fixture
async def seed_admin_partido(db_session):
    from tests.conftest import seed_test_data
    await seed_test_data(db_session)
    await db_session.commit()


class TestActualizarPartido:
    async def test_actualizar_goles(self, client, db_session, seed_admin_partido):
        r = await client.put(
            "/api/v1/admin/partidos/p001",
            json={"goles_local": 2, "goles_visitante": 1},
            headers={"X-API-Key": ADMIN_KEY},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["goles_local"] == 2
        assert data["goles_visitante"] == 1

    async def test_sin_auth_devuelve_403(self, client, seed_admin_partido):
        r = await client.put(
            "/api/v1/admin/partidos/p001",
            json={"goles_local": 1, "goles_visitante": 0},
        )
        assert r.status_code == 403

    async def test_partido_inexistente(self, client):
        r = await client.put(
            "/api/v1/admin/partidos/no-existe",
            json={"goles_local": 1, "goles_visitante": 0},
            headers={"X-API-Key": ADMIN_KEY},
        )
        assert r.status_code == 404

    async def test_finalizar_partido(self, client, db_session, seed_admin_partido):
        r = await client.put(
            "/api/v1/admin/partidos/p001",
            json={"goles_local": 2, "goles_visitante": 1, "estado": "finalizado"},
            headers={"X-API-Key": ADMIN_KEY},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["estado"] == "finalizado"


class TestApiKeys:
    @pytest.fixture(autouse=True)
    async def setup(self, db_session):
        self.db = db_session

    async def _create_key(self, client):
        return await client.post(
            "/api/v1/admin/api-keys",
            json={"owner": "Test Owner", "email": "test@example.com"},
            headers={"X-API-Key": ADMIN_KEY},
        )

    async def test_crear_api_key(self, client):
        r = await self._create_key(client)
        assert r.status_code == 201
        data = r.json()
        assert data["owner"] == "Test Owner"
        assert data["email"] == "test@example.com"
        assert data["is_active"] is True
        assert "key" in data

    async def test_crear_sin_auth_devuelve_403(self, client):
        r = await client.post(
            "/api/v1/admin/api-keys",
            json={"owner": "Test", "email": "test@t.com"},
        )
        assert r.status_code == 403

    async def test_listar_api_keys(self, client):
        await self._create_key(client)
        r = await client.get("/api/v1/admin/api-keys", headers={"X-API-Key": ADMIN_KEY})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_toggle_api_key(self, client):
        r1 = await self._create_key(client)
        kid = r1.json()["key"]

        r = await client.patch(f"/api/v1/admin/api-keys/{kid}/toggle", headers={"X-API-Key": ADMIN_KEY})
        assert r.status_code == 200
        assert r.json()["is_active"] is False

    async def test_toggle_inexistente_devuelve_404(self, client):
        r = await client.patch(
            "/api/v1/admin/api-keys/no-existe/toggle",
            headers={"X-API-Key": ADMIN_KEY},
        )
        assert r.status_code == 404

    async def test_eliminar_api_key(self, client):
        r1 = await self._create_key(client)
        kid = r1.json()["key"]

        r = await client.delete(f"/api/v1/admin/api-keys/{kid}", headers={"X-API-Key": ADMIN_KEY})
        assert r.status_code == 204

        result = await self.db.execute(select(APIKey).where(APIKey.key == kid))
        assert result.scalar_one_or_none() is None

    async def test_eliminar_inexistente_devuelve_404(self, client):
        r = await client.delete(
            "/api/v1/admin/api-keys/no-existe",
            headers={"X-API-Key": ADMIN_KEY},
        )
        assert r.status_code == 404
