import json
import uuid

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

                    if k == "fecha" and isinstance(v, str):

                        v = __import__("datetime").date.fromisoformat(v)

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

    print(f"  Tabla histórica: {total} filas nuevas")

    return total


async def seed_noticias(db: AsyncSession):
    """Semilla de 12 noticias con imágenes Unsplash y contenido HTML rico.

    Usa upsert por titulo: actualiza imagen_url/contenido si ya existe,
    inserta si no existe. Idempotente — correrlo de nuevo no duplica.
    """
    from ..models.noticia import Noticia
    from datetime import datetime

    _img = "https://images.unsplash.com/photo-{photo_id}?w=800&h=600&fit=crop&auto=format"

    noticias = [
        # ── 6 editoriales (origen="editorial", fuente="Liga Paraguaya") ──
        {
            "titulo": "Olimpia domina el Torneo Apertura con racha invicta de 14 fechas",
            "resumen": "El Decano acumula 11 victorias y 3 empates, liderando la tabla con 36 puntos.",
            "contenido": """<h2>Un campeonato dominante</h2>
<p>Club Olimpia llega a la fecha 15 del <strong>Torneo Apertura 2026</strong> como lider indiscutido. Con 11 victorias y solo 3 empates en 14 partidos, el equipo acumula 36 puntos y mantiene una diferencia de goles de +18 que habla de su solidez tanto en ataque como en defensa.</p>
<h2>El factor Defensores del Chaco</h2>
<p>El <strong>Defensores del Chaco</strong> se ha convertido en una fortaleza infranqueable. Olimpia no ha perdido en su estadio en todo el torneo, acumulando 6 victorias y 1 empate como local. La fanaticada ha respondido con asistencias historicas que elevan el rendimiento del plantel.</p>
<h2>Proximo desafio</h2>
<p>El proximo compromiso sera contra Sportivo Luqueno en la fecha 15, un partido que el equipo blancorrojo espera resolver con la misma contundencia que lo ha caracterizado durante toda la temporada. El entrenador ha confirmado que no habra rotaciones importantes.</p>""",
            "fuente": "Liga Paraguaya",
            "origen": "editorial",
            "pub_date": datetime(2026, 7, 20, 14, 0),
            "imagen_url": _img.format(photo_id="1574629810914-9e590e708vae"),
        },
        {
            "titulo": "Cerro Porteno se prepara para la Copa Libertadores con refuerzos estrella",
            "resumen": "El Abad del Sur incorpora dos jugadores de primer nivel para la fase de grupos continental.",
            "contenido": """<h2>Refuerzos de impacto inmediato</h2>
<p>Club Cerro Porteno ha concretado la incorporacion de dos futbolistas de jerarquia de cara a la <strong>Copa Libertadores 2026</strong>. Los nuevos refuerzos llegan para reforzar las lineas que mostraron debilidades en la fase anterior del torneo continental.</p>
<h2>El proyecto deportivo</h2>
<p>La dirigencia cerrenha ha invertido fuertemente en este plantel, entendiendo que la Copa Libertadores representa la maxima aspiracion del club. Con un presupuesto historico para refuerzos, Cerro apunta a superar la fase de grupos y llegar al menos a cuartos de final.</p>
<h2>La opinion del technical staff</h2>
<p>El cuerpo tecnico se muestra optimista con los nuevos incorporados, quienes ya se han entrenado con el grupo y muestran una adaptacion rapida al estilo de juego del equipo. Se esperan debuts oficiales en las proximas fechas del torneo local.</p>""",
            "fuente": "Liga Paraguaya",
            "origen": "editorial",
            "pub_date": datetime(2026, 7, 18, 10, 30),
            "imagen_url": _img.format(photo_id="1522778119319-2c3ba4d48a10"),
        },
        {
            "titulo": "Guarani apunta firme a la clasificacion a copas internacionales",
            "resumen": "El Aborigen necesita sumar en las ultimas fechas para asegurar su lugar en la zona continental.",
            "contenido": """<h2>Una temporada de altibajos</h2>
<p>Club Guarani ha tenido un Torneo Apertura irregular, pero las ultimas 5 fechas muestran una tendencia ascendente con 4 victorias y 1 empate. El equipo se encuentra en el 4to puesto con 28 puntos, justo en la zona de clasificacion a copas internacionales.</p>
<h2>El desafio de las ultimas fechas</h2>
<p>Con solo 4 partidos restantes, Guarani enfrenta un calendario exigente que incluye duelos directos contra equipos como Libertad y Nacional. Cada punto sera valioso para asegurar la clasificacion a la Copa Sudamericana 2026.</p>
<h2>Jugadores clave</h2>
<p>Los delanteros guaranitas han sido determinantes en la racha positiva, combinando experiencia juvenil con goles oportunos. El equipo busca consolidar su proyecto deportivo que incluye la formacion de jugadores locales.</p>""",
            "fuente": "Liga Paraguaya",
            "origen": "editorial",
            "pub_date": datetime(2026, 7, 15, 16, 0),
            "imagen_url": _img.format(photo_id="1431324155650-1b4475d6560c"),
        },
        {
            "titulo": "Rubio Nu, la revelacion del Torneo Apertura 2026",
            "resumen": "El equipo del cerro suma 5 victorias consecutivas y asciende a positions de privilegio.",
            "contenido": """<h2>La racha que asombra</h2>
<p>Club Rubio Nu se ha convertido en la <strong>revelacion del Torneo Apertura 2026</strong>. Con 5 victorias consecutivas y un fútbol ofensivo que ha enamorado a su fanaticada, el equipo del cerro ha escalado posiciones hasta situarse en el 5to lugar de la tabla.</p>
<h2>El merito del cuerpo tecnico</h2>
<p>El entrenador ha logrado cohesionar un plantel joven con piezas experimentadas, creando un sistema de juego que aprovecha la velocidad de sus extremos y la contundencia de su delantero centro. El trabajo tactico ha sido clave en esta racha historica.</p>
<h2>Los proximos compromisos</h2>
<p>Rubio Nu busca mantener la racha en las proximas fechas, cuando enfrente a equipos de mayor jerarquia. El plantel se mantiene motivado y con la confianza necesaria para seguir sumando victorias importantes.</p>""",
            "fuente": "Liga Paraguaya",
            "origen": "editorial",
            "pub_date": datetime(2026, 7, 12, 11, 0),
            "imagen_url": _img.format(photo_id="1508098682722-e99c43a406b2"),
        },
        {
            "titulo": "Sportivo Luqueno busca reencontrarse con la victoria en el Defensores del Chaco",
            "resumen": "El club de Luque necesita sumar puntos urgentemente para alejarse de los ultimos puestos.",
            "contenido": """<h2>Un momento complicado</h2>
<p>Sportivo Luqueno atraviesa un<strong> momento complicado</strong> en el Torneo Apertura 2026. Con solo 1 victoria en los ultimos 6 partidos, el equipo se encuentra en zona peligrosa con 16 puntos, a solo 3 puntos del ultimo puesto.</p>
<h2>La urgencia de sumar</h2>
<p>El plantel es consciente de la situacion critica y cada partido se convierte en una final. El entrenador ha reforzado los entrenamientos tácticos y ha做出 cambios en la alineacion para buscar la mejor combinacion posible.</p>
<h2>El apoyo de la fanaticada</h2>
<p>A pesar de los malos resultados, la fanaticada luquena se mantiene fiel al equipo. Los hinchas esperan que la visita al Defensores del Chaco sirva para revertir la situacion y empezar a sumar de a tres.</p>""",
            "fuente": "Liga Paraguaya",
            "origen": "editorial",
            "pub_date": datetime(2026, 7, 10, 9, 0),
            "imagen_url": _img.format(photo_id="1553778263-737702704237"),
        },
        {
            "titulo": "La Seleccion Paraguaya convoca a sus figuras para las Eliminatorias Sudamericanas",
            "resumen": "El Trebol convoca a 23 jugadores para los compromisos de septiembre contra Brasil y Venezuela.",
            "contenido": """<h2>La lista definitiva</h2>
<p>El director tecnico de la <strong>Seleccion Paraguaya</strong> ha dado a conocer la lista de 23 convocados para las proximas fechas de las Eliminatorias Sudamericanas 2026. Los compromisos seran contra Brasil en Asuncion y Venezuela en Puerto La Cruz.</p>
<h2>Las novedades</h2>
<p>Entre las novedades destacan el回归 de figuras que estuvieron ausentes en la fecha anterior, asi como el debut de jovenes talentos del futbol local. La inclusion de jugadores de Olimpia, Cerro Porteno y Guarani refuerza el compromiso de la liga con la seleccion.</p>
<h2>El objetivo clasificatorio</h2>
<p>Paraguay se encuentra en zona de clasificacion directa al Mundial 2026, pero necesita sumar puntos para mantener su posicion. Los proximos dos partidos son fundamentales para el sueño mundialista.</p>""",
            "fuente": "Liga Paraguaya",
            "origen": "editorial",
            "pub_date": datetime(2026, 7, 8, 15, 0),
            "imagen_url": _img.format(photo_id="1579952363873-27f3bade9f55"),
        },
        # ── 6 RSS (origen="rss", distintas fuentes) ──
        {
            "titulo": "Olimpia golea a Nacional y se consolida como lider del Apertura",
            "resumen": "El Decano venció 3-0 en el Defensores del Chaco con goles de Amaral, Benitez y Espinola.",
            "contenido": """<h2>Un triunfo contundente</h2>
<p>Club Olimpia goleo 3-0 a Nacional en el <strong>Defensores del Chaco</strong>, en un partido donde el equipo blancorrojo domino de principio a fin. Los goles fueron obra de Amaral (minuto 23), Benitez (minuto 56) y Espinola (minuto 78).</p>
<h2>El partido</h2>
<p>Olimpia salio con la intencion clara de sentenciar el partido desde el inicio. La presion alta del equipo no le permitio a Nacional generar peligro, y a los 23 minutos Amaral abrió el marcador tras una jugada colectiva magistral.</p>
<h2>Las cifras</h2>
<p>Con este resultado, Olimpia acumula 39 puntos en 15 partidos, manteniendo una ventaja de 7 puntos sobre el segundo clasificado. El equipo ha convertido 38 goles y solo ha recibido 12, mostrando un balance extraordinario.</p>""",
            "fuente": "ABC Color",
            "origen": "rss",
            "pub_date": datetime(2026, 7, 21, 22, 0),
            "imagen_url": _img.format(photo_id="1517466787188-cf91b740d3f6"),
            "url_original": "https://www.abc.com.py/deportes/olimpia-nacional-3-0",
        },
        {
            "titulo": "Libertad y Guarani empatan 1-1 en el clásico del bairro Sacramento",
            "resumen": "Empate justo en un clásico donde ambos equipos tuvieron chances de victoria.",
            "contenido": """<h2>Un clásico intenso</h2>
<p>El clásico del bairro Sacramento entre Libertad y Guarani finalizó con un empate 1-1 que deja a ambos equipos con gustos agridulces. Libertad adelantó en el primer tiempo, pero Guarani igualó en los ultimos minutos del complemento.</p>
<h2>Los goles</h2>
<p>Libertad se adelanto al minuto 34 mediante un tiro libre magistral. Guarani no se rindió y en el minuto 82, con un cabezazo en una jugada a balon parado, empato el marcador y silencio al publico local.</p>
<h2>Las consecuencias</h2>
<p>El empate beneficia a Olimpia, que aumenta su ventaja en la tabla. Libertad se mantiene segundo con 32 puntos, mientras que Guarani suma 29 y se consolida en zona de clasificacion internacional.</p>""",
            "fuente": "ESPN Paraguay",
            "origen": "rss",
            "pub_date": datetime(2026, 7, 19, 20, 30),
            "imagen_url": _img.format(photo_id="1560272618-493d3ea477f8"),
            "url_original": "https://www.espn.com.py/futbol/nota/_/id/libertad-guarani-1-1",
        },
        {
            "titulo": "Cerro Porteno vence a Sportivo Trinidense y sigue segundo en la tabla",
            "resumen": "El Abad del Sur sumó tres puntos importantes en la búsqueda del título.",
            "contenido": """<h2>Tres puntos vitales</h2>
<p>Club Cerro Porteno venció 2-1 a Sportivo Trinidense en un partido complicado que el equipo cerrenha supo resolver en los detalles. Los goles fueron de Romero y Lucero, mientras que Trinidense descontó desde el punto penal.</p>
<h2>El análisis tecnico</h2>
<p>El entrenador cerrenho reconoció que no fue el mejor partido de su equipo, pero destacó la capacidad de reacción y la solidez defensiva en los momentos complicados. "Los tres puntos son lo que importa en esta fase del torneo", declaró.</p>
<h2>La tabla se ajusta</h2>
<p>Con este triunfo, Cerro Porteno se mantiene en el segundo puesto con 33 puntos, a 6 de Olimpia. El equipo busca mantener la presion sobre el lider y esperar cualquier tropiezo en las ultimas fechas.</p>""",
            "fuente": "Telefuturo",
            "origen": "rss",
            "pub_date": datetime(2026, 7, 17, 18, 0),
            "imagen_url": _img.format(photo_id="1551958325-38adb9e48dbb"),
            "url_original": "https://www.telefuturo.com.py/deportes/cerro-trinidense-2-1",
        },
        {
            "titulo": "Rubio Nu sigue su racha invicta con victoria sobre 12 de Octubre",
            "resumen": "El equipo del cerro ya suma 6 triunfos consecutivos en el torneo local.",
            "contenido": """<h2>La racha continúa</h2>
<p>Club Rubio Nu sumó su sexta victoria consecutiva al vencer 2-0 a 12 de Octubre en el Estadio General Adrián Jara. Los goles fueron de Fernández y González, en un partido donde el equipo local no tuvo problemas para controlar.</p>
<h2>El ascenso meteórico</h2>
<p>En apenas 6 fechas, Rubio Nu ha pasado del 10mo al 5to puesto de la tabla. La confianza del plantel es máxima y el equipo ha mostrado un fútbol ofensivo que ha dejado grandes actuaciones.</p>
<h2>Los números hablan</h2>
<p>En esta racha, Rubio Nu ha convertido 14 goles y solo ha recibido 3. El equipo ha promediado el 67% de posesión en cada partido, mostrando un dominio absoluto en cada compromiso.</p>""",
            "fuente": "La Nación",
            "origen": "rss",
            "pub_date": datetime(2026, 7, 14, 17, 0),
            "imagen_url": _img.format(photo_id="1517841905240-472689e1170e"),
            "url_original": "https://www.lanacion.com.py/deportes/rubio-nu-12-octubre-2-0",
        },
        {
            "titulo": "Nacional busca reactivarse tras dos derrotas consecutivas",
            "resumen": "El Tricolor necesita sumar urgente para no alejarse de la zona de clasificación.",
            "contenido": """<h2>Un momento delicado</h2>
<p>Club Nacional atraviesa su peor momento en el Torneo Apertura 2026. Con dos derrotas consecutivas (3-0 ante Olimpia y 2-1 ante 3 de Febrero), el equipo ha caído al 7mo puesto con 24 puntos.</p>
<h2>Los problemas del equipo</h2>
<p>La principal debilidad de Nacional ha sido su defensa, que ha recibido 5 goles en los últimos dos partidos. El cuerpo técnico ha trabajado en soluciones tácticas para mejorar la solidez colectiva.</p>
<h2>La oportunidad de reacción</h2>
<p>El próximo rival será Sol de América, un equipo accesible que podría servir para que Nacional retome el camino de las victorias y recupere la confianza perdida.</p>""",
            "fuente": "Popular",
            "origen": "rss",
            "pub_date": datetime(2026, 7, 11, 14, 0),
            "imagen_url": _img.format(photo_id="1556056612-9a3b42d1f3e6"),
            "url_original": "https://www.popular.com.py/deportes/nacional-crisis",
        },
        {
            "titulo": "La ADF convoca torneo sub-17 con participation de 12 clubes de la liga",
            "resumen": "El torneo juvenil buscara descubrir nuevos talentos para las selecciones inferiores.",
            "contenido": """<h2>El torneo sub-17</h2>
<p>La Asociación Deportiva de Fútbbol (ADF) ha convocado un torneo sub-17 que reunirá a los mejores juveniles de 12 clubes de la liga paraguaya. El certamen se disputará en las instalaciones del Parque Hernando de la Quintana.</p>
<h2>El objetivo</h2>
<p>El principal objetivo del torneo es servir como cantera de talentos para las selecciones nacionales juveniles. Los entrenadores de las categorías inferiores de la seleccion estarán presentes para observar a los jovenes futbolistas.</p>
<h2>Los clubes participantes</h2>
<p>Participarán Olimpia, Cerro Porteño, Guarani, Libertad, Nacional, Sportivo Luqueño, Rubio Ñú, 3 de Febrero, General Díaz, Deportivo Capiatá, Fernando de la Mora y Sportivo Trinidense. El torneo arrancará el próximo fin de semana.</p>""",
            "fuente": "1000 Noticias",
            "origen": "rss",
            "pub_date": datetime(2026, 7, 9, 12, 0),
            "imagen_url": _img.format(photo_id="1431324155650-1b4475d6560c"),
            "url_original": "https://www.1000noticias.com.py/deportes/bsub-17",
        },
    ]

    count_new = 0
    count_upd = 0

    for n in noticias:
        stmt = select(Noticia).where(Noticia.titulo == n["titulo"])
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            changed = False
            if existing.imagen_url != n.get("imagen_url"):
                existing.imagen_url = n.get("imagen_url")
                changed = True
            if existing.contenido != n.get("contenido"):
                existing.contenido = n.get("contenido")
                changed = True
            if existing.resumen != n.get("resumen"):
                existing.resumen = n.get("resumen")
                changed = True
            if existing.url_original != n.get("url_original"):
                existing.url_original = n.get("url_original")
                changed = True
            if changed:
                count_upd += 1
            continue

        noticia = Noticia(
            id=str(uuid.uuid4()),
            titulo=n["titulo"],
            resumen=n["resumen"],
            contenido=n["contenido"],
            imagen_url=n.get("imagen_url"),
            video_url=None,
            fuente=n["fuente"],
            origen=n["origen"],
            url_original=n.get("url_original"),
            pub_date=n["pub_date"],
            is_published=True,
        )
        db.add(noticia)
        count_new += 1

    await db.flush()
    print(f"  Noticias: {count_new} nuevas, {count_upd} actualizadas")
    return count_new


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

        await seed_noticias(db)

        await db.commit()

    print("Seed completado.")





if __name__ == "__main__":

    import asyncio

    asyncio.run(main())

