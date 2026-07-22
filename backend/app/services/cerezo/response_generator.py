import json
import logging

logger = logging.getLogger(__name__)

_TEMPLATES: dict[str, list[str]] = {
    "greeting": [
        "Â¡Hola! Soy Cerezo Digital. Preguntame sobre clubes, partidos, la tabla, o pedime predicciones.",
        "Â¡Hola, hincha! Estoy acÃ¡ para responder todo sobre la liga paraguaya. Â¿QuÃ© querÃ©s saber?",
    ],
    "club_info": [
        "{club[nombre]} fue fundado en {club[fundacion]}. Tiene {club[titulos_liga]} tÃ­tulos de liga y {total_intl} tÃ­tulos internacionales.",
        "{club[nombre]} juega en {club[estadio]}, fundado en {club[fundacion]}. {titulos_resumen}",
    ],
    "table_position": [
        "{club_nombre} estÃ¡ en el puesto {posicion}Â° con {puntos} puntos en {partidos} partidos.",
        "En la tabla, {club_nombre} va {posicion}Â° con {puntos} puntos.",
        "AcÃ¡ va la tabla. Consultame por algÃºn club en particular para mÃ¡s detalles.",
        "MirÃ¡ la tabla general. Decime un club para saber su posiciÃ³n exacta.",
    ],
    "prediction": [
        "SegÃºn los datos, {local} tiene {local_pct}% de ganar, {draw_pct}% empate, {visitante_pct}% {visitante}. Confianza: {confidence}.",
        "Cerezo dice: {local} {local_pct}% â€” {draw_pct}% empate â€” {visitante} {visitante_pct}%. Basado en {total_h2h} partidos histÃ³ricos.",
    ],
    "head_to_head": [
        "En los Ãºltimos {total} partidos: {local_nombre} ganÃ³ {local_wins}, {visitante_nombre} ganÃ³ {vis_wins}, {draws} empates.",
    ],
    "club_comparison": [
        "{a_nombre} tiene {a_ligas} ligas y {a_intl} tÃ­tulos internacionales. {b_nombre} tiene {b_ligas} ligas y {b_intl} tÃ­tulos internacionales. {ventaja}",
        "{a_nombre} fue fundado en {a_fundacion} ({a_edad} aÃ±os) y {b_nombre} en {b_fundacion} ({b_edad} aÃ±os). {ventaja_edad}",
    ],
    "next_match": [
        "El prÃ³ximo partido es el {fecha} contra {rival} por el {torneo}.",
        "Juega el {fecha} vs {rival} en el {torneo}.",
        "PrÃ³ximos partidos: {lista_partidos}",
    ],
    "match_result": [
        "Los Ãºltimos partidos: revisÃ¡ la tabla de partidos para mÃ¡s detalles.",
        "En los Ãºltimos {forma_total} partidos: {wins} ganados, {draws} empatados, {losses} perdidos.",
    ],
    "top_scorer": [
        "TodavÃ­a no tengo datos de goleadores actualizados al instante. Preguntame sobre clubes o partidos.",
    ],
    "general_question": [
        "Buena pregunta. Lamentablemente no tengo acceso a esa informaciÃ³n en este momento. Preguntame sobre clubes, partidos, la tabla, o pedime predicciones.",
        "Eso no lo tengo registrado. Soy experto en la liga paraguaya: preguntame por clubes, posiciones, resultados, o predicciones.",
    ],
    "unknown": [
        "No entendÃ­ bien. ProbÃ¡ preguntar: datos de un club, quiÃ©n ganÃ³ un partido, cÃ³mo viene la tabla, o quiÃ©n va a ganar.",
        "No estoy seguro de lo que preguntÃ¡s. Decime algo como: 'Datos de Olimpia', 'QuiÃ©n ganÃ³ el clÃ¡sico', o 'QuiÃ©n lidera la tabla'.",
    ],
}

_LLM_AVAILABLE: bool | None = None
_LLM = None


def _get_llm():
    global _LLM, _LLM_AVAILABLE
    if _LLM_AVAILABLE is False:
        return None
    if _LLM is not None:
        return _LLM
    try:
        from llama_cpp import Llama
        import os
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "models",
            "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
        )
        if not os.path.exists(model_path):
            logger.warning("Tiny LLM model not found at %s", model_path)
            _LLM_AVAILABLE = False
            return None
        _LLM = Llama(model_path, n_ctx=512, verbose=False)
        _LLM_AVAILABLE = True
        return _LLM
    except Exception as e:
        logger.warning("Failed to load tiny LLM: %s", e)
        _LLM_AVAILABLE = False
        return None


def _render_template(intent: str, data: dict, prediction: dict | None) -> str:
    import random
    templates = _TEMPLATES.get(intent, _TEMPLATES["unknown"])
    template = random.choice(templates)

    ctx = {}

    if intent == "club_info" and data.get("club"):
        club = dict(data["club"])
        ctx["club"] = club
        ctx["club"].setdefault("estadio", "su estadio")
        total_intl = sum(t["cantidad"] for t in club.get("titulos_internacionales", []))
        ctx["total_intl"] = total_intl
        ctx["titulos_resumen"] = f"Tiene {club['titulos_liga']} ligas y {total_intl} tÃ­tulos internacionales." if total_intl else f"Tiene {club['titulos_liga']} tÃ­tulos de liga."

    if intent == "prediction" and prediction:
        ctx["local_pct"] = prediction["local_win_pct"]
        ctx["draw_pct"] = prediction["draw_pct"]
        ctx["visitante_pct"] = prediction["visitor_win_pct"]
        ctx["local"] = "Local"
        ctx["visitante"] = "Visitante"
        ctx["confidence"] = prediction["confidence"]
        ctx["total_h2h"] = prediction.get("total_partidos", 0)

    if intent == "head_to_head" and data.get("head_to_head"):
        h2h = data["head_to_head"]
        ctx["total"] = len(h2h)
        ctx["local_wins"] = sum(1 for p in h2h if p["goles_local"] is not None and p["goles_local"] > p["goles_visitante"])
        ctx["vis_wins"] = sum(1 for p in h2h if p["goles_visitante"] is not None and p["goles_visitante"] > p["goles_local"])
        ctx["draws"] = sum(1 for p in h2h if p.get("goles_local") == p.get("goles_visitante"))
        ctx["local_nombre"] = "Local"
        ctx["visitante_nombre"] = "Visitante"

    if intent == "club_comparison" and data.get("club_a") and data.get("club_b"):
        a = data["club_a"]
        b = data["club_b"]
        cmp = data.get("comparison", {})
        ctx["a_nombre"] = a["nombre"]
        ctx["b_nombre"] = b["nombre"]
        ctx["a_ligas"] = a["titulos_liga"]
        ctx["b_ligas"] = b["titulos_liga"]
        ctx["a_intl"] = cmp.get("total_intl_a", 0)
        ctx["b_intl"] = cmp.get("total_intl_b", 0)
        ctx["a_fundacion"] = a["fundacion"]
        ctx["b_fundacion"] = b["fundacion"]
        ctx["a_edad"] = 2026 - a["fundacion"]
        ctx["b_edad"] = 2026 - b["fundacion"]
        vl = cmp.get("ventaja_ligas", 0)
        vi = cmp.get("ventaja_intl", 0)
        partes = []
        if vl != 0:
            quien = a["nombre"] if vl > 0 else b["nombre"]
            partes.append(f"{quien} lidera por {abs(vl)} tÃ­tulo(s) de liga")
        if vi != 0:
            quien = a["nombre"] if vi > 0 else b["nombre"]
            partes.append(f"{quien} lidera por {abs(vi)} tÃ­tulo(s) internacional(es)")
        ctx["ventaja"] = " | ".join(partes) if partes else "EstÃ¡n parejos en tÃ­tulos"
        ctx["ventaja_edad"] = f"{a['nombre']} es mÃ¡s antiguo" if cmp.get("a_mas_viejo") else f"{b['nombre']} es mÃ¡s antiguo"

    if intent == "next_match" and data.get("proximos"):
        prox = data["proximos"]
        if len(prox) == 1:
            p = prox[0]
            ctx["fecha"] = p["fecha"]
            ctx["rival"] = p["rival_nombre"]
            ctx["torneo"] = p["torneo"]
            template = random.choice(templates[:2])
        elif len(prox) > 1:
            parts = []
            for p in prox:
                parts.append(f"{p['fecha']} vs {p['rival_nombre']} ({p['torneo']})")
            ctx["lista_partidos"] = "; ".join(parts)
            template = templates[2]

    if intent == "table_position":
        if data.get("club_posicion"):
            cp = data["club_posicion"]
            ctx["club_nombre"] = cp.get("nombre", cp.get("club_nombre", "El club"))
            ctx["posicion"] = cp["posicion"]
            ctx["puntos"] = cp.get("puntos", cp.get("pts", 0))
            ctx["partidos"] = cp.get("partidos_jugados", cp.get("pj", 0))
            template = random.choice(templates[:2])
        else:
            template = random.choice(templates[2:])

    if intent == "match_result" and data.get("forma"):
        f = data["forma"]
        ctx["wins"] = f["wins"]
        ctx["draws"] = f["draws"]
        ctx["losses"] = f["losses"]
        ctx["forma_total"] = f.get("total", f["wins"] + f["draws"] + f["losses"])
        template = templates[1]

    if not ctx:
        return template
    try:
        return template.format(**ctx)
    except (KeyError, ValueError, AttributeError) as e:
        logger.warning("Template format failed for intent '%s': %s", intent, e)
    fallback = random.choice(_TEMPLATES["unknown"])
    return fallback


class CerezoResponseGenerator:

    @staticmethod
    async def generate(intent: str, data: dict, prediction: dict | None, message: str) -> str:
        llm = _get_llm()
        if llm is not None:
            try:
                context = json.dumps(data, ensure_ascii=False, default=str)
                prompt = f"""Contexto real:
{context}

InstrucciÃ³n: RespondÃ© como un hincha paraguayo de fÃºtbol, natural, con vocabulario local. MÃ¡ximo 2 oraciones. No inventes datos.

Pregunta: {message}
Respuesta:"""
                response = llm(prompt, max_tokens=100, temperature=0.5, stop=["\n\n"])
                text = response["choices"][0]["text"].strip()
                if text:
                    return text
            except Exception as e:
                logger.warning("Tiny LLM response failed, falling back to template: %s", e)

        return _render_template(intent, data, prediction)
