import json
import pytest
from pathlib import Path


SAMPLE_WIKI = """<html>
<body>
<table class="infobox">
<tr><th colspan="2" style="text-align:center;">Club Olimpia</th></tr>
<tr><th scope="row">Fundación</th><td>25 de julio de 1902</td></tr>
<tr><th scope="row">Presidente</th><td>Juan Antonio Sosa</td></tr>
<tr><th scope="row" class="label" style="text-align:left;font-size: 92%; width: 36%;;">Títulos</th><td colspan="2" style="font-size: 92%;;">46</td></tr>
<tr><td colspan="3" style="text-align:center;background:#ddd;"><b><a rel="mw:ExtLink nofollow" href="https://clubolimpia.com.py/" class="external text">Página web oficial</a></b></td></tr>
</table>
<p><b>Club Olimpia</b> is a Paraguayan sports club based in Asunción.</p>
</body></html>"""


@pytest.mark.asyncio
async def test_scraper_clubes_parse():
    from backend.scripts.scraper_clubes import parse_club_wikipedia

    result = parse_club_wikipedia(SAMPLE_WIKI, "olimpia")

    assert result["sitio_web"] == "https://clubolimpia.com.py/"
    assert "sports club" in result["descripcion"]
    assert result["titulos_liga"] == 46
    assert len(result["titulos_info"]) > 0


@pytest.mark.asyncio
async def test_scraper_clubes_enrich(tmp_path, respx_mock):
    from backend.scripts.scraper_clubes import enrich_clubes_json
    from backend.scripts.scraper_base import ScraperBase
    from httpx import Response

    clubs = [
        {"id": "olimpia", "nombre": "Club Olimpia", "escudo": "x.png"},
        {"id": "cerro-porteno", "nombre": "Club Cerro Porteño", "escudo": "y.png"},
    ]
    json_path = tmp_path / "clubes.json"
    json_path.write_text(json.dumps(clubs, ensure_ascii=False), encoding="utf-8")

    respx_mock.get("https://es.wikipedia.org/wiki/Club_Olimpia").mock(return_value=Response(200, text=SAMPLE_WIKI))
    respx_mock.get("https://es.wikipedia.org/wiki/Club_Cerro_Porteño").mock(return_value=Response(200, text="<html><body><p>Club Cerro</p></body></html>"))

    scraper = ScraperBase(cache_dir=None)
    await enrich_clubes_json(str(json_path), cache_dir=None, scraper=scraper)
    await scraper.close()

    enriched = json.loads(json_path.read_text(encoding="utf-8"))
    assert enriched[0]["sitio_web"] == "https://clubolimpia.com.py/"
    assert enriched[0]["titulos_liga"] == 46
    assert "sitio_web" not in enriched[1]
