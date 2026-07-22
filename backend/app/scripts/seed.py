import json
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import async_session, init_db
from ..models.club import Club
from ..models.goleador import Goleador
from ..models.partido import Partido
from ..models.tabla import TablaPosicion
from ..models.transferencia import Transferencia

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
    count_new = 0
    count_upd = 0
    for item in data:
        existing = await db.execute(select(Club).where(Club.id == item["id"]))
        club = existing.scalar_one_or_none()
        if club:
            changed = False
            for field in ("sitio_web", "descripcion", "titulos_liga", "titulos_info", "titulos_internacionales"):
                val = item.get(field)
                if val is not None and getattr(club, field, None) != val:
                    setattr(club, field, val)
                    changed = True
            if changed:
                count_upd += 1
            continue
        club = Club(
            id=item["id"],
            nombre=item["nombre"],
            ciudad=item["ciudad"],
            apodo=item["apodo"],
            colores=item["colores"],
            estadio=item.get("estadio", ""),
            capacidad=item.get("capacidad", 0),
            fundacion=item.get("fundacion", 1900),
            direccion=item.get("direccion", ""),
            escudo=item.get("escudo", ""),
            camiseta=item.get("camiseta", ""),
            sitio_web=item.get("sitio_web", ""),
            descripcion=item.get("descripcion", ""),
            titulos_liga=item.get("titulos_liga", 0),
            titulos_info=item.get("titulos_info", []),
            titulos_internacionales=item.get("titulos_internacionales", []),
        )
        db.add(club)
        count_new += 1
    await db.flush()
    print(f"  Clubes: {count_new} nuevos, {count_upd} actualizados")
    return count_new


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
        stmt = select(TablaPosicion).where(
            TablaPosicion.torneo == item.get("torneo", "Apertura 2026"),
            TablaPosicion.jornada == item.get("jornada", 1),
            TablaPosicion.club_id == item["club_id"],
        )
        existing = await db.execute(stmt)
        if existing.scalar_one_or_none():
            continue
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


async def seed_goleadores(db: AsyncSession):
    data = load_json("goleadores_demo.json")
    count_new = 0
    count_upd = 0
    for item in data:
        existing = await db.execute(select(Goleador).where(Goleador.id == item["id"]))
        g = existing.scalar_one_or_none()
        if g:
            g.nombre = item["nombre"]
            g.club_id = item["club_id"]
            g.goles = item["goles"]
            g.asistencias = item["asistencias"]
            g.torneo = item["torneo"]
            g.temporada = item["temporada"]
            count_upd += 1
            continue
        db.add(Goleador(
            id=item["id"],
            nombre=item["nombre"],
            club_id=item["club_id"],
            goles=item["goles"],
            asistencias=item["asistencias"],
            torneo=item["torneo"],
            temporada=item["temporada"],
        ))
        count_new += 1
    await db.flush()
    print(f"  Goleadores: {count_new} nuevos, {count_upd} actualizados")
    return count_new


async def seed_transferencias(db: AsyncSession):
    data = load_json("transferencias_demo.json")
    count_new = 0
    count_upd = 0
    for item in data:
        existing = await db.execute(select(Transferencia).where(Transferencia.id == item["id"]))
        t = existing.scalar_one_or_none()
        if t:
            for k, v in item.items():
                if k != "id":
                    setattr(t, k, v)
            count_upd += 1
            continue
        db.add(Transferencia(
            id=item["id"],
            jugador_nombre=item["jugador_nombre"],
            jugador_posicion=item.get("jugador_posicion"),
            club_origen_id=item.get("club_origen_id"),
            club_destino_id=item["club_destino_id"],
            fecha=__import__("datetime").date.fromisoformat(item["fecha"]),
            tipo=item["tipo"],
            estado=item["estado"],
            monto=item.get("monto"),
            duracion_meses=item.get("duracion_meses"),
            fuente_nombre=item.get("fuente_nombre"),
            verification_level=item.get("verification_level", 3),
            is_active=item.get("is_active", True),
        ))
        count_new += 1
    await db.flush()
    print(f"  Transferencias: {count_new} nuevos, {count_upd} actualizados")
    return count_new


HISTORICO_DIR = DATA_DIR / "partidos_historicos"


async def seed_tabla_historico(db: AsyncSession):
    import glob as _glob

    pattern = str(HISTORICO_DIR / "temporada_*.json")
    files = sorted(_glob.glob(pattern))
    total = 0
    for path in files:
        rel = Path(path).relative_to(DATA_DIR)
        print(f"  Cargando {Path(rel).as_posix()}...")
        data = load_json(str(rel))
        for item in data:
            stmt = select(TablaPosicion).where(
                TablaPosicion.torneo == item["torneo"],
                TablaPosicion.jornada == 0,
                TablaPosicion.club_id == item["club_id"],
            )
            existing = await db.execute(stmt)
            if existing.scalar_one_or_none():
                continue
            tabla_row = TablaPosicion(
                torneo=item["torneo"],
                jornada=0,
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
            total += 1
        await db.flush()
    print(f"  Tabla histÃ³rica: {total} filas nuevas")
    return total


async def main():
    print("Creando tablas (sin borrar datos existentes)...")
    from ..core.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Ejecutando seed...")
    async with async_session() as db:
        await seed_clubes(db)
        await seed_partidos(db)
        await seed_tabla(db)
        await seed_goleadores(db)
        await seed_transferencias(db)
        await db.commit()
    print("Seed completado.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
