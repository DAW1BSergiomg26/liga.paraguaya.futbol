# Design: Motor de Simulación Probabilística de Partidos

**Date:** 2026-07-17
**Status:** Pending approval

## Objective

Build a Poisson-based match simulation engine that calculates win/draw/loss probabilities and the 3 most likely exact scores using real data from `TablaPosicion` in Neon Postgres.

## Mathematical Model

### Poisson Distribution

For a match Home vs Away:

1. **League averages** (from all clubs in latest jornada):
   - `avg_gf` = average goals scored per club
   - `avg_gc` = average goals conceded per club

2. **Team strength indices**:
   - `home_attack` = home.gf / avg_gf (offensive strength)
   - `home_defense` = home.gc / avg_gc (defensive weakness)
   - `away_attack` = away.gf / avg_gf
   - `away_defense` = away.gc / avg_gc

3. **Expected goals (λ)**:
   - `λ_home` = home_attack × away_defense × avg_gf
   - `λ_away` = away_attack × home_defense × avg_gf

4. **Poisson probability**: `P(k goals) = (λ^k × e^-λ) / k!`

5. **Match outcome matrix**: Compute P(i, j) for i,j ∈ [0..6], then:
   - `P(home_win)` = Σ P(i,j) where i > j
   - `P(draw)` = Σ P(i,j) where i == j
   - `P(away_win)` = Σ P(i,j) where j > i

6. **Top 3 exact scores**: Sort the 7×7 matrix descending, return top 3.

## Architecture

### Files to create

| File | Purpose |
|------|---------|
| `backend/app/schemas/simulator.py` | Pydantic validation schemas |
| `backend/app/services/simulator_service.py` | Poisson math + DB queries |
| `backend/app/api/simulator.py` | FastAPI router |

### Files to modify

| File | Change |
|------|--------|
| `backend/app/main.py` | Import + register simulator router |

## Data Flow

```
POST /api/v1/simulador/prediccion
  → SimulationInput (home_club_id: str, away_club_id: str)
  → SimulatorService.simulate_match(db, home_id, away_id)
    → Query TablaPosicion for both clubs (latest jornada per torneo)
    → Query league averages
    → Compute Poisson matrix
    → Return SimulationResultOut
  → HTTP 200 with probabilities
```

## Error Handling

- Club not found in `tabla_posiciones`: HTTP 404 with `"Club {id} no encontrado en la tabla de posiciones"`
- Both IDs identical: HTTP 400 with `"Los IDs de local y visitante deben ser distintos"`

## Schemas

### SimulationInput
```python
class SimulationInput(BaseModel):
    home_club_id: str
    away_club_id: str
```

### ExactScore
```python
class ExactScore(BaseModel):
    goles_local: int
    goles_visitante: int
    probabilidad: float  # 0.0–1.0
```

### SimulationResultOut
```python
class SimulationResultOut(BaseModel):
    home_club_id: str
    home_club_name: str
    away_club_id: str
    away_club_name: str
    probabilidad_local: float   # %
    probabilidad_empate: float  # %
    probabilidad_visitante: float  # %
    lambda_local: float         # goles esperados local
    lambda_visitante: float     # goles esperados visitante
    resultados_mas_probables: list[ExactScore]  # top 3
```
