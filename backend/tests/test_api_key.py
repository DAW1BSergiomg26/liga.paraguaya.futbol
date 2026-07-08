from unittest.mock import patch

import pytest

import backend.app.main as main_mod
from backend.app.core.api_key import RATE_LIMIT_MAX, RateLimiter, rate_limit_info
from backend.app.models.api_key import APIKey


class TestRateLimiter:
    def setup_method(self):
        self.limiter = RateLimiter()

    def test_permite_hasta_limite(self):
        limit = RATE_LIMIT_MAX
        for i in range(limit):
            ok, remaining, _ = self.limiter.check("test-key")
            assert ok is True
            assert remaining == limit - i

    def test_bloquea_al_exceder_limite(self):
        for _ in range(RATE_LIMIT_MAX):
            self.limiter.check("test-key")

        ok, remaining, reset_in = self.limiter.check("test-key")
        assert ok is False
        assert remaining == 0
        assert reset_in > 0

    def test_ventanas_independientes_por_key(self):
        for _ in range(RATE_LIMIT_MAX):
            self.limiter.check("key-a")

        ok, _, _ = self.limiter.check("key-b")
        assert ok is True


class TestRateLimitInfo:
    async def test_key_invalida_devuelve_401(self, db_session):
        info = await rate_limit_info("no-existe", db_session)
        assert info["ok"] is False
        assert info["status_code"] == 401
        assert info["body"]["error"]["code"] == "INVALID_API_KEY"

    async def test_key_valida_pasa(self, db_session):
        key = APIKey(owner="Test", email="t@t.com")
        db_session.add(key)
        await db_session.commit()

        info = await rate_limit_info(key.key, db_session)
        assert info["ok"] is True
        assert info["remaining"] == RATE_LIMIT_MAX

    async def test_key_desactivada_devuelve_401(self, db_session):
        key = APIKey(owner="Test", email="t@t.com", is_active=False)
        db_session.add(key)
        await db_session.commit()

        info = await rate_limit_info(key.key, db_session)
        assert info["ok"] is False
        assert info["status_code"] == 401

    async def test_incrementa_requests_count(self, db_session):
        key = APIKey(owner="Test", email="t@t.com")
        db_session.add(key)
        await db_session.commit()

        await rate_limit_info(key.key, db_session)

        await db_session.refresh(key)
        assert key.requests_count == 1


class TestMiddleware:
    async def test_sin_key_accede_normal(self, client):
        r = await client.get("/api/v1/clubes")
        assert r.status_code == 200

    async def test_key_valida_agrega_headers(self, client):
        with patch.object(main_mod, "rate_limit_info", return_value={"ok": True, "remaining": 95, "reset_in": 0}):
            r = await client.get("/api/v1/clubes", headers={"X-API-Key": "test-key"})
        assert r.status_code == 200
        assert r.headers["X-RateLimit-Limit"] == str(RATE_LIMIT_MAX)
        assert r.headers["X-RateLimit-Remaining"] == "95"

    async def test_key_invalida_devuelve_401(self, client):
        with patch.object(main_mod, "rate_limit_info", return_value={
            "ok": False, "status_code": 401,
            "body": {"success": False, "error": {"code": "INVALID_API_KEY", "message": "", "status": 401}},
            "reset_in": 0,
        }):
            r = await client.get("/api/v1/clubes", headers={"X-API-Key": "fake-key"})
        assert r.status_code == 401
        assert r.json()["error"]["code"] == "INVALID_API_KEY"

    async def test_rate_limit_al_exceder(self, client):
        with patch.object(main_mod, "rate_limit_info", return_value={
            "ok": False, "status_code": 429,
            "body": {"success": False, "error": {"code": "RATE_LIMIT_EXCEEDED", "message": "", "status": 429}},
            "reset_in": 30,
        }):
            r = await client.get("/api/v1/clubes", headers={"X-API-Key": "test-key"})
        assert r.status_code == 429
        assert r.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"

    async def test_rutas_admin_no_requieren_api_key_publica(self, client):
        r = await client.put(
            "/api/v1/admin/partidos/no-existe",
            json={"goles_local": 0, "goles_visitante": 0},
        )
        assert r.status_code == 403

    async def test_sin_key_no_llama_rate_limit_info(self, client):
        with patch.object(main_mod, "rate_limit_info") as mock_fn:
            r = await client.get("/api/v1/clubes")
        assert r.status_code == 200
        mock_fn.assert_not_called()
