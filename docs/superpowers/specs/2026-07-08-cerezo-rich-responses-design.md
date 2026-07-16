# Cerezo Rich Responses — Design Spec

## Problem

Cerezo currently returns plain text responses (with optional LLM generation). The frontend renders everything as simple text bubbles, missing the opportunity to show rich visual data (club shields, stats bars, comparison tables, mini standings) inline in the chat.

## Solution

Add `structured_data` to the `CerezoResponse` so the frontend can render intent-specific rich cards alongside the natural-language message. Each intent defines its own structured shape; the frontend maps `structured_data.type` to a dedicated React component.

---

## Architecture

```
User message → /api/v1/cerezo/ask
  → IntentClassifier → EntityExtractor → DataFetcher
  → ResponseGenerator (text + structured_data)
  → CerezoResponse { message, intent, structured_data, entities, prediction }
  → Frontend renders:
      - <ChatBubble text={message} />
      - <RichCard type={structured_data.type} data={structured_data} />
```

No changes to the classifier, extractor, data fetcher, or prediction engine. Only the response generator and response schema change.

---

## Structured Data Types

### club_info → type: "club_detail"

```json
{
  "type": "club_detail",
  "club": {
    "nombre": "Club Olimpia",
    "escudo": "https://...",
    "ciudad": "Asunción",
    "estadio": "Estadio Osvaldo Domínguez Dibb",
    "capacidad": 22000,
    "fundacion": 1902,
    "titulos_liga": 48,
    "descripcion": "El Club Olimpia es..."
  },
  "titulos": [
    { "torneo": "Primera División", "cantidad": 48 },
    { "torneo": "Copa Libertadores", "cantidad": 3 }
  ]
}
```

### match_result → type: "match_form"

```json
{
  "type": "match_form",
  "club": "Olimpia",
  "last5": [
    { "rival": "Cerro Porteño", "resultado": "G", "goles_local": 2, "goles_visit": 1 },
    { "rival": "Libertad", "resultado": "E", "goles_local": 1, "goles_visit": 1 },
    { "rival": "Guaraní", "resultado": "P", "goles_local": 0, "goles_visit": 2 }
  ],
  "wins": 3,
  "draws": 1,
  "losses": 1
}
```

### head_to_head → type: "h2h"

```json
{
  "type": "h2h",
  "club1": { "nombre": "Olimpia", "escudo": "..." },
  "club2": { "nombre": "Cerro Porteño", "escudo": "..." },
  "total": 10,
  "wins1": 4,
  "draws": 3,
  "wins2": 3,
  "ultimos": [
    { "fecha": "2026-02-01", "goles1": 2, "goles2": 1 },
    ...
  ]
}
```

### table_position → type: "mini_table"

```json
{
  "type": "mini_table",
  "torneo": "Apertura 2026",
  "jornada": 5,
  "clubes": [
    { "pos": 1, "nombre": "Olimpia", "escudo": "...", "pj": 5, "pg": 4, "pe": 1, "pp": 0, "pts": 13 }
  ],
  "club_destacado": { "pos": 1, "nombre": "Olimpia", ... }
}
```

### prediction → type: "prediction" (exists today, unchanged)

```json
{
  "type": "prediction",
  "local_win_pct": 45,
  "draw_pct": 30,
  "visitor_win_pct": 25,
  "confidence": "media",
  "total_partidos": 10
}
```

### club_comparison → type: "comparison"

```json
{
  "type": "comparison",
  "club1": { "nombre": "Olimpia", "escudo": "...", "titulos": 48, "fundacion": 1902 },
  "club2": { "nombre": "Cerro Porteño", "escudo": "...", "titulos": 35, "fundacion": 1912 },
  "advantages": [
    "Olimpia tiene 13 títulos de liga más que Cerro Porteño",
    "Olimpia es 10 años más antiguo"
  ]
}
```

### next_match → type: "next_match"

```json
{
  "type": "next_match",
  "club": "Olimpia",
  "rival": "Cerro Porteño",
  "escudo_rival": "https://...",
  "fecha": "2026-02-15",
  "torneo": "Apertura 2026",
  "estadio": "Manuel Ferreira"
}
```

### greeting / unknown → type: "greeting" / "unknown"

Empty object `{}` — only the text message is displayed.

---

## Frontend Components

Located in `frontend/src/components/cerezo/`:

| Component | File | Props |
|-----------|------|-------|
| `ClubCard` | `ClubCard.tsx` | `data: ClubDetailData` |
| `MatchFormCard` | `MatchFormCard.tsx` | `data: MatchFormData` |
| `H2HCard` | `H2HCard.tsx` | `data: H2HData` |
| `MiniTableCard` | `MiniTableCard.tsx` | `data: MiniTableData` |
| `ComparisonCard` | `ComparisonCard.tsx` | `data: ComparisonData` |
| `TopScorerCard` | `TopScorerCard.tsx` | `data: TopScorerData` |
| `NextMatchCard` | `NextMatchCard.tsx` | `data: NextMatchData` |
| `RichCardRouter` | `RichCardRouter.tsx` | `data: StructuredData` — switches on `type` |

The existing `PredictionCard` stays in place (or moves to the same pattern).

Each card follows:
- Tailwind CSS, dark theme consistent with the app
- Responsive (mobile-first)
- Loads club escudo images
- Plain text fallback if image fails

---

## Files to Change

### Backend
- `backend/app/schemas/cerezo.py` — add `structured_data: dict` field to `CerezoResponse`
- `backend/app/services/cerezo/response_generator.py` — return `(text, structured_data)` tuple
- `backend/app/api/cerezo.py` — thread `structured_data` through the endpoint

### Frontend
- `frontend/src/components/cerezo/RichCardRouter.tsx` — new, dispatches by type
- `frontend/src/components/cerezo/ClubCard.tsx` — new
- `frontend/src/components/cerezo/MatchFormCard.tsx` — new
- `frontend/src/components/cerezo/H2HCard.tsx` — new
- `frontend/src/components/cerezo/MiniTableCard.tsx` — new
- `frontend/src/components/cerezo/ComparisonCard.tsx` — new
- `frontend/src/components/cerezo/NextMatchCard.tsx` — new
- `frontend/src/app/cerezo/page.tsx` — integrate RichCardRouter after each assistant bubble

### Tests
- `backend/tests/test_cerezo_response_generator.py` — update assertions for structured_data
- `backend/tests/test_cerezo_router.py` — verify structured_data in response

---

## Non-Goals

- No changes to classifier, entity extractor, data fetcher, or prediction engine
- No new intents (that's a future phase)
- No LLM prompt changes (only structured data output)
- No conversation memory changes
