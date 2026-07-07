import pytest


SAMPLE_RSSSF = """
<pre>
<b><a name="1aper">Torneo Apertura 2024</a></b>

Final Table:

 1.Libertad               22  14  6  2  42-16  48  Champions
 2.Cerro Porteño          22  13  6  3  40-17  45
 3.Olimpia                22   9  9  4  28-21  36
</pre>
"""


@pytest.mark.asyncio
async def test_parse_rsssf_table():
    from backend.scripts.scraper_historico import parse_rsssf_table

    club_map = {
        "Club Libertad": "libertad",
        "Club Cerro Porteño": "cerro-porteno",
        "Club Olimpia": "olimpia",
        "Libertad": "libertad",
        "Cerro Porteño": "cerro-porteno",
        "Olimpia": "olimpia",
    }

    result = parse_rsssf_table(SAMPLE_RSSSF, club_map, "2024")

    assert len(result) == 3
    assert result[0]["club_id"] == "libertad"
    assert result[0]["pj"] == 22
    assert result[0]["pg"] == 14
    assert result[0]["puntos"] == 48
    assert result[0]["posicion"] == 1
    assert result[0]["gf"] == 42
    assert result[0]["gc"] == 16
    assert result[0]["dg"] == 26
    assert result[2]["club_id"] == "olimpia"


@pytest.mark.asyncio
async def test_club_aliases():
    from backend.scripts.scraper_historico import _club_aliases

    assert _club_aliases("Club Olimpia") == ["Olimpia"]
    assert _club_aliases("Club Atlético Colegiales") == ["Colegiales"]
    assert _club_aliases("Sportivo Luqueño") == []
    assert _club_aliases("Club Deportivo Recoleta") == ["Recoleta"]


@pytest.mark.asyncio
async def test_parse_rsssf_multiple_tables():
    from backend.scripts.scraper_historico import parse_rsssf_table

    html = """
<pre>
<b><a name="1aper">Torneo Apertura 2024</a></b>

Final Table:

 1.Libertad               22  14  6  2  42-16  48  Champions
 2.Cerro Porteño          22  13  6  3  40-17  45

Round 1
[Jan 19]
Olimpia              1-1 Sol de América
</pre>
"""
    club_map = {"Libertad": "libertad", "Cerro Porteño": "cerro-porteno"}
    result = parse_rsssf_table(html, club_map, "2024")
    assert len(result) == 2
    assert result[0]["club_id"] == "libertad"
    assert result[1]["club_id"] == "cerro-porteno"
