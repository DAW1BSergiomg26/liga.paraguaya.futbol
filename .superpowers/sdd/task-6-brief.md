### Task 6: Backend — Seed Script

**Files:**
- Create: `backend/app/scripts/__init__.py`
- Create: `backend/app/scripts/seed.py`

**Interfaces:**
- Consumes: `Club`, `Partido`, `TablaPosicion` ORM; `engine`, `async_session` from core
- Produces: Loads JSON seed data into database tables

- [ ] **Step 1: Create directories**

```powershell
New-Item -ItemType Directory -Path "backend/app/scripts" -Force
```

- [ ] **Step 2: Create `backend/app/scripts/__init__.py`** (empty)

- [ ] **Step 3: Create `backend/app/scripts/seed.py`**

```python
import json
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import async_session, init_db
from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"


def load_json(name: str) -> list:
    path = DATA_DIR / name
    if not path.exists():
        print(f"  File not found: {path}")
        return []
    with open(path, "r", encoding="utf-8-sig") as f:
        return json.load(f)


async def seed_clubes(db: AsyncSession):
    data = load_json("clubes_paraguay.json")
    count = 0
    for item in data:
        existing = await db.execute(select(Club).where(Club.id == item["id"]))
        if existing.scalar_one_or_none():
            continue
        club = Club(
            id=item["id"],
            nombre=item["nombre"],
            ciudad=item["ciudad"],
            apodo=item["apodo"],
            colores=item["colores"],
            estadio=item["estadio"],
        )
        db.add(club)
        count += 1
    await db.flush()
    print(f"  Clubes: {count} nuevos")
    return count


async def seed_partidos(db: AsyncSession):
    data = load_json("partidos_demo.json")
    count = 0
    for item in data:
        existing = await db.execute(select(Partido).where(Partido.id == item["id"]))
        if existing.scalar_one_or_none():
            continue
        partido = Partido(
            id=item["id"],
            torneo=item["torneo"],
            fecha=date.fromisoformat(item["fecha"]),
            jornada=item.get("jornada", 1),
            local_id=item["local"],
            visitante_id=item["visitante"],
            goles_local=item.get("goles_local"),
            goles_visitante=item.get("goles_visitante"),
            estado=item["estado"],
        )
        db.add(partido)
        count += 1
    await db.flush()
    print(f"  Partidos: {count} nuevos")
    return count


async def seed_tabla(db: AsyncSession):
    data = load_json("tabla_posiciones_demo.json")
    count = 0
    for item in data:
        tabla_row = TablaPosicion(
            torneo=item.get("torneo", "Apertura 2026"),
            jornada=item.get("jornada", 1),
            club_id=item["club_id"],
            posicion=item["posicion"],
            pj=item["pj"],
            pg=item["pg"],
            pe=item["pe"],
            pp=item["pp"],
            gf=item["gf"],
            gc=item["gc"],
            dg=item["dg"],
            puntos=item["puntos"],
        )
        db.add(tabla_row)
        count += 1
    await db.flush()
    print(f"  Tabla: {count} filas nuevas")
    return count


async def main():
    print("Inicializando base de datos...")
    await init_db()
    print("Ejecutando seed...")
    async with async_session() as db:
        await seed_clubes(db)
        await seed_partidos(db)
        await seed_tabla(db)
        await db.commit()
    print("Seed completado.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

- [ ] **Step 4: Run seed script**

```powershell
cd backend
python -m backend.app.scripts.seed
```

Expected output:
```
Inicializando base de datos...
Ejecutando seed...
  Clubes: 4 nuevos
  Partidos: 2 nuevos
  Tabla: 4 filas nuevas
Seed completado.
```

- [ ] **Step 5: Run seed again (idempotent)**

```powershell
cd backend && python -m backend.app.scripts.seed
```

Expected: `Clubes: 0 nuevos, Partidos: 0 nuevos, Tabla: 0 filas nuevas`

- [ ] **Step 6: Verify API returns data**

```powershell
# In another terminal, start server
cd backend && uvicorn backend.app.main:app --reload --port 8001

# Then test
curl http://localhost:8001/api/v1/clubes
```

Expected: JSON array with 4 clubs.

```powershell
curl http://localhost:8001/api/v1/partidos
curl http://localhost:8001/api/v1/tabla
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(backend): seed script for initial data"
```

---


