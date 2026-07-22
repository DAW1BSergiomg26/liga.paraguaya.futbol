_KEYWORDS: dict[str, list[str]] = {
    "club_info": ["datos", "informaciÃ³n", "informacion", "cÃ³mo es", "como es", "historia", "detalles", "quiÃ©n es", "quien es", "estadio", "fundaciÃ³n", "fundacion", "tÃ­tulos", "titulos", "apodo", "aÃ±os", "cuÃ¡ntos aÃ±os", "cuantos aÃ±os", "colores", "ciudad", "direcciÃ³n", "direccion", "descripciÃ³n", "descripcion", "escudo", "camiseta"],
    "match_result": ["ganÃ³", "gano", "resultado", "cÃ³mo quedÃ³", "como quedo", "Ãºltimo partido", "ultimo partido", "Ãºltimo clÃ¡sico", "ultimo clasico", "pasÃ³", "paso", "Ãºltimo resultado", "ultimo resultado", "Ãºltimos resultados", "ultimos resultados", "cÃ³mo viene", "como viene", "Ãºltimos partidos", "ultimos partidos", "marcha", "racha"],
    "head_to_head": ["historial", "cÃ³mo le fue", "como le fue", "contra", "versus", "enfrentaron", "clÃ¡sicos", "clasicos"],
    "table_position": ["tabla", "posiciones", "lidera", "posiciÃ³n", "posicion", "campeonato", "clasificaciÃ³n", "clasificacion", "cÃ³mo estÃ¡", "como esta", "puesto", "ubicaciÃ³n", "ubicacion"],
    "prediction": ["gana", "predicciÃ³n", "prediccion", "pronÃ³stico", "pronostico", "va a ganar", "quiÃ©n gana", "quien gana", "va ganar"],
    "top_scorer": ["goleador", "artillero", "mÃ¡ximo", "maximo", "goleadores", "mÃ¡ximo goleador", "maximo goleador", "quiÃ©n es el goleador", "quien es el goleador", "tabla de goleadores", "mÃ¡ximo artillero", "maximo artillero"],
    "club_comparison": ["quiÃ©n tiene mÃ¡s", "quien tiene mas", "mÃ¡s tÃ­tulos", "mas titulos", "mÃ¡s copas", "mas copas", "mÃ¡s grande", "mas grande", "mÃ¡s antiguo", "mas antiguo", "mÃ¡s viejo", "mas viejo", "comparar", "cuÃ¡l es mejor", "cual es mejor", "mejor club", "diferencia"],
    "next_match": ["cuÃ¡ndo juega", "cuando juega", "prÃ³ximo partido", "proximo partido", "horario", "fecha", "dÃ­a juega", "dia juega", "se enfrenta", "prÃ³ximos partidos", "proximos partidos", "partido de", "partidos de", "agenda"],
    "greeting": ["hola", "buenas", "buen", "buen dÃ­a", "buen dia", "cÃ³mo estÃ¡s", "como estas", "quÃ© tal", "que tal", "buenas tardes", "buenas noches", "buenos dÃ­as", "buenos dias"],
    "general_question": ["quÃ© dÃ­a", "que dia", "quÃ© hora", "que hora", "cuÃ¡nto falta", "cuanto falta", "quiÃ©n es el presidente", "quien es el presidente", "dÃ³nde queda", "donde queda", "cuÃ¡ntos equipos", "cuantos equipos", "cÃ³mo se llama", "como se llama", "cuÃ¡ntos goles", "cuantos goles", "me contÃ¡s", "me contas", "contame", "conta me", "sabÃ©s", "sabes", "cuÃ¡ntos clubes", "cuantos clubes", "quiÃ©n es", "quien es", "quÃ© es", "que es", "cuÃ¡l es", "cual es", "dÃ³nde estÃ¡", "donde esta", "cuÃ¡nto vale", "cuanto vale", "quiÃ©n juega", "quien juega", "quÃ© partido", "que partido"],
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
