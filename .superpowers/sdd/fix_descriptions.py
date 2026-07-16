import json, re

with open("data/clubes_paraguay.json", "r", encoding="utf-8") as f:
    clubs = json.load(f)

descriptions = {
    "olimpia": (
        "El Club Olimpia es una entidad deportiva con sede en la ciudad de Asunción, Paraguay. "
        "Fue fundado el 25 de julio de 1902 por un grupo de jóvenes paraguayos. Su nombre fue propuesto "
        "por William Paats, ciudadano neerlandés radicado en el país desde fines del siglo XIX y "
        "considerado el «padre del fútbol paraguayo» por haber insertado y fomentado la práctica de "
        "dicho deporte en el país. El equipo disputa sus partidos de local en el Estadio Osvaldo "
        "Domínguez Dibb, conocido popularmente como El Bosque."
    ),
    "cerro-porteno": (
        "El Club Cerro Porteño es una entidad deportiva con sede en el barrio Obrero de la capital "
        "de Paraguay, Asunción. Su principal actividad es el fútbol y actualmente compite en la "
        "Primera División de Paraguay, donde ha logrado conquistar un total de 41 títulos oficiales "
        "a lo largo de su historia. Fue fundado el 1 de octubre de 1912 bajo el nombre de Cerro "
        "Porteño Football Club."
    ),
    "colegiales": (
        "El Club Atlético Colegiales es un equipo profesional de fútbol de Paraguay oriundo de la "
        "zona de Cuatro Mojones, municipio de Lambaré. Fue fundado el 7 de enero de 1977. "
        "Actualmente milita en la Tercera División de Paraguay desde 2024."
    ),
    "libertad": (
        "El Club Libertad es una entidad deportiva con sede en el barrio Las Mercedes de la ciudad "
        "de Asunción, Paraguay. El club fue fundado el 30 de julio de 1905. Hasta la fecha ha "
        "conquistado un total de 26 campeonatos de primera división, además de tres títulos de "
        "Copa Paraguay y dos de Supercopa Paraguay."
    ),
    "guarani": (
        "El Club Guaraní es una institución deportiva y social de Paraguay, con sede en el barrio "
        "Pinozá, en la zona conocida como Dos Bocas de la ciudad de Asunción. Fundado el 12 de "
        "octubre de 1903, juega en la Primera División de Paraguay desde su creación. Disputa el "
        "clásico más añejo ante Olimpia y el clásico capitalino frente a Libertad. También mantiene "
        "una importante rivalidad deportiva con Cerro Porteño y en menor medida con el Sportivo Luqueño."
    ),
    "general-caballero": (
        "El Club General Caballero es un club de fútbol de Paraguay, de la ciudad de "
        "Dr. Juan León Mallorquín (ex Ka'arendy), departamento de Alto Paraná. Desde el año 2026 "
        "disputa en la Segunda División de Paraguay, tras no haber logrado salvar la categoría en "
        "la temporada 2025, luego de 4 años en Primera División."
    ),
    "nacional": (
        "El Club Nacional es una entidad deportiva con sede en el barrio Obrero de la ciudad de "
        "Asunción que se desempeña en la Primera División de Paraguay."
    ),
    "recoleta": (
        "Recoleta Football Club, anteriormente conocido como Club Deportivo Recoleta, es una "
        "asociación deportiva y social de la ciudad de Asunción, Paraguay, con sede en el barrio "
        "del mismo nombre. Fue fundado el 12 de febrero de 1931. Su club de fútbol milita en la "
        "Primera División de Paraguay desde 2025."
    ),
    "rubio-nu": (
        "El Club Rubio Ñu es un club de fútbol paraguayo, situado en el barrio Santísima Trinidad "
        "de la ciudad de Asunción. Fue fundado el 24 de agosto de 1913 por jóvenes menores de 18 "
        "años en honor a los niños mártires de Acosta Ñu, batalla ocurrida durante la Guerra de la "
        "Triple Alianza. Su clásico rival es el Club Sportivo Trinidense, más conocido como el "
        "«Clásico de Trinidad». Desde la temporada 2026 disputa la Primera División de Paraguay, "
        "tras ascender y coronarse campeón en la División Intermedia."
    ),
    "2-de-mayo": (
        "El Club Sportivo 2 de Mayo es un club de fútbol paraguayo con sede en la ciudad de "
        "Pedro Juan Caballero, capital del departamento de Amambay. Desde 2024 compite en la "
        "Primera División, después de una ausencia de 14 años, habiendo estado en la máxima "
        "categoría entre los años 2006 y 2009."
    ),
    "ameliano": (
        "El Club Sportivo Ameliano, también conocido simplemente como Ameliano, es una entidad "
        "deportiva de Paraguay con sede social en el barrio Jara de la ciudad de Asunción y su "
        "campo de juego en la ciudad de Villeta. Su fundación se remonta a 1936, y desde el año "
        "2022 compite en la Primera División de Paraguay."
    ),
    "luqueno": (
        "El Club Sportivo Luqueño es un club de fútbol de Paraguay, ubicado en la ciudad de Luque. "
        "Fue fundado el 1 de mayo de 1921 a partir de la fusión de los clubes Marte Atlético, "
        "El Vencedor y General Aquino, con el objetivo de consolidar a la comunidad deportiva de "
        "Luque. Participa en la Primera División de Paraguay, donde ha obtenido 2 títulos absolutos "
        "y 6 subcampeonatos."
    ),
    "san-lorenzo": (
        "El Club Sportivo San Lorenzo, o simplemente San Lorenzo, es un club deportivo situado "
        "en la ciudad de San Lorenzo, Departamento Central, y afiliado a la Asociación Paraguaya "
        "de Fútbol. Fue fundado el 17 de abril de 1930 y actualmente milita en la Primera División "
        "del fútbol paraguayo."
    ),
    "sol-de-america": (
        "El Club Sol de América es una asociación deportiva de Paraguay cuya sede social se "
        "encuentra en el barrio Obrero de Asunción y su campo de fútbol se sitúa en la ciudad "
        "vecina de Villa Elisa. Fue fundado el 22 de marzo de 1909 en la ciudad capital del país. "
        "En fútbol milita desde 2025 en la Segunda División, luego de descender de la Primera "
        "División, categoría en la cual es uno de los animadores históricos más tradicionales."
    ),
    "tembetary": (
        "El Club Atlético Tembetary, o simplemente Tembetary, es un club de fútbol actualmente "
        "ubicado en la ciudad de Villa Elisa, Paraguay. Fue fundado el 3 de agosto de 1912, en el "
        "barrio del mismo nombre de la capital paraguaya, Asunción. Desde la temporada 2026 "
        "competirá en la Segunda División de fútbol de Paraguay."
    ),
    "trinidense": (
        "El Sportivo Trinidense es un club de fútbol de Paraguay que milita actualmente en la "
        "Primera División de Paraguay. Está situado en el barrio Virgen de la Asunción del distrito "
        "de Santísima Trinidad, en la ciudad de Asunción. Sus partidos como local los juega en el "
        "Estadio Martín Torres. Su clásico rival es el club Rubio Ñu, cuyo estadio se encuentra a "
        "1 km de distancia, en el denominado Clásico de Trinidad."
    ),
}

for club in clubs:
    cid = club["id"]
    if cid in descriptions:
        club["descripcion"] = descriptions[cid]
    else:
        print(f"WARNING: no description for {cid}")

with open("data/clubes_paraguay.json", "w", encoding="utf-8") as f:
    json.dump(clubs, f, ensure_ascii=False, indent=2)

print("OK: 16 descriptions updated")
