import asyncio
import json
import re
import sys
from pathlib import Path

from backend.scripts.scraper_base import ScraperBase


SLUG_OVERRIDES = {
    "Club Nacional": "Club_Nacional_(Paraguay)",
    "Sportivo 2 de Mayo": "Club_Sportivo_2_de_Mayo",
    "Club Sol de América": "Club_Sol_de_América_(Asunción)",
    "Club Atlético Colegiales": "Club_Atlético_Colegiales_(Paraguay)",
}


def _wikipedia_slug(nombre: str) -> str:
    if nombre in SLUG_OVERRIDES:
        return SLUG_OVERRIDES[nombre]
    return nombre.replace(" ", "_")


def parse_club_wikipedia(html: str, club_id: str) -> dict:
    from selectolax.parser import HTMLParser
    root = HTMLParser(html)
    result = {"sitio_web": "", "descripcion": "", "titulos_liga": 0, "titulos_info": []}

    infobox = root.css_first("table.infobox")
    if infobox:
        for td in infobox.css("td"):
            link = td.css_first("a")
            if link:
                text = link.text(strip=True)
                href = link.attributes.get("href", "")
                if text and ("oficial" in text.lower() or "web" in text.lower()) and href.startswith("http"):
                    result["sitio_web"] = href
                    break

        for row in infobox.css("tr"):
            th = row.css_first("th")
            td_vals = row.css("td")
            if th and td_vals:
                th_text = th.text(strip=True)
                if th_text == "Títulos" or th_text == "Titulos":
                    val_td = td_vals[-1]
                    val_text = val_td.text(strip=True)
                    match = re.search(r"(\d+)", val_text)
                    if match:
                        result["titulos_liga"] = int(match.group(1))
                        result["titulos_info"].append({
                            "torneo": "Primera División",
                            "cantidad": int(match.group(1)),
                        })
                    break

    for p in root.css("p"):
        text = p.text(strip=True)
        if len(text) > 30:
            result["descripcion"] = text[:500]
            break

    return result


async def enrich_clubes_json(json_path: str, cache_dir: str | None = ".cache/scraper", scraper: ScraperBase | None = None) -> int:
    path = Path(json_path)
    clubs = json.loads(path.read_text(encoding="utf-8-sig"))

    own_scraper = scraper is None
    scraper = scraper or ScraperBase(cache_dir=cache_dir, min_interval=2.0, use_impersonate=True)
    enriched = 0

    for club in clubs:
        slug = _wikipedia_slug(club.get("nombre", ""))
        if not slug:
            continue
        url = f"https://es.wikipedia.org/wiki/{slug}"
        try:
            html = await scraper.fetch(url)
            data = parse_club_wikipedia(html, club["id"])
            changed = False
            for key, val in data.items():
                if val and (key not in club or club.get(key) != val):
                    club[key] = val
                    changed = True
            if changed:
                enriched += 1
                print(f"  Enriched: {club['nombre']}")
        except Exception as e:
            print(f"  Failed: {club['nombre']} — {e}")

    if own_scraper:
        await scraper.close()
    path.write_text(json.dumps(clubs, ensure_ascii=False, indent=2), encoding="utf-8")
    return enriched


async def main():
    json_path = Path(__file__).resolve().parent.parent.parent / "data" / "clubes_paraguay.json"
    print(f"Enriching {json_path}...")
    count = await enrich_clubes_json(str(json_path))
    print(f"Done. {count} clubs enriched.")


if __name__ == "__main__":
    asyncio.run(main())
