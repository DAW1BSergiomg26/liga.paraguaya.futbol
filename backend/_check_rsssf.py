import asyncio, sys
sys.path.insert(0, "..")
from scripts.scraper_base import ScraperBase
from scripts.scraper_historico import scrape_year_direct, _load_club_map

club_map = _load_club_map("../data/clubes_paraguay.json")
print(f"Club map size: {len(club_map)}")

async def main():
    scraper = ScraperBase(cache_dir=None, min_interval=2.0)
    rows = await scrape_year_direct(scraper, "2024", club_map)
    await scraper.close()
    print(f"\nTotal rows: {len(rows)}")
    seen = set()
    for r in rows:
        seen.add(r["club_id"])
        extra = ""
        if r["posicion"] == 1:
            extra = f"  <- {r['club']}"
        gf = r["gf"]
        gc = r["gc"]
        print(f"  #{r['posicion']:>2} {r['club_id']:20s} Pts={r['puntos']:>2}  GF={gf} GC={gc}{extra}")
    print(f"\nUnique clubs: {len(seen)} -> {sorted(seen)}")

asyncio.run(main())
