_KEYWORDS: dict[str, list[str]] = {
    "club_info": ["datos", "información", "informacion", "cómo es", "como es", "historia", "detalles", "quién es", "quien es", "estadio", "fundación", "fundacion", "títulos", "titulos", "apodo", "años", "cuántos años", "cuantos años", "colores", "ciudad", "dirección", "direccion", "descripción", "descripcion", "escudo", "camiseta"],
    "match_result": ["ganó", "gano", "resultado", "cómo quedó", "como quedo", "último partido", "ultimo partido", "último clásico", "ultimo clasico", "pasó", "paso", "último resultado", "ultimo resultado", "últimos resultados", "ultimos resultados", "cómo viene", "como viene", "últimos partidos", "ultimos partidos", "marcha", "racha"],
    "head_to_head": ["historial", "cómo le fue", "como le fue", "contra", "versus", "enfrentaron", "clásicos", "clasicos"],
    "table_position": ["tabla", "posiciones", "lidera", "posición", "posicion", "campeonato", "clasificación", "clasificacion", "cómo está", "como esta", "puesto", "ubicación", "ubicacion"],
    "prediction": ["gana", "predicción", "prediccion", "pronóstico", "pronostico", "va a ganar", "quién gana", "quien gana", "va ganar"],
    "top_scorer": ["goleador", "artillero", "máximo", "maximo", "goleadores", "máximo goleador", "maximo goleador", "quién es el goleador", "quien es el goleador", "tabla de goleadores", "máximo artillero", "maximo artillero"],
    "club_comparison": ["quién tiene más", "quien tiene mas", "más títulos", "mas titulos", "más copas", "mas copas", "más grande", "mas grande", "más antiguo", "mas antiguo", "más viejo", "mas viejo", "comparar", "cuál es mejor", "cual es mejor", "mejor club", "diferencia"],
    "next_match": ["cuándo juega", "cuando juega", "próximo partido", "proximo partido", "horario", "fecha", "día juega", "dia juega", "se enfrenta", "próximos partidos", "proximos partidos", "partido de", "partidos de", "agenda"],
    "greeting": ["hola", "buenas", "buen", "buen día", "buen dia", "cómo estás", "como estas", "qué tal", "que tal", "buenas tardes", "buenas noches", "buenos días", "buenos dias"],
    "general_question": ["qué día", "que dia", "qué hora", "que hora", "cuánto falta", "cuanto falta", "quién es el presidente", "quien es el presidente", "dónde queda", "donde queda", "cuántos equipos", "cuantos equipos", "cómo se llama", "como se llama", "cuántos goles", "cuantos goles", "me contás", "me contas", "contame", "conta me", "sabés", "sabes", "cuántos clubes", "cuantos clubes", "quién es", "quien es", "qué es", "que es", "cuál es", "cual es", "dónde está", "donde esta", "cuánto vale", "cuanto vale", "quién juega", "quien juega", "qué partido", "que partido"],
}


class CerezoIntentClassifier:

    @staticmethod
    async def classify(message: str) -> dict:
        text_lower = message.lower()
        scores: dict[str, int] = {}
        for intent, keywords in _KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in text_lower)
            if count > 0:
                scores[intent] = count

        if not scores:
            return {"intent": "unknown", "confidence": 0.0, "entities": {}}

        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]
        confidence = min(round(0.5 + (best_score - 1) * 0.2, 4), 0.95)

        return {"intent": best_intent, "confidence": confidence, "entities": {}}
