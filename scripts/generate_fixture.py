import json
from datetime import date, timedelta

clubes = [
    "olimpia", "cerro-porteno", "libertad", "guarani", "nacional",
    "recoleta", "rubio-nu", "2-de-mayo", "ameliano", "luqueno",
    "san-lorenzo", "trinidense"
]

score_map = {
    ("olimpia", "cerro-porteno"): (2, 1),
    ("olimpia", "libertad"): (1, 0),
    ("olimpia", "guarani"): (3, 0),
    ("olimpia", "nacional"): (1, 1),
    ("olimpia", "recoleta"): (2, 0),
    ("olimpia", "rubio-nu"): (1, 0),
    ("olimpia", "2-de-mayo"): (4, 1),
    ("olimpia", "ameliano"): (0, 0),
    ("olimpia", "luqueno"): (2, 0),
    ("olimpia", "san-lorenzo"): (3, 0),
    ("olimpia", "trinidense"): (2, 2),
    ("cerro-porteno", "olimpia"): (1, 1),
    ("cerro-porteno", "libertad"): (2, 1),
    ("cerro-porteno", "guarani"): (1, 0),
    ("cerro-porteno", "nacional"): (0, 1),
    ("cerro-porteno", "recoleta"): (2, 1),
    ("cerro-porteno", "rubio-nu"): (1, 0),
    ("cerro-porteno", "2-de-mayo"): (3, 0),
    ("cerro-porteno", "ameliano"): (2, 0),
    ("cerro-porteno", "luqueno"): (1, 1),
    ("cerro-porteno", "san-lorenzo"): (2, 0),
    ("cerro-porteno", "trinidense"): (2, 1),
    ("libertad", "olimpia"): (0, 2),
    ("libertad", "cerro-porteno"): (1, 2),
    ("libertad", "guarani"): (2, 0),
    ("libertad", "nacional"): (0, 1),
    ("libertad", "recoleta"): (3, 2),
    ("libertad", "rubio-nu"): (0, 0),
    ("libertad", "2-de-mayo"): (3, 0),
    ("libertad", "ameliano"): (1, 2),
    ("libertad", "luqueno"): (2, 0),
    ("libertad", "san-lorenzo"): (4, 0),
    ("libertad", "trinidense"): (1, 2),
    ("guarani", "olimpia"): (0, 1),
    ("guarani", "cerro-porteno"): (1, 0),
    ("guarani", "libertad"): (1, 1),
    ("guarani", "nacional"): (1, 1),
    ("guarani", "recoleta"): (3, 0),
    ("guarani", "rubio-nu"): (1, 0),
    ("guarani", "2-de-mayo"): (2, 2),
    ("guarani", "ameliano"): (0, 0),
    ("guarani", "luqueno"): (3, 1),
    ("guarani", "san-lorenzo"): (4, 0),
    ("guarani", "trinidense"): (2, 0),
    ("nacional", "olimpia"): (1, 0),
    ("nacional", "cerro-porteno"): (2, 0),
    ("nacional", "libertad"): (1, 0),
    ("nacional", "guarani"): (1, 1),
    ("nacional", "recoleta"): (1, 0),
    ("nacional", "rubio-nu"): (0, 0),
    ("nacional", "2-de-mayo"): (1, 0),
    ("nacional", "ameliano"): (2, 2),
    ("nacional", "luqueno"): (1, 1),
    ("nacional", "san-lorenzo"): (2, 0),
    ("nacional", "trinidense"): (0, 0),
    ("recoleta", "olimpia"): (2, 2),
    ("recoleta", "cerro-porteno"): (0, 1),
    ("recoleta", "libertad"): (2, 1),
    ("recoleta", "guarani"): (1, 0),
    ("recoleta", "nacional"): (3, 0),
    ("recoleta", "rubio-nu"): (0, 1),
    ("recoleta", "2-de-mayo"): (4, 0),
    ("recoleta", "ameliano"): (1, 2),
    ("recoleta", "luqueno"): (3, 1),
    ("recoleta", "san-lorenzo"): (5, 1),
    ("recoleta", "trinidense"): (2, 1),
    ("rubio-nu", "olimpia"): (0, 2),
    ("rubio-nu", "cerro-porteno"): (0, 2),
    ("rubio-nu", "libertad"): (0, 3),
    ("rubio-nu", "guarani"): (0, 0),
    ("rubio-nu", "nacional"): (2, 1),
    ("rubio-nu", "recoleta"): (1, 0),
    ("rubio-nu", "2-de-mayo"): (4, 1),
    ("rubio-nu", "ameliano"): (1, 0),
    ("rubio-nu", "luqueno"): (0, 2),
    ("rubio-nu", "san-lorenzo"): (1, 0),
    ("rubio-nu", "trinidense"): (0, 2),
    ("2-de-mayo", "olimpia"): (0, 1),
    ("2-de-mayo", "cerro-porteno"): (2, 0),
    ("2-de-mayo", "libertad"): (0, 1),
    ("2-de-mayo", "guarani"): (2, 1),
    ("2-de-mayo", "nacional"): (0, 3),
    ("2-de-mayo", "recoleta"): (1, 3),
    ("2-de-mayo", "rubio-nu"): (1, 0),
    ("2-de-mayo", "ameliano"): (1, 1),
    ("2-de-mayo", "luqueno"): (1, 0),
    ("2-de-mayo", "san-lorenzo"): (0, 0),
    ("2-de-mayo", "trinidense"): (1, 1),
    ("ameliano", "olimpia"): (1, 2),
    ("ameliano", "cerro-porteno"): (1, 1),
    ("ameliano", "libertad"): (0, 0),
    ("ameliano", "guarani"): (1, 0),
    ("ameliano", "nacional"): (0, 0),
    ("ameliano", "recoleta"): (1, 0),
    ("ameliano", "rubio-nu"): (1, 1),
    ("ameliano", "2-de-mayo"): (2, 0),
    ("ameliano", "luqueno"): (3, 1),
    ("ameliano", "san-lorenzo"): (2, 0),
    ("ameliano", "trinidense"): (3, 1),
    ("luqueno", "olimpia"): (0, 2),
    ("luqueno", "cerro-porteno"): (1, 2),
    ("luqueno", "libertad"): (1, 2),
    ("luqueno", "guarani"): (1, 0),
    ("luqueno", "nacional"): (2, 2),
    ("luqueno", "recoleta"): (3, 1),
    ("luqueno", "rubio-nu"): (2, 0),
    ("luqueno", "2-de-mayo"): (1, 0),
    ("luqueno", "ameliano"): (1, 2),
    ("luqueno", "san-lorenzo"): (0, 0),
    ("luqueno", "trinidense"): (0, 1),
    ("san-lorenzo", "olimpia"): (0, 2),
    ("san-lorenzo", "cerro-porteno"): (1, 1),
    ("san-lorenzo", "libertad"): (0, 2),
    ("san-lorenzo", "guarani"): (1, 1),
    ("san-lorenzo", "nacional"): (0, 2),
    ("san-lorenzo", "recoleta"): (1, 1),
    ("san-lorenzo", "rubio-nu"): (0, 1),
    ("san-lorenzo", "2-de-mayo"): (1, 2),
    ("san-lorenzo", "ameliano"): (0, 1),
    ("san-lorenzo", "luqueno"): (2, 1),
    ("san-lorenzo", "trinidense"): (0, 2),
    ("trinidense", "olimpia"): (1, 2),
    ("trinidense", "cerro-porteno"): (2, 1),
    ("trinidense", "libertad"): (3, 1),
    ("trinidense", "guarani"): (1, 1),
    ("trinidense", "nacional"): (1, 2),
    ("trinidense", "recoleta"): (1, 1),
    ("trinidense", "rubio-nu"): (1, 0),
    ("trinidense", "2-de-mayo"): (2, 0),
    ("trinidense", "ameliano"): (0, 0),
    ("trinidense", "luqueno"): (2, 1),
    ("trinidense", "san-lorenzo"): (1, 0),
}

def round_robin(teams):
    n = len(teams)
    if n % 2 == 1:
        teams = teams + [None]
        n += 1
    rounds = []
    for r in range(n - 1):
        round_matches = []
        for i in range(n // 2):
            h = teams[i]
            a = teams[n - 1 - i]
            if h is not None and a is not None:
                if r % 2 == 1:
                    round_matches.append((a, h))
                else:
                    round_matches.append((h, a))
        rounds.append(round_matches)
        teams = [teams[0]] + [teams[-1]] + teams[1:-1]
    return rounds

partidos = []
match_id = 1

start_date = date(2026, 1, 31)

def get_score(local, visitante):
    key = (local, visitante)
    key_rev = (visitante, local)
    if key in score_map:
        return score_map[key]
    elif key_rev in score_map:
        return (score_map[key_rev][1], score_map[key_rev][0])
    return (0, 0)

ronda_ida = round_robin(clubes[:])

for jornada_idx, ronda in enumerate(ronda_ida):
    jornada = jornada_idx + 1
    fecha = start_date + timedelta(weeks=jornada_idx)
    for local, visitante in ronda:
        goles_local, goles_visitante = get_score(local, visitante)
        partidos.append({
            "id": f"apertura-2026-{match_id:03d}",
            "torneo": "Apertura 2026",
            "fecha": fecha.isoformat(),
            "jornada": jornada,
            "local": local,
            "visitante": visitante,
            "goles_local": goles_local,
            "goles_visitante": goles_visitante,
            "estado": "finalizado"
        })
        match_id += 1

clubes_rev = clubes[1:] + [clubes[0]]
ronda_vuelta = round_robin(clubes_rev)

for jornada_idx, ronda in enumerate(ronda_vuelta):
    jornada = jornada_idx + 12
    fecha = start_date + timedelta(weeks=jornada_idx + 12)
    for local, visitante in ronda:
        goles_local, goles_visitante = get_score(local, visitante)
        partidos.append({
            "id": f"apertura-2026-{match_id:03d}",
            "torneo": "Apertura 2026",
            "fecha": fecha.isoformat(),
            "jornada": jornada,
            "local": local,
            "visitante": visitante,
            "goles_local": goles_local,
            "goles_visitante": goles_visitante,
            "estado": "finalizado"
        })
        match_id += 1

clausura_start = date(2026, 7, 18)
c_rounds = round_robin(clubes[:])

for jornada_idx, ronda in enumerate(c_rounds[:5]):
    jornada = jornada_idx + 1
    fecha = clausura_start + timedelta(weeks=jornada_idx)
    for local, visitante in ronda:
        partidos.append({
            "id": f"clausura-2026-{match_id:03d}",
            "torneo": "Clausura 2026",
            "fecha": fecha.isoformat(),
            "jornada": jornada,
            "local": local,
            "visitante": visitante,
            "goles_local": None,
            "goles_visitante": None,
            "estado": "programado"
        })
        match_id += 1

with open("data/partidos_demo.json", "w", encoding="utf-8") as f:
    json.dump(partidos, f, ensure_ascii=False, indent=2)

print(f"Generated {len(partidos)} matches")
