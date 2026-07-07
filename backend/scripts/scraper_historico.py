import asyncio
import json
import re
from pathlib import Path

from backend.scripts.scraper_base import ScraperBase


RSSSF_OVERRIDES = {
    "2 de Mayo": "2-de-mayo",
    "General Caballero JLM": "general-caballero",
}


def _load_club_map(json_path: str) -> dict[str, str]:
    clubs = json.loads(Path(json_path).read_text(encoding="utf-8-sig"))
    base = {c["nombre"]: c["id"] for c in clubs}
    aliases = {}
    for c in clubs:
        for alias in _club_aliases(c["nombre"]):
            if alias not in aliases:
                aliases[alias] = c["id"]
    aliases.update(base)
    aliases.update(RSSSF_OVERRIDES)
    return aliases


def _club_aliases(nombre: str) -> list[str]:
    for prefix in ["Club Atlético ", "Club Deportivo ", "Club "]:
        if nombre.startswith(prefix):
            return [nombre.removeprefix(prefix)]
    return []


def _parse_row(parts: list[str], club_map: dict[str, str], anio: str, torneo: str | None = None) -> dict | None:
    pos_name = parts[0]
    dot = pos_name.find(".")
    if dot < 1:
        return None
    try:
        pos = int(pos_name[:dot])
    except ValueError:
        return None
    first_word = pos_name[dot + 1:]
    remaining = parts[1:]

    for extra in range(min(len(remaining), 4), -1, -1):
        name_words = [first_word]
        if extra > 0:
            name_words.extend(remaining[:extra])
        stats = remaining[extra:]
        if len(stats) < 6:
            continue
        try:
            pj = int(stats[0])
            w = int(stats[1])
            d = int(stats[2])
            l = int(stats[3])
            pts = int(stats[5])
            gf_ga = stats[4]
            dash = gf_ga.find("-")
            if dash < 1:
                continue
            gf = int(gf_ga[:dash])
            gc = int(gf_ga[dash + 1:])
        except (ValueError, IndexError):
            continue
        nombre = " ".join(name_words)
        club_id = club_map.get(nombre, "")
        if club_id:
            return {
                "torneo": torneo or f"Temporada {anio}",
                "anio": anio,
                "club_id": club_id,
                "club": nombre,
                "posicion": pos,
                "pj": pj,
                "pg": w,
                "pe": d,
                "pp": l,
                "gf": gf,
                "gc": gc,
                "dg": gf - gc,
                "puntos": pts,
            }
    return None


def _extract_torneo(line: str) -> str | None:
    m = re.search(r">([^<]+)</a>", line)
    if m:
        return m.group(1).strip()
    return None


def parse_rsssf_table(html: str, club_map: dict[str, str], anio: str) -> list[dict]:
    results = []
    pre = re.search(r"<pre>(.*?)</pre>", html, re.DOTALL)
    if not pre:
        return results
    lines = pre.group(1).splitlines()
    in_table = False
    current_torneo: str | None = None
    seen_rows: set[tuple] = set()
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        if re.search(r'<a\s+name', line, re.IGNORECASE):
            current_torneo = _extract_torneo(line)
            in_table = False
            continue
        if "Final Table:" in line:
            in_table = True
            continue
        if not in_table:
            continue
        if line.startswith("Round") or line.startswith("["):
            in_table = False
            continue
        parts = line.split()
        if len(parts) < 7:
            continue
        row = _parse_row(parts, club_map, anio, current_torneo)
        if row:
            key = (row["club_id"], row["posicion"], row["puntos"])
            if key not in seen_rows:
                seen_rows.add(key)
                results.append(row)
    return results


async def scrape_year(scraper: ScraperBase, anio: str, club_map: dict) -> list[dict]:
    url = f"https://www.rsssf.org/tablesp/para{anio}.html"
    try:
        html = await scraper.fetch(url)
        return parse_rsssf_table(html, club_map, anio)
    except Exception as e:
        print(f"  RSSSF {anio}: {e}")
        return []


async def scrape_year_direct(scraper: ScraperBase, anio: str, club_map: dict) -> list[dict]:
    url = f"https://www.rsssf.org/tablesp/para{anio}.html"
    try:
        raw = await scraper.fetch_bytes(url)
    except Exception as e:
        print(f"  RSSSF {anio}: {e}")
        return []
    text = raw.decode("iso-8859-1", errors="replace")
    return parse_rsssf_table(text, club_map, anio)


async def scrape_all(years: list[str] | None = None) -> dict[str, list[dict]]:
    if years is None:
        years = [str(y) for y in range(2020, 2027)]

    data_dir = Path(__file__).resolve().parent.parent.parent / "data"
    club_map = _load_club_map(str(data_dir / "clubes_paraguay.json"))

    scraper = ScraperBase(cache_dir=str(data_dir / ".cache" / "scraper"), min_interval=3.0)
    historico = {}

    for anio in years:
        print(f"Scraping {anio}...")
        rows = await scrape_year_direct(scraper, anio, club_map)
        if rows:
            historico[anio] = rows
            slug = f"temporada_{anio}"
            out_path = data_dir / "partidos_historicos" / f"{slug}.json"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(
                json.dumps(rows, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            print(f"  -> {len(rows)} rows saved")

    await scraper.close()
    return historico


async def main():
    years = [str(y) for y in range(2020, 2027)]
    print(f"Scraping RSSSF for years: {years}")
    result = await scrape_all(years)
    print(f"Done. {sum(len(v) for v in result.values())} total rows across {len(result)} years.")


if __name__ == "__main__":
    asyncio.run(main())
