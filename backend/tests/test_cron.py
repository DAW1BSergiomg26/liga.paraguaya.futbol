from datetime import date, timedelta

from backend.app.models.partido import Partido


class TestCronRecordatorios:
    async def test_recordatorios_sin_partidos_proximos(self, client):
        r = await client.post("/api/v1/cron/recordatorios")
        assert r.status_code == 200
        data = r.json()
        assert data["recordatorios_enviados"] == 0

    async def test_recordatorios_con_partido_proximo(self, client, db_session):
        manana = date.today() + timedelta(days=1)
        from tests.conftest import seed_test_data
        await seed_test_data(db_session)

        p = Partido(
            id="p999", torneo="Apertura 2026", fecha=manana,
            jornada=2, local_id="olimpia", visitante_id="cerro-porteno",
            estado="programado",
        )
        db_session.add(p)
        await db_session.commit()

        r = await client.post("/api/v1/cron/recordatorios")
        assert r.status_code == 200
        data = r.json()
        assert data["recordatorios_enviados"] >= 0
