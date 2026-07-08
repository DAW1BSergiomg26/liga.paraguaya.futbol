_KEYWORDS: dict[str, list[str]] = {
    "club_info": ["datos", "información", "informacion", "cómo es", "como es", "historia", "detalles"],
    "match_result": ["ganó", "gano", "resultado", "cómo quedó", "como quedo", "último partido", "ultimo partido", "último clásico", "ultimo clasico"],
    "head_to_head": ["historial", "cómo le fue", "como le fue", "contra", "versus", "enfrentaron", "clásicos", "clasicos"],
    "table_position": ["tabla", "posiciones", "lidera", "posición", "posicion", "campeonato"],
    "prediction": ["gana", "próximo", "proximo", "predicción", "prediccion", "pronóstico", "pronostico", "va a ganar"],
    "top_scorer": ["goleador", "artillero", "máximo", "maximo", "goleadores"],
    "greeting": ["hola", "buenas", "buen", "cómo estás", "como estas", "buen día", "buen dia", "qué tal", "que tal"],
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
