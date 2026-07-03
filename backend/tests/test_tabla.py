import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_obtener_tabla(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/tabla")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["club_id"] == "olimpia"
